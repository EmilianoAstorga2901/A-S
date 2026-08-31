from typing import Literal

from pydantic import BaseModel, Field, model_validator

RiskProfile = Literal["Conservador", "Moderado", "Agresivo"]
HorizonCode = Literal["lt1", "1to3", "3to5", "5to10", "gt10"]
LiquidityCode = Literal["none", "small", "important", "almost_all"]
EmergencyFundCode = Literal["yes", "partial", "no", "unsure"]
DebtCode = Literal["none", "controlled", "costly", "late", "unsure"]
IncomeCode = Literal["stable_regular", "stable_irregular", "variable", "difficulties"]


class ProfileAnswers(BaseModel):
    goal: str
    horizon: HorizonCode
    horizon_years: float = Field(ge=0)
    liquidity_need: LiquidityCode
    emergency_fund: EmergencyFundCode
    debt_status: DebtCode
    income_stability: IncomeCode
    loss_reaction: Literal["sell_all", "sell_part", "hold", "buy_more"]
    loss_tolerance_pct: Literal[5, 10, 20, 30]
    monthly_contribution: float = Field(ge=0)
    contribution_currency: Literal["ARS", "USD"] = "ARS"
    contribution_unsure: bool = False
    age: int | None = Field(default=None, ge=18, le=100)
    initial_amount: float | None = Field(default=None, ge=0)
    experience: str | None = None
    known_products: list[str] = Field(default_factory=list)
    sectors: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_answers(self):
        if len(set(self.sectors)) > 3:
            raise ValueError("Se pueden elegir hasta 3 sectores")
        if not self.contribution_unsure and self.monthly_contribution <= 0:
            raise ValueError("El aporte mensual debe ser positivo o marcarse como no definido")
        return self


class UserProfile(BaseModel):
    profile: RiskProfile
    capacity: RiskProfile
    tolerance: RiskProfile
    capacity_score: int = Field(ge=0, le=100)
    tolerance_score: int = Field(ge=0, le=100)
    reasons: list[str]
    safety_limits: list[str]
    warnings: list[str]
    contradiction: str
    sectors: list[str]
    allocation: dict[str, int]
    explanation_level: Literal["simple", "intermediate", "advanced"] = "simple"
    assessment_quality: dict[str, object] = Field(default_factory=dict)
    rules_version: str = "profile_v2.0"


class AssetInput(BaseModel):
    id: str
    risk_score: int = Field(ge=1, le=5)
    liquidity_score: int = Field(ge=1, le=5)
    horizon_min_years: float = Field(ge=0)
    sectors: list[str] = Field(default_factory=list)
    valuation_score: int = Field(ge=1, le=5, description="1 por debajo, 5 exigente")


class CompatibilityResult(BaseModel):
    asset_id: str
    score: int
    explanation: list[str]


class WithdrawalRequest(BaseModel):
    portfolio_value: float = Field(gt=0)
    liquid_balance: float = Field(ge=0)
    percentage: float = Field(gt=0, le=100)


class WithdrawalSimulation(BaseModel):
    requested_amount: float
    from_liquidity: float
    assets_to_sell: float
    needs_confirmation: bool = True
