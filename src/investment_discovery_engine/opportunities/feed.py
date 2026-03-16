"""Opportunity feed placeholder."""

from __future__ import annotations

from ..personalization.service import UserPersonalizationService
from ..shared.models import OpportunityFeed
from .generator import OpportunityGenerator


class OpportunityFeedService:
    """Builds a user-facing feed of ranked opportunity ideas."""

    def __init__(
        self,
        generator: OpportunityGenerator,
        personalization_service: UserPersonalizationService,
    ) -> None:
        self.generator = generator
        self.personalization_service = personalization_service

    def build_feed(self, user_id: str) -> OpportunityFeed:
        """Return a personalized placeholder feed."""

        context = self.personalization_service.build_discovery_context(user_id)
        starter_symbols = ["AAPL", "MSFT", "NVDA", "GOOGL"]
        filtered_symbols = [
            symbol
            for symbol in starter_symbols
            if symbol not in context["excluded_symbols"]
        ]
        opportunities = self.generator.generate_candidates(filtered_symbols)

        return OpportunityFeed(
            user_id=user_id,
            opportunities=opportunities,
            filters_applied={
                "risk_tolerance": context["risk_tolerance"],
                "preferred_sectors": context["preferred_sectors"],
            },
        )
