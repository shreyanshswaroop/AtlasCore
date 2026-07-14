import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.companies import router as companies_router
from app.api.news import router as news_router
from app.api.sync import router as sync_router
from app.core.config import get_settings
from app.services.scheduler_service import auto_sync_loop


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    sync_task: asyncio.Task | None = None

    if settings.atlascore_auto_sync_enabled:
        sync_task = asyncio.create_task(auto_sync_loop())

    yield

    if sync_task is not None:
        sync_task.cancel()

        with suppress(asyncio.CancelledError):
            await sync_task


app = FastAPI(
    title="AtlasCore API",
    description="AI research intelligence and discovery platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies_router)
app.include_router(news_router)
app.include_router(sync_router)


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
