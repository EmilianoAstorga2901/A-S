from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
def homepage() -> str:
    return """
    <html><body>
    <h1>Investment Discovery Engine</h1>
    <h2>Explorar inversiones</h2>
    <p>Deck de oportunidades con multiplicadores y explicaciones.</p>
    </body></html>
    """
