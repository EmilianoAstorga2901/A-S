"""UI routes and template rendering."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from ..analysis.engine import FinancialAnalysisEngine
from ..config import settings
from ..market_data.service import MarketDataService
from .demo_content import build_demo_context

router = APIRouter(include_in_schema=False)
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent / "templates"))
analysis_engine = FinancialAnalysisEngine()
market_data_service = MarketDataService()


@router.get("/", response_class=HTMLResponse)
def homepage(request: Request) -> HTMLResponse:
    """Render the fintech wallet demo."""

    context = build_demo_context(
        market_data_service=market_data_service,
        analysis_engine=analysis_engine,
    )
    context.update({"request": request, "app_name": settings.app_name})

    return templates.TemplateResponse(
        request,
        "index.html",
        context,
    )
