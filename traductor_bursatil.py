import os
import time
import tkinter as tk
from tkinter import ttk, simpledialog, messagebox
from datetime import datetime, timedelta
from urllib.parse import urlencode
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import json

DEFAULT_SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "MELI"]
API_BASE = "https://finnhub.io/api/v1"
REQUEST_TIMEOUT_SECONDS = 12
REFRESH_COOLDOWN_SECONDS = 2.0
KEY_FILE = ".finnhub_api_key"
API_ENV_CANDIDATES = ("FINNHUB_API_KEY", "FINHUB_API_KEY")


class MarketApiError(Exception):
    pass


class FinnhubClient:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key.strip() if api_key else ""
        if not self.api_key:
            raise MarketApiError(
                "No se encontró API key. Usá FINNHUB_API_KEY (o FINHUB_API_KEY) o configurala con el botón API."
            )

    def _get_json(self, path: str, params: dict):
        params = {**params, "token": self.api_key}
        url = f"{API_BASE}{path}?{urlencode(params)}"
        request = Request(url, headers={"User-Agent": "FriendlyBrokerDemo/2.0"})

        try:
            with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                payload = response.read().decode("utf-8")
        except HTTPError as exc:
            raise MarketApiError(f"La API devolvió HTTP {exc.code}.") from exc
        except URLError as exc:
            raise MarketApiError("No se pudo conectar con la API de mercado.") from exc
        except Exception as exc:
            raise MarketApiError("Falló la conexión con el servicio de mercado.") from exc

        try:
            data = json.loads(payload)
        except json.JSONDecodeError as exc:
            raise MarketApiError("La API devolvió una respuesta inválida.") from exc

        if isinstance(data, dict) and data.get("error"):
            raise MarketApiError(str(data["error"]))

        return data

    def get_quote(self, symbol: str):
        return self._get_json("/quote", {"symbol": symbol})

    def get_profile(self, symbol: str):
        return self._get_json("/stock/profile2", {"symbol": symbol})

    def get_candles(self, symbol: str, days: int = 20):
        now = datetime.utcnow()
        start = now - timedelta(days=days + 5)
        return self._get_json(
            "/stock/candle",
            {
                "symbol": symbol,
                "resolution": "D",
                "from": int(start.timestamp()),
                "to": int(now.timestamp()),
            },
        )

    def get_company_news(self, symbol: str, days: int = 7):
        today = datetime.utcnow().date()
        since = today - timedelta(days=days)
        data = self._get_json(
            "/company-news",
            {
                "symbol": symbol,
                "from": since.isoformat(),
                "to": today.isoformat(),
            },
        )
        return data if isinstance(data, list) else []


