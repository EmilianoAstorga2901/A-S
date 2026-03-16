from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    asset: str
    universe: str = "global-equities"
    user_id: Optional[str] = None


class MultiplierRow(BaseModel):
    name: str
    multiplier: str
    reason: str


class AnalysisResult(BaseModel):
    asset: str
    summary: str
    score: Optional[float] = None
    risk_level: Optional[str] = None
    signals: List[str] = Field(default_factory=list)
    recommendation: Optional[str] = None
    buy_label: Optional[str] = None
    sell_label: Optional[str] = None
    multiplier_rows: List[MultiplierRow] = Field(default_factory=list)
