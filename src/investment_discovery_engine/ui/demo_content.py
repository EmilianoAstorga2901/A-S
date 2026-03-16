"""Presentation data for the fintech UI demo."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from ..analysis.engine import FinancialAnalysisEngine
from ..analysis.schemas import AnalysisResult
from ..market_data.schemas import AssetMarketData, FundamentalSnapshot
from ..market_data.service import DEFAULT_UNIVERSE, MarketDataService
from ..personalization.service import UserPersonalizationService


@dataclass(frozen=True)
class WalletMetric:
    """Compact metric displayed inside the wallet summary card."""

    label: str
    value: str
    tone: str = "neutral"


@dataclass(frozen=True)
class QuickAction:
    """Shortcut action visible on the home screen."""

    key: str
    label: str
    subtitle: str


@dataclass(frozen=True)
class ActivityItem:
    """Mock wallet movement shown in the activity views."""

    kind: str
    title: str
    subtitle: str
    amount: str
    tone: str
    status: str


@dataclass(frozen=True)
class MarketHighlight:
    """Small market insight preview displayed in the home screen."""

    title: str
    value: str
    change: str
    tone: str


@dataclass(frozen=True)
class MoreItem:
    """Option displayed in the More screen."""

    title: str
    description: str


@dataclass(frozen=True)
class ScenarioProjection:
    """Projected portfolio outcome for a fixed ticket size."""

    name: str
    value: str
    return_text: str
    tone: str
    description: str


@dataclass(frozen=True)
class AnalysisPoint:
    """Point used in technical, macro, or accounting analysis blocks."""

    label: str
    value: str
    description: str


@dataclass(frozen=True)
class TechnicalCandle:
    """Renderable candlestick body and wick coordinates."""

    x: float
    wick_top: float
    wick_bottom: float
    body_y: float
    body_height: float
    width: float
    tone: str


@dataclass(frozen=True)
class TechnicalVolumeBar:
    """Renderable volume bar coordinates."""

    x: float
    y: float
    height: float
    width: float
    tone: str


@dataclass(frozen=True)
class TechnicalChart:
    """Inline SVG chart model used in the detail technical section."""

    svg_width: int
    svg_height: int
    axis_bottom_padding: int
    grid_lines: List[float]
    volume_divider_y: float
    current_price_label: str
    window_label: str
    range_label: str
    average_volume_label: str
    price_max_label: str
    price_mid_label: str
    price_min_label: str
    ma_short_points: str
    ma_long_points: str
    candles: List[TechnicalCandle] = field(default_factory=list)
    volume_bars: List[TechnicalVolumeBar] = field(default_factory=list)


@dataclass(frozen=True)
class TechnicalChartRange:
    """Named chart range available in the expanded technical view."""

    key: str
    label: str
    chart: TechnicalChart


@dataclass(frozen=True)
class MacroBackdrop:
    """Simple macro snapshot derived from the tracked market universe."""

    risk_regime: str
    growth_leadership: str
    rate_regime: str
    inflation_regime: str
    spy_return_1m: float
    spy_return_3m: float
    qqq_return_3m: float
    gld_return_3m: float
    tlt_return_3m: float
    growth_spread_3m: float


@dataclass(frozen=True)
class OpportunityCard:
    """Visual representation of a market-backed investment idea."""

    slug: str
    symbol: str
    category: str
    opportunity_type: str
    time_horizon: str
    name: str
    base_score: float
    sector_tag: str
    asset_type_tag: str
    risk_band: str
    expected_return: str
    risk_level: str
    downside_scenario: str
    model_confidence: str
    explanation: str
    detail_scenario: str
    accent_color: str
    accent_glow: str
    sparkline_points: str
    chart_delta: str
    risk_tone: str
    simulation: List[ScenarioProjection] = field(default_factory=list)
    technical_chart: Optional[TechnicalChart] = None
    technical_chart_ranges: List[TechnicalChartRange] = field(default_factory=list)
    default_chart_range: str = "3m"
    technical_points: List[AnalysisPoint] = field(default_factory=list)
    economic_points: List[AnalysisPoint] = field(default_factory=list)
    accounting_points: List[AnalysisPoint] = field(default_factory=list)
    strategy_why: str = ""
    strategy_bet: str = ""
    strategy_portfolio_fit: str = ""
    why_in_feed: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class WalletDemo:
    """Wallet overview used in the home screen."""

    total_balance: str
    monthly_change: str
    metrics: List[WalletMetric] = field(default_factory=list)


ASSET_PRESENTATION: Dict[str, Dict[str, str]] = {
    "SPY": {
        "name": "SPDR S&P 500 ETF",
        "category": "ETF broad market",
        "opportunity_type": "ETF core",
        "sector_tag": "broad-market",
        "asset_type_tag": "etf",
        "time_horizon": "6 a 12 meses",
        "accent_color": "#2979FF",
        "accent_glow": "rgba(41, 121, 255, 0.22)",
        "explanation": "Da exposicion liquida al equity amplio de EEUU y sirve como base para una cartera de largo plazo.",
        "strategy_why": "Tiene sentido como bloque central cuando se busca capturar mercado amplio con sesgo a calidad y liquidez.",
        "strategy_bet": "Apuesta a continuidad del ciclo corporativo de EEUU sin depender de una sola accion o sector.",
        "strategy_portfolio_fit": "Encaja como posicion nucleo y como referencia para balancear apuestas mas tematicas.",
    },
    "QQQ": {
        "name": "Invesco Nasdaq 100 ETF",
        "category": "ETF growth",
        "opportunity_type": "ETF tecnologico",
        "sector_tag": "technology",
        "asset_type_tag": "etf",
        "time_horizon": "6 a 12 meses",
        "accent_color": "#2979FF",
        "accent_glow": "rgba(41, 121, 255, 0.26)",
        "explanation": "Concentra innovacion y crecimiento en megacaps de tecnologia y consumo digital.",
        "strategy_why": "Tiene sentido cuando el mercado premia duration larga, crecimiento y capacidad de reinversion.",
        "strategy_bet": "Apuesta a que tecnologia de alta calidad siga liderando revisiones de resultados y flujo de capital.",
        "strategy_portfolio_fit": "Encaja como tilt de crecimiento arriba de una base mas diversificada como SPY.",
    },
    "GLD": {
        "name": "SPDR Gold Shares",
        "category": "ETF refugio",
        "opportunity_type": "Cobertura macro",
        "sector_tag": "gold",
        "asset_type_tag": "gold",
        "time_horizon": "3 a 9 meses",
        "accent_color": "#00C853",
        "accent_glow": "rgba(0, 200, 83, 0.20)",
        "explanation": "Funciona como activo de cobertura frente a incertidumbre macro, dolar debil o compresion de tasas reales.",
        "strategy_why": "Tiene sentido como amortiguador cuando sube la sensibilidad a eventos macro o geopoliticos.",
        "strategy_bet": "Apuesta a que las tasas reales no vuelvan a presionar fuerte y que la demanda defensiva siga firme.",
        "strategy_portfolio_fit": "Encaja como bloque de cobertura no correlacionado frente a equity y duration tradicional.",
    },
    "TLT": {
        "name": "iShares 20+ Year Treasury Bond ETF",
        "category": "ETF duration",
        "opportunity_type": "Idea macro defensiva",
        "sector_tag": "rates",
        "asset_type_tag": "bond",
        "time_horizon": "3 a 12 meses",
        "accent_color": "#00C853",
        "accent_glow": "rgba(0, 200, 83, 0.20)",
        "explanation": "Ofrece duration larga para capturar alivio en tasas, desaceleracion economica o flight to quality.",
        "strategy_why": "Tiene sentido cuando se busca convexidad y cobertura frente a desaceleracion o caidas de equity.",
        "strategy_bet": "Apuesta a que los rendimientos largos retrocedan o que aumente la demanda por bonos soberanos.",
        "strategy_portfolio_fit": "Encaja como pata defensiva frente a posiciones de growth o equity ciclico.",
    },
    "AAPL": {
        "name": "Apple",
        "category": "Accion megacap",
        "opportunity_type": "Accion quality growth",
        "sector_tag": "technology",
        "asset_type_tag": "equity",
        "time_horizon": "6 a 12 meses",
        "accent_color": "#2979FF",
        "accent_glow": "rgba(41, 121, 255, 0.22)",
        "explanation": "Combina ecosistema defensivo, caja solida y capacidad de monetizacion sobre una base instalada enorme.",
        "strategy_why": "Tiene sentido por calidad operativa, balance fuerte y resiliencia de margenes.",
        "strategy_bet": "Apuesta a que servicios, pricing y renovacion de dispositivos sostengan crecimiento rentable.",
        "strategy_portfolio_fit": "Encaja como accion core dentro de una cartera growth con menor volatilidad relativa.",
    },
    "MSFT": {
        "name": "Microsoft",
        "category": "Accion software",
        "opportunity_type": "Accion compounder",
        "sector_tag": "technology",
        "asset_type_tag": "equity",
        "time_horizon": "6 a 18 meses",
        "accent_color": "#2979FF",
        "accent_glow": "rgba(41, 121, 255, 0.24)",
        "explanation": "Es una combinacion de software recurrente, nube, IA y balance sobresaliente.",
        "strategy_why": "Tiene sentido por recurrencia de ingresos, disciplina de capital y liderazgo en software empresarial.",
        "strategy_bet": "Apuesta a que nube, productividad y capas de IA sostengan crecimiento por encima del promedio.",
        "strategy_portfolio_fit": "Encaja como activo de calidad para una cartera de largo plazo con sesgo a tecnologia.",
    },
    "NVDA": {
        "name": "NVIDIA",
        "category": "Accion AI",
        "opportunity_type": "Accion de alto crecimiento",
        "sector_tag": "technology",
        "asset_type_tag": "equity",
        "time_horizon": "3 a 9 meses",
        "accent_color": "#FF5252",
        "accent_glow": "rgba(255, 82, 82, 0.24)",
        "explanation": "Sigue siendo el proxy principal de capex en IA, con crecimiento explosivo y beta alta.",
        "strategy_why": "Tiene sentido cuando se busca exposicion directa al lider de infraestructura AI del mercado.",
        "strategy_bet": "Apuesta a continuidad del capex en data centers, aceleradores y computo de alto rendimiento.",
        "strategy_portfolio_fit": "Encaja como posicion tactica o satelital, no como unico nucleo de una cartera balanceada.",
    },
    "KO": {
        "name": "Coca-Cola",
        "category": "Accion defensiva",
        "opportunity_type": "Accion estable de consumo",
        "sector_tag": "consumer-defensive",
        "asset_type_tag": "equity",
        "time_horizon": "9 a 18 meses",
        "accent_color": "#00C853",
        "accent_glow": "rgba(0, 200, 83, 0.18)",
        "explanation": "Aporta estabilidad, pricing power y cash flow predecible dentro de una cartera mas volatil.",
        "strategy_why": "Tiene sentido como nombre defensivo con marca global, caja recurrente y menor sensibilidad al ciclo.",
        "strategy_bet": "Apuesta a continuidad de margenes y demanda resistente en consumo defensivo.",
        "strategy_portfolio_fit": "Encaja como estabilizador frente a posiciones growth o tematicas mas agresivas.",
    },
}

ECONOMIC_PROFILE: Dict[str, Dict[str, str]] = {
    "SPY": {
        "sector_context": "mercado amplio EEUU",
        "driver": "revision de ganancias agregadas y amplitud del indice",
        "rate_sensitivity": "media",
        "inflation_context": "multiples y costos agregados",
    },
    "QQQ": {
        "sector_context": "tecnologia y growth mega cap",
        "driver": "duration larga, software, IA y reinversion",
        "rate_sensitivity": "alta",
        "inflation_context": "multiples sensibles a tasas reales",
    },
    "GLD": {
        "sector_context": "oro y cobertura macro",
        "driver": "tasas reales, dolar y demanda defensiva",
        "rate_sensitivity": "inversa a tasas reales",
        "inflation_context": "cobertura frente a eventos macro e inflacion",
    },
    "TLT": {
        "sector_context": "duration larga soberana",
        "driver": "curva larga de EEUU y demanda por refugio",
        "rate_sensitivity": "muy alta",
        "inflation_context": "mejora con desinflacion y menor tasa real",
    },
    "AAPL": {
        "sector_context": "hardware premium y servicios",
        "driver": "pricing, ecosistema y monetizacion de servicios",
        "rate_sensitivity": "media-alta",
        "inflation_context": "marca fuerte para absorber parte de la presion de costos",
    },
    "MSFT": {
        "sector_context": "software, nube e IA empresarial",
        "driver": "capex corporativo, nube y contratos recurrentes",
        "rate_sensitivity": "media-alta",
        "inflation_context": "mas sensible a multiples que a costos fisicos",
    },
    "NVDA": {
        "sector_context": "semis y computo acelerado",
        "driver": "capex de data centers e infraestructura AI",
        "rate_sensitivity": "alta",
        "inflation_context": "alta beta al ciclo de inversion y a expectativas de crecimiento",
    },
    "KO": {
        "sector_context": "consumo defensivo global",
        "driver": "pricing power y demanda recurrente",
        "rate_sensitivity": "baja-media",
        "inflation_context": "sensible a costos de insumos, pero con defensa de marca",
    },
}


def _build_sparkline(points: List[float], width: int = 260, height: int = 92) -> str:
    """Convert a numeric series into SVG polyline coordinates."""

    if len(points) < 2:
        raise ValueError("A sparkline requires at least two points.")

    min_value = min(points)
    max_value = max(points)
    span = max(max_value - min_value, 1e-6)
    step = width / (len(points) - 1)
    coordinates: List[str] = []

    for index, value in enumerate(points):
        x = round(index * step, 2)
        y = round(height - ((value - min_value) / span) * height, 2)
        coordinates.append(f"{x},{y}")

    return " ".join(coordinates)


def _format_percent(value: float) -> str:
    """Format a decimal return or volatility into a percentage string."""

    return f"{value * 100:+.1f}%"


def _format_currency(value: float) -> str:
    """Format a float as USD."""

    return f"$ {value:,.2f}"


def _format_compact_number(value: float) -> str:
    """Format large numbers into a compact chart-friendly label."""

    absolute = abs(value)

    if absolute >= 1_000_000_000:
        return f"{value / 1_000_000_000:.1f}B"
    if absolute >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    if absolute >= 1_000:
        return f"{value / 1_000:.1f}K"

    return f"{value:.0f}"


def _format_ratio(value: float) -> str:
    """Format ratios such as debt-to-equity or current ratio."""

    return f"{value:.2f}x"


def _risk_tone(risk_level: str) -> str:
    """Map the human risk label into the existing UI tone system."""

    if risk_level == "Bajo":
        return "positive"
    if risk_level == "Medio":
        return "neutral"
    return "negative"


def _risk_band(risk_level: str) -> str:
    """Normalize the display risk label into a frontend-friendly token."""

    if risk_level == "Bajo":
        return "low"
    if risk_level == "Medio":
        return "medium"
    return "high"


def _derived_base_return(data: AssetMarketData) -> float:
    """Blend recent returns into a simple base-case signal."""

    return (0.45 * data.return_1m) + (0.35 * data.return_3m) + (0.20 * data.return_6m)


def _format_score(score: Optional[float]) -> str:
    """Present the technical score using the existing confidence slot in the UI."""

    if score is None:
        return "N/D"

    return f"{round(score)}%"


def _rolling_average(values: List[float], window: int) -> List[Optional[float]]:
    """Compute a simple rolling average while preserving alignment."""

    averages: List[Optional[float]] = []
    running_total = 0.0

    for index, value in enumerate(values):
        running_total += value

        if index >= window:
            running_total -= values[index - window]

        if index + 1 >= window:
            averages.append(running_total / window)
        else:
            averages.append(None)

    return averages


def _build_line_points(
    values: List[Optional[float]],
    x_positions: List[float],
    map_price,
) -> str:
    """Convert line values into SVG polyline points."""

    coordinates: List[str] = []

    for value, x_position in zip(values, x_positions):
        if value is None:
            continue

        coordinates.append(f"{round(x_position, 2)},{round(map_price(value), 2)}")

    return " ".join(coordinates)


def _build_technical_chart(
    data: AssetMarketData,
    periods: int,
    min_width: int,
    price_height: int,
    volume_height: int,
) -> Optional[TechnicalChart]:
    """Build a native SVG candlestick chart with SMA overlays and volume."""

    bars = data.history[-periods:]

    if len(bars) < 2:
        return None

    full_closes = [point.close for point in data.history]
    ma_short = _rolling_average(full_closes, 20)
    ma_long = _rolling_average(full_closes, 50)
    start_index = len(data.history) - len(bars)
    display_ma_short = ma_short[start_index:]
    display_ma_long = ma_long[start_index:]

    chart_width = float(max(min_width, len(bars) * 10))
    padding_x = 14.0
    plot_width = chart_width - (padding_x * 2)
    step = plot_width / len(bars)
    candle_width = max(min(step * 0.58, 12.0), 4.0)
    price_top = 20.0
    price_height_float = float(price_height)
    volume_top = price_top + price_height_float + 42.0
    volume_height_float = float(volume_height)
    chart_height = int(volume_top + volume_height_float + 18.0)

    price_values: List[float] = []
    volume_values: List[float] = []

    for point, short_value, long_value in zip(bars, display_ma_short, display_ma_long):
        open_value = point.open if point.open is not None else point.close
        high_value = point.high if point.high is not None else max(open_value, point.close)
        low_value = point.low if point.low is not None else min(open_value, point.close)
        price_values.extend([open_value, high_value, low_value, point.close])

        if short_value is not None:
            price_values.append(short_value)
        if long_value is not None:
            price_values.append(long_value)

        if point.volume is not None:
            volume_values.append(point.volume)

    max_price = max(price_values)
    min_price = min(price_values)
    price_span = max(max_price - min_price, 1e-6)
    max_volume = max(volume_values) if volume_values else 0.0

    def map_price(value: float) -> float:
        return price_top + ((max_price - value) / price_span) * price_height_float

    x_positions: List[float] = []
    candles: List[TechnicalCandle] = []
    volume_bars: List[TechnicalVolumeBar] = []

    for index, point in enumerate(bars):
        center_x = padding_x + (step * index) + (step / 2)
        x_positions.append(center_x)

        open_value = point.open if point.open is not None else point.close
        high_value = point.high if point.high is not None else max(open_value, point.close)
        low_value = point.low if point.low is not None else min(open_value, point.close)
        tone = "up" if point.close >= open_value else "down"

        open_y = map_price(open_value)
        close_y = map_price(point.close)
        candles.append(
            TechnicalCandle(
                x=round(center_x, 2),
                wick_top=round(map_price(high_value), 2),
                wick_bottom=round(map_price(low_value), 2),
                body_y=round(min(open_y, close_y), 2),
                body_height=round(max(abs(close_y - open_y), 2.0), 2),
                width=round(candle_width, 2),
                tone=tone,
            )
        )

        if max_volume > 0:
            volume_value = point.volume if point.volume is not None else 0.0
            scaled_height = (volume_value / max_volume) * volume_height
            if volume_value > 0:
                scaled_height = max(scaled_height, 2.0)

            volume_bars.append(
                TechnicalVolumeBar(
                    x=round(center_x - (candle_width / 2), 2),
                    y=round(volume_top + volume_height - scaled_height, 2),
                    height=round(scaled_height, 2),
                    width=round(candle_width, 2),
                    tone=tone,
                )
            )

    average_volume = sum(volume_values) / len(volume_values) if volume_values else 0.0
    midpoint = min_price + ((max_price - min_price) / 2)
    grid_lines = [
        round(price_top + (price_height_float * ratio), 2)
        for ratio in (0.16, 0.38, 0.60, 0.82)
    ]

    return TechnicalChart(
        svg_width=int(chart_width),
        svg_height=chart_height,
        axis_bottom_padding=int(volume_height_float + 36.0),
        grid_lines=grid_lines,
        volume_divider_y=round(volume_top - 10.0, 2),
        current_price_label=_format_currency(data.current_price),
        window_label=f"Ultimas {len(bars)} ruedas",
        range_label=f"Rango {_format_currency(min_price)} a {_format_currency(max_price)}",
        average_volume_label=(
            f"Vol. prom. {_format_compact_number(average_volume)}"
            if average_volume > 0
            else "Volumen no disponible"
        ),
        price_max_label=_format_currency(max_price),
        price_mid_label=_format_currency(midpoint),
        price_min_label=_format_currency(min_price),
        ma_short_points=_build_line_points(display_ma_short, x_positions, map_price),
        ma_long_points=_build_line_points(display_ma_long, x_positions, map_price),
        candles=candles,
        volume_bars=volume_bars,
    )


def _build_chart_ranges(data: AssetMarketData) -> Tuple[Optional[TechnicalChart], List[TechnicalChartRange]]:
    """Build the compact chart plus the selectable expanded chart ranges."""

    detail_chart = _build_technical_chart(
        data=data,
        periods=36,
        min_width=620,
        price_height=172,
        volume_height=62,
    )

    range_definitions = [
        ("1m", "1M", 21, 860),
        ("3m", "3M", 63, 980),
        ("6m", "6M", 126, 1480),
    ]
    expanded_ranges: List[TechnicalChartRange] = []

    for key, label, periods, min_width in range_definitions:
        chart = _build_technical_chart(
            data=data,
            periods=periods,
            min_width=min_width,
            price_height=256,
            volume_height=92,
        )

        if chart is None:
            continue

        expanded_ranges.append(
            TechnicalChartRange(
                key=key,
                label=label,
                chart=chart,
            )
        )

    return detail_chart, expanded_ranges


def _build_simulation(base_return: float, drawdown: float, volatility: float) -> List[ScenarioProjection]:
    """Create a simple investment simulation using real market metrics."""

    optimistic_return = max(base_return + max(volatility * 0.20, 0.05), 0.05)
    negative_return = min(drawdown, base_return - max(volatility * 0.30, 0.06))
    base_value = 1000 * (1 + base_return)
    optimistic_value = 1000 * (1 + optimistic_return)
    negative_value = 1000 * (1 + negative_return)

    return [
        ScenarioProjection(
            name="Optimista",
            value=_format_currency(optimistic_value),
            return_text=_format_percent(optimistic_return),
            tone="positive",
            description="Se combina continuidad de tendencia con expansion moderada del apetito por riesgo.",
        ),
        ScenarioProjection(
            name="Base",
            value=_format_currency(base_value),
            return_text=_format_percent(base_return),
            tone="neutral",
            description="Usa una lectura derivada de retornos recientes, tendencia y medias moviles.",
        ),
        ScenarioProjection(
            name="Negativo",
            value=_format_currency(negative_value),
            return_text=_format_percent(negative_return),
            tone="negative",
            description="Toma como referencia drawdown reciente y un shock simple de volatilidad.",
        ),
    ]


def _build_technical_points(data: AssetMarketData) -> List[AnalysisPoint]:
    """Generate a compact technical section from real market metrics."""

    if data.current_price > data.ma_short > data.ma_long:
        trend_value = "Alcista con confirmacion"
        candle_text = "Los cierres recientes sostienen continuidad por encima de medias."
    elif data.current_price < data.ma_short < data.ma_long:
        trend_value = "Bajista con presion"
        candle_text = "Las ultimas ruedas validan debilidad y rebotes de corta duracion."
    else:
        trend_value = "Mixta con rotacion"
        candle_text = "El precio alterna tramos de continuidad y compresion cerca de zonas tecnicas."

    return [
        AnalysisPoint(
            label="Tendencia",
            value=trend_value,
            description=f"Precio actual {_format_currency(data.current_price)} frente a MM20 {_format_currency(data.ma_short)} y MM50 {_format_currency(data.ma_long)}.",
        ),
        AnalysisPoint(
            label="Velas japonesas",
            value="Lectura de continuidad",
            description=candle_text,
        ),
        AnalysisPoint(
            label="Medias moviles",
            value=f"MM20 {_format_currency(data.ma_short)} | MM50 {_format_currency(data.ma_long)}",
            description="La relacion entre medias se usa como filtro simple para confirmar sesgo de corto y mediano plazo.",
        ),
        AnalysisPoint(
            label="Momentum",
            value=f"1m {_format_percent(data.return_1m)} | 3m {_format_percent(data.return_3m)}",
            description="La combinacion 1m / 3m resume si el activo acelera, consolida o pierde impulso.",
        ),
    ]


def _build_macro_backdrop(market_data: List[AssetMarketData]) -> Optional[MacroBackdrop]:
    """Build a simple macro snapshot from live or fallback market proxies."""

    by_symbol = {item.symbol: item for item in market_data}
    required_symbols = ("SPY", "QQQ", "GLD", "TLT")

    if not all(symbol in by_symbol for symbol in required_symbols):
        return None

    spy = by_symbol["SPY"]
    qqq = by_symbol["QQQ"]
    gld = by_symbol["GLD"]
    tlt = by_symbol["TLT"]

    equity_momentum = (spy.return_1m + qqq.return_1m) / 2
    growth_spread_3m = qqq.return_3m - spy.return_3m

    if equity_momentum >= 0.02 and tlt.return_3m <= 0:
        risk_regime = "Mercado pro-riesgo"
    elif equity_momentum <= -0.01 and (gld.return_3m > 0 or tlt.return_3m > 0):
        risk_regime = "Mercado defensivo"
    else:
        risk_regime = "Mercado mixto"

    if tlt.return_3m >= 0.04:
        rate_regime = "Tasas largas cediendo"
    elif tlt.return_3m <= -0.04:
        rate_regime = "Tasas largas firmes"
    else:
        rate_regime = "Tasas largas laterales"

    if growth_spread_3m >= 0.03:
        growth_leadership = "Growth lidera"
    elif growth_spread_3m <= -0.03:
        growth_leadership = "Rotacion hacia defensivos"
    else:
        growth_leadership = "Liderazgo equilibrado"

    if gld.return_3m >= 0.04 and tlt.return_3m <= 0.0:
        inflation_regime = "Cobertura inflacionaria demandada"
    elif tlt.return_3m >= 0.04 and gld.return_3m <= 0.02:
        inflation_regime = "Expectativas de inflacion mas contenidas"
    else:
        inflation_regime = "Expectativas de inflacion mixtas"

    return MacroBackdrop(
        risk_regime=risk_regime,
        growth_leadership=growth_leadership,
        rate_regime=rate_regime,
        inflation_regime=inflation_regime,
        spy_return_1m=spy.return_1m,
        spy_return_3m=spy.return_3m,
        qqq_return_3m=qqq.return_3m,
        gld_return_3m=gld.return_3m,
        tlt_return_3m=tlt.return_3m,
        growth_spread_3m=growth_spread_3m,
    )


def _build_mock_economic_points(symbol: str) -> List[AnalysisPoint]:
    """Return stable fallback macro points consistent with the asset profile."""

    if symbol == "GLD":
        return [
            AnalysisPoint("Contexto macro", "Cobertura macro", "El oro reacciona mas a tasas reales, dolar y demanda defensiva que al ciclo corporativo."),
            AnalysisPoint("Tasas e inflacion", "Sensibilidad a tasas reales", "La moderacion de tasas reales suele mejorar el soporte del metal."),
            AnalysisPoint("Entorno regional", "Driver global", "Es un activo transversal con demanda de bancos centrales y flujos defensivos internacionales."),
        ]

    if symbol == "TLT":
        return [
            AnalysisPoint("Contexto macro", "Duration larga", "TLT refleja expectativas de crecimiento, inflacion y demanda por seguridad en bonos soberanos."),
            AnalysisPoint("Tasas e inflacion", "Alta sensibilidad", "Pequenos movimientos en yields largos impactan fuerte sobre duration larga."),
            AnalysisPoint("Entorno regional", "Referencia EEUU", "Su principal driver es la curva larga de Treasuries y la politica monetaria estadounidense."),
        ]

    if symbol in ("SPY", "QQQ"):
        return [
            AnalysisPoint("Contexto macro", "Ciclo de crecimiento", "Los ETFs de equity responden a actividad, liquidez y revision de ganancias agregadas."),
            AnalysisPoint("Tasas e inflacion", "Importan para multiples", "La trayectoria de inflacion y tasas largas sigue siendo clave para valuaciones de equity."),
            AnalysisPoint("Entorno sectorial", "Flujo hacia mega caps", "La concentracion en lideres mantiene al indice sensible a tecnologia y calidad."),
        ]

    if symbol == "KO":
        return [
            AnalysisPoint("Contexto macro", "Consumo defensivo", "El negocio suele resistir mejor desaceleraciones por su perfil de demanda recurrente."),
            AnalysisPoint("Tasas e inflacion", "Pricing power", "La compania depende mas de pricing y mix que de un ciclo de fuerte expansion economica."),
            AnalysisPoint("Entorno sectorial", "Defensivo global", "Bebidas y staples suelen ganar atractivo cuando el mercado prioriza estabilidad."),
        ]

    return [
        AnalysisPoint("Contexto macro", "Capex y demanda digital", "El driver principal es la continuidad del gasto corporativo en software, nube o infraestructura."),
        AnalysisPoint("Tasas e inflacion", "Impacto en valuacion", "Los cambios en tasa real siguen influyendo sobre multiples de crecimiento."),
        AnalysisPoint("Entorno sectorial", "Revision positiva selectiva", "La competencia, guidance y adopcion del producto definen el ritmo de revisiones."),
    ]


def _relative_performance_label(spread: float, benchmark_name: str) -> str:
    """Turn relative performance into a readable label."""

    if spread >= 0.05:
        return f"por encima de {benchmark_name}"
    if spread <= -0.05:
        return f"por debajo de {benchmark_name}"
    return f"en linea con {benchmark_name}"


def _build_economic_points(
    data: AssetMarketData,
    macro_backdrop: Optional[MacroBackdrop],
) -> List[AnalysisPoint]:
    """Build the economic section using market-derived macro proxies when available."""

    if macro_backdrop is None:
        return _build_mock_economic_points(data.symbol)

    profile = ECONOMIC_PROFILE.get(data.symbol, {})
    sector_context = profile.get("sector_context", "sector monitoreado")
    driver = profile.get("driver", "flujo y revision de expectativas")
    rate_sensitivity = profile.get("rate_sensitivity", "media")
    inflation_context = profile.get("inflation_context", "sensibilidad macro mixta")

    if data.symbol == "GLD":
        return [
            AnalysisPoint(
                "Contexto macro",
                f"{macro_backdrop.inflation_regime} | {_format_percent(data.return_3m)} 3m",
                (
                    f"GLD acumula {_format_percent(data.return_1m)} en 1 mes y {_format_percent(data.return_3m)} en 3 meses. "
                    f"La combinacion de oro y el proxy de duration larga hoy sugiere {macro_backdrop.inflation_regime.lower()}."
                ),
            ),
            AnalysisPoint(
                "Tasas e inflacion",
                f"{macro_backdrop.rate_regime} | TLT {_format_percent(macro_backdrop.tlt_return_3m)}",
                (
                    "El metal suele reaccionar mejor cuando baja la presion de tasas reales o cuando vuelve la demanda defensiva. "
                    f"Hoy el mensaje del proxy de tasas largas es de {macro_backdrop.rate_regime.lower()}."
                ),
            ),
            AnalysisPoint(
                "Entorno del activo",
                f"{macro_backdrop.risk_regime} | cobertura macro",
                (
                    "Como bloque de diversificacion, GLD gana atractivo cuando el mercado busca cobertura frente a shocks de inflacion, "
                    "geopolitica o perdida de conviccion en equity."
                ),
            ),
        ]

    if data.symbol == "TLT":
        return [
            AnalysisPoint(
                "Contexto macro",
                f"{macro_backdrop.rate_regime} | {_format_percent(data.return_3m)} 3m",
                (
                    f"TLT funciona como proxy de tasas largas de EEUU y hoy acumula {_format_percent(data.return_3m)} en 3 meses. "
                    f"La lectura actual es de {macro_backdrop.rate_regime.lower()}, clave para duration larga."
                ),
            ),
            AnalysisPoint(
                "Tasas e inflacion",
                f"{macro_backdrop.inflation_regime} | GLD {_format_percent(macro_backdrop.gld_return_3m)}",
                (
                    "La duration larga mejora cuando el mercado descuenta menor inflacion o menor crecimiento. "
                    "Sufre si la curva larga vuelve a exigir premio por inflacion o por mayor oferta de bonos."
                ),
            ),
            AnalysisPoint(
                "Entorno regional",
                f"{macro_backdrop.risk_regime} | curva EEUU",
                (
                    "Cuando el apetito por riesgo se enfria o se modera la actividad, TLT suele recuperar relevancia como cobertura "
                    "frente a equity y growth."
                ),
            ),
        ]

    if data.symbol == "SPY":
        return [
            AnalysisPoint(
                "Contexto macro",
                f"{macro_backdrop.risk_regime} | {_format_percent(data.return_1m)} 1m",
                (
                    f"SPY resume la lectura del equity amplio y hoy marca {_format_percent(data.return_1m)} en 1 mes y "
                    f"{_format_percent(data.return_3m)} en 3 meses. El tono del mercado luce {macro_backdrop.risk_regime.lower()}."
                ),
            ),
            AnalysisPoint(
                "Tasas e inflacion",
                f"{macro_backdrop.rate_regime} | TLT {_format_percent(macro_backdrop.tlt_return_3m)}",
                (
                    "Las valuaciones agregadas siguen condicionadas por el costo de capital. "
                    f"El proxy de tasas largas hoy sugiere {macro_backdrop.rate_regime.lower()}."
                ),
            ),
            AnalysisPoint(
                "Entorno sectorial",
                f"{macro_backdrop.growth_leadership} | spread {_format_percent(macro_backdrop.growth_spread_3m)}",
                (
                    "El spread QQQ-SPY ayuda a leer si el liderazgo sigue concentrado en growth o si se amplia al resto del mercado. "
                    f"Hoy la lectura es de {macro_backdrop.growth_leadership.lower()}."
                ),
            ),
        ]

    if data.symbol == "QQQ":
        return [
            AnalysisPoint(
                "Contexto macro",
                f"{macro_backdrop.growth_leadership} | {_format_percent(data.return_3m)} 3m",
                (
                    f"QQQ concentra growth y megacaps, con un retorno de {_format_percent(data.return_3m)} en 3 meses. "
                    f"El spread frente a SPY de {_format_percent(macro_backdrop.growth_spread_3m)} hoy apunta a {macro_backdrop.growth_leadership.lower()}."
                ),
            ),
            AnalysisPoint(
                "Tasas e inflacion",
                f"{macro_backdrop.rate_regime} | sensibilidad alta",
                (
                    "Cuando las tasas largas aflojan, QQQ suele recibir soporte de valuacion. "
                    "Cuando suben, el multiple de growth queda mas exigido por duration larga."
                ),
            ),
            AnalysisPoint(
                "Entorno sectorial",
                f"{sector_context} | {macro_backdrop.risk_regime.lower()}",
                (
                    f"La concentracion en lideres tecnologicos hace que el ETF dependa de {driver}. "
                    "La lectura sectorial hoy sigue muy ligada a software, semis e IA."
                ),
            ),
        ]

    if data.symbol in ("AAPL", "MSFT", "NVDA"):
        relative_spread = data.return_3m - macro_backdrop.qqq_return_3m
        relative_label = _relative_performance_label(relative_spread, "Nasdaq")

        return [
            AnalysisPoint(
                "Contexto macro",
                f"{macro_backdrop.growth_leadership} | {_format_percent(data.return_3m)} 3m",
                (
                    f"{data.name} se mueve dentro de un entorno donde growth hoy luce {macro_backdrop.growth_leadership.lower()}. "
                    f"El activo acumula {_format_percent(data.return_3m)} en 3 meses, con sensibilidad clara a multiples y expectativas."
                ),
            ),
            AnalysisPoint(
                "Tasas e inflacion",
                f"{macro_backdrop.rate_regime} | sensibilidad {rate_sensitivity}",
                (
                    f"El nombre mantiene una sensibilidad {rate_sensitivity} al movimiento de tasas largas. "
                    f"{inflation_context.capitalize()} y el proxy TLT hoy refleja {macro_backdrop.rate_regime.lower()}."
                ),
            ),
            AnalysisPoint(
                "Entorno sectorial",
                f"{sector_context} | {relative_label}",
                (
                    f"Contra QQQ, el activo va {relative_label} por {_format_percent(relative_spread)} en 3 meses. "
                    f"El driver sectorial principal sigue siendo {driver}."
                ),
            ),
        ]

    if data.symbol == "KO":
        relative_spread = data.return_3m - macro_backdrop.spy_return_3m
        relative_label = _relative_performance_label(relative_spread, "SPY")

        return [
            AnalysisPoint(
                "Contexto macro",
                f"{macro_backdrop.risk_regime} | {_format_percent(data.return_3m)} 3m",
                (
                    f"KO funciona como nombre defensivo y hoy acumula {_format_percent(data.return_3m)} en 3 meses. "
                    f"En un mercado {macro_backdrop.risk_regime.lower()}, el sesgo defensivo vuelve a tener valor relativo."
                ),
            ),
            AnalysisPoint(
                "Tasas e inflacion",
                f"{macro_backdrop.inflation_regime} | pricing power",
                (
                    f"La compania sigue expuesta a costos de insumos y distribucion, pero {inflation_context}. "
                    "Su capacidad de pricing ayuda a absorber parte de la presion."
                ),
            ),
            AnalysisPoint(
                "Entorno sectorial",
                f"{sector_context} | {relative_label}",
                (
                    f"Frente a SPY, KO se mueve {relative_label} por {_format_percent(relative_spread)} en 3 meses. "
                    f"El driver sectorial sigue siendo {driver}."
                ),
            ),
        ]

    return _build_mock_economic_points(data.symbol)


def _growth_label(value: Optional[float]) -> str:
    """Convert a growth metric into a qualitative label."""

    if value is None:
        return "Sin dato estable"
    if value >= 0.18:
        return "Alto"
    if value >= 0.06:
        return "Moderado"
    if value >= 0:
        return "Leve"
    return "Debil"


def _margin_label(value: Optional[float]) -> str:
    """Convert a margin metric into a qualitative label."""

    if value is None:
        return "Sin dato estable"
    if value >= 0.25:
        return "Robustos"
    if value >= 0.12:
        return "Saludables"
    if value >= 0.05:
        return "Ajustados"
    return "Presionados"


def _balance_label(fundamentals: FundamentalSnapshot) -> str:
    """Describe the balance sheet using leverage and liquidity."""

    debt_to_equity = fundamentals.debt_to_equity
    total_cash = fundamentals.total_cash
    total_debt = fundamentals.total_debt

    if total_cash is not None and total_debt is not None and total_cash >= total_debt:
        return "Balance solido"
    if debt_to_equity is None:
        return "Balance sin lectura completa"
    if debt_to_equity <= 0.8:
        return "Balance solido"
    if debt_to_equity <= 1.6:
        return "Apalancamiento controlado"
    return "Balance apalancado"


def _quality_label(fundamentals: FundamentalSnapshot) -> str:
    """Build a basic financial quality signal."""

    score = 0

    if fundamentals.return_on_equity is not None:
        if fundamentals.return_on_equity >= 0.20:
            score += 2
        elif fundamentals.return_on_equity >= 0.10:
            score += 1

    if fundamentals.profit_margin is not None:
        if fundamentals.profit_margin >= 0.18:
            score += 2
        elif fundamentals.profit_margin >= 0.08:
            score += 1

    if fundamentals.debt_to_equity is not None:
        if fundamentals.debt_to_equity <= 0.8:
            score += 2
        elif fundamentals.debt_to_equity <= 1.6:
            score += 1

    if fundamentals.current_ratio is not None and fundamentals.current_ratio >= 1.0:
        score += 1

    if score >= 5:
        return "Calidad alta"
    if score >= 3:
        return "Calidad aceptable"
    return "Calidad irregular"


def _build_real_accounting_points(symbol: str, fundamentals: FundamentalSnapshot) -> List[AnalysisPoint]:
    """Build the accounting block using live or semireal fundamentals."""

    revenue_growth = fundamentals.revenue_growth
    earnings_growth = fundamentals.earnings_growth
    selected_margin = (
        fundamentals.profit_margin
        if fundamentals.profit_margin is not None
        else fundamentals.operating_margin
    )
    balance_view = _balance_label(fundamentals)
    quality_view = _quality_label(fundamentals)

    revenue_value = (
        f"{_growth_label(revenue_growth)} | {_format_percent(revenue_growth)}"
        if revenue_growth is not None
        else "Sin dato estable"
    )
    earnings_value = (
        f"{_growth_label(earnings_growth)} | {_format_percent(earnings_growth)}"
        if earnings_growth is not None
        else "Sin dato estable"
    )
    margin_value = (
        f"{_margin_label(selected_margin)} | {_format_percent(selected_margin)}"
        if selected_margin is not None
        else "Sin dato estable"
    )

    if fundamentals.total_cash is not None and fundamentals.total_debt is not None:
        debt_description = (
            f"Caja {_format_compact_number(fundamentals.total_cash)} frente a deuda "
            f"{_format_compact_number(fundamentals.total_debt)}."
        )
    elif fundamentals.current_ratio is not None:
        debt_description = f"Liquidez corriente de {_format_ratio(fundamentals.current_ratio)}."
    else:
        debt_description = "No hubo suficiente cobertura para leer caja, deuda o liquidez con estabilidad."

    if fundamentals.debt_to_equity is not None:
        debt_value = f"{balance_view} | D/E {_format_ratio(fundamentals.debt_to_equity)}"
    else:
        debt_value = balance_view

    quality_description_parts: List[str] = []

    if fundamentals.return_on_equity is not None:
        quality_description_parts.append(f"ROE {_format_percent(fundamentals.return_on_equity)}")
    if fundamentals.current_ratio is not None:
        quality_description_parts.append(f"liquidez {_format_ratio(fundamentals.current_ratio)}")
    if selected_margin is not None:
        quality_description_parts.append(f"margen {_format_percent(selected_margin)}")

    if quality_description_parts:
        quality_description = ", ".join(quality_description_parts) + "."
    else:
        quality_description = "La lectura de calidad usa un mix simple de rentabilidad, liquidez y apalancamiento."

    return [
        AnalysisPoint(
            "Crecimiento de ingresos",
            revenue_value,
            (
                f"{symbol} muestra un crecimiento {_growth_label(revenue_growth).lower()} de ingresos "
                f"cuando se observa la ultima referencia disponible."
                if revenue_growth is not None
                else "No se obtuvo una referencia consistente de crecimiento de ingresos, por eso se mantiene una lectura conservadora."
            ),
        ),
        AnalysisPoint(
            "Deuda y caja",
            debt_value,
            f"{debt_description} La lectura general del balance hoy es de {balance_view.lower()}.",
        ),
        AnalysisPoint(
            "Margenes",
            margin_value,
            (
                f"Los margenes lucen {_margin_label(selected_margin).lower()} y ayudan a sostener la resiliencia operativa."
                if selected_margin is not None
                else "No hubo suficiente consistencia para medir margenes con precision, por eso la lectura queda en modo prudente."
            ),
        ),
        AnalysisPoint(
            "Ganancias",
            earnings_value,
            (
                f"El crecimiento de ganancias se ubica en zona {_growth_label(earnings_growth).lower()} y sirve como referencia simple de traccion del negocio."
                if earnings_growth is not None
                else "No se obtuvo una tasa estable de crecimiento de ganancias, asi que se mantiene una lectura cualitativa."
            ),
        ),
        AnalysisPoint(
            "Calidad financiera",
            quality_view,
            f"Lectura sintetica construida con {quality_description} La calidad hoy se clasifica como {quality_view.lower()}.",
        ),
    ]


def _build_accounting_points(symbol: str, fundamentals: Optional[FundamentalSnapshot]) -> List[AnalysisPoint]:
    """Return accounting points using live fundamentals when available."""

    has_real_fields = False
    if fundamentals:
        has_real_fields = any(
            metric is not None
            for metric in (
                fundamentals.revenue_growth,
                fundamentals.earnings_growth,
                fundamentals.profit_margin,
                fundamentals.operating_margin,
                fundamentals.debt_to_equity,
                fundamentals.total_cash,
                fundamentals.total_debt,
                fundamentals.return_on_equity,
                fundamentals.current_ratio,
            )
        )

    if (
        fundamentals
        and has_real_fields
        and fundamentals.instrument_type not in ("ETF", "MUTUALFUND", "INDEX", "CRYPTO")
    ):
        return _build_real_accounting_points(symbol, fundamentals)

    if symbol in ("GLD", "TLT"):
        return [
            AnalysisPoint("Crecimiento de ingresos", "No aplica directo", "El ETF refleja comportamiento del subyacente y flujos, no estados contables corporativos."),
            AnalysisPoint("Deuda", "No aplica directo", "El foco esta en sensibilidad macro, duration o reservas de valor mas que en apalancamiento empresarial."),
            AnalysisPoint("Margenes", "No aplica directo", "La evaluacion se centra en tracking, liquidez y driver macro principal."),
            AnalysisPoint("Ganancias", "Driver macro", "La tesis depende de tasas, dolar o flujos defensivos antes que de EPS corporativo."),
            AnalysisPoint("Rentabilidad", "Relacion cobertura / volatilidad", "Se usa como pieza de cartera por proteccion y diversificacion, no por rentabilidad operativa."),
        ]

    if symbol in ("SPY", "QQQ"):
        return [
            AnalysisPoint("Crecimiento de ingresos", "Agregado saludable", "El ETF captura el crecimiento agregado del indice y reduce dispersion de nombres individuales."),
            AnalysisPoint("Deuda", "Diversificada", "El riesgo de balance se distribuye entre muchas companias y sectores."),
            AnalysisPoint("Margenes", "Soporte amplio", "Los margenes agregados dependen del mix sectorial y de la calidad de las mega caps."),
            AnalysisPoint("Ganancias", "EPS del indice", "La referencia real pasa por la revision de EPS agregado del benchmark."),
            AnalysisPoint("Rentabilidad", "Calidad promedio alta", "La canasta tiende a reflejar rentabilidad corporativa mas estable que una accion individual."),
        ]

    return [
        AnalysisPoint("Crecimiento de ingresos", "Consistente", "La compania se evalua por capacidad de sostener crecimiento sin deterioro del mix de negocio."),
        AnalysisPoint("Deuda", "Controlada", "El balance sigue siendo un filtro central para evitar crecimiento dependiente de apalancamiento agresivo."),
        AnalysisPoint("Margenes", "Resistentes", "El mercado premia negocios que sostienen margenes aun con presion competitiva o de costos."),
        AnalysisPoint("Ganancias", "Visibilidad aceptable", "La trayectoria de EPS importa tanto como la calidad del flujo de caja que la acompana."),
        AnalysisPoint("Rentabilidad", "Superior al promedio", "ROE o ROIC consistentes suelen explicar la persistencia del premio de valuacion."),
    ]


def _build_market_highlights(market_data: List[AssetMarketData]) -> List[MarketHighlight]:
    """Create the home-screen radar from real market metrics."""

    ranked = sorted(market_data, key=lambda item: item.return_1m, reverse=True)[:3]
    highlights: List[MarketHighlight] = []

    for item in ranked:
        tone = "positive" if item.return_1m >= 0 else "negative"
        if abs(item.return_1m) < 0.01:
            tone = "neutral"

        highlights.append(
            MarketHighlight(
                title=item.symbol,
                value=_format_percent(item.return_1m),
                change=f"Vol. {_format_percent(item.volatility)}",
                tone=tone,
            )
        )

    return highlights


def _build_opportunity_card(
    data: AssetMarketData,
    analysis: AnalysisResult,
    macro_backdrop: Optional[MacroBackdrop],
) -> OpportunityCard:
    """Convert real market data plus static narrative into a UI card."""

    presentation = ASSET_PRESENTATION[data.symbol]
    base_return = _derived_base_return(data)
    base_score = analysis.score or 0.0
    risk_label = analysis.risk_level or "Medio"
    risk_tone = _risk_tone(risk_label)
    risk_band = _risk_band(risk_label)
    detail_chart, expanded_chart_ranges = _build_chart_ranges(data)

    return OpportunityCard(
        slug=data.symbol.lower(),
        symbol=data.symbol,
        category=f"{data.symbol} · {presentation['category']}",
        opportunity_type=presentation["opportunity_type"],
        time_horizon=presentation["time_horizon"],
        name=presentation["name"],
        base_score=base_score,
        sector_tag=presentation["sector_tag"],
        asset_type_tag=presentation["asset_type_tag"],
        risk_band=risk_band,
        expected_return=_format_percent(base_return),
        risk_level=risk_label,
        downside_scenario=f"{_format_percent(data.drawdown)} drawdown 6m",
        model_confidence=_format_score(base_score),
        explanation=analysis.summary,
        detail_scenario=(
            f"Precio {_format_currency(data.current_price)} | MM20 {_format_currency(data.ma_short)} | "
            f"MM50 {_format_currency(data.ma_long)} | Volatilidad {_format_percent(data.volatility)} | "
            f"Drawdown observado {_format_percent(data.drawdown)}."
        ),
        accent_color=presentation["accent_color"],
        accent_glow=presentation["accent_glow"],
        sparkline_points=_build_sparkline([point.close for point in data.history[-10:]]),
        chart_delta=f"{_format_percent(data.return_1m)} en 1 mes",
        risk_tone=risk_tone,
        simulation=_build_simulation(base_return, data.drawdown, data.volatility),
        technical_chart=detail_chart,
        technical_chart_ranges=expanded_chart_ranges,
        default_chart_range="3m",
        technical_points=_build_technical_points(data),
        economic_points=_build_economic_points(data, macro_backdrop),
        accounting_points=_build_accounting_points(data.symbol, data.fundamentals),
        strategy_why=presentation["strategy_why"],
        strategy_bet=presentation["strategy_bet"],
        strategy_portfolio_fit=presentation["strategy_portfolio_fit"],
        why_in_feed=analysis.signals[:4],
    )


def build_demo_context(
    market_data_service: Optional[MarketDataService] = None,
    analysis_engine: Optional[FinancialAnalysisEngine] = None,
) -> Dict[str, Any]:
    """Return the market-backed content required by the fintech UI demo."""

    service = market_data_service or MarketDataService(symbols=list(DEFAULT_UNIVERSE))
    scorer = analysis_engine or FinancialAnalysisEngine()
    personalization_service = UserPersonalizationService()
    personalization_context = personalization_service.build_discovery_context("demo-user")
    market_data = service.get_universe_metrics()

    wallet = WalletDemo(
        total_balance="$ 152,480.20",
        monthly_change="+6.4% vs. mes anterior",
        metrics=[
            WalletMetric(label="Invertido", value="$ 98,400", tone="positive"),
            WalletMetric(label="Disponible", value="$ 41,930", tone="neutral"),
            WalletMetric(label="Rend. 30d", value="+4.8%", tone="positive"),
        ],
    )

    quick_actions = [
        QuickAction(key="transfer", label="Transferir", subtitle="Enviar en segundos"),
        QuickAction(key="funds", label="Agregar fondos", subtitle="Cargar balance"),
        QuickAction(key="pay", label="Pagar", subtitle="Servicios y comercios"),
        QuickAction(key="simulate", label="Simular", subtitle="Escenarios rapidos"),
    ]

    activity_items = [
        ActivityItem(
            kind="invest",
            title="Suscripcion cartera growth",
            subtitle="Hoy | 09:24",
            amount="-$ 12,500",
            tone="negative",
            status="Procesado",
        ),
        ActivityItem(
            kind="income",
            title="Transferencia recibida",
            subtitle="Hoy | 08:41",
            amount="+$ 20,000",
            tone="positive",
            status="Disponible",
        ),
        ActivityItem(
            kind="expense",
            title="Pago QR cafeteria",
            subtitle="Ayer | 18:10",
            amount="-$ 2,300",
            tone="negative",
            status="Completado",
        ),
        ActivityItem(
            kind="income",
            title="Cobro dividendos",
            subtitle="Ayer | 12:02",
            amount="+$ 1,280",
            tone="positive",
            status="Acreditado",
        ),
    ]

    activity_summary = [
        WalletMetric(label="Ingresos", value="+$ 21,280", tone="positive"),
        WalletMetric(label="Pagos", value="-$ 2,300", tone="negative"),
        WalletMetric(label="Invertido", value="-$ 12,500", tone="neutral"),
    ]

    scored_assets: List[Tuple[AssetMarketData, AnalysisResult]] = []
    for item in market_data:
        scored_assets.append((item, scorer.analyze_market_data(item)))

    scored_assets.sort(key=lambda item: item[1].score or 0.0, reverse=True)

    macro_backdrop = _build_macro_backdrop(market_data)
    opportunities = [
        _build_opportunity_card(item, analysis, macro_backdrop)
        for item, analysis in scored_assets
    ]
    market_highlights = _build_market_highlights(market_data)

    more_items = [
        MoreItem(title="Perfil y seguridad", description="Gestion de acceso, biometria y dispositivos."),
        MoreItem(title="Alertas inteligentes", description="Notificaciones de oportunidades, riesgo y movimientos."),
        MoreItem(title="Metas de ahorro", description="Objetivos, reglas automaticas y seguimiento mensual."),
        MoreItem(title="Centro de ayuda", description="Soporte, preguntas frecuentes y contacto."),
    ]

    return {
        "user_name": "Fausto",
        "wallet": wallet,
        "quick_actions": quick_actions,
        "activity_items": activity_items,
        "activity_summary": activity_summary,
        "market_highlights": market_highlights,
        "opportunities": opportunities,
        "more_items": more_items,
        "personalization_defaults": {
            "risk_tolerance": personalization_context["risk_tolerance"],
            "preferred_sectors": personalization_context["preferred_sectors"],
            "preferred_asset_type": personalization_context["preferred_asset_type"],
        },
        "personalization_options": personalization_context["preference_catalog"],
        "default_screen": "home",
    }
