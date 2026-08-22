# Prisma

Prototipo mobile-first de una billetera digital con foco en inversiones, creado con React y Vite.

## Desarrollo

```bash
npm install
npm run dev
```

La interfaz está optimizada para un viewport de 390 × 844 px y también se adapta a pantallas mayores.

## Qué incluye el prototipo

- Home original de la billetera y tablero de Inversiones.
- Saldos disponibles e invertidos en pesos y dólares.
- Múltiples carteras, composición y rendimiento por activo.
- Calendario financiero y Termómetro como herramientas independientes.
- Recorrido guiado con nueve preguntas esenciales, cuatro opcionales y preferencias de hasta tres sectores.
- Pregunta condicional para diferenciar el vector de una vivienda, un auto u otra compra importante.
- Evaluación adaptativa de conocimiento dentro de **Armarla con Prisma**: 3 minicasos de detección y entre 3 y 6 preguntas de profundización tomadas de un banco rotativo de 30 casos.
- Seis dimensiones observables de conocimiento: riesgo, diversificación, liquidez, inflación/moneda, instrumentos y costos. El resultado solo cambia el nivel de explicación; nunca el perfil de riesgo.
- Perfil separado en capacidad objetiva y tolerancia emocional, con límites de seguridad explicables.
- Mapa dinámico del inversor visible y corregible. Cada elemento del vector abre un árbol de evidencia y confianza para seguridad, conocimiento, objetivo, preferencias y decisiones observadas.
- Exploración en Flash cards o Lista. La ruta guiada vuelve a mostrar únicamente activos: las tarjetas educativas intercaladas quedaron fuera de la interfaz para una iteración futura.
- Las decisiones observadas se conservan en el mapa del inversor, pero no reordenan el mazo en esta versión de presentación ni alteran compatibilidad, límites o riesgo.
- Cola determinística de descubrimiento mediante `compatibility_v1.0`: filtros obligatorios, siete compatibilidades parciales, penalizaciones, función faltante y bono sectorial acotado.
- Estados persistentes y reversibles: Guardados, Descartados, Historial, cartera simulada y Deshacer.
- Ficha ampliada en acordeones con las quince capas definidas en el documento maestro.
- Logos reales guardados localmente para Apple, YPF, SPDR/State Street, Coca-Cola, Galicia y Pampa Energía. El proveedor de mercado mantiene prioridad; bonos, monedas y productos ficticios reciben un ícono neutral por tipo en lugar de siglas y colores inventados.
- Sección visible de noticias y eventos al final de **Inversiones** y dentro de **Ver más**. Cada elemento indica activos, carteras potencialmente afectadas, fuente, fecha, estado del hecho y dirección de impacto. Los ejemplos locales están rotulados como referencia y nunca se presentan como noticias en vivo.
- Capa **Avanzada** específica por instrumento: valuación, rentabilidad, crecimiento, balance, mercado, ETF, fondos, crédito, TIR, duration, convexidad, DV01, spreads y operación. Cada métrica tiene un control pequeño que despliega definición, fórmula, lectura y limitaciones; los valores faltantes dicen “No disponible”.
- Catálogo global preparado mediante un adaptador de backend para Finnhub. La búsqueda externa aparece solo en **Armarla por mi cuenta**; un activo sin metadatos de seguridad puede explorarse pero no entra automáticamente en la cartera guiada.
- Adaptador argentino separado y estado explícito para BYMA Market Data. No se declara conectado hasta configurar contrato, permisos, URL y clave.
- Construcción `portfolio_v1.0` por funciones, pesos por compatibilidad, límites por empresa y complemento, RiskPolicy, HHI, cobertura y escenarios de estrés educativos.
- Revisión del monto total y confirmación final separada de la cartera simulada.
- Simulación de retiros sin ejecución automática.
- Backend Python con reglas explicables para perfil, compatibilidad y asignación.
- Modo demo reiniciable con un caso documentado de 22 años, jubilación y USD 200 por mes. El borrado afecta solo perfil y decisiones de Prisma; no elimina las carteras de ejemplo de V6.

La alternativa **Armarla por mi cuenta** conserva el acceso directo a la lista de activos, sin preguntas ni feed guiado, y suma la búsqueda del catálogo externo cuando el proveedor está configurado.

## Backend Python

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
npm run api
```

La documentación interactiva queda disponible en `http://localhost:8000/docs`.
Usá `.env.example` como guía y exportá `FINNHUB_API_KEY` en la terminal del backend antes de ejecutar `npm run api`. La clave nunca se envía a Vite. Los activos argentinos requieren un contrato de Market Data de BYMA y las variables `BYMA_MARKET_DATA_URL` y `BYMA_API_KEY`.

```bash
export FINNHUB_API_KEY="tu_clave"
npm run api
```

Sin credenciales, Prisma conserva los 12 activos completos de V6, muestra ejemplos de noticias claramente rotulados y deja los ratios dependientes del proveedor como “No disponible”. No reemplaza faltantes con números inventados.

El alcance, los estados de conexión y el contrato de una noticia están documentados en [`docs/MARKET_DATA.md`](docs/MARKET_DATA.md). La procedencia de los SVG y los fallbacks está en [`docs/ASSET_LOGOS.md`](docs/ASSET_LOGOS.md).

Para probar las reglas sin iniciar el servidor:

```bash
python3 -m unittest backend.test_engine
python3 -m unittest backend.test_market
npm test
```

Con Vite abierto, los cambios guardados se reflejan automáticamente en la pestaña local del navegador.

## Recorrido sugerido para la presentación

1. Abrí **Invertir**.
2. Elegí **Iniciar demo** para saltar al caso precargado, o **Nueva cartera → Armarla con Prisma** para probar las preguntas adaptativas.
3. En **Tu punto de partida**, abrí las ramas del mapa y cambiá el nivel de explicación.
4. Entrá a la propuesta para recorrer el mazo de activos sin lecturas intercaladas.
5. Abrí **Ver más**, elegí **Avanzada** y expandí la explicación de un ratio. Las noticias relacionadas aparecen al final de la ficha, sin un botón separado.
6. Volvé a **Inversiones** y bajá hasta noticias para ver qué activos y carteras afecta cada tema.
7. Terminá en **Revisar cartera**, donde V6 conserva montos editables, porcentajes, total por moneda, concentración, advertencias y confirmación separada.
