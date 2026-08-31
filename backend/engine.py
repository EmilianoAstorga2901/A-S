from .models import AssetInput, CompatibilityResult, ProfileAnswers, UserProfile, WithdrawalSimulation

LEVELS = {"Conservador": 0, "Moderado": 1, "Agresivo": 2}

CAPACITY_SCORES = {
    "horizon": {"lt1": 0, "1to3": 35, "3to5": 55, "5to10": 75, "gt10": 100},
    "liquidity": {"none": 100, "small": 75, "important": 40, "almost_all": 0},
    "fund": {"yes": 100, "partial": 60, "unsure": 40, "no": 0},
    "income": {"stable_regular": 100, "stable_irregular": 70, "variable": 45, "difficulties": 0},
}

TOLERANCE_SCORES = {
    "reaction": {"sell_all": 0, "sell_part": 35, "hold": 75, "buy_more": 100},
    "loss": {5: 10, 10: 35, 20: 65, 30: 90},
}

ALLOCATION_TABLE = {
    "retirement": {
        "Conservador": [30, 50, 20, 0], "Moderado": [15, 35, 40, 10], "Agresivo": [5, 15, 55, 25],
    },
    "growth": {
        "Conservador": [30, 50, 20, 0], "Moderado": [15, 35, 40, 10], "Agresivo": [5, 15, 55, 25],
    },
    "purchase": {
        "Conservador": [45, 45, 10, 0], "Moderado": [30, 40, 25, 5], "Agresivo": [20, 30, 35, 15],
    },
    "income": {
        "Conservador": [20, 60, 20, 0], "Moderado": [10, 50, 30, 10], "Agresivo": [5, 35, 40, 20],
    },
    "reserve": {
        "Conservador": [70, 30, 0, 0], "Moderado": [70, 30, 0, 0], "Agresivo": [70, 30, 0, 0],
    },
    "learn": {
        "Conservador": [40, 45, 15, 0], "Moderado": [25, 40, 30, 5], "Agresivo": [15, 30, 45, 10],
    },
    "other": {
        "Conservador": [30, 50, 20, 0], "Moderado": [15, 35, 40, 10], "Agresivo": [5, 15, 55, 25],
    },
}


def _level(score: int) -> str:
    return "Conservador" if score < 40 else "Moderado" if score < 70 else "Agresivo"


def _transfer(values: list[float], sources: list[int], amount: float, target: int) -> None:
    remaining = max(0.0, amount)
    for source in sources:
        if remaining <= 0:
            break
        moved = min(values[source], remaining)
        values[source] -= moved
        values[target] += moved
        remaining -= moved


def _apply_safety_allocation(base: list[int], a: ProfileAnswers) -> list[float]:
    values = [float(value) for value in base]
    if a.horizon == "lt1" or a.liquidity_need == "almost_all":
        return [80, 20, 0, 0]
    if a.horizon == "1to3":
        _transfer(values, [3], values[3], 0)
        if values[2] > 10:
            _transfer(values, [2], values[2] - 10, 1)
        if values[0] < 40:
            _transfer(values, [2, 1], 40 - values[0], 0)
        if values[0] + values[1] < 90:
            _transfer(values, [2], 90 - values[0] - values[1], 1)
    if a.horizon == "3to5":
        if values[3] > 5:
            _transfer(values, [3], values[3] - 5, 1)
        if values[0] < 20:
            _transfer(values, [3, 2, 1], 20 - values[0], 0)
        if values[0] + values[1] < 60:
            _transfer(values, [3, 2], 60 - values[0] - values[1], 1)
    if a.liquidity_need == "important":
        _transfer(values, [3], values[3], 0)
        if values[0] < 40:
            _transfer(values, [2, 1], 40 - values[0], 0)
        if values[0] + values[1] < 80:
            _transfer(values, [2], 80 - values[0] - values[1], 1)
    if a.liquidity_need == "small" and values[0] < 20:
        _transfer(values, [3, 2, 1], 20 - values[0], 0)
    if a.emergency_fund == "no":
        _transfer(values, [3], values[3], 0)
        if values[0] < 50:
            _transfer(values, [2, 1], 50 - values[0], 0)
    if a.emergency_fund in {"partial", "unsure"} and values[0] < 30:
        _transfer(values, [3, 2, 1], 30 - values[0], 0)
    return values


def _allocation(a: ProfileAnswers, profile: str) -> dict[str, int]:
    key = a.goal if a.goal in ALLOCATION_TABLE else "other"
    values = _apply_safety_allocation(ALLOCATION_TABLE[key][profile], a)
    rounded = [max(0, round(value)) for value in values]
    rounded[0] += 100 - sum(rounded)
    return dict(zip(["liquidity", "stability", "growth", "satellite"], rounded))


def _explanation_level(experience: str | None) -> str:
    if experience == "high":
        return "advanced"
    if experience == "medium":
        return "intermediate"
    return "simple"


