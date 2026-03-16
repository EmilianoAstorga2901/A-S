"""Core financial analysis engine placeholder."""

from __future__ import annotations

from typing import List

from ..market_data.schemas import AssetMarketData
from .schemas import AnalysisRequest, AnalysisResult


class FinancialAnalysisEngine:
    """Coordinates future valuation, scoring, and signal generation pipelines."""

    def analyze(self, request: AnalysisRequest) -> AnalysisResult:
        """Return a placeholder analysis result for an asset."""

        return AnalysisResult(
            asset=request.asset,
            summary="Base analysis pipeline placeholder.",
            score=None,
            risk_level=None,
            signals=[],
        )

    def analyze_market_data(self, asset_data: AssetMarketData) -> AnalysisResult:
        """Score one asset using a basic and explainable technical model."""

        stability = self._recent_stability(asset_data)
        momentum_score = self._momentum_score(asset_data)
        trend_score = self._trend_score(asset_data)
        volatility_score = self._volatility_score(asset_data.volatility)
        drawdown_score = self._drawdown_score(asset_data.drawdown)
        stability_score = self._stability_score(stability)

        final_score = round(
            (0.35 * momentum_score)
            + (0.25 * trend_score)
            + (0.15 * volatility_score)
            + (0.15 * drawdown_score)
            + (0.10 * stability_score),
            1,
        )

        risk_level = self._risk_level(
            volatility=asset_data.volatility,
            drawdown=asset_data.drawdown,
            stability=stability,
        )
        signals = self._build_signals(
            asset_data=asset_data,
            score=final_score,
            risk_level=risk_level,
            stability=stability,
        )

        return AnalysisResult(
            asset=asset_data.symbol,
            summary=self._build_summary(score=final_score, risk_level=risk_level, signals=signals),
            score=final_score,
            risk_level=risk_level,
            signals=signals,
        )

    def _momentum_score(self, asset_data: AssetMarketData) -> float:
        """Blend recent returns into a 0-100 momentum score."""

        weighted_return = (
            (0.40 * asset_data.return_1m)
            + (0.35 * asset_data.return_3m)
            + (0.25 * asset_data.return_6m)
        )
        return self._clamp(50 + (weighted_return * 320), 0, 100)

    def _trend_score(self, asset_data: AssetMarketData) -> float:
        """Evaluate price alignment versus moving averages."""

        if asset_data.ma_short == 0 or asset_data.ma_long == 0:
            return 50.0

        short_vs_long = (asset_data.ma_short / asset_data.ma_long) - 1
        price_vs_short = (asset_data.current_price / asset_data.ma_short) - 1
        raw_score = 50 + (short_vs_long * 1100) + (price_vs_short * 700)
        return self._clamp(raw_score, 0, 100)

    def _volatility_score(self, volatility: float) -> float:
        """Reward contained realized volatility."""

        return self._clamp(100 - (volatility * 220), 0, 100)

    def _drawdown_score(self, drawdown: float) -> float:
        """Reward contained drawdowns."""

        return self._clamp(100 - (abs(drawdown) * 320), 0, 100)

    def _stability_score(self, stability: float) -> float:
        """Convert the recent stability ratio into a score."""

        return self._clamp(stability * 100, 0, 100)

    def _recent_stability(self, asset_data: AssetMarketData) -> float:
        """Estimate stability from the last 20 sessions."""

        closes = [point.close for point in asset_data.history]

        if len(closes) < 21:
            return 0.5

        returns: List[float] = []
        for index in range(1, len(closes)):
            previous_close = closes[index - 1]
            current_close = closes[index]

            if previous_close == 0:
                continue

            returns.append((current_close / previous_close) - 1)

        recent_returns = returns[-20:]

        if not recent_returns:
            return 0.5

        positive_ratio = sum(1 for value in recent_returns if value > 0) / len(recent_returns)
        average_return = sum(recent_returns) / len(recent_returns)
        variance = sum((value - average_return) ** 2 for value in recent_returns) / len(recent_returns)
        recent_volatility = variance ** 0.5
        smoothness = max(0.0, 1 - min(recent_volatility / 0.03, 1.0))

        return self._clamp((0.6 * positive_ratio) + (0.4 * smoothness), 0.0, 1.0)

    def _risk_level(self, volatility: float, drawdown: float, stability: float) -> str:
        """Classify risk using realized volatility, drawdown, and recent stability."""

        volatility_risk = min(volatility / 0.40, 1.0)
        drawdown_risk = min(abs(drawdown) / 0.30, 1.0)
        stability_risk = 1 - stability
        composite_risk = (
            (0.45 * volatility_risk)
            + (0.35 * drawdown_risk)
            + (0.20 * stability_risk)
        )

        if composite_risk < 0.33:
            return "Bajo"
        if composite_risk < 0.66:
            return "Medio"
        return "Alto"

    def _build_signals(
        self,
        asset_data: AssetMarketData,
        score: float,
        risk_level: str,
        stability: float,
    ) -> List[str]:
        """Generate human-readable technical signals for the deck and detail view."""

        signals = [f"Score tecnico {round(score)}/100 dentro del universo monitoreado."]

        if asset_data.return_3m >= 0.03:
            signals.append(f"Momentum positivo en 3 meses de {self._format_percent(asset_data.return_3m)}.")
        elif asset_data.return_3m <= -0.03:
            signals.append(f"Momentum debil en 3 meses de {self._format_percent(asset_data.return_3m)}.")
        else:
            signals.append(f"Momentum intermedio en 3 meses de {self._format_percent(asset_data.return_3m)}.")

        average_spread = 0.0
        if asset_data.ma_long != 0:
            average_spread = (asset_data.ma_short / asset_data.ma_long) - 1

        if asset_data.ma_short >= asset_data.ma_long:
            signals.append(
                f"MM20 por encima de MM50 con spread de {self._format_percent(average_spread)}."
            )
        else:
            signals.append(
                f"MM20 por debajo de MM50 con spread de {self._format_percent(average_spread)}."
            )

        volatility_label = "baja" if asset_data.volatility < 0.18 else "moderada" if asset_data.volatility < 0.30 else "alta"
        signals.append(
            f"Volatilidad {volatility_label} en {self._format_percent(asset_data.volatility)} y riesgo clasificado como {risk_level.lower()}."
        )

        if abs(asset_data.drawdown) < 0.10:
            signals.append(f"Drawdown contenido de {self._format_percent(asset_data.drawdown)}.")
        elif abs(asset_data.drawdown) < 0.20:
            signals.append(f"Drawdown manejable de {self._format_percent(asset_data.drawdown)}.")
        else:
            signals.append(f"Drawdown exigente de {self._format_percent(asset_data.drawdown)}.")

        if stability >= 0.65:
            signals.append("Secuencia reciente estable con cierres mayormente favorables.")
        elif stability >= 0.50:
            signals.append("Secuencia reciente mixta, pero sin deterioro brusco del setup.")
        else:
            signals.append("Secuencia reciente inestable y mas sensible a cambios de tendencia.")

        return signals

    def _build_summary(self, score: float, risk_level: str, signals: List[str]) -> str:
        """Create a concise summary suitable for opportunity explanations."""

        score_label = "fuerte" if score >= 70 else "intermedio" if score >= 55 else "de seguimiento"
        leading_signal = signals[1] if len(signals) > 1 else "sin senales destacadas"
        return (
            f"Setup tecnico {score_label} con riesgo {risk_level.lower()}. "
            f"{leading_signal}"
        )

    def _format_percent(self, value: float) -> str:
        """Format decimals as signed percentages."""

        return f"{value * 100:+.1f}%"

    def _clamp(self, value: float, lower: float, upper: float) -> float:
        """Clamp a numeric value within a closed range."""

        return max(lower, min(upper, value))
