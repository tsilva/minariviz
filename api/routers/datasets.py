import logging

from fastapi import APIRouter, HTTPException, Path, Query
from fastapi.responses import Response
from services.resource_limits import ResourceLimitError

from services.hdf5_reader import (
    get_episode_frames,
    get_episode_info,
    get_episode_list,
)
from utils.frame_encoder import UnsupportedFrameShapeError, encode_frame_batch

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


def safe_error(error: Exception) -> HTTPException:
    if isinstance(error, ResourceLimitError):
        headers = {"Retry-After": str(error.retry_after)} if error.retry_after else None
        return HTTPException(error.status_code, str(error), headers=headers)
    if isinstance(error, ValueError):
        return HTTPException(404, "Dataset or episode is unavailable.")
    logger.exception("Observation request failed")
    return HTTPException(
        503, "Observations are temporarily unavailable; try again later."
    )


@router.get("/{dataset_id:path}/episodes")
def list_episodes(dataset_id: str):
    try:
        return get_episode_list(dataset_id)
    except Exception as e:
        raise safe_error(e) from None


@router.get("/{dataset_id:path}/episodes/{episode_id}/info")
def episode_info(dataset_id: str, episode_id: int = Path(ge=0)):
    try:
        return get_episode_info(dataset_id, episode_id)
    except Exception as e:
        raise safe_error(e) from None


@router.get("/{dataset_id:path}/episodes/{episode_id}/frames")
def episode_frames(
    dataset_id: str,
    episode_id: int = Path(ge=0),
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
    except UnsupportedFrameShapeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise safe_error(e) from None
