import logging

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

import traceback

from services.hdf5_reader import (
    _open_hdf5,
    _resolve_obs_dataset,
    get_episode_frames,
    get_episode_info,
    get_episode_list,
)
from utils.frame_encoder import encode_frame_batch

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("/{dataset_id:path}/debug/{episode_id}")
def debug_hdf5(dataset_id: str, episode_id: int):
    """Temporary debug endpoint to inspect HDF5 structure."""
    info = {}
    try:
        with _open_hdf5(dataset_id) as f:
            ep_key = f"episode_{episode_id}"
            info["episode_exists"] = ep_key in f
            if ep_key not in f:
                return info
            ep = f[ep_key]
            info["ep_keys"] = list(ep.keys())
            obs = ep["observations"]
            info["obs_type"] = str(type(obs).__name__)
            if hasattr(obs, "shape"):
                info["obs_shape"] = list(obs.shape)
                info["obs_dtype"] = str(obs.dtype)
                info["obs_compression"] = str(obs.compression)
                info["obs_chunks"] = list(obs.chunks) if obs.chunks else None
                # Try reading 1 frame
                try:
                    frame = obs[0]
                    info["read_1_frame"] = f"OK shape={list(frame.shape)} dtype={frame.dtype}"
                except Exception as e:
                    info["read_1_frame"] = f"FAILED: {e}"
                    info["read_1_traceback"] = traceback.format_exc()
            else:
                info["obs_keys"] = list(obs.keys())
                first_key = list(obs.keys())[0]
                ds = obs[first_key]
                info["first_key"] = first_key
                info["first_shape"] = list(ds.shape)
                info["first_dtype"] = str(ds.dtype)
                info["first_compression"] = str(ds.compression)
                try:
                    frame = ds[0]
                    info["read_1_frame"] = f"OK shape={list(frame.shape)} dtype={frame.dtype}"
                except Exception as e:
                    info["read_1_frame"] = f"FAILED: {e}"
                    info["read_1_traceback"] = traceback.format_exc()
    except Exception as e:
        info["error"] = str(e)
        info["traceback"] = traceback.format_exc()
    return info


@router.get("/{dataset_id:path}/episodes")
def list_episodes(dataset_id: str):
    try:
        return get_episode_list(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{dataset_id:path}/episodes/{episode_id}/info")
def episode_info(dataset_id: str, episode_id: int):
    try:
        return get_episode_info(dataset_id, episode_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{dataset_id:path}/episodes/{episode_id}/frames")
def episode_frames(
    dataset_id: str,
    episode_id: int,
    start: int = Query(default=0, ge=0),
    count: int = Query(default=120, ge=1, le=500),
    quality: int = Query(default=75, ge=1, le=100),
):
    try:
        frames = get_episode_frames(dataset_id, episode_id, start, count)
        data = encode_frame_batch(frames, quality)
        return Response(
            content=data,
            media_type="application/octet-stream",
            headers={"X-Frame-Count": str(frames.shape[0])},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Failed to get frames for %s ep %s", dataset_id, episode_id)
        raise HTTPException(status_code=500, detail=str(e))
