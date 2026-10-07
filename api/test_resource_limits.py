import io
import json
import re
import subprocess
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import h5py
import numpy as np
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from routers.datasets import router
from services import dataset_cache, hdf5_reader
from services.resource_limits import ObservationLimits, ResourceLimitError, WindowLimit

DATASET_ID = "D4RL/pointmaze/umaze-v2"


def make_app():
    app = FastAPI()
    app.include_router(router)
    app.add_middleware(ObservationLimits)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


class RequestLimitsTests(unittest.TestCase):
    def test_rate_limit_is_global_and_health_is_exempt(self):
        with patch.dict("os.environ", {"MINARIVIZ_REQUESTS_PER_MINUTE": "2"}):
            with TestClient(make_app()) as client:
                for address in ("1.1.1.1", "2.2.2.2"):
                    response = client.get(
                        "/api/datasets/unknown/episodes",
                        headers={"X-Forwarded-For": address},
                    )
                    self.assertEqual(response.status_code, 404)
                response = client.get("/api/datasets/unknown/episodes")
                self.assertEqual(response.status_code, 429)
                self.assertGreater(int(response.headers["Retry-After"]), 0)
                self.assertEqual(client.get("/api/health").status_code, 200)

    def test_rate_window_recovers(self):
        limit = WindowLimit(1, 60)
        with patch("services.resource_limits.time.monotonic", side_effect=[1, 2, 61]):
            self.assertEqual(limit.retry_after(), 0)
            self.assertEqual(limit.retry_after(), 59)
            self.assertEqual(limit.retry_after(), 0)

    def test_concurrent_work_is_rejected_then_slot_is_released(self):
        entered = threading.Event()
        release = threading.Event()

        def slow_episodes(_):
            entered.set()
            release.wait(5)
            return []

        with patch.dict("os.environ", {"MINARIVIZ_MAX_CONCURRENT_REQUESTS": "1"}):
            with (
                TestClient(make_app()) as client,
                patch("routers.datasets.get_episode_list", side_effect=slow_episodes),
            ):
                with ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(
                        client.get, f"/api/datasets/{DATASET_ID}/episodes"
                    )
                    try:
                        self.assertTrue(entered.wait(3))
                        response = client.get(f"/api/datasets/{DATASET_ID}/episodes")
                        self.assertEqual(response.status_code, 503)
                        self.assertEqual(client.get("/api/health").status_code, 200)
                    finally:
                        release.set()
                    self.assertEqual(future.result().status_code, 200)
                self.assertEqual(
                    client.get(f"/api/datasets/{DATASET_ID}/episodes").status_code, 200
                )

    def test_limits_preserve_status_and_errors_hide_private_details(self):
        with TestClient(make_app()) as client:
            with patch(
                "routers.datasets.get_episode_list",
                side_effect=ResourceLimitError("Download limit reached.", 429, 20),
            ):
                response = client.get(f"/api/datasets/{DATASET_ID}/episodes")
                self.assertEqual(response.status_code, 429)
                self.assertEqual(response.headers["Retry-After"], "20")
            with patch(
                "routers.datasets.get_episode_list",
                side_effect=OSError("private/path credential"),
            ):
                with self.assertLogs("routers.datasets", "ERROR"):
                    response = client.get(f"/api/datasets/{DATASET_ID}/episodes")
                self.assertEqual(response.status_code, 503)
                self.assertNotIn("private", response.text)
            self.assertEqual(
                client.get(f"/api/datasets/{DATASET_ID}/episodes/-1/info").status_code,
                422,
            )


class DownloadLimitsTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.patches = [
            patch.object(dataset_cache, "CACHE_ROOT", self.root),
            patch.object(dataset_cache, "DOWNLOAD_LOCK", threading.Lock()),
            patch.object(dataset_cache, "DOWNLOAD_RATE", WindowLimit(4, 600)),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    def test_unknown_ids_and_traversal_never_touch_network(self):
        with patch.object(dataset_cache, "get_hf_file_metadata") as metadata:
            for name in (
                "../private",
                "/tmp/file",
                "hf://attacker/dataset",
                "D4RL/pointmaze/../umaze-v2",
            ):
                with self.assertRaises(ValueError):
                    dataset_cache.ensure_downloaded(name)
            metadata.assert_not_called()

    def test_symlink_cannot_escape_cache(self):
        with tempfile.TemporaryDirectory() as outside:
            (self.root / "D4RL").symlink_to(outside, target_is_directory=True)
            with self.assertRaises(ValueError):
                dataset_cache.dataset_path(DATASET_ID)

    def test_oversized_and_unverifiable_downloads_are_rejected_before_transfer(self):
        for size in (None, 0, dataset_cache.MAX_DATASET_BYTES + 1):
            with patch.object(
                dataset_cache,
                "get_hf_file_metadata",
                return_value=SimpleNamespace(size=size, commit_hash="revision"),
            ):
                with patch.object(dataset_cache.subprocess, "run") as transfer:
                    with self.assertRaises(ResourceLimitError):
                        dataset_cache.ensure_downloaded(DATASET_ID)
                    transfer.assert_not_called()

    def test_full_cache_rejects_without_upstream_access(self):
        (self.root / "existing").write_bytes(b"existing")
        with patch.object(dataset_cache, "MAX_CACHE_BYTES", 8):
            with patch.object(dataset_cache, "get_hf_file_metadata") as metadata:
                with self.assertRaises(ResourceLimitError):
                    dataset_cache.ensure_downloaded(DATASET_ID)
                metadata.assert_not_called()

    def test_cache_reserves_space_for_pending_file(self):
        with patch.object(dataset_cache, "MAX_CACHE_BYTES", 1024 * 1024 + 1):
            with patch.object(
                dataset_cache,
                "get_hf_file_metadata",
                return_value=SimpleNamespace(size=2, commit_hash="revision"),
            ):
                with patch.object(dataset_cache.subprocess, "run") as transfer:
                    with self.assertRaises(ResourceLimitError):
                        dataset_cache.ensure_downloaded(DATASET_ID)
                    transfer.assert_not_called()

    def test_timeout_cleans_staging_and_releases_download_lock(self):
        with patch.object(
            dataset_cache,
            "get_hf_file_metadata",
            return_value=SimpleNamespace(size=2, commit_hash="revision"),
        ):
            with patch.object(
                dataset_cache.subprocess,
                "run",
                side_effect=subprocess.TimeoutExpired("download", 120),
            ):
                with self.assertRaises(ResourceLimitError):
                    dataset_cache.ensure_downloaded(DATASET_ID)
        self.assertEqual(list(self.root.iterdir()), [])
        self.assertFalse(dataset_cache.DOWNLOAD_LOCK.locked())

    def test_verified_download_is_published_once_and_reused(self):
        def transfer(command, **kwargs):
            downloaded = Path(command[-2]) / command[3]
            downloaded.parent.mkdir(parents=True)
            downloaded.write_bytes(b"ok")
            self.assertEqual(command[4], "pinned-revision")
            self.assertEqual(command[-1], "2")
            self.assertNotIn("HF_TOKEN", kwargs["env"])
            return SimpleNamespace(returncode=0)

        with patch.object(
            dataset_cache,
            "get_hf_file_metadata",
            return_value=SimpleNamespace(size=2, commit_hash="pinned-revision"),
        ) as metadata:
            with patch.object(
                dataset_cache.subprocess, "run", side_effect=transfer
            ) as download:
                path = dataset_cache.ensure_downloaded(DATASET_ID)
                self.assertEqual(path.read_bytes(), b"ok")
                self.assertEqual(dataset_cache.ensure_downloaded(DATASET_ID), path)
                self.assertEqual(download.call_count, 1)
                self.assertEqual(metadata.call_count, 1)
        self.assertFalse(list(self.root.glob(".download-*")))

    def test_incomplete_download_is_never_published(self):
        def transfer(command, **kwargs):
            downloaded = Path(command[-2]) / command[3]
            downloaded.parent.mkdir(parents=True)
            downloaded.write_bytes(b"partial")
            return SimpleNamespace(returncode=0)

        with patch.object(
            dataset_cache,
            "get_hf_file_metadata",
            return_value=SimpleNamespace(size=10, commit_hash="revision"),
        ):
            with patch.object(dataset_cache.subprocess, "run", side_effect=transfer):
                with self.assertRaises(ResourceLimitError):
                    dataset_cache.ensure_downloaded(DATASET_ID)
        self.assertFalse(dataset_cache.dataset_path(DATASET_ID).exists())
        self.assertFalse(list(self.root.glob(".download-*")))

    def test_oversized_cached_file_is_rejected(self):
        path = dataset_cache.dataset_path(DATASET_ID)
        path.parent.mkdir(parents=True)
        path.write_bytes(b"large")
        with patch.object(dataset_cache, "MAX_DATASET_BYTES", 4):
            with self.assertRaises(ResourceLimitError):
                dataset_cache.ensure_downloaded(DATASET_ID)

    def test_repeated_failed_downloads_are_rate_limited(self):
        with patch.object(
            dataset_cache, "get_hf_file_metadata", side_effect=OSError("offline")
        ) as metadata:
            for _ in range(4):
                with self.assertRaises(OSError):
                    dataset_cache.ensure_downloaded(DATASET_ID)
            with self.assertRaises(ResourceLimitError) as raised:
                dataset_cache.ensure_downloaded(DATASET_ID)
            self.assertEqual(raised.exception.status_code, 429)
            self.assertEqual(metadata.call_count, 4)

    def test_allowlist_matches_frontend_catalog(self):
        source = Path(__file__).parents[1] / "lib/minari-data.ts"
        if not source.exists():
            self.skipTest("Frontend sources are not copied into the API image")
        catalog = set(re.findall(r'    id: "([^"]+)"', source.read_text()))
        allowlist = json.loads(
            (Path(__file__).parent / "allowed-datasets.json").read_text()
        )
        self.assertEqual(set(allowlist), catalog)


class FrameBudgetTests(unittest.TestCase):
    def test_numeric_budget_rejects_before_loading_array(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "dataset.hdf5"
            with h5py.File(path, "w") as file:
                file.create_dataset(
                    "episode_0/observations", shape=(120, 1000, 1000, 3), dtype="uint8"
                )
            with patch.object(hdf5_reader, "_ensure_downloaded", return_value=path):
                with self.assertRaises(ResourceLimitError):
                    hdf5_reader.get_episode_frames(DATASET_ID, 0)

    def test_small_real_hdf5_frames_and_rewards_still_work(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "dataset.hdf5"
            frames = np.zeros((3, 2, 2, 3), dtype="uint8")
            with h5py.File(path, "w") as file:
                file.create_dataset("episode_0/observations", data=frames)
                file.create_dataset("episode_0/rewards", data=[1, 2, 3])
            with patch.object(hdf5_reader, "_ensure_downloaded", return_value=path):
                np.testing.assert_equal(
                    hdf5_reader.get_episode_frames(DATASET_ID, 0, 1, 2), frames[1:]
                )
                self.assertEqual(
                    hdf5_reader.get_episode_info(DATASET_ID, 0)["total_reward"], 6
                )
                with self.assertRaises(ValueError):
                    hdf5_reader.get_episode_frames(DATASET_ID, 0, 3, 1)

    def test_compressed_frames_obey_pixel_and_batch_budgets(self):
        buffer = io.BytesIO()
        Image.new("RGB", (10, 10)).save(buffer, format="JPEG")
        raw = buffer.getvalue()
        with patch.object(hdf5_reader, "MAX_FRAME_PIXELS", 99):
            with self.assertRaises(ResourceLimitError):
                hdf5_reader._decode_vlen_frames([raw])
        with patch.object(hdf5_reader, "MAX_BATCH_BYTES", 500):
            with self.assertRaises(ResourceLimitError):
                hdf5_reader._decode_vlen_frames([raw, raw])


if __name__ == "__main__":
    unittest.main()
