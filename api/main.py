from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers.datasets import router as datasets_router

app = FastAPI(title="minariviz API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
