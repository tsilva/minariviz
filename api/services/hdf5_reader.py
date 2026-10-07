import io
from collections.abc import Iterable
from contextlib import contextmanager

import h5py
import numpy as np
from PIL import Image

from services.dataset_cache import ensure_downloaded as _ensure_downloaded
from services.resource_limits import (
    MAX_BATCH_BYTES,
    MAX_EPISODES,
    MAX_FRAME_PIXELS,
    MAX_REWARD_BYTES,
    ResourceLimitError,
)


@contextmanager
def _open_hdf5(dataset_id: str):
    """Open the HDF5 file for a dataset."""
    path = _ensure_downloaded(dataset_id)
    f = h5py.File(path, "r")
    try:
        yield f
    finally:
        f.close()


def _resolve_obs_dataset(ep_group: h5py.Group) -> h5py.Dataset:
    """Resolve the observations dataset from an episode group.

    Handles both flat observation datasets (e.g. Atari Box spaces)
    and dict observation groups.
    """
    obs = ep_group["observations"]
    if isinstance(obs, h5py.Dataset):
        return obs
    # Dict observation space — use the first key
    first_key = next(iter(obs))
    return obs[first_key]


def _decode_vlen_frames(raw_entries: Iterable) -> np.ndarray:
    """Decode variable-length byte arrays (JPEG-compressed observations) into image frames."""
    frames = []
    total_bytes = 0
    for entry in raw_entries:
        with Image.open(io.BytesIO(bytes(entry))) as img:
            if img.width * img.height > MAX_FRAME_PIXELS:
                raise ResourceLimitError(
                    "Observation frame exceeds this server's pixel limit."
                )
            # Budget before decoding, including a conservative four bytes per pixel.
            estimated_bytes = img.width * img.height * max(4, len(img.getbands()))
            if total_bytes + estimated_bytes > MAX_BATCH_BYTES:
                raise ResourceLimitError(
                    "Frame batch is too large; request fewer frames."
                )
            frame = np.asarray(img)
            total_bytes += frame.nbytes
            frames.append(frame)
    if not frames:
        raise ValueError("No frames in the requested range.")
    return np.stack(frames)


def get_episode_list(dataset_id: str) -> list[dict]:
    """Get list of episodes with their lengths (metadata only, no array loading)."""
    with _open_hdf5(dataset_id) as f:
        episodes = []
        ep_idx = 0
        while f"episode_{ep_idx}" in f:
            if ep_idx >= MAX_EPISODES:
                raise ResourceLimitError(
                    "Dataset has too many episodes for this server."
                )
            obs_ds = _resolve_obs_dataset(f[f"episode_{ep_idx}"])
            episodes.append({"id": ep_idx, "length": obs_ds.shape[0]})
            ep_idx += 1
        return episodes


def get_episode_info(dataset_id: str, episode_id: int) -> dict:
    """Get detailed info about a specific episode."""
    with _open_hdf5(dataset_id) as f:
        ep_key = f"episode_{episode_id}"
        if ep_key not in f:
            raise ValueError(f"Episode {episode_id} not found")

        ep_group = f[ep_key]
        obs_ds = _resolve_obs_dataset(ep_group)
        reward_ds = ep_group["rewards"]
        if reward_ds.size * reward_ds.dtype.itemsize > MAX_REWARD_BYTES:
            raise ResourceLimitError(
                "Episode rewards exceed this server's memory limit."
            )
        rewards = reward_ds[:]

        if obs_ds.dtype == object:
            # Compressed observations — decode one frame to get shape
            sample = _decode_vlen_frames([obs_ds[0]])[0]
            obs_shape = list(sample.shape)
        else:
            obs_shape = list(obs_ds.shape[1:])

        return {
            "id": episode_id,
            "length": obs_ds.shape[0],
            "total_reward": float(np.sum(rewards)),
            "observation_shape": obs_shape,
        }


def get_episode_frames(
    dataset_id: str,
    episode_id: int,
    start: int = 0,
    count: int = 120,
) -> np.ndarray:
    """Get a slice of observation frames via HDF5 hyperslab read.

    Handles both raw numeric arrays and JPEG-compressed (object dtype) observations.
    """
    with _open_hdf5(dataset_id) as f:
        ep_key = f"episode_{episode_id}"
        if ep_key not in f:
            raise ValueError(f"Episode {episode_id} not found")

        obs_ds = _resolve_obs_dataset(f[ep_key])
        if start >= obs_ds.shape[0]:
            raise ValueError("No frames in the requested range.")
        end = min(start + count, obs_ds.shape[0])
        if obs_ds.dtype == object:
            # Read and decode one entry at a time, so compressed entries cannot
            # allocate an entire unbounded batch before the budget is checked.
            frames = _decode_vlen_frames(obs_ds[index] for index in range(start, end))
        else:
            elements_per_frame = int(np.prod(obs_ds.shape[1:], dtype=object))
            if (end - start) * elements_per_frame * max(
                obs_ds.dtype.itemsize, 1
            ) > MAX_BATCH_BYTES:
                raise ResourceLimitError(
                    "Frame batch is too large; request fewer frames."
                )
            if (
                len(obs_ds.shape) >= 3
                and obs_ds.shape[1] * obs_ds.shape[2] > MAX_FRAME_PIXELS
            ):
                raise ResourceLimitError(
                    "Observation frame exceeds this server's pixel limit."
                )
            frames = obs_ds[start:end]

        if frames.dtype != np.uint8:
            frames = np.clip(frames, 0, 255).astype(np.uint8)

        return frames
