"""Opportunity generation placeholder."""

from __future__ import annotations

from typing import List

from ..analysis.engine import FinancialAnalysisEngine
from ..analysis.schemas import AnalysisRequest
from ..market_data.service import MarketDataService
from ..shared.models import Opportunity


class OpportunityGenerator:
    """Turns market inputs and analysis outputs into opportunity candidates."""

    def __init__(
        self,
        analysis_engine: FinancialAnalysisEngine,
        market_data_service: MarketDataService,
    ) -> None:
        self.analysis_engine = analysis_engine
        self.market_data_service = market_data_service

    def generate_candidates(self, symbols: List[str]) -> List[Opportunity]:
        """Generate placeholder opportunities for a list of symbols."""

        candidates: List[Opportunity] = []

        for symbol in symbols:
            snapshot = self.market_data_service.get_snapshot(symbol)
            analysis = self.analysis_engine.analyze(AnalysisRequest(asset=symbol))
            candidates.append(
                Opportunity(
                    symbol=symbol,
                    title=f"Potential opportunity in {symbol}",
                    thesis=analysis.summary,
                    risk_level="medium",
                    last_price=snapshot.price,
                    score=analysis.score,
                )
            )

        return candidates
