from __future__ import annotations

from typing import Dict, List

from fastapi import APIRouter

from ..analysis.engine import FinancialAnalysisEngine
from ..market_data.schemas import MarketSnapshot
from ..market_data.service import MarketDataService
from ..opportunities.feed import OpportunityFeedService
from ..opportunities.generator import OpportunityGenerator
from ..personalization.service import UserPersonalizationService
from ..shared.models import OpportunityFeed

router = APIRouter(tags=["investment-discovery-engine"])

analysis_engine = FinancialAnalysisEngine()
market_data_service = MarketDataService()
personalization_service = UserPersonalizationService()
opportunity_generator = OpportunityGenerator(analysis_engine=analysis_engine, market_data_service=market_data_service)
opportunity_feed_service = OpportunityFeedService(generator=opportunity_generator, personalization_service=personalization_service)


@router.get("/health")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok", "service": "investment-discovery-engine"}


@router.get("/market/watchlist", response_model=List[MarketSnapshot])
def get_watchlist() -> List[MarketSnapshot]:
    return market_data_service.get_watchlist()


@router.get("/users/{user_id}/opportunities", response_model=OpportunityFeed)
def get_opportunity_feed(user_id: str) -> OpportunityFeed:
    return opportunity_feed_service.build_feed(user_id=user_id)
