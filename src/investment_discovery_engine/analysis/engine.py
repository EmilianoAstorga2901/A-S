"""Core financial analysis engine."""

from __future__ import annotations

from typing import List

from ..market_data.schemas import AssetMarketData
from .schemas import AnalysisRequest, AnalysisResult, MultiplierRow


class FinancialAnalysisEngine:
    def analyze(self, request: AnalysisRequest) -> AnalysisResult:
        return AnalysisResult(
            asset=request.asset,
            summary="Base analysis pipeline placeholder.",
            score=None,
            risk_level=None,
            signals=[],
        )

    def analyze_market_data(self, asset_data: AssetMarketData) -> AnalysisResult:
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

        risk_level = self._risk_level(asset_data.volatility, asset_data.drawdown, stability)
        signals = self._build_signals(asset_data, final_score, risk_level, stability)
        recommendation, buy_label, sell_label = self._bet_style_labels(final_score, risk_level)

        return AnalysisResult(
            asset=asset_data.symbol,
            summary=self._build_summary(final_score, risk_level, signals),
            score=final_score,
            risk_level=risk_level,
            signals=signals,
            recommendation=recommendation,
            buy_label=buy_label,
            sell_label=sell_label,
            multiplier_rows=self._build_multiplier_rows(asset_data, final_score),
        )

    def _bet_style_labels(self, score: float, risk_level: str) -> tuple[str, str, str]:
        if score >= 72 and risk_level != "Alto":
            return "Comprar", "x1.36 Impulso", "x1.18 Resguardo"
        if risk_level == "Alto":
            return "Mirar", "x1.22 Selectivo", "x1.44 Cobertura"
        return "Comprar", "x1.24 Confianza", "x1.20 Proteger"

    def _build_multiplier_rows(self, asset_data: AssetMarketData, score: float) -> List[MultiplierRow]:
        rows = [
            MultiplierRow(
                name="Escenario alcista (>0.5%)",
                multiplier=f"x{1.10 + max(0, asset_data.return_1m * 10):.2f}",
                reason=f"Retorno 1M de {self._format_percent(asset_data.return_1m)} apoya una suba gradual.",
            ),
            MultiplierRow(
                name="Continuidad de tendencia",
                multiplier=f"x{1.20 + max(0, asset_data.return_3m * 8):.2f}",
                reason=f"Retorno 3M de {self._format_percent(asset_data.return_3m)} sostiene el sesgo.",
            ),
            MultiplierRow(
                name="Movimiento fuerte",
                multiplier=f"x{1.30 + max(0, (score - 50) / 100):.2f}",
                reason=f"Score técnico {score}/100 sugiere potencial por encima del promedio.",
            ),
            MultiplierRow(
                name="Cobertura por giro",
                multiplier=f"x{1.15 + min(0.50, asset_data.volatility):.2f}",
                reason=f"Volatilidad anualizada {self._format_percent(asset_data.volatility)} incrementa valor de cobertura.",
            ),
        ]
        return rows

    def _momentum_score(self, asset_data: AssetMarketData) -> float:
        weighted_return = (0.40 * asset_data.return_1m) + (0.35 * asset_data.return_3m) + (0.25 * asset_data.return_6m)
        return self._clamp(50 + (weighted_return * 320), 0, 100)

    def _trend_score(self, asset_data: AssetMarketData) -> float:
        if asset_data.ma_short == 0 or asset_data.ma_long == 0:
            return 50.0
        short_vs_long = (asset_data.ma_short / asset_data.ma_long) - 1
        price_vs_short = (asset_data.current_price / asset_data.ma_short) - 1
        return self._clamp(50 + (short_vs_long * 1100) + (price_vs_short * 700), 0, 100)

    def _volatility_score(self, volatility: float) -> float:
        return self._clamp(100 - (volatility * 220), 0, 100)

    def _drawdown_score(self, drawdown: float) -> float:
        return self._clamp(100 - (abs(drawdown) * 320), 0, 100)

    def _stability_score(self, stability: float) -> float:
        return self._clamp(stability * 100, 0, 100)

    def _recent_stability(self, asset_data: AssetMarketData) -> float:
        closes = [point.close for point in asset_data.history]
        if len(closes) < 21:
            return 0.5
        returns = []
        for i in range(1, len(closes)):
            prev = closes[i - 1]
            if prev != 0:
                returns.append((closes[i] / prev) - 1)
        recent = returns[-20:]
        if not recent:
            return 0.5
        positive_ratio = sum(1 for v in recent if v > 0) / len(recent)
        avg = sum(recent) / len(recent)
        var = sum((v - avg) ** 2 for v in recent) / len(recent)
        smoothness = max(0.0, 1 - min((var ** 0.5) / 0.03, 1.0))
        return self._clamp((0.6 * positive_ratio) + (0.4 * smoothness), 0.0, 1.0)

    def _risk_level(self, volatility: float, drawdown: float, stability: float) -> str:
        volatility_risk = min(volatility / 0.40, 1.0)
        drawdown_risk = min(abs(drawdown) / 0.30, 1.0)
        stability_risk = 1 - stability
        composite = (0.45 * volatility_risk) + (0.35 * drawdown_risk) + (0.20 * stability_risk)
        if composite < 0.33:
            return "Bajo"
        if composite < 0.66:
            return "Medio"
        return "Alto"

    def _build_signals(self, asset_data: AssetMarketData, score: float, risk_level: str, stability: float) -> List[str]:
        return [
            f"Score tecnico {round(score)}/100.",
            f"Momentum 3M {self._format_percent(asset_data.return_3m)}.",
            f"Volatilidad {self._format_percent(asset_data.volatility)} con riesgo {risk_level.lower()}.",
            f"Drawdown {self._format_percent(asset_data.drawdown)}.",
            "Secuencia estable." if stability >= 0.6 else "Secuencia mixta.",
        ]

    def _build_summary(self, score: float, risk_level: str, signals: List[str]) -> str:
        score_label = "fuerte" if score >= 70 else "intermedio" if score >= 55 else "de seguimiento"
        lead = signals[1] if len(signals) > 1 else "sin señales"
        return f"Setup tecnico {score_label} con riesgo {risk_level.lower()}. {lead}"

    def _format_percent(self, value: float) -> str:
        return f"{value * 100:+.1f}%"

    def _clamp(self, value: float, lower: float, upper: float) -> float:
        return max(lower, min(upper, value))
