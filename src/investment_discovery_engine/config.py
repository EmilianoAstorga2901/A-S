from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "Investment Discovery Engine"
    environment: str = os.getenv("IDE_ENV", "development")
    api_prefix: str = "/api"


settings = Settings()
