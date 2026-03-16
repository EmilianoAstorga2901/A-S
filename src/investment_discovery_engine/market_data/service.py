from __future__ import annotations

from datetime import datetime, timedelta
from math import sin
from typing import Dict, List

from .schemas import AssetMarketData, HistoricalPricePoint, MarketSnapshot

DEFAULT_UNIVERSE = ["AAPL", "MSFT", "NVDA", "SPY"]
ASSET_NAMES: Dict[str, str] = {
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "NVDA": "NVIDIA",
    "SPY": "SPDR S&P 500 ETF",
}
BASE_PRICE: Dict[str, float] = {"AAPL": 210.0, "MSFT": 420.0, "NVDA": 130.0, "SPY": 560.0}


class MarketDataService:
    def __init__(self, symbols: List[str] | None = None) -> None:
        self.symbols = symbols or list(DEFAULT_UNIVERSE)

    def get_watchlist(self) -> List[MarketSnapshot]:
        return [self.get_snapshot(symbol) for symbol in self.symbols]

    def get_snapshot(self, symbol: str) -> MarketSnapshot:
        metrics = self.get_asset_metrics(symbol)
        return MarketSnapshot(symbol=symbol, name=metrics.name, price=metrics.current_price, source=metrics.source)

    def get_asset_metrics(self, symbol: str) -> AssetMarketData:
        history = self._build_history(symbol)
        closes = [p.close for p in history]
        current = closes[-1]
        ret_1m = self._period_return(closes, 21)
        ret_3m = self._period_return(closes, 63)
        ret_6m = self._period_return(closes, 126)
        ma_short = sum(closes[-20:]) / 20
        ma_long = sum(closes[-50:]) / 50

        rolling_max = closes[0]
        min_dd = 0.0
        for c in closes:
            rolling_max = max(rolling_max, c)
            dd = (c / rolling_max) - 1
            min_dd = min(min_dd, dd)

        returns = []
        for i in range(1, len(closes)):
            returns.append((closes[i] / closes[i - 1]) - 1)
        mean = sum(returns) / len(returns)
        var = sum((r - mean) ** 2 for r in returns) / len(returns)
        vol = (var ** 0.5) * (252 ** 0.5)

        return AssetMarketData(
            symbol=symbol,
            name=ASSET_NAMES.get(symbol, symbol),
            current_price=round(current, 2),
            return_1m=ret_1m,
            return_3m=ret_3m,
            return_6m=ret_6m,
            volatility=vol,
            drawdown=min_dd,
            ma_short=ma_short,
            ma_long=ma_long,
            history=history,
        )

    def _build_history(self, symbol: str) -> List[HistoricalPricePoint]:
        base = BASE_PRICE.get(symbol, 100.0)
        today = datetime.utcnow().date()
        rows: List[HistoricalPricePoint] = []
        for idx in range(180):
            day = today - timedelta(days=179 - idx)
            drift = 1 + (0.0007 * idx)
            wave = 1 + 0.03 * sin(idx / 8)
            price = base * drift * wave
            rows.append(HistoricalPricePoint(date=day.isoformat(), close=round(price, 2)))
        return rows

    def _period_return(self, closes: List[float], periods: int) -> float:
        if len(closes) <= periods:
            start = closes[0]
        else:
            start = closes[-periods - 1]
        end = closes[-1]
        return 0.0 if start == 0 else (end / start) - 1
