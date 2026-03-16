"""Market data service backed by yfinance with deterministic fallbacks."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd

from .schemas import AssetMarketData, FundamentalSnapshot, HistoricalPricePoint, MarketSnapshot

try:
    import yfinance as yf
except ImportError:  # pragma: no cover - exercised implicitly when dependency is absent.
    yf = None


DEFAULT_UNIVERSE = ["SPY", "QQQ", "GLD", "TLT", "AAPL", "MSFT", "NVDA", "KO"]
FUND_SYMBOLS = {"SPY", "QQQ", "GLD", "TLT"}

ASSET_NAMES: Dict[str, str] = {
    "SPY": "SPDR S&P 500 ETF",
    "QQQ": "Invesco Nasdaq 100 ETF",
    "GLD": "SPDR Gold Shares",
    "TLT": "iShares 20+ Year Treasury Bond ETF",
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "NVDA": "NVIDIA",
    "KO": "Coca-Cola",
}

FALLBACK_PROFILE: Dict[str, Tuple[float, float, float]] = {
    "SPY": (580.0, 0.0034, 0.008),
    "QQQ": (505.0, 0.0048, 0.012),
    "GLD": (224.0, 0.0021, 0.006),
    "TLT": (91.0, -0.0006, 0.009),
    "AAPL": (228.0, 0.0036, 0.013),
    "MSFT": (426.0, 0.0039, 0.011),
    "NVDA": (134.0, 0.0061, 0.024),
    "KO": (61.0, 0.0015, 0.005),
}

FALLBACK_FUNDAMENTALS: Dict[str, Dict[str, float]] = {
    "AAPL": {
        "revenue_growth": 0.06,
        "earnings_growth": 0.09,
        "profit_margin": 0.25,
        "operating_margin": 0.31,
        "debt_to_equity": 1.45,
        "total_cash": 67_000_000_000.0,
        "total_debt": 108_000_000_000.0,
        "return_on_equity": 1.32,
        "current_ratio": 0.95,
    },
    "MSFT": {
        "revenue_growth": 0.14,
        "earnings_growth": 0.18,
        "profit_margin": 0.36,
        "operating_margin": 0.44,
        "debt_to_equity": 0.42,
        "total_cash": 80_000_000_000.0,
        "total_debt": 52_000_000_000.0,
        "return_on_equity": 0.34,
        "current_ratio": 1.28,
    },
    "NVDA": {
        "revenue_growth": 0.62,
        "earnings_growth": 0.72,
        "profit_margin": 0.49,
        "operating_margin": 0.56,
        "debt_to_equity": 0.27,
        "total_cash": 31_000_000_000.0,
        "total_debt": 11_000_000_000.0,
        "return_on_equity": 0.69,
        "current_ratio": 3.10,
    },
    "KO": {
        "revenue_growth": 0.05,
        "earnings_growth": 0.07,
        "profit_margin": 0.23,
        "operating_margin": 0.29,
        "debt_to_equity": 1.58,
        "total_cash": 11_000_000_000.0,
        "total_debt": 41_000_000_000.0,
        "return_on_equity": 0.39,
        "current_ratio": 1.09,
    },
}


class MarketDataService:
    """Abstraction over external and internal market data providers."""

    _analytics_cache: Dict[str, Tuple[datetime, List[AssetMarketData]]] = {}
    _fundamentals_cache: Dict[str, Tuple[datetime, FundamentalSnapshot]] = {}

    def __init__(
        self,
        symbols: Optional[List[str]] = None,
        cache_ttl_seconds: int = 900,
    ) -> None:
        self.symbols = symbols or list(DEFAULT_UNIVERSE)
        self.cache_ttl_seconds = cache_ttl_seconds

    def get_snapshot(self, symbol: str) -> MarketSnapshot:
        """Return the latest normalized market snapshot for one asset."""

        data = self.get_asset_metrics(symbol)
        return MarketSnapshot(
            symbol=data.symbol,
            name=data.name,
            price=data.current_price,
            currency=data.currency,
            source=data.source,
            timestamp=data.timestamp,
        )

    def get_watchlist(self) -> List[MarketSnapshot]:
        """Return a starter watchlist enriched with live prices when available."""

        return [self.get_snapshot(symbol) for symbol in self.symbols[:4]]

    def get_asset_metrics(self, symbol: str) -> AssetMarketData:
        """Return metrics for a single asset."""

        all_metrics = self.get_universe_metrics(symbols=[symbol])
        return all_metrics[0]

    def get_universe_metrics(self, symbols: Optional[List[str]] = None) -> List[AssetMarketData]:
        """Return normalized analytics for the configured asset universe."""

        requested_symbols = symbols or list(self.symbols)
        cache_key = ",".join(requested_symbols)
        now = datetime.now(timezone.utc)
        cached = self._analytics_cache.get(cache_key)

        if cached and now - cached[0] < timedelta(seconds=self.cache_ttl_seconds):
            return cached[1]

        metrics = self._fetch_from_yfinance(requested_symbols)

        if not metrics:
            metrics = self._build_fallback_metrics(requested_symbols)
        else:
            metrics_by_symbol = {item.symbol: item for item in metrics}
            missing_symbols = [symbol for symbol in requested_symbols if symbol not in metrics_by_symbol]

            if missing_symbols:
                fallback_metrics = self._build_fallback_metrics(missing_symbols)
                for item in fallback_metrics:
                    metrics_by_symbol[item.symbol] = item

            metrics = [metrics_by_symbol[symbol] for symbol in requested_symbols if symbol in metrics_by_symbol]

        self._analytics_cache[cache_key] = (now, metrics)
        return metrics

    def _fetch_from_yfinance(self, symbols: List[str]) -> List[AssetMarketData]:
        """Fetch and normalize analytics from yfinance."""

        if yf is None:
            return []

        try:
            raw_data = yf.download(
                tickers=" ".join(symbols),
                period="1y",
                interval="1d",
                auto_adjust=True,
                progress=False,
                threads=False,
                group_by="ticker",
            )
        except Exception:
            return []

        metrics: List[AssetMarketData] = []

        for symbol in symbols:
            price_frame = self._extract_price_frame(raw_data, symbol)

            if price_frame.empty or len(price_frame) < 2:
                continue

            fundamentals = self._fetch_fundamental_snapshot(symbol)
            if fundamentals is None:
                fundamentals = self._build_fallback_fundamental_snapshot(symbol)

            normalized = self._build_asset_market_data(
                symbol=symbol,
                name=ASSET_NAMES.get(symbol, symbol),
                price_frame=price_frame,
                fundamentals=fundamentals,
                source="yfinance",
            )
            metrics.append(normalized)

        return metrics

    def _extract_price_frame(self, raw_data: pd.DataFrame, symbol: str) -> pd.DataFrame:
        """Extract a clean OHLCV frame from yfinance output."""

        if raw_data.empty:
            return pd.DataFrame()

        if isinstance(raw_data.columns, pd.MultiIndex):
            if symbol not in raw_data.columns.get_level_values(0):
                return pd.DataFrame()

            symbol_frame = raw_data[symbol]
            if "Close" not in symbol_frame:
                return pd.DataFrame()

            return self._normalize_price_frame(symbol_frame)

        if "Close" not in raw_data:
            return pd.DataFrame()

        return self._normalize_price_frame(raw_data)

    def _normalize_price_frame(self, price_frame: pd.DataFrame) -> pd.DataFrame:
        """Standardize yfinance columns into an OHLCV frame."""

        normalized = price_frame.copy()

        for column in ("Open", "High", "Low", "Close"):
            if column not in normalized:
                normalized[column] = np.nan

        if "Volume" not in normalized:
            normalized["Volume"] = 0.0

        normalized = normalized[["Open", "High", "Low", "Close", "Volume"]].dropna(subset=["Close"])

        if normalized.empty:
            return pd.DataFrame()

        normalized["Open"] = normalized["Open"].fillna(normalized["Close"])
        normalized["High"] = normalized["High"].fillna(normalized[["Open", "Close"]].max(axis=1))
        normalized["Low"] = normalized["Low"].fillna(normalized[["Open", "Close"]].min(axis=1))
        normalized["Volume"] = normalized["Volume"].fillna(0.0)

        return normalized.astype(float)

    def _build_asset_market_data(
        self,
        symbol: str,
        name: str,
        price_frame: pd.DataFrame,
        fundamentals: Optional[FundamentalSnapshot],
        source: str,
    ) -> AssetMarketData:
        """Convert a close series into normalized metrics."""

        price_frame = price_frame.copy()
        price_series = price_frame["Close"].astype(float).dropna()
        price_series = price_series.astype(float).dropna()
        returns = price_series.pct_change().dropna()
        current_price = float(price_series.iloc[-1])

        return AssetMarketData(
            symbol=symbol,
            name=name,
            source=source,
            current_price=current_price,
            return_1m=self._period_return(price_series, 21),
            return_3m=self._period_return(price_series, 63),
            return_6m=self._period_return(price_series, 126),
            volatility=self._annualized_volatility(returns),
            drawdown=self._max_drawdown(price_series),
            ma_short=float(price_series.tail(20).mean()),
            ma_long=float(price_series.tail(50).mean()),
            history=self._to_history_points(price_frame.tail(180)),
            fundamentals=fundamentals,
        )

    def _build_fallback_metrics(self, symbols: List[str]) -> List[AssetMarketData]:
        """Return deterministic synthetic analytics when yfinance is unavailable."""

        metrics: List[AssetMarketData] = []

        for symbol in symbols:
            base_price, daily_drift, wave_amplitude = FALLBACK_PROFILE.get(symbol, (100.0, 0.0015, 0.01))
            price_frame = self._build_fallback_frame(
                base_price=base_price,
                daily_drift=daily_drift,
                wave_amplitude=wave_amplitude,
            )
            metrics.append(
                self._build_asset_market_data(
                    symbol=symbol,
                    name=ASSET_NAMES.get(symbol, symbol),
                    price_frame=price_frame,
                    fundamentals=self._build_fallback_fundamental_snapshot(symbol),
                    source="fallback-synthetic",
                )
            )

        return metrics

    def _build_fallback_frame(
        self,
        base_price: float,
        daily_drift: float,
        wave_amplitude: float,
    ) -> pd.DataFrame:
        """Create a smooth deterministic OHLCV frame used only as a fallback."""

        periods = 180
        index = pd.date_range(end=datetime.now(timezone.utc), periods=periods, freq="B")
        steps = np.arange(periods)
        trend = base_price * np.exp(daily_drift * steps)
        seasonality = 1 + wave_amplitude * np.sin(steps / 5.0) + (wave_amplitude / 2.0) * np.cos(steps / 11.0)
        close = pd.Series(trend * seasonality, index=index)
        previous_close = close.shift(1).fillna(close.iloc[0] * (1 - daily_drift))
        open_series = previous_close * (1 + (wave_amplitude * 0.18) * np.sin(steps / 3.0))
        high_series = np.maximum(open_series, close) * (
            1 + 0.003 + (abs(wave_amplitude) * 0.40 * (1 + np.sin(steps / 4.0)) / 2)
        )
        low_series = np.minimum(open_series, close) * (
            1 - 0.003 - (abs(wave_amplitude) * 0.35 * (1 + np.cos(steps / 6.0)) / 2)
        )
        volume_series = (base_price * 100000) * (
            1 + (0.22 * np.sin(steps / 7.0)) + (0.14 * np.cos(steps / 9.0))
        )

        return pd.DataFrame(
            {
                "Open": open_series.astype(float),
                "High": np.maximum(high_series.astype(float), close.astype(float)),
                "Low": np.minimum(low_series.astype(float), close.astype(float)),
                "Close": close.astype(float),
                "Volume": np.maximum(volume_series.astype(float), 0.0),
            },
            index=index,
        )

    def _period_return(self, price_series: pd.Series, trading_days: int) -> float:
        """Calculate a total return for a given trading-day lookback."""

        if price_series.empty:
            return 0.0

        if len(price_series) <= trading_days:
            start_price = float(price_series.iloc[0])
        else:
            start_price = float(price_series.iloc[-trading_days - 1])

        end_price = float(price_series.iloc[-1])

        if start_price == 0:
            return 0.0

        return (end_price / start_price) - 1

    def _annualized_volatility(self, returns: pd.Series) -> float:
        """Calculate a simple annualized volatility."""

        if returns.empty:
            return 0.0

        return float(returns.std(ddof=0) * np.sqrt(252))

    def _max_drawdown(self, price_series: pd.Series) -> float:
        """Calculate the maximum drawdown over the observed period."""

        if price_series.empty:
            return 0.0

        rolling_max = price_series.cummax()
        drawdowns = (price_series / rolling_max) - 1
        return float(drawdowns.min())

    def _to_history_points(self, price_frame: pd.DataFrame) -> List[HistoricalPricePoint]:
        """Serialize an OHLCV frame into UI-friendly points."""

        history: List[HistoricalPricePoint] = []

        for timestamp, row in price_frame.iterrows():
            if hasattr(timestamp, "strftime"):
                label = timestamp.strftime("%Y-%m-%d")
            else:
                label = str(timestamp)

            history.append(
                HistoricalPricePoint(
                    date=label,
                    open=float(row["Open"]) if not pd.isna(row["Open"]) else None,
                    high=float(row["High"]) if not pd.isna(row["High"]) else None,
                    low=float(row["Low"]) if not pd.isna(row["Low"]) else None,
                    close=float(row["Close"]),
                    volume=float(row["Volume"]) if not pd.isna(row["Volume"]) else None,
                )
            )

        return history

    def _fetch_fundamental_snapshot(self, symbol: str) -> Optional[FundamentalSnapshot]:
        """Fetch a minimal set of fundamental metrics for one symbol."""

        cached = self._fundamentals_cache.get(symbol)
        now = datetime.now(timezone.utc)

        if cached and now - cached[0] < timedelta(seconds=self.cache_ttl_seconds):
            return cached[1]

        if yf is None:
            return None

        try:
            ticker = yf.Ticker(symbol)
        except Exception:
            return None

        info = self._safe_info(ticker)
        instrument_type = str(info.get("quoteType") or "").upper()

        if not instrument_type:
            if symbol in FUND_SYMBOLS:
                instrument_type = "ETF"
            else:
                instrument_type = "EQUITY"

        if instrument_type in ("ETF", "MUTUALFUND", "INDEX", "CRYPTO"):
            snapshot = FundamentalSnapshot(
                instrument_type=instrument_type,
                source="fallback-fund",
            )
            self._fundamentals_cache[symbol] = (now, snapshot)
            return snapshot

        income_statement = self._safe_statement(ticker, "income_stmt")
        balance_sheet = self._safe_statement(ticker, "balance_sheet")

        revenue_growth = self._normalize_percent(
            self._first_available(
                info.get("revenueGrowth"),
                self._growth_from_statement(income_statement, ("Total Revenue", "Operating Revenue")),
            )
        )
        earnings_growth = self._normalize_percent(
            self._first_available(
                info.get("earningsGrowth"),
                self._growth_from_statement(
                    income_statement,
                    ("Net Income", "Net Income Common Stockholders", "Diluted NI Availto Com Stockholders"),
                ),
            )
        )
        profit_margin = self._normalize_percent(
            self._first_available(
                info.get("profitMargins"),
                self._margin_from_statement(
                    income_statement,
                    numerator_labels=(
                        "Net Income",
                        "Net Income Common Stockholders",
                        "Diluted NI Availto Com Stockholders",
                    ),
                    denominator_labels=("Total Revenue", "Operating Revenue"),
                ),
            )
        )
        operating_margin = self._normalize_percent(
            self._first_available(
                info.get("operatingMargins"),
                self._margin_from_statement(
                    income_statement,
                    numerator_labels=("Operating Income", "Operating Revenue"),
                    denominator_labels=("Total Revenue", "Operating Revenue"),
                ),
            )
        )

        total_cash = self._first_available(
            info.get("totalCash"),
            self._statement_latest(balance_sheet, ("Cash And Cash Equivalents", "Cash Cash Equivalents And Short Term Investments")),
        )
        total_debt = self._first_available(
            info.get("totalDebt"),
            self._statement_latest(balance_sheet, ("Total Debt", "Current Debt And Capital Lease Obligation")),
        )
        current_ratio = self._normalize_ratio(info.get("currentRatio"))
        return_on_equity = self._normalize_percent(info.get("returnOnEquity"))
        debt_to_equity = self._normalize_debt_to_equity(info.get("debtToEquity"))

        snapshot = FundamentalSnapshot(
            instrument_type=instrument_type,
            source="yfinance-fundamentals",
            revenue_growth=revenue_growth,
            earnings_growth=earnings_growth,
            profit_margin=profit_margin,
            operating_margin=operating_margin,
            debt_to_equity=debt_to_equity,
            total_cash=self._normalize_amount(total_cash),
            total_debt=self._normalize_amount(total_debt),
            return_on_equity=return_on_equity,
            current_ratio=current_ratio,
        )

        self._fundamentals_cache[symbol] = (now, snapshot)
        return snapshot

    def _build_fallback_fundamental_snapshot(self, symbol: str) -> FundamentalSnapshot:
        """Return a stable fallback for fundamentals when live data is unavailable."""

        if symbol in FUND_SYMBOLS:
            return FundamentalSnapshot(
                instrument_type="ETF",
                source="fallback-fund",
            )

        profile = FALLBACK_FUNDAMENTALS.get(symbol, {})
        return FundamentalSnapshot(
            instrument_type="EQUITY",
            source="fallback-profile",
            revenue_growth=profile.get("revenue_growth"),
            earnings_growth=profile.get("earnings_growth"),
            profit_margin=profile.get("profit_margin"),
            operating_margin=profile.get("operating_margin"),
            debt_to_equity=profile.get("debt_to_equity"),
            total_cash=profile.get("total_cash"),
            total_debt=profile.get("total_debt"),
            return_on_equity=profile.get("return_on_equity"),
            current_ratio=profile.get("current_ratio"),
        )

    def _safe_info(self, ticker: "yf.Ticker") -> Dict[str, object]:
        """Read `info` defensively because the endpoint can be unstable."""

        try:
            info = ticker.info
        except Exception:
            return {}

        return info if isinstance(info, dict) else {}

    def _safe_statement(self, ticker: "yf.Ticker", attribute_name: str) -> pd.DataFrame:
        """Read financial statements defensively."""

        try:
            statement = getattr(ticker, attribute_name)
        except Exception:
            return pd.DataFrame()

        return statement if isinstance(statement, pd.DataFrame) else pd.DataFrame()

    def _statement_latest(self, statement: pd.DataFrame, labels: Sequence[str]) -> Optional[float]:
        """Read the latest non-null statement value for one of the requested labels."""

        series = self._statement_series(statement, labels)
        if series is None:
            return None

        values = [value for value in series.tolist() if pd.notna(value)]
        if not values:
            return None

        return float(values[0])

    def _growth_from_statement(self, statement: pd.DataFrame, labels: Sequence[str]) -> Optional[float]:
        """Compute growth from the first two reported statement values."""

        series = self._statement_series(statement, labels)
        if series is None:
            return None

        values = [float(value) for value in series.tolist() if pd.notna(value)]
        if len(values) < 2 or values[1] == 0:
            return None

        return (values[0] / values[1]) - 1

    def _margin_from_statement(
        self,
        statement: pd.DataFrame,
        numerator_labels: Sequence[str],
        denominator_labels: Sequence[str],
    ) -> Optional[float]:
        """Compute a simple profitability margin from a statement."""

        numerator = self._statement_latest(statement, numerator_labels)
        denominator = self._statement_latest(statement, denominator_labels)

        if numerator is None or denominator in (None, 0):
            return None

        return numerator / denominator

    def _statement_series(self, statement: pd.DataFrame, labels: Sequence[str]) -> Optional[pd.Series]:
        """Return the first matching row series from a statement."""

        if statement.empty:
            return None

        for label in labels:
            if label in statement.index:
                return statement.loc[label]

        return None

    def _first_available(self, *values: Optional[float]) -> Optional[float]:
        """Return the first non-null metric."""

        for value in values:
            if value is not None and not pd.isna(value):
                return float(value)

        return None

    def _normalize_percent(self, value: Optional[float]) -> Optional[float]:
        """Normalize values that should behave like decimals."""

        if value is None:
            return None

        normalized = float(value)
        if abs(normalized) > 1.5:
            normalized /= 100.0

        return normalized

    def _normalize_ratio(self, value: Optional[float]) -> Optional[float]:
        """Normalize generic ratios without changing well-scaled values."""

        if value is None:
            return None

        return float(value)

    def _normalize_debt_to_equity(self, value: Optional[float]) -> Optional[float]:
        """Normalize debt-to-equity values, often returned as percentages."""

        if value is None:
            return None

        normalized = float(value)
        if abs(normalized) > 20:
            normalized /= 100.0

        return normalized

    def _normalize_amount(self, value: Optional[float]) -> Optional[float]:
        """Normalize large balance sheet values."""

        if value is None:
            return None

        return float(value)
