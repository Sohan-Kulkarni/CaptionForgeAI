import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.caption import router as caption_router
from app.services.caption_service import CaptionServiceError, load_model

load_dotenv()


def _allowed_origins() -> list[str]:
    origins = os.getenv("ALLOWED_ORIGINS", "")
    parsed = [origin.strip() for origin in origins.split(",") if origin.strip()]
    return parsed or ["http://localhost:5173", "http://127.0.0.1:5173"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        load_model()
    except CaptionServiceError:
        print("Application startup failed because the BLIP model could not be loaded.", flush=True)
        raise

    yield


app = FastAPI(
    title="AI Image Caption Generator API",
    description="Generate multiple BLIP-powered captions for uploaded images.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(caption_router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
