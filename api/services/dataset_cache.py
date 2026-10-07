"""Download only catalog observation files, with bounded disk and network work."""

import json
import os
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

from huggingface_hub import get_hf_file_metadata, hf_hub_url

from services.resource_limits import ResourceLimitError, WindowLimit, positive_setting

ALLOWED_DATASETS = frozenset(
    json.loads((Path(__file__).parents[1] / "allowed-datasets.json").read_text())
)
CACHE_ROOT = Path(
    os.getenv("MINARIVIZ_CACHE_DIR", str(Path.home() / ".minari/datasets"))
)
MAX_DATASET_BYTES = positive_setting("MINARIVIZ_MAX_DATASET_BYTES", 1024 * 1024 * 1024)
MAX_CACHE_BYTES = positive_setting("MINARIVIZ_MAX_CACHE_BYTES", 2 * 1024 * 1024 * 1024)
DOWNLOAD_TIMEOUT = positive_setting("MINARIVIZ_DOWNLOAD_TIMEOUT_SECONDS", 120)
DOWNLOAD_RATE = WindowLimit(
    positive_setting("MINARIVIZ_DOWNLOADS_PER_TEN_MINUTES", 4), 600
)
DOWNLOAD_LOCK = threading.Lock()


def dataset_path(dataset_id: str) -> Path:
    if dataset_id not in ALLOWED_DATASETS:
        raise ValueError("Dataset is not in the supported catalog.")
    root = CACHE_ROOT.resolve()
    path = (root / dataset_id / "data/main_data.hdf5").resolve()
    if not path.is_relative_to(root):
        raise ValueError("Invalid dataset path.")
    return path


def cache_bytes() -> int:
    return sum(p.stat().st_size for p in CACHE_ROOT.rglob("*") if p.is_file())


def ensure_downloaded(dataset_id: str) -> Path:
    path = dataset_path(dataset_id)
    if path.is_file():
        if path.stat().st_size > MAX_DATASET_BYTES:
            raise ResourceLimitError("Dataset exceeds this server's size limit.")
        return path
    if not DOWNLOAD_LOCK.acquire(blocking=False):
        raise ResourceLimitError(
            "Another dataset is downloading; try again shortly.", 503, 5
        )
    try:
        if path.is_file():
            return path
        retry = DOWNLOAD_RATE.retry_after()
        if retry:
            raise ResourceLimitError(
                "Dataset download limit reached; try again later.", 429, retry
            )
        CACHE_ROOT.mkdir(parents=True, exist_ok=True)
        used_bytes = cache_bytes()
        if used_bytes >= MAX_CACHE_BYTES:
            raise ResourceLimitError(
                "Dataset cache is full; contact the server operator.", 503
            )
        repository, relative_id = dataset_id.split("/", 1)
        filename = relative_id + "/data/main_data.hdf5"
        repo_id = "farama-minari/" + repository
        metadata = get_hf_file_metadata(
            hf_hub_url(repo_id, filename, repo_type="dataset"), token=False, timeout=10
        )
        if not metadata.commit_hash or metadata.size is None or metadata.size <= 0:
            raise ResourceLimitError(
                "Dataset download size could not be verified.", 503
            )
        if metadata.size > MAX_DATASET_BYTES:
            raise ResourceLimitError("Dataset exceeds this server's size limit.")
        # Reserve space for download metadata as well as the observation file.
        if used_bytes + metadata.size + 1024 * 1024 > MAX_CACHE_BYTES:
            raise ResourceLimitError(
                "Dataset cache has insufficient space; contact the server operator.",
                503,
            )
        with tempfile.TemporaryDirectory(
            prefix=".download-", dir=CACHE_ROOT
        ) as temporary:
            stage = Path(temporary)
            environment = {
                key: os.environ[key]
                for key in ("PATH", "SYSTEMROOT", "TMPDIR")
                if key in os.environ
            }
            environment.update(
                {
                    "HF_HOME": str(stage / ".hf"),
                    "HF_HUB_DISABLE_XET": "1",
                    "HF_HUB_DISABLE_IMPLICIT_TOKEN": "1",
                    "HF_HUB_DOWNLOAD_TIMEOUT": "15",
                }
            )
            try:
                result = subprocess.run(
                    [
                        sys.executable,
                        str(Path(__file__).with_name("download_worker.py")),
                        repo_id,
                        filename,
                        metadata.commit_hash,
                        str(stage),
                        str(metadata.size),
                    ],
                    env=environment,
                    timeout=DOWNLOAD_TIMEOUT,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except subprocess.TimeoutExpired:
                raise ResourceLimitError(
                    "Dataset download timed out; try again later.", 503, 30
                ) from None
            downloaded = stage / filename
            if result.returncode != 0 or not downloaded.is_file():
                raise ResourceLimitError(
                    "Dataset download failed; try again later.", 503, 30
                )
            if downloaded.stat().st_size != metadata.size:
                raise ResourceLimitError(
                    "Dataset download size did not match its metadata.", 503
                )
            path.parent.mkdir(parents=True, exist_ok=True)
            downloaded.replace(path)
        return path
    finally:
        DOWNLOAD_LOCK.release()
