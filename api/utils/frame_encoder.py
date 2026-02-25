import io
import struct

import numpy as np
from PIL import Image


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
        else:
            img = Image.fromarray(frame, mode="RGB")

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        jpeg_bytes = buf.getvalue()

        parts.append(struct.pack("<I", len(jpeg_bytes)))
        parts.append(jpeg_bytes)

    return b"".join(parts)
