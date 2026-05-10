import io
import struct

import numpy as np
from PIL import Image


class UnsupportedFrameShapeError(ValueError):
    """Raised when an observation cannot be represented as an image frame."""


def encode_frame_batch(frames: np.ndarray, quality: int = 75) -> bytes:
    """Encode a batch of frames as length-prefixed JPEGs.

    Each frame is encoded as: [4-byte uint32 length][JPEG bytes]
    Frames are concatenated into a single binary blob.

    Args:
        frames: Array of shape (N, H, W) for grayscale or (N, H, W, 3) for RGB.
        quality: JPEG quality 1-100.

    Returns:
        Concatenated binary data with length-prefixed JPEG frames.
    """
    parts: list[bytes] = []

    for i in range(frames.shape[0]):
        frame = frames[i]

        if frame.ndim == 2:
            img = Image.fromarray(frame, mode="L")
        elif frame.ndim == 3 and frame.shape[2] == 1:
            img = Image.fromarray(frame[:, :, 0], mode="L")
        elif frame.ndim == 3 and frame.shape[2] == 3:
            img = Image.fromarray(frame, mode="RGB")
        elif frame.ndim == 3 and frame.shape[2] == 4:
            img = Image.fromarray(frame, mode="RGBA").convert("RGB")
        else:
            raise UnsupportedFrameShapeError(
                "Observation frames must be 2D grayscale or 3D image arrays; "
                f"got frame shape {frame.shape}"
            )

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        jpeg_bytes = buf.getvalue()

        parts.append(struct.pack("<I", len(jpeg_bytes)))
        parts.append(jpeg_bytes)

    return b"".join(parts)