class MarketTranslator:
    @staticmethod
    def safe_float(value, default=0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return float(default)

    @staticmethod
    def classify_risk(volatility_pct: float) -> str:
        if volatility_pct >= 4.5:
            return "Alta"
        if volatility_pct >= 2.0:
            return "Media"
        return "Baja"

    @staticmethod
    def classify_momentum(day_change_pct: float, week_change_pct: float) -> int:
        score = 50 + day_change_pct * 4 + week_change_pct * 1.8
        return max(5, min(95, round(score)))

    @staticmethod
    def volume_label(volume: float) -> str:
        if volume >= 60_000_000:
            return "Muy alto"
        if volume >= 15_000_000:
            return "Alto"
        if volume >= 3_000_000:
            return "Medio"
        return "Bajo"

    @staticmethod
    def build_recommendation(day_change_pct: float, week_change_pct: float, risk: str):
        if day_change_pct > 1.2 and week_change_pct > 2.0 and risk != "Alta":
            return "Comprar", "x1.35 Impulso"
        if day_change_pct < -1.5 and week_change_pct < -2.5:
            return "Mirar", "x1.28 Esperar"
        if risk == "Alta":
            return "Mirar", "x1.60 Volátil"
        return "Comprar", "x1.22 Confianza"

    @staticmethod
    def build_sell_label(day_change_pct: float, week_change_pct: float) -> str:
        if day_change_pct > 2.0 or week_change_pct > 5.0:
            return "x1.48 Tomar ganancia"
        if day_change_pct < -2.0:
            return "x1.32 Proteger"
        return "x1.18 Resguardo"

    @staticmethod
    def percent_text(value: float) -> str:
        sign = "+" if value >= 0 else ""
        return f"{sign}{value:.2f}%"

    @staticmethod
    def build_multiplier_rows(day_change_pct: float, week_change_pct: float, volatility_pct: float):
        rows = [
            ("Suba suave (>0.5%)", 1.12 + max(0, day_change_pct) * 0.01, "Si acompaña el día, suma una ganancia moderada."),
            ("Suba media (>1.0%)", 1.20 + max(0, day_change_pct) * 0.015, "Con impulso y volumen, el potencial mejora."),
            ("Suba fuerte (>1.5%)", 1.35 + max(0, week_change_pct) * 0.01, "Tendencia semanal positiva aumenta la expectativa."),
            ("Corrección (<-1.0%)", 1.18 + max(0, volatility_pct - 1.5) * 0.02, "Sirve para cubrirte si el precio se gira."),
        ]
        clean = []
        for name, mult, reason in rows:
            clean.append({"name": name, "multiplier": f"x{mult:.2f}", "reason": reason})
        return clean

    @staticmethod
    def transform(symbol: str, quote: dict, profile: dict, candles: dict, news: list):
        current = MarketTranslator.safe_float(quote.get("c"))
        previous_close = MarketTranslator.safe_float(quote.get("pc"), current)
        day_change_pct = ((current - previous_close) / previous_close) * 100.0 if previous_close else 0.0

        closes = candles.get("c") or []
        highs = candles.get("h") or []
        lows = candles.get("l") or []
        volumes = candles.get("v") or []

        week_change_pct = 0.0
        if len(closes) >= 6 and closes[-6] not in (0, None):
            week_change_pct = ((closes[-1] - closes[-6]) / closes[-6]) * 100.0

        avg_close = sum(closes[-10:]) / max(1, len(closes[-10:])) if closes else current
        high_recent = max(highs[-10:]) if highs else current
        low_recent = min(lows[-10:]) if lows else current
        avg_volume = sum(volumes[-10:]) / max(1, len(volumes[-10:])) if volumes else 0.0

        volatility_pct = ((high_recent - low_recent) / avg_close) * 100.0 if avg_close else 0.0

        risk = MarketTranslator.classify_risk(volatility_pct)
        momentum = MarketTranslator.classify_momentum(day_change_pct, week_change_pct)
        volume = MarketTranslator.volume_label(avg_volume)
        company_name = profile.get("name") or symbol
        recommendation, buy_label = MarketTranslator.build_recommendation(day_change_pct, week_change_pct, risk)
        sell_label = MarketTranslator.build_sell_label(day_change_pct, week_change_pct)

        headline = news[0].get("headline") if news else "Sin noticia reciente destacada."
        source = news[0].get("source") if news else "Mercado"

        return {
            "ticker": symbol,
            "company": company_name,
            "price": round(current, 2),
            "day_move": MarketTranslator.percent_text(day_change_pct),
            "week_move": MarketTranslator.percent_text(week_change_pct),
            "momentum": momentum,
            "risk": risk,
            "volume": volume,
            "buy_label": buy_label,
            "sell_label": sell_label,
            "ai_recommendation": recommendation,
            "headline": headline,
            "headline_source": source,
            "spark_prices": closes[-12:] if closes else [current],
            "multiplier_rows": MarketTranslator.build_multiplier_rows(day_change_pct, week_change_pct, volatility_pct),
        }


class FriendlyBrokerApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("Traductor bursátil estilo apuestas")
        self.root.geometry("470x940")
        self.root.configure(bg="#101828")

        self.client = None
        self.deck = []
        self.buy_picks = []
        self.sell_picks = []
        self.watch_picks = []
        self.last_refresh_ts = 0.0
        self.status_text = tk.StringVar(value="Cargando mercado...")

        self.style = ttk.Style()
        self.style.theme_use("clam")
        self.style.configure("TProgressbar", thickness=9, troughcolor="#232935", background="#f97316")

        self.build_ui()
        self.init_market_client()
        self.load_market_data(initial=True)

    def build_ui(self) -> None:
        self.main = tk.Frame(self.root, bg="#1d2230")
        self.main.pack(fill="both", expand=True, padx=8, pady=8)

        self.build_header()
        self.build_tabs()
        self.build_main_card()
        self.build_navbar()

    def build_header(self) -> None:
        header = tk.Frame(self.main, bg="#111827")
        header.pack(fill="x", pady=(0, 6))

        tk.Button(header, text="← Atrás", command=self.root.destroy, bg="#111827", fg="#f97316", relief="flat", font=("Arial", 12, "bold")).pack(side="left", padx=8, pady=8)
        info = tk.Frame(header, bg="#111827")
        info.pack(side="left", expand=True)
        tk.Label(info, text="Mercado en vivo", bg="#111827", fg="#f3f4f6", font=("Arial", 15, "bold")).pack()
        tk.Label(info, textvariable=self.status_text, bg="#111827", fg="#9ca3af", font=("Arial", 9), wraplength=290, justify="center").pack()
        tk.Button(header, text="API", command=self.configure_api_key, bg="#1f2937", fg="#ffffff", relief="flat", font=("Arial", 10, "bold"), padx=10).pack(side="right", padx=(0, 6))
        tk.Button(header, text="$ 4,88", command=self.load_market_data, bg="#f97316", fg="#ffffff", relief="flat", font=("Arial", 12, "bold"), padx=16).pack(side="right", padx=8)

    def build_tabs(self) -> None:
        tabs = tk.Frame(self.main, bg="#3b4252")
        tabs.pack(fill="x", pady=(0, 8))
        for i, t in enumerate(["General", "Partido", "Estadísticas"]):
            fg = "#ffffff" if i == 0 else "#d1d5db"
            underline = tk.Frame(tabs, bg="#f97316" if i == 0 else "#3b4252", height=3)
            box = tk.Frame(tabs, bg="#3b4252")
            box.pack(side="left", expand=True, fill="x")
            tk.Label(box, text=t, bg="#3b4252", fg=fg, font=("Arial", 13)).pack(pady=(10, 6))
            underline.pack(in_=box, fill="x", padx=22, pady=(0, 3))

    def build_main_card(self) -> None:
        self.card_area = tk.Frame(self.main, bg="#1d2230")
        self.card_area.pack(fill="both", expand=True)

    def build_navbar(self) -> None:
        nav = tk.Frame(self.main, bg="#151925")
        nav.pack(fill="x", pady=(8, 0))
        for i, item in enumerate(["Inicio", "En vivo", "Mis picks", "Mercados", "Perfil"]):
            fg = "#f97316" if i == 0 else "#9ca3af"
            tk.Label(nav, text=item, bg="#151925", fg=fg, font=("Arial", 10, "bold")).pack(side="left", expand=True, fill="x", pady=12)

    def init_market_client(self) -> None:
        api_key = self.resolve_api_key()
        try:
            self.client = FinnhubClient(api_key)
            self.status_text.set("API key configurada.")
        except MarketApiError as exc:
            self.client = None
            self.status_text.set(str(exc))

    def resolve_api_key(self) -> str:
        for env_name in API_ENV_CANDIDATES:
            env_key = os.getenv(env_name, "").strip()
            if env_key:
                return env_key
        try:
            with open(KEY_FILE, "r", encoding="utf-8") as handle:
                return handle.read().strip()
        except OSError:
            return ""

    def configure_api_key(self) -> None:
        current_key = self.resolve_api_key()
        new_key = simpledialog.askstring(
            "Configurar API key de Finnhub",
            "Pegá tu API key de Finnhub:\n(acepta FINNHUB_API_KEY o FINHUB_API_KEY; también se guarda en .finnhub_api_key)",
            initialvalue=current_key,
            parent=self.root,
        )
        if new_key is None:
            return

        cleaned = new_key.strip()
        if not cleaned:
            messagebox.showwarning("Clave vacía", "No se guardó ninguna API key.")
            return

        try:
            with open(KEY_FILE, "w", encoding="utf-8") as handle:
                handle.write(cleaned)
        except OSError as exc:
            messagebox.showerror("Error", f"No se pudo guardar la API key: {exc}")
            return

        self.init_market_client()
        self.load_market_data(initial=True)
        messagebox.showinfo("Listo", "FINNHUB_API_KEY configurada correctamente.")

    def clear_card_area(self) -> None:
        for widget in self.card_area.winfo_children():
            widget.destroy()

    def load_market_data(self, initial: bool = False) -> None:
        now = time.time()
        if not initial and now - self.last_refresh_ts < REFRESH_COOLDOWN_SECONDS:
            return
        self.last_refresh_ts = now

        if not self.client:
            self.render_empty_state("Falta API key", "Tocá el botón API y pegá tu key de Finnhub para mostrar acciones reales.")
            return

        transformed = []
        for symbol in DEFAULT_SYMBOLS:
            try:
                quote = self.client.get_quote(symbol)
                profile = self.client.get_profile(symbol)
                candles = self.client.get_candles(symbol)
                news = self.client.get_company_news(symbol)
                if not quote.get("c"):
                    raise MarketApiError("Sin cotización")
                transformed.append(MarketTranslator.transform(symbol, quote, profile, candles, news))
            except Exception:
                continue

        if not transformed:
            self.render_empty_state("Sin datos", "No se pudieron traer precios, revisá límites de API.")
            return

        self.deck = transformed
        self.status_text.set(f"Actualizado {datetime.now().strftime('%H:%M:%S')}")
        self.render_current_stock()

    def render_empty_state(self, title: str, subtitle: str) -> None:
        self.clear_card_area()
        box = tk.Frame(self.card_area, bg="#0f172a")
        box.pack(fill="both", expand=True)
        tk.Label(box, text=title, font=("Arial", 20, "bold"), bg="#0f172a", fg="#ffffff").pack(pady=(80, 10))
        tk.Label(box, text=subtitle, font=("Arial", 11), bg="#0f172a", fg="#9ca3af", wraplength=360).pack()

    def render_current_stock(self) -> None:
        self.clear_card_area()
        if not self.deck:
            self.render_empty_state("Sin más acciones", "Tocá actualizar para traer una nueva tanda.")
            return

        stock = self.deck[0]
        panel = tk.Frame(self.card_area, bg="#111827", highlightbackground="#374151", highlightthickness=1)
        panel.pack(fill="both", expand=True)

        hero = tk.Frame(panel, bg="#131a27")
        hero.pack(fill="x", padx=8, pady=8)
        tk.Label(hero, text=f"{stock['ticker']}  •  {stock['company']}", bg="#131a27", fg="#ffffff", font=("Arial", 18, "bold")).pack(anchor="w", padx=10, pady=(12, 2))
        tk.Label(hero, text=f"${stock['price']:.2f}   |   Día {stock['day_move']}   |   Semana {stock['week_move']}", bg="#131a27", fg="#cbd5e1", font=("Arial", 10)).pack(anchor="w", padx=10, pady=(0, 8))
        tk.Label(hero, text=f"Noticia: {stock['headline_source']} · {stock['headline']}", bg="#131a27", fg="#93c5fd", font=("Arial", 9), wraplength=430, justify="left").pack(anchor="w", padx=10, pady=(0, 12))

        section = tk.Frame(panel, bg="#0b1220")
        section.pack(fill="x", padx=8, pady=(0, 6))
        tk.Label(section, text="Ganador del movimiento (disfrazado en multiplicadores)", bg="#0b1220", fg="#f3f4f6", font=("Arial", 14, "bold")).pack(anchor="w", padx=10, pady=(10, 8))

        picks = tk.Frame(section, bg="#0b1220")
        picks.pack(fill="x", padx=10, pady=(0, 10))
        self.make_pick_button(picks, "COMPRAR", stock["buy_label"], "#064e3b", "#10b981", lambda: self.handle_decision("buy"))
        self.make_pick_button(picks, "MIRAR", "x1.10 Esperar", "#78350f", "#f59e0b", lambda: self.handle_decision("watch"))
        self.make_pick_button(picks, "VENDER", stock["sell_label"], "#881337", "#f43f5e", lambda: self.handle_decision("sell"))

        info = tk.Frame(panel, bg="#111827")
        info.pack(fill="both", expand=True, padx=8, pady=(0, 8))
        tk.Label(info, text="Información de la acción y por qué esos porcentajes", bg="#111827", fg="#ffffff", font=("Arial", 13, "bold")).pack(anchor="w", padx=6, pady=(6, 6))

        for row in stock["multiplier_rows"]:
            self.make_multiplier_row(info, row)

        explain = tk.Frame(info, bg="#1f2937")
        explain.pack(fill="x", padx=6, pady=(8, 4))
        tk.Label(explain, text=f"Impulso {stock['momentum']}%  ·  Riesgo {stock['risk']}  ·  Volumen {stock['volume']}", bg="#1f2937", fg="#f9fafb", font=("Arial", 10, "bold")).pack(anchor="w", padx=8, pady=(8, 2))
        tk.Label(explain, text=f"Recomendación rápida de la app: {stock['ai_recommendation']}. Se calcula con variación diaria/semanal, volatilidad y volumen.", bg="#1f2937", fg="#d1d5db", font=("Arial", 9), wraplength=430, justify="left").pack(anchor="w", padx=8, pady=(0, 8))

    def make_pick_button(self, parent: tk.Widget, title: str, mult: str, bg: str, fg: str, cmd) -> None:
        box = tk.Frame(parent, bg="#0b1220")
        box.pack(side="left", expand=True, fill="x", padx=4)
        tk.Button(box, text=f"{title}\n{mult}", command=cmd, bg=bg, fg="#ffffff", activebackground=fg, relief="flat", font=("Arial", 11, "bold"), pady=14).pack(fill="x")

    def make_multiplier_row(self, parent: tk.Widget, row: dict) -> None:
        line = tk.Frame(parent, bg="#1f2937")
        line.pack(fill="x", padx=6, pady=3)
        tk.Label(line, text=row["name"], bg="#1f2937", fg="#f3f4f6", font=("Arial", 11)).pack(side="left", padx=8, pady=8)
        tk.Label(line, text=row["multiplier"], bg="#111827", fg="#f97316", font=("Arial", 12, "bold"), padx=10, pady=4).pack(side="right", padx=8)
        tk.Label(line, text=row["reason"], bg="#1f2937", fg="#9ca3af", font=("Arial", 8), wraplength=250, justify="left").pack(side="right", padx=8)

    def handle_decision(self, action: str) -> None:
        if not self.deck:
            return
        stock = self.deck.pop(0)
        if action == "buy":
            self.buy_picks.insert(0, stock)
        elif action == "sell":
            self.sell_picks.insert(0, stock)
        else:
            self.watch_picks.insert(0, stock)
        self.render_current_stock()


if __name__ == "__main__":
    root = tk.Tk()
    app = FriendlyBrokerApp(root)
    root.mainloop()
