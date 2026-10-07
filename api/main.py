import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.datasets import router as datasets_router
from services.resource_limits import ObservationLimits

app = FastAPI(title="minariviz API", version="0.1.0")
app.add_middleware(ObservationLimits)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets_router)


@app.get("/")
def root():
    return {
        "name": "minariviz API",
        "status": "ok",
        "health": "/api/health",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
