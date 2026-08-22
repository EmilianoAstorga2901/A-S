"""Adaptadores de mercado para Prisma.

El frontend nunca recibe claves. Finnhub cubre búsqueda y datos globales cuando
FINNHUB_API_KEY está configurada. Los datos argentinos requieren un contrato de
Market Data de BYMA; el estado se expone sin fingir una conexión inexistente.
"""

from __future__ import annotations

import json
import os
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


FINNHUB_BASE_URL = "https://finnhub.io/api/v1"
SYMBOL_PATTERN = re.compile(r"^[A-Za-z0-9.\-_:]{1,32}$")


class MarketProviderError(RuntimeError):
    pass


def _get_json(path: str, params: dict[str, Any], timeout: float = 8.0) -> Any:
    url = f"{FINNHUB_BASE_URL}{path}?{urlencode(params)}"
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "Prisma-MVP/0.2"})
    try:
        with urlopen(request, timeout=timeout) as response:  # noqa: S310 - fixed HTTPS provider base URL
            return json.loads(response.read().decode("utf-8"))
    except Exception as exc:  # Provider errors are normalized for the API boundary.
        raise MarketProviderError("El proveedor global no respondió") from exc


def _token() -> str:
    return os.getenv("FINNHUB_API_KEY", "").strip()


def market_status() -> dict[str, Any]:
    global_ready = bool(_token())
    byma_credentials_present = bool(os.getenv("BYMA_MARKET_DATA_URL", "").strip() and os.getenv("BYMA_API_KEY", "").strip())
    return {
        "mode": "live" if global_ready else "reference",
        "global": {
            "provider": "Finnhub",
            "configured": global_ready,
            "coverage": "Acciones y ETF globales; perfil, logo, cotización, métricas y noticias según plan contratado.",
        },
        "argentina": {
            "provider": "BYMA Market Data",
            "configured": False,
            "credentialsPresent": byma_credentials_present,
            "coverage": "Acciones, renta fija, opciones, futuros y otros segmentos según contrato y permisos.",
            "message": "Pendiente de mapear los endpoints habilitados por el contrato específico de BYMA.",
        },
        "message": "Catálogo global conectado." if global_ready else "Falta FINNHUB_API_KEY; se mantienen solo los activos de referencia de V6.",
    }


def search_global_assets(query: str, limit: int = 20) -> dict[str, Any]:
    token = _token()
    if not token:
        return {"mode": "reference", "sourceLabel": "Catálogo V6", "assets": [], "message": "Proveedor global sin configurar"}
    payload = _get_json("/search", {"q": query, "token": token})
    assets = []
    for item in payload.get("result", [])[: max(1, min(limit, 50))]:
        symbol = str(item.get("symbol") or "").strip()
        if not symbol:
            continue
        assets.append({
            "symbol": symbol,
            "displaySymbol": item.get("displaySymbol") or symbol,
            "description": item.get("description") or symbol,
            "type": item.get("type") or "Instrumento listado",
            "exchange": item.get("primaryExchange") or "",
            "provider": "Finnhub",
        })
    return {"mode": "live", "sourceLabel": "Finnhub", "assets": assets, "count": len(assets)}


def _validated_symbol(symbol: str) -> str:
    normalized = symbol.upper().strip()
    if not SYMBOL_PATTERN.fullmatch(normalized):
        raise ValueError("Símbolo inválido")
    return normalized


def global_asset_snapshot(symbol: str) -> dict[str, Any]:
    token = _token()
    if not token:
        raise MarketProviderError("FINNHUB_API_KEY no está configurada")
    normalized = _validated_symbol(symbol)
    today = date.today()
    from_date = today - timedelta(days=30)
    quote = _get_json("/quote", {"symbol": normalized, "token": token})
    profile = _get_json("/stock/profile2", {"symbol": normalized, "token": token})
    metric_payload = _get_json("/stock/metric", {"symbol": normalized, "metric": "all", "token": token})
    news = _get_json("/company-news", {"symbol": normalized, "from": from_date.isoformat(), "to": today.isoformat(), "token": token})
    normalized_news = [
        {
            "id": item.get("id"),
            "symbol": normalized,
            "headline": item.get("headline"),
            "summary": item.get("summary"),
            "image": item.get("image"),
            "source": item.get("source"),
            "url": item.get("url"),
            "datetime": item.get("datetime"),
            "publishedLabel": datetime.fromtimestamp(item["datetime"], tz=timezone.utc).strftime("%d/%m/%Y %H:%M UTC") if item.get("datetime") else "Fecha no informada",
        }
        for item in news[:8]
    ]
    return {
        "mode": "live",
        "sourceLabel": "Finnhub",
        "symbol": normalized,
        "currency": profile.get("currency"),
        "quote": quote,
        "profile": profile,
        "metrics": metric_payload.get("metric", {}),
        "news": normalized_news,
        "asOf": datetime.now(timezone.utc).isoformat(),
    }


def global_company_news(symbols: list[str]) -> dict[str, Any]:
    token = _token()
    if not token:
        return {"mode": "reference", "sourceLabel": "Noticias de referencia V6", "news": [], "message": "Proveedor global sin configurar"}
    today = date.today()
    from_date = today - timedelta(days=14)
    items: list[dict[str, Any]] = []
    for symbol in symbols[:8]:
        normalized = _validated_symbol(symbol)
        payload = _get_json("/company-news", {"symbol": normalized, "from": from_date.isoformat(), "to": today.isoformat(), "token": token})
        for item in payload[:4]:
            items.append({
                "id": item.get("id"),
                "symbol": normalized,
                "headline": item.get("headline"),
                "summary": item.get("summary"),
                "image": item.get("image"),
                "source": item.get("source"),
                "url": item.get("url"),
                "datetime": item.get("datetime"),
                "publishedLabel": datetime.fromtimestamp(item["datetime"], tz=timezone.utc).strftime("%d/%m/%Y %H:%M UTC") if item.get("datetime") else "Fecha no informada",
            })
    items.sort(key=lambda item: item.get("datetime") or 0, reverse=True)
    return {"mode": "live", "sourceLabel": "Finnhub", "news": items[:12], "asOf": datetime.now(timezone.utc).isoformat()}


def global_company_profiles(symbols: list[str]) -> dict[str, Any]:
    token = _token()
    if not token:
        return {"mode": "reference", "sourceLabel": "Identidades locales V6", "profiles": {}}
    profiles: dict[str, Any] = {}
    for symbol in symbols[:20]:
        normalized = _validated_symbol(symbol)
        profile = _get_json("/stock/profile2", {"symbol": normalized, "token": token})
        if profile:
            profiles[normalized] = {
                "name": profile.get("name"),
                "logo": profile.get("logo"),
                "weburl": profile.get("weburl"),
                "exchange": profile.get("exchange"),
                "currency": profile.get("currency"),
            }
    return {"mode": "live", "sourceLabel": "Finnhub", "profiles": profiles, "asOf": datetime.now(timezone.utc).isoformat()}
