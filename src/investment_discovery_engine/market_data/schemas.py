from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field


class MarketSnapshot(BaseModel):
    symbol: str
    name: Optional[str] = None
    price: Optional[float] = None
    currency: str = "USD"
    source: str = "fallback-provider"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HistoricalPricePoint(BaseModel):
    date: str
    close: float


class AssetMarketData(BaseModel):
    symbol: str
    name: str
    currency: str = "USD"
    source: str = "fallback-synthetic"
    current_price: float
    return_1m: float
    return_3m: float
    return_6m: float
    volatility: float
    drawdown: float
    ma_short: float
    ma_long: float
    history: List[HistoricalPricePoint] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
