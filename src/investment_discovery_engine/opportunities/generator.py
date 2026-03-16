from __future__ import annotations

from typing import List

from ..analysis.engine import FinancialAnalysisEngine
from ..market_data.service import MarketDataService
from ..shared.models import Opportunity, OpportunityMultiplier


class OpportunityGenerator:
    def __init__(self, analysis_engine: FinancialAnalysisEngine, market_data_service: MarketDataService) -> None:
        self.analysis_engine = analysis_engine
        self.market_data_service = market_data_service

    def generate_candidates(self, symbols: List[str]) -> List[Opportunity]:
        candidates: List[Opportunity] = []
        for symbol in symbols:
            asset_data = self.market_data_service.get_asset_metrics(symbol)
            analysis = self.analysis_engine.analyze_market_data(asset_data)
            candidates.append(
                Opportunity(
                    symbol=symbol,
                    title=f"Mercado en vivo: {symbol}",
                    thesis=analysis.summary,
                    risk_level=(analysis.risk_level or "Medio").lower(),
                    last_price=asset_data.current_price,
                    score=analysis.score,
                    recommendation=analysis.recommendation,
                    buy_label=analysis.buy_label,
                    sell_label=analysis.sell_label,
                    multipliers=[OpportunityMultiplier(**row.model_dump()) for row in analysis.multiplier_rows],
                    why=analysis.signals,
                )
            )
        return candidates
