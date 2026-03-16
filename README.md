# Investment Discovery Engine

Aplicacion fintech en Python orientada a descubrir oportunidades de inversion con una demo visual tipo billetera virtual.

## Estado actual

La etapa actual incluye:

- interfaz web en modo oscuro
- pantalla principal estilo wallet
- navegacion inferior entre vistas
- acceso directo al deck de "Explorar inversiones"
- deck mock tipo Tinder con una oportunidad principal por vez
- vista detalle enriquecida con simulacion y analisis mock
- market data real con `yfinance` para un universo inicial de activos cuando la dependencia y la red estan disponibles
- scoring tecnico simple para ordenar el deck y explicar cada oportunidad
- grafico tecnico SVG con velas, SMA 20, SMA 50 y volumen dentro del detalle
- vista tecnica expandida con selector simple de rango 1M / 3M / 6M
- capa inicial de fundamentales para enriquecer el analisis contable cuando hay datos disponibles
- capa economica semirreal basada en proxies de mercado para tasas, liderazgo growth/defensivo e inflacion
- personalizacion basica del deck por perfil de riesgo, sectores, tipo de activo y comportamiento de guardado/descartado
- fallback sintetico estable cuando no se puede consultar el proveedor

Todavia no incluye scoring financiero complejo, personalizacion avanzada ni logica real de broker.

## Estructura relevante

```text
investment-discovery-engine/
|-- README.md
|-- requirements.txt
|-- src/
|   `-- investment_discovery_engine/
|       |-- main.py
|       |-- api/
|       |-- analysis/
|       |-- market_data/
|       |-- opportunities/
|       |-- personalization/
|       |-- shared/
|       `-- ui/
|           |-- demo_content.py
|           |-- web.py
|           |-- static/
|           |   |-- css/styles.css
|           |   `-- js/app.js
|           `-- templates/index.html
`-- tests/
```

## Ejecutar localmente

Desde `/Users/faustosalazar/Desktop/investment-discovery-engine`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn investment_discovery_engine.main:app --app-dir src --reload
```

Luego abre:

```text
http://127.0.0.1:8000
```

## Demo UI

La demo abre en `Inicio` y permite navegar entre:

- Inicio
- Actividad
- QR
- Explorar inversiones
- Mas

La vista `Explorar inversiones` entra directo a un deck de una sola carta activa. Se puede:

- hacer swipe izquierda para descartar
- hacer swipe derecha para guardar
- usar botones `Descartar` y `Guardar` con el mismo efecto
- usar `Ver mas` para abrir el detalle enriquecido dentro de la misma app

En `Mas` ahora hay una capa inicial de personalizacion para:

- elegir perfil de riesgo bajo / medio / alto
- priorizar sectores preferidos
- definir un tipo de activo prioritario
- dejar que el feed aprenda de lo que se guarda o descarta

La personalizacion actua como una capa por encima del score tecnico existente y reordena solo las cartas pendientes del deck.

La pantalla detalle mantiene:

- resumen profesional de la oportunidad
- simulacion mock para 1000 USD
- analisis tecnico, economico y contable
- explicacion estrategica
- seccion "Por que aparecio esta carta"

## Datos reales vs. mock

La parte conectada a datos reales ahora usa `yfinance` para este universo inicial:

- SPY
- QQQ
- GLD
- TLT
- AAPL
- MSFT
- NVDA
- KO

Con datos reales se alimentan:

- precios historicos
- mini graficos del deck
- retorno 1 mes
- retorno 3 meses
- retorno 6 meses
- volatilidad anualizada simple
- drawdown simple
- media movil corta y media movil larga
- score tecnico basico por activo
- orden del deck segun score
- clasificacion de riesgo basada en volatilidad, drawdown y estabilidad reciente
- grafico tecnico del detalle construido con OHLC, SMA 20, SMA 50 y volumen
- vista expandida del grafico reutilizando el mismo renderer SVG con rangos 1M, 3M y 6M
- capa fundamental simple para ingresos, ganancias, margenes, deuda/caja y calidad financiera
- lectura economica apoyada en retornos reales o fallback de SPY, QQQ, GLD y TLT como proxies de apetito por riesgo, tasas largas e inflacion
- nombre del activo, retorno base derivado y clasificacion simple de riesgo
- parte del analisis tecnico, derivado de precio, momentum y medias moviles
- ranking personalizado del deck, construido sobre el score tecnico segun perfil, sectores, tipo de activo y comportamiento reciente
- una razon personalizada extra dentro de "Por que aparecio esta carta"

Por ahora siguen mock:

- explicacion estrategica
- simulacion detallada de broker
- personalizacion avanzada del usuario
- scoring avanzado
