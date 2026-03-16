"""Personalization helpers used by the demo feed."""

from __future__ import annotations

from typing import Any, Dict

from .schemas import UserPreferences, UserProfile

RISK_PROFILE_OPTIONS = [
    {"key": "low", "label": "Bajo", "description": "Prioriza setups mas estables y defensivos."},
    {"key": "medium", "label": "Medio", "description": "Equilibra oportunidad y control de riesgo."},
    {"key": "high", "label": "Alto", "description": "Tolera mas volatilidad para buscar mayor upside."},
]

SECTOR_OPTIONS = [
    {"key": "technology", "label": "Tecnologia"},
    {"key": "broad-market", "label": "Mercado amplio"},
    {"key": "consumer-defensive", "label": "Consumo defensivo"},
    {"key": "rates", "label": "Bonos largos"},
    {"key": "gold", "label": "Oro"},
]

ASSET_TYPE_OPTIONS = [
    {"key": "any", "label": "Todos"},
    {"key": "equity", "label": "Acciones"},
    {"key": "etf", "label": "ETF"},
    {"key": "bond", "label": "Bonos"},
    {"key": "gold", "label": "Oro"},
]


class UserPersonalizationService:
    """Builds the user context consumed by the opportunity feed."""

    def get_profile(self, user_id: str) -> UserProfile:
        """Return a simple demo profile until user storage is implemented."""

        return UserProfile(
            user_id=user_id,
            preferences=UserPreferences(
                risk_tolerance="medium",
                preferred_sectors=["technology"],
                preferred_asset_type="equity",
            ),
        )

    def get_preference_catalog(self) -> Dict[str, Any]:
        """Return the small option catalog rendered in the demo UI."""

        return {
            "risk_profiles": RISK_PROFILE_OPTIONS,
            "sectors": SECTOR_OPTIONS,
            "asset_types": ASSET_TYPE_OPTIONS,
        }

    def build_discovery_context(self, user_id: str) -> Dict[str, Any]:
        """Return a lightweight context dictionary for downstream modules."""

        profile = self.get_profile(user_id)
        return {
            "user_id": profile.user_id,
            "risk_tolerance": profile.preferences.risk_tolerance,
            "preferred_sectors": profile.preferences.preferred_sectors,
            "preferred_asset_type": profile.preferences.preferred_asset_type,
            "excluded_symbols": profile.excluded_symbols,
            "preference_catalog": self.get_preference_catalog(),
        }
