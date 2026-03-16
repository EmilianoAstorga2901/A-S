from __future__ import annotations

from typing import Any, Dict

from .schemas import UserPreferences, UserProfile


class UserPersonalizationService:
    def get_profile(self, user_id: str) -> UserProfile:
        return UserProfile(
            user_id=user_id,
            preferences=UserPreferences(risk_tolerance="medium", preferred_sectors=["technology"], preferred_asset_type="equity"),
        )

    def build_discovery_context(self, user_id: str) -> Dict[str, Any]:
        profile = self.get_profile(user_id)
        return {
            "user_id": profile.user_id,
            "risk_tolerance": profile.preferences.risk_tolerance,
            "preferred_sectors": profile.preferences.preferred_sectors,
            "preferred_asset_type": profile.preferences.preferred_asset_type,
            "excluded_symbols": profile.excluded_symbols,
        }
