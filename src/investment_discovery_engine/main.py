"""Application entrypoint."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .api.routes import router as api_router
from .config import settings
from .ui.web import router as ui_router

BASE_DIR = Path(__file__).resolve().parent


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Fintech platform for financial analysis and investment discovery.",
    )
    app.mount("/static", StaticFiles(directory=str(BASE_DIR / "ui" / "static")), name="static")
    app.include_router(ui_router)
    app.include_router(api_router, prefix=settings.api_prefix)
    return app


app = create_app()
