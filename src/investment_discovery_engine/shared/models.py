from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class OpportunityMultiplier(BaseModel):
    name: str
    multiplier: str
    reason: str


class Opportunity(BaseModel):
    symbol: str
    title: str
    thesis: str
    risk_level: str
    last_price: Optional[float] = None
    score: Optional[float] = None
    recommendation: Optional[str] = None
    buy_label: Optional[str] = None
    sell_label: Optional[str] = None
    multipliers: List[OpportunityMultiplier] = Field(default_factory=list)
    why: List[str] = Field(default_factory=list)


class OpportunityFeed(BaseModel):
    user_id: str
    opportunities: List[Opportunity] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
