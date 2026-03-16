"""Application configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Centralized runtime settings for the application."""

    app_name: str = "Investment Discovery Engine"
    environment: str = os.getenv("IDE_ENV", "development")
    api_prefix: str = "/api"
    default_user_id: str = os.getenv("IDE_DEFAULT_USER_ID", "demo-user")


settings = Settings()
