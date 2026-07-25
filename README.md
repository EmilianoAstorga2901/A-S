# Prisma

MVP mobile-first de una experiencia B2B/B2B2C de inversión educativa para bancos, brokers y billeteras argentinas. La aplicación **no mueve dinero, no custodia fondos y no ejecuta operaciones reales**.

## Desarrollo

```bash
npm install
npm run dev
```

Pruebas y build:

```bash
npm test
npm run build
```

La interfaz está optimizada para un viewport de 390 × 844 px y se adapta a pantallas mayores.

## Datos de mercado

Prisma intenta consultar un backend configurable mediante `VITE_MARKET_DATA_URL`. El contrato esperado se encuentra encapsulado en `src/services/marketData/`. Copiá `.env.example` como `.env.local` solamente si disponés de un backend compatible.

- Si el proveedor responde, cada cotización indica si es en tiempo real o diferida, su fuente y actualización.
- Si falta configuración o la fuente falla, la aplicación cambia automáticamente al proveedor simulado y muestra el error de conexión sin presentarlo como dato real.
- El catálogo, las explicaciones y los eventos iniciales son datos manuales educativos; no constituyen una recomendación.
- Nunca coloques secretos en variables `VITE_*`: esas variables son visibles en el navegador. Las credenciales privadas deben vivir en un backend.

## Arquitectura de esta etapa

- `src/domain/assets`: catálogo y metadatos independientes de las cotizaciones.
- `src/domain/compatibility`: fórmula determinística, ponderaciones, motivos y penalizaciones.
- `src/domain/investorProfile`: normalización del perfil para compararlo con los activos.
- `src/domain/portfolio`: posiciones y análisis de cartera simulada.
- `src/services/marketData`: adaptadores real y simulado con fallback explícito.
- `src/services/persistence`: repositorios que aíslan `localStorage` para poder reemplazarlo por una API.
- `src/screens`: feed personalizado y navegación a la ficha educativa.

## Limitaciones actuales

Esta primera etapa no incluye órdenes reales, custodia, autenticación, sincronización entre dispositivos, calendario económico completo ni análisis estadístico de correlaciones. La posición incluida usa un monto simulado fijo y el proveedor real requiere un backend compatible. Los eventos y valores del proveedor de fallback son demostrativos y están identificados como simulados.
