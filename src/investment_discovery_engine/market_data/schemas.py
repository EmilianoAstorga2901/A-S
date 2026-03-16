"""Schemas for market data payloads."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field


class MarketSnapshot(BaseModel):
    """Represents a basic market price snapshot."""

    symbol: str
    name: Optional[str] = None
    price: Optional[float] = None
    currency: str = "USD"
    source: str = "placeholder-provider"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HistoricalPricePoint(BaseModel):
    """Represents a historical OHLCV point used for charts and metrics."""

    date: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: float
    volume: Optional[float] = None


class FundamentalSnapshot(BaseModel):
    """Normalized snapshot of a few basic fundamental metrics."""

    instrument_type: str = "UNKNOWN"
    source: str = "fallback"
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None
    profit_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    debt_to_equity: Optional[float] = None
    total_cash: Optional[float] = None
    total_debt: Optional[float] = None
    return_on_equity: Optional[float] = None
    current_ratio: Optional[float] = None


class AssetMarketData(BaseModel):
    """Normalized market data and basic analytics for a tradable asset."""

    symbol: str
    name: str
    currency: str = "USD"
    source: str = "yfinance"
    current_price: float
    return_1m: float
    return_3m: float
    return_6m: float
    volatility: float
    drawdown: float
    ma_short: float
    ma_long: float
    history: List[HistoricalPricePoint] = Field(default_factory=list)
    fundamentals: Optional[FundamentalSnapshot] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