def build_profile(a: ProfileAnswers) -> UserProfile:
    capacity_score = round(
        0.30 * CAPACITY_SCORES["horizon"][a.horizon]
        + 0.30 * CAPACITY_SCORES["liquidity"][a.liquidity_need]
        + 0.25 * CAPACITY_SCORES["fund"][a.emergency_fund]
        + 0.15 * CAPACITY_SCORES["income"][a.income_stability]
    )
    tolerance_score = min(
        TOLERANCE_SCORES["reaction"][a.loss_reaction],
        TOLERANCE_SCORES["loss"][a.loss_tolerance_pct],
    )
    capacity = _level(capacity_score)
    tolerance = _level(tolerance_score)
    profile = capacity if LEVELS[capacity] <= LEVELS[tolerance] else tolerance
    limits: list[str] = []
    warnings: list[str] = []

    def cap(maximum: str, message: str) -> None:
        nonlocal profile
        if LEVELS[profile] > LEVELS[maximum]:
            profile = maximum
        limits.append(message)

    if a.horizon == "lt1":
        cap("Conservador", "El plazo menor a un año exige una cartera conservadora.")
    if a.horizon == "1to3":
        cap("Moderado", "El horizonte de uno a tres años impide una cartera agresiva.")
    if a.emergency_fund == "no":
        cap("Conservador", "Sin fondo de emergencia se prioriza liquidez y estabilidad.")
    if a.emergency_fund == "partial":
        cap("Moderado", "El fondo de emergencia parcial limita el perfil a Moderado.")
    if a.emergency_fund == "unsure":
        cap("Moderado", "Conviene revisar el fondo de emergencia antes de aumentar riesgo.")
    if a.liquidity_need == "almost_all":
        cap("Conservador", "La necesidad probable de retirar casi todo exige alta liquidez.")
    if a.liquidity_need == "important":
        cap("Moderado", "Necesitar una parte importante limita el perfil a Moderado.")
    if a.debt_status == "costly":
        cap("Moderado", "La deuda costosa limita el perfil hasta comparar su costo efectivo.")
    if a.debt_status == "late":
        cap("Conservador", "Las deudas atrasadas requieren estabilizar las finanzas antes de asumir riesgo.")

    if a.debt_status == "costly":
        warnings.append("Tenés deuda costosa: compará su costo con el beneficio incierto de invertir.")
    if a.debt_status == "late":
        warnings.append("Antes de invertir, revisá las deudas atrasadas o difíciles de pagar.")
    if a.debt_status == "unsure":
        warnings.append("Aclarar tu situación de deuda puede cambiar las decisiones operativas.")

    if capacity == tolerance:
        contradiction = "Tu situación financiera y tu tolerancia a las fluctuaciones son coherentes con este perfil."
    elif LEVELS[capacity] > LEVELS[tolerance]:
        contradiction = "Tu situación permitiría más variación de la que hoy te resulta cómoda. La propuesta respeta tu tolerancia."
    else:
        contradiction = "Te sentís dispuesto a asumir más riesgo del que tu situación permite. La propuesta prioriza tu capacidad."

    reasons = [
        f"Tu capacidad objetiva es {capacity.lower()} por plazo, liquidez, respaldo e ingresos.",
        f"Tu tolerancia emocional es {tolerance.lower()} según tu reacción y pérdida máxima.",
    ]
    if limits:
        reasons.append(limits[0])

    contradiction_gap = abs(capacity_score - tolerance_score)
    uncertainty_penalty = (10 if a.emergency_fund == "unsure" else 0) + (10 if a.debt_status == "unsure" else 0)
    confidence = max(35, min(90, 100 - uncertainty_penalty - (10 if contradiction_gap >= 40 else 0)))
    requires_review = a.debt_status in {"costly", "late", "unsure"} or a.income_stability == "difficulties" or a.emergency_fund == "no" or contradiction_gap >= 40

    return UserProfile(
        profile=profile,
        capacity=capacity,
        tolerance=tolerance,
        capacity_score=capacity_score,
        tolerance_score=tolerance_score,
        reasons=reasons,
        safety_limits=limits,
        warnings=warnings,
        contradiction=contradiction,
        sectors=list(dict.fromkeys(a.sectors))[:3],
        allocation=_allocation(a, profile),
        explanation_level=_explanation_level(a.experience),
        assessment_quality={"coverage": 100, "confidence": confidence, "contradiction_gap": contradiction_gap, "requires_review": requires_review, "basis": "Autodeclarado; no validado externamente"},
    )


def score_asset(profile: UserProfile, horizon_years: float, asset: AssetInput) -> CompatibilityResult:
    score = 100
    reasons: list[str] = []
    max_risk = {"Conservador": 2, "Moderado": 4, "Agresivo": 4}[profile.profile]
    if asset.risk_score > max_risk:
        score -= 35
        reasons.append("El riesgo del activo supera el rango automático apropiado para el perfil.")
    if horizon_years < asset.horizon_min_years:
        score -= 30
        reasons.append("El horizonte del usuario es menor al recomendado para este activo.")
    overlap = set(profile.sectors) & set(asset.sectors)
    if overlap:
        score += min(8, 4 * len(overlap))
        reasons.append("Coincide con una preferencia sectorial; solo afecta el orden de descubrimiento.")
    if asset.valuation_score >= 4:
        score -= 10
        reasons.append("La valoración es exigente y reduce el margen de seguridad.")
    if asset.liquidity_score <= 2:
        score -= 10
        reasons.append("La liquidez es limitada.")
    return CompatibilityResult(asset_id=asset.id, score=max(0, min(100, score)), explanation=reasons or ["Compatible con el perfil y horizonte declarados."])


def allocation_for(profile: UserProfile) -> dict[str, int]:
    return profile.allocation


def simulate_withdrawal(portfolio_value: float, liquid_balance: float, percentage: float) -> WithdrawalSimulation:
    amount = portfolio_value * percentage / 100
    from_liquidity = min(amount, liquid_balance)
    return WithdrawalSimulation(
        requested_amount=round(amount, 2),
        from_liquidity=round(from_liquidity, 2),
        assets_to_sell=round(amount - from_liquidity, 2),
    )
