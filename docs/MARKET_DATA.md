# Contrato de datos de mercado y noticias

## Qué queda operativo en este corte

| Capa | Fuente | Estado sin credenciales | Estado con credenciales |
| --- | --- | --- | --- |
| Activos completos de la experiencia guiada | Datos de referencia de V6 | 12 fichas completas | Se actualizan logo y métricas disponibles, sin cambiar las reglas de seguridad |
| Búsqueda global manual | Finnhub | Inactiva y rotulada | Búsqueda por símbolo/nombre, ficha, cotización, perfil/logo, métricas y noticias |
| Mercado argentino amplio | BYMA Market Data | Pendiente | Requiere contrato, permisos y mapeo de los endpoints habilitados |
| Noticias del tablero | Referencias de diseño | Visibles y rotuladas como no actuales | Noticias de los símbolos seguidos, con fuente y fecha |

La experiencia guiada no incorpora un símbolo externo solamente porque tenga precio. Primero necesita tipo de instrumento, moneda económica, riesgo, liquidez, horizonte, emisor, sector, superposiciones y límites de concentración. La ruta manual permite explorarlo mientras esa cobertura no existe.

## Contrato de una noticia

Cada elemento separa:

- hecho y fuente original;
- fecha de publicación;
- activos relacionados;
- carteras expuestas;
- relevancia para la composición actual;
- impacto favorable, adverso, mixto o incierto;
- estado `referencia` o `fuente conectada`.

Una noticia conectada comienza con impacto **incierto**. Prisma no transforma automáticamente un titular en una orden ni inventa una dirección favorable o adversa.

## Seguridad técnica

- `FINNHUB_API_KEY` y cualquier credencial de BYMA existen solo en el backend.
- Vite recibe datos normalizados, nunca claves.
- Si una fuente no responde, la interfaz conserva V6 y muestra “No disponible”.
- Las empresas y marcas conocidas tienen un logo SVG real guardado localmente; el logo entregado por el proveedor conserva prioridad.
- Bonos soberanos, conversiones y productos ficticios usan un ícono neutral del tipo de instrumento. No se les inventa una marca ni un color corporativo.
- Los ratios incluyen definición, fórmula, lectura y limitaciones además del valor.

El inventario, la procedencia y el criterio de fallback de cada identidad visual están en [`ASSET_LOGOS.md`](ASSET_LOGOS.md).

## Fuentes oficiales consideradas

- [Finnhub API](https://finnhub.io/docs/api): símbolos, búsqueda, cotización, perfil/logo, métricas básicas y noticias corporativas según plan.
- [BYMA Market Data APIs](https://www.byma.com.ar/productos/productos-de-datos/market-data/apis): información de renta variable, renta fija, derivados y otros segmentos sujeta a contrato y permisos.
- [BYMA Productos de Datos](https://www.byma.com.ar/productos/productos-de-datos): condiciones de acceso, uso y distribución.

Antes de una demo con datos reales, configurar `.env`, iniciar el backend en `http://localhost:8000` y verificar `/market/status`. No presentar el bloque argentino como conectado hasta completar el contrato y validar los campos de cada instrumento.
