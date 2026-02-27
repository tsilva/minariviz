from contextlib import contextmanager
from pathlib import Path

import h5py
import minari
import numpy as np


def _hdf5_path(dataset_id: str) -> Path:
    """Return the path to the dataset's HDF5 file."""
    return Path.home() / ".minari" / "datasets" / dataset_id / "data" / "main_data.hdf5"


def _ensure_downloaded(dataset_id: str) -> Path:
    """Download dataset if not already present, return HDF5 path."""
    path = _hdf5_path(dataset_id)
    if not path.exists():
        minari.load_dataset(dataset_id, download=True)
    return path


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


def get_episode_list(dataset_id: str) -> list[dict]:
    """Get list of episodes with their lengths (metadata only, no array loading)."""
    with _open_hdf5(dataset_id) as f:
        episodes = []
        ep_idx = 0
        while f"episode_{ep_idx}" in f:
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
        rewards = ep_group["rewards"][:]

        return {
            "id": episode_id,
            "length": obs_ds.shape[0],
            "total_reward": float(np.sum(rewards)),
            "observation_shape": list(obs_ds.shape[1:]),
        }


def get_episode_frames(
    dataset_id: str,
    episode_id: int,
    start: int = 0,
    count: int = 120,
) -> np.ndarray:
    """Get a slice of observation frames via HDF5 hyperslab read.

    Only reads the requested frames from disk (~12MB for 120 Atari RGB frames).
    """
    with _open_hdf5(dataset_id) as f:
        ep_key = f"episode_{episode_id}"
        if ep_key not in f:
            raise ValueError(f"Episode {episode_id} not found")

        obs_ds = _resolve_obs_dataset(f[ep_key])
        end = min(start + count, obs_ds.shape[0])
        frames = obs_ds[start:end]

        if frames.dtype != np.uint8:
            frames = np.clip(frames, 0, 255).astype(np.uint8)

        return frames
