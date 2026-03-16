from __future__ import annotations

from fastapi import FastAPI

from .api.routes import router as api_router
from .config import settings
from .ui.web import router as ui_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")
    app.include_router(ui_router)
    app.include_router(api_router, prefix=settings.api_prefix)
    return app


app = create_app()
