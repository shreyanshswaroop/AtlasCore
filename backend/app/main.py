from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.papers import router as papers_router


app = FastAPI(
    title="AtlasCore API",
    description="AI research intelligence and discovery platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(papers_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "AtlasCore API is running",
        "status": "healthy",
    }


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "atlascore-api",
    }
