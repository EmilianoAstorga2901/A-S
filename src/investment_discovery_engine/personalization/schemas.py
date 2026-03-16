"""Schemas for user personalization."""

from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    """Preferences that shape opportunity ranking and filtering."""

    risk_tolerance: str = "medium"
    investment_horizon: str = "medium-term"
    preferred_sectors: List[str] = Field(default_factory=list)
    preferred_asset_type: str = "any"


class UserProfile(BaseModel):
    """Base user profile for personalization services."""

    user_id: str
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    excluded_symbols: List[str] = Field(default_factory=list)
