"""FastAPI app."""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import __version__
from .db import init_db
from .routers import catalog as catalog_router
from .routers import chat as chat_router
from .routers import conversations as conv_router
from .routers import downloads as downloads_router
from .routers import training as training_router

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="PocketLM", version=__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "version": __version__}


app.include_router(catalog_router.router, prefix="/api", tags=["catalog"])
app.include_router(downloads_router.router, prefix="/api", tags=["downloads"])
app.include_router(conv_router.router, prefix="/api", tags=["conversations"])
app.include_router(chat_router.router, prefix="/api", tags=["chat"])
app.include_router(training_router.router, prefix="/api", tags=["training"])


# Serve SPA
app.mount(
    "/static",
    StaticFiles(directory=str(STATIC_DIR)),
    name="static",
)


@app.get("/")
def index():
    return FileResponse(str(STATIC_DIR / "index.html"))

