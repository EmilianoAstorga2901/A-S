import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const reviewSource = readFileSync(new URL('./features/PortfolioReview.jsx', import.meta.url), 'utf8');
const exploreSource = readFileSync(new URL('./features/Explore.jsx', import.meta.url), 'utf8');
const assetDetailSource = readFileSync(new URL('./features/AssetDetail.jsx', import.meta.url), 'utf8');
const newsSource = readFileSync(new URL('./components/NewsFeed.jsx', import.meta.url), 'utf8');
const metricsSource = readFileSync(new URL('./components/AdvancedMetrics.jsx', import.meta.url), 'utf8');
const assetLogoSource = readFileSync(new URL('./components/AssetLogo.jsx', import.meta.url), 'utf8');
const viteSource = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');

test('todas las rutas visibles de V6 siguen conectadas', () => {
  const routes = [
    "screen === 'investments'",
    "screen === 'portfolio-choice'",
    "screen.startsWith('portfolio:')",
    "screen === 'thermometer'",
    "screen === 'calendar'",
    "screen === 'onboarding'",
    "screen === 'starting-point'",
    "screen === 'explore'",
    "screen === 'asset-list'",
    "screen.startsWith('market-asset:')",
    "screen.startsWith('asset:')",
    "screen === 'saved'",
    "screen === 'portfolio-review'",
    "screen === 'purchase-review'",
    "screen === 'portfolio-complete'",
    "screen === 'assistant'",
    "screen === 'sell'",
  ];
  routes.forEach((route) => assert.ok(appSource.includes(route), `Falta la ruta ${route}`));
});

test('la pantalla de Inversiones de V6 conserva carteras, rendimiento, herramientas y asistente', () => {
  ['Resumen de tu dinero', 'Mis carteras', 'Nueva cartera', 'Termómetro', 'Calendario', 'Rendimiento', 'Asistente operativo']
    .forEach((copy) => assert.ok(appSource.includes(copy), `Falta ${copy}`));
});

test('la ruta manual continúa entrando directamente a la lista sin cuestionario', () => {
  const manualButton = /Armarla por mi cuenta[\s\S]{0,280}Sin preguntas y sin flash cards/;
  assert.match(appSource, manualButton);
  assert.ok(appSource.includes("onClick={() => setScreen('asset-list')}"));
  assert.ok(appSource.includes("onClick={() => setScreen('onboarding')}"));
});

test('la revisión V6 conserva montos, porcentajes, concentración y confirmación separada', () => {
  ['Monto para empezar', 'Mayor posición', 'HHI emisor', 'Total ingresado', 'Revisar total y continuar', 'Confirmar compra']
    .forEach((copy) => assert.ok(reviewSource.includes(copy), `Falta ${copy}`));
});

test('Discover conserva la lista completa y el mazo visible contiene solo activos', () => {
  assert.ok(exploreSource.includes("mode === 'list'"));
  assert.ok(exploreSource.includes('<FlashAssetCard'));
  assert.ok(exploreSource.includes('<ClosureCard'));
  assert.ok(!exploreSource.includes('buildDiscoverSession'));
  assert.ok(!exploreSource.includes('<LearningCard'));
  assert.ok(exploreSource.includes('Catálogo de mercado conectado'));
});

test('noticias y ratios quedan visibles dentro de Inversiones y de la ficha', () => {
  assert.ok(appSource.includes('<NewsFeed'));
  assert.ok(assetDetailSource.includes('<NewsFeed'));
  assert.ok(assetDetailSource.includes('<AdvancedMetrics'));
  assert.ok(assetDetailSource.includes("section.id === 'advanced'"));
  assert.ok(assetDetailSource.includes('providerData={providerData} embedded'));
  assert.ok(!assetDetailSource.includes("explanationLevel === 'advanced' && <AdvancedMetrics"));
  assert.ok(newsSource.includes('Afecta tu cartera:'));
  assert.ok(newsSource.includes('news-story-media'));
  assert.ok(newsSource.includes('news-source-row'));
  assert.ok(metricsSource.includes('Ratios y cálculos'));
  assert.ok(metricsSource.includes('FICHA TÉCNICA'));
  assert.ok(metricsSource.includes('EXPLORADOR DE RATIOS'));
  assert.ok(metricsSource.includes('Buscar P/E, duration, volatilidad'));
  assert.ok(metricsSource.includes('CÁLCULO EDUCATIVO'));
});

test('Vite usa el plugin React y evita el blanco por JSX sin runtime', () => {
  assert.ok(viteSource.includes("from '@vitejs/plugin-react'"));
  assert.ok(viteSource.includes('plugins: [react()]'));
});

test('las identidades visuales no vuelven a siglas con colores inventados', () => {
  assert.ok(assetLogoSource.includes('logoCandidatesForAsset'));
  assert.ok(assetLogoSource.includes('FallbackIcon'));
  assert.ok(assetLogoSource.includes('data-logo-source={sourceKind}'));
  assert.ok(!assetLogoSource.includes('brandFallbacks'));
  assert.ok(!assetLogoSource.includes('<b aria-hidden="true">'));
  assert.ok(!appSource.includes('className="holding-symbol"'));
  assert.ok(!appSource.includes('className="asset-logo"'));
  assert.ok(!reviewSource.includes('className="asset-logo"'));
  ['apple', 'ypf', 'galicia', 'pampa-energia', 'state-street', 'coca-cola'].forEach((name) => {
    const svg = readFileSync(new URL(`../public/assets/logos/${name}.svg`, import.meta.url), 'utf8');
    assert.ok(svg.includes('<svg'), `Falta el SVG real de ${name}`);
  });
});
