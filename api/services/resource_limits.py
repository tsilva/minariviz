"""Resource boundaries for the single-process public observation API."""

import math
import os
import threading
import time
from collections import deque

from fastapi.responses import JSONResponse


def positive_setting(name: str, default: int) -> int:
    value = int(os.getenv(name, str(default)))
    if value <= 0:
        raise ValueError(f"{name} must be positive")
    return value


MAX_BATCH_BYTES = positive_setting("MINARIVIZ_MAX_BATCH_BYTES", 32 * 1024 * 1024)
MAX_FRAME_PIXELS = positive_setting("MINARIVIZ_MAX_FRAME_PIXELS", 2_000_000)
MAX_EPISODES = 100_000
MAX_REWARD_BYTES = 16 * 1024 * 1024


class ResourceLimitError(Exception):
    def __init__(self, message: str, status_code: int = 413, retry_after: int = 0):
        super().__init__(message)
        self.status_code = status_code
        self.retry_after = retry_after


class WindowLimit:
    def __init__(self, capacity: int, seconds: int):
        self.capacity = capacity
        self.seconds = seconds
        self.timestamps: deque[float] = deque()
        self.lock = threading.Lock()

    def retry_after(self) -> int:
        with self.lock:
            now = time.monotonic()
            while self.timestamps and self.timestamps[0] <= now - self.seconds:
                self.timestamps.popleft()
            if len(self.timestamps) >= self.capacity:
                return max(1, math.ceil(self.timestamps[0] + self.seconds - now))
            self.timestamps.append(now)
            return 0


class ObservationLimits:
    """Global limits cannot be bypassed by spoofing forwarded client addresses."""

    def __init__(self, app):
        self.app = app
        self.rate = WindowLimit(
            positive_setting("MINARIVIZ_REQUESTS_PER_MINUTE", 120), 60
        )
        self.slots = threading.BoundedSemaphore(
            positive_setting("MINARIVIZ_MAX_CONCURRENT_REQUESTS", 2)
        )

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or not scope["path"].startswith("/api/datasets/"):
            return await self.app(scope, receive, send)
        retry = self.rate.retry_after()
        if retry:
            response = JSONResponse(
                {"detail": "Observation request limit reached; try again shortly."},
                status_code=429,
                headers={"Retry-After": str(retry)},
            )
            return await response(scope, receive, send)
        if not self.slots.acquire(blocking=False):
            response = JSONResponse(
                {"detail": "Observation server is busy; try again shortly."},
                status_code=503,
                headers={"Retry-After": "5"},
            )
            return await response(scope, receive, send)
        try:
            return await self.app(scope, receive, send)
        finally:
            self.slots.release()
