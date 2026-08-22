from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .engine import allocation_for, build_profile, score_asset, simulate_withdrawal
from .market import MarketProviderError, global_asset_snapshot, global_company_news, global_company_profiles, market_status, search_global_assets
from .models import AssetInput, CompatibilityResult, ProfileAnswers, UserProfile, WithdrawalRequest, WithdrawalSimulation

app = FastAPI(title="Prisma API", version="0.2.0", description="Motores explicables y adaptadores de mercado del MVP de Prisma")
app.add_middleware(CORSMiddleware, allow_origin_regex=r"http://(localhost|127\.0\.0\.1):517\d", allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health(): return {"status": "ok"}

@app.post("/profile", response_model=UserProfile)
def profile(answers: ProfileAnswers): return build_profile(answers)

@app.post("/compatibility", response_model=CompatibilityResult)
def compatibility(profile: UserProfile, horizon_years: float, asset: AssetInput): return score_asset(profile, horizon_years, asset)

@app.post("/allocation")
def allocation(profile: UserProfile): return allocation_for(profile)

@app.post("/withdrawals/simulate", response_model=WithdrawalSimulation)
def withdrawal(request: WithdrawalRequest): return simulate_withdrawal(request.portfolio_value, request.liquid_balance, request.percentage)


@app.get("/market/status")
def connected_market_status():
    return market_status()


@app.get("/market/search")
def connected_market_search(q: str = Query(min_length=2, max_length=80), limit: int = Query(default=20, ge=1, le=50)):
    try:
        return search_global_assets(q, limit)
    except MarketProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/market/assets/{symbol}")
def connected_market_asset(symbol: str):
    try:
        return global_asset_snapshot(symbol)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MarketProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/market/news")
def connected_market_news(symbols: str = Query(min_length=1, max_length=200)):
    requested = [symbol.strip() for symbol in symbols.split(",") if symbol.strip()]
    if not requested:
        raise HTTPException(status_code=400, detail="Indicá al menos un símbolo")
    try:
        return global_company_news(requested)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MarketProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/market/profiles")
def connected_market_profiles(symbols: str = Query(min_length=1, max_length=300)):
    requested = [symbol.strip() for symbol in symbols.split(",") if symbol.strip()]
    if not requested:
        raise HTTPException(status_code=400, detail="Indicá al menos un símbolo")
    try:
        return global_company_profiles(requested)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MarketProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
