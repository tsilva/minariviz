from functools import lru_cache

import minari
import numpy as np


@lru_cache(maxsize=8)
def load_dataset(dataset_id: str) -> minari.MinariDataset:
    """Load and cache a Minari dataset."""
    return minari.load_dataset(dataset_id, download=True)


def get_episode_list(dataset_id: str) -> list[dict]:
    """Get list of episodes with their lengths."""
    dataset = load_dataset(dataset_id)
    episodes = []
    for i, ep in enumerate(dataset.iterate_episodes()):
        obs = ep.observations
        if isinstance(obs, dict):
            first_key = next(iter(obs))
            length = len(obs[first_key])
        else:
            length = len(obs)
        episodes.append({"id": i, "length": length})
    return episodes


def get_episode_info(dataset_id: str, episode_id: int) -> dict:
    """Get detailed info about a specific episode."""
    dataset = load_dataset(dataset_id)
    episodes = list(dataset.iterate_episodes(episode_indices=[episode_id]))
    if not episodes:
        raise ValueError(f"Episode {episode_id} not found")

    ep = episodes[0]
    obs = ep.observations
    if isinstance(obs, dict):
        first_key = next(iter(obs))
        obs_array = obs[first_key]
    else:
        obs_array = obs

    total_reward = float(np.sum(ep.rewards))

    return {
        "id": episode_id,
        "length": len(obs_array),
        "total_reward": total_reward,
        "observation_shape": list(obs_array.shape[1:]),
    }


def get_episode_frames(
    dataset_id: str,
    episode_id: int,
    start: int = 0,
    count: int = 120,
) -> np.ndarray:
    """Get a slice of observation frames from an episode.

    Returns numpy array of shape (count, H, W) or (count, H, W, 3).
    """
    dataset = load_dataset(dataset_id)
    episodes = list(dataset.iterate_episodes(episode_indices=[episode_id]))
    if not episodes:
        raise ValueError(f"Episode {episode_id} not found")

    ep = episodes[0]
    obs = ep.observations
    if isinstance(obs, dict):
        first_key = next(iter(obs))
        obs_array = obs[first_key]
    else:
        obs_array = obs

    end = min(start + count, len(obs_array))
    frames = obs_array[start:end]

    if frames.dtype != np.uint8:
        frames = np.clip(frames, 0, 255).astype(np.uint8)

    return frames
