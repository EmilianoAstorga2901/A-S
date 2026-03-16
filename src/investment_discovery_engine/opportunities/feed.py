from __future__ import annotations

from ..personalization.service import UserPersonalizationService
from ..shared.models import OpportunityFeed
from .generator import OpportunityGenerator


class OpportunityFeedService:
    def __init__(self, generator: OpportunityGenerator, personalization_service: UserPersonalizationService) -> None:
        self.generator = generator
        self.personalization_service = personalization_service

    def build_feed(self, user_id: str) -> OpportunityFeed:
        context = self.personalization_service.build_discovery_context(user_id)
        starter_symbols = ["AAPL", "MSFT", "NVDA", "SPY"]
        filtered = [s for s in starter_symbols if s not in context["excluded_symbols"]]
        opportunities = self.generator.generate_candidates(filtered)
        return OpportunityFeed(
            user_id=user_id,
            opportunities=opportunities,
            filters_applied={
                "risk_tolerance": context["risk_tolerance"],
                "preferred_sectors": context["preferred_sectors"],
            },
        )
