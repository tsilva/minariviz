import logging

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from services.hdf5_reader import (
    get_episode_frames,
    get_episode_info,
    get_episode_list,
)
from utils.frame_encoder import encode_frame_batch

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


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
