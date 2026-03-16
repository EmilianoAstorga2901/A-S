"""Shared application models."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Opportunity(BaseModel):
    """User-facing investment idea."""

    symbol: str
    title: str
    thesis: str
    risk_level: str
    last_price: Optional[float] = None
    score: Optional[float] = None


class OpportunityFeed(BaseModel):
    """Collection of opportunities delivered to a user."""

    user_id: str
    opportunities: List[Opportunity] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
