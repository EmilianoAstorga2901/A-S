"""Schemas for the financial analysis engine."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    """Input for the analysis engine."""

    asset: str
    universe: str = "global-equities"
    user_id: Optional[str] = None


class AnalysisResult(BaseModel):
    """Normalized output from the analysis engine."""

    asset: str
    summary: str
    score: Optional[float] = None
    risk_level: Optional[str] = None
    signals: List[str] = Field(default_factory=list)
