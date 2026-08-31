import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateProfile } from './profile.js';
import {
  evaluateKnowledgeResponses,
  mergeKnowledgeIntoProfile,
  selectAdaptiveQuestions,
  selectGatewayQuestions,
} from './knowledgeEngine.js';
import { addBehaviorSignal, buildInvestorMap, goalVectorPresets } from './investorMap.js';
import { createDemoProfileResult } from './demoMode.js';
import { newsForAsset, normalizeLiveNews, referenceNews } from './data/newsData.js';
import { assetLogoIdentity, logoCandidatesForAsset } from './data/assetLogoRegistry.js';
import { assetMetricClass, buildMetricGroups } from './marketMetrics.js';

const answers = {
  experience: 'high',
  goal: 'retirement',
  horizon: 'gt10',
  liquidity: 'none',
  emergencyFund: 'yes',
  debts: 'none',
  income: 'stable_regular',
  reaction: 'hold',
  lossTolerance: 20,
  contribution: { currency: 'USD', amount: '200', unsure: false },
  products: [],
  sectors: ['Tecnología'],
};

const gatewayResponses = {
  'gate-risk-div-1': 'b',
  'gate-liquidity-instruments-1': 'a',
  'gate-inflation-costs-1': 'a',
};

test('las preguntas de detección rotan y no repiten inmediatamente', () => {
  const first = selectGatewayQuestions([]);
  const second = selectGatewayQuestions(first.map((question) => question.id));
  assert.equal(first.length, 3);
  assert.equal(second.length, 3);
  assert.ok(second.every((question) => !first.some((previous) => previous.id === question.id)));
});

test('la etapa adaptativa selecciona entre tres y seis preguntas', () => {
  const gateway = selectGatewayQuestions([]);
  const correct = selectAdaptiveQuestions(gatewayResponses, gateway, []);
  const uncertain = selectAdaptiveQuestions({
    'gate-risk-div-1': 'unknown',
    'gate-liquidity-instruments-1': 'unknown',
    'gate-inflation-costs-1': 'unknown',
  }, gateway, []);
  assert.ok(correct.length >= 3 && correct.length <= 6);
  assert.ok(uncertain.length >= correct.length && uncertain.length <= 6);
  assert.equal(new Set(uncertain.map((question) => question.id)).size, uncertain.length);
});

test('conocimiento cambia explicación pero nunca los cálculos de seguridad', () => {
  const base = calculateProfile(answers);
  const knowledge = evaluateKnowledgeResponses({
    ...gatewayResponses,
    'risk-2': 'a',
    'diversification-2': 'b',
    'liquidity-2': 'a',
    'inflation-fx-2': 'a',
    'instruments-2': 'a',
    'costs-2': 'a',
  });
  const merged = mergeKnowledgeIntoProfile(base, knowledge);
  assert.equal(merged.profile, base.profile);
  assert.equal(merged.capacity_score, base.capacity_score);
  assert.equal(merged.tolerance_score, base.tolerance_score);
  assert.deepEqual(merged.allocation, base.allocation);
  assert.equal(merged.explanation_level, knowledge.explanationLevel);
  assert.equal(knowledge.safetyImpact, 'none');
});

test('profile_v2 makes financial fragility binding and exposes uncertainty', () => {
  const lateDebt = calculateProfile({ ...answers, debts: 'late', reaction: 'buy_more', lossTolerance: 30 });
  assert.equal(lateDebt.profile, 'Conservador');
  assert.equal(lateDebt.rules_version, 'profile_v2.0');
  assert.equal(lateDebt.assessment_quality.requires_review, true);
  assert.ok(lateDebt.assessment_quality.confidence <= 90);
  const uncertainAnswers = { ...answers, debts: 'unsure', emergencyFund: 'unsure' };
  const uncertain = calculateProfile(uncertainAnswers);
  assert.ok(uncertain.assessment_quality.confidence < lateDebt.assessment_quality.confidence);
  const map = buildInvestorMap({ profile: uncertain, answers: uncertainAnswers, knowledge: evaluateKnowledgeResponses(gatewayResponses) });
  assert.equal(map.tree.safety.confidence, uncertain.assessment_quality.confidence);
});

test('el mapa registra decisiones sin modificar la rama vinculante', () => {
  const profile = calculateProfile(answers);
  const knowledge = evaluateKnowledgeResponses(gatewayResponses);
  const result = { profile, answers, knowledge, investorMap: buildInvestorMap({ profile, answers, knowledge, now: '2026-08-15T00:00:00.000Z' }) };
  const before = Object.fromEntries(Object.entries(result.investorMap.tree.safety.children).map(([key, item]) => [key, item.value]));
  const afterResult = addBehaviorSignal(result, 'discard', { assetId: 'aapl', sector: 'Tecnología' }, '2026-08-15T00:01:00.000Z');
  const after = Object.fromEntries(Object.entries(afterResult.investorMap.tree.safety.children).map(([key, item]) => [key, item.value]));
  assert.deepEqual(after, before);
  assert.equal(afterResult.investorMap.tree.behavior.raw.discard, 1);
  assert.equal(afterResult.investorMap.tree.behavior.safetyImpact, 'none');
});

test('existen vectores de objetivo diferenciados para jubilación, vivienda y auto', () => {
  assert.notDeepEqual(goalVectorPresets.retirement, goalVectorPresets.home);
  assert.notDeepEqual(goalVectorPresets.home, goalVectorPresets.car);
  assert.ok(goalVectorPresets.retirement.growthPriority > goalVectorPresets.car.growthPriority);
  const profile = calculateProfile({ ...answers, goal: 'purchase' });
  const knowledge = evaluateKnowledgeResponses(gatewayResponses);
  const homeMap = buildInvestorMap({ profile, answers: { ...answers, goal: 'purchase', purchaseType: 'home' }, knowledge, now: '2026-08-15T00:00:00.000Z' });
  const carMap = buildInvestorMap({ profile, answers: { ...answers, goal: 'purchase', purchaseType: 'car' }, knowledge, now: '2026-08-15T00:00:00.000Z' });
  assert.equal(homeMap.tree.goal.preset.label, 'Vivienda');
  assert.equal(carMap.tree.goal.preset.label, 'Auto');
  const homeProfile = calculateProfile({ ...answers, goal: 'purchase', purchaseType: 'home' });
  const carProfile = calculateProfile({ ...answers, goal: 'purchase', purchaseType: 'car' });
  assert.ok(carProfile.allocation.liquidity > homeProfile.allocation.liquidity);
  assert.equal(Object.values(homeProfile.allocation).reduce((sum, value) => sum + value, 0), 100);
  assert.equal(Object.values(carProfile.allocation).reduce((sum, value) => sum + value, 0), 100);
});

test('el catálogo avanzado cambia las herramientas según el tipo de activo', () => {
  const equity = { id: 'aapl', symbol: 'AAPL', type: 'CEDEAR de empresa estadounidense', dailyReturn: 1, monthlyReturn: 2, annualReturn: 3 };
  const etf = { id: 'spy', symbol: 'SPY', type: 'CEDEAR de ETF sobre el S&P 500' };
  const bond = { id: 'al30', symbol: 'AL30', type: 'Bono soberano en dólares' };
  const fund = { id: 'fund', symbol: 'FHD', type: 'Fondo común de inversión' };
  const liquidity = { id: 'mep', symbol: 'MEP', type: 'Conversión a dólar MEP', dailyReturn: -0.1, monthlyReturn: 2, annualReturn: 22.6 };
  assert.equal(assetMetricClass(equity), 'equity');
  assert.equal(assetMetricClass(etf), 'etf');
  assert.equal(assetMetricClass(bond), 'bond');
  assert.equal(assetMetricClass(fund), 'fund');
  assert.equal(assetMetricClass(liquidity), 'liquidity');
  const equityMetrics = buildMetricGroups(equity).flatMap((group) => group.metrics);
  assert.ok(equityMetrics.length >= 20);
  assert.ok(equityMetrics.some((metric) => metric.label === 'P/E'));
  assert.ok(equityMetrics.some((metric) => metric.label === 'Cobertura de intereses'));
  assert.ok(equityMetrics.every((metric) => metric.definition && metric.formula && metric.limits));
  assert.equal(equityMetrics.find((metric) => metric.label === 'P/E').displayValue, '29,4x');
  assert.equal(equityMetrics.find((metric) => metric.label === 'P/E').sourceLabel, 'Dato demostrativo V6');
  [equity, etf, bond, fund, liquidity].forEach((asset) => {
    const metrics = buildMetricGroups(asset).flatMap((group) => group.metrics);
    assert.ok(metrics.filter((metric) => metric.available).length >= 7, `${asset.symbol} quedó sin cobertura demostrativa`);
    assert.ok(metrics.every((metric) => metric.definition && metric.interpretation && metric.formula && metric.limits));
  });
  const livePe = buildMetricGroups(equity, { metrics: { peTTM: 31.2 }, sourceLabel: 'Proveedor de prueba', asOf: 'Hoy' })
    .flatMap((group) => group.metrics).find((metric) => metric.key === 'pe');
  assert.equal(livePe.displayValue, '31,2x');
  assert.equal(livePe.sourceKind, 'live');
});

test('las noticias declaran fuente, impacto y exposiciones afectadas', () => {
  assert.ok(referenceNews.length >= 4);
  referenceNews.forEach((item) => {
    assert.ok(item.source?.name);
    assert.ok(item.source?.url);
    assert.ok(item.imageUrl);
    assert.ok(item.imageAlt);
    assert.ok(['favorable', 'adverse', 'mixed', 'uncertain'].includes(item.impact));
    assert.ok(item.affectedAssetIds.length > 0);
    assert.equal(item.factStatus, 'No es una noticia en vivo');
  });
  assert.ok(newsForAsset('aapl').some((item) => item.affectedPortfolioIds.includes('future')));
  const live = normalizeLiveNews({ id: 1, symbol: 'AAPL', headline: 'Hecho', source: 'Fuente', publishedLabel: 'Hoy' }, { AAPL: 'aapl' });
  assert.equal(live.source.kind, 'live');
  assert.equal(live.impact, 'uncertain');
  assert.equal(live.imageUrl, '/news/market-context.svg');
  assert.deepEqual(live.affectedAssetIds, ['aapl']);
});

test('los activos de marca usan logos reales locales y el proveedor conserva prioridad', () => {
  const brandSymbols = ['AAPL', 'YPFD', 'YMCXO', 'SPY', 'KO', 'GGAL', 'PAMP'];
  brandSymbols.forEach((symbol) => {
    const identity = assetLogoIdentity({ symbol });
    assert.match(identity.localSrc, /^\/assets\/logos\/.+\.svg$/);
    assert.ok(identity.sourceName);
    assert.ok(identity.sourcePage);
  });
  assert.deepEqual(
    logoCandidatesForAsset({ symbol: 'AAPL', logoUrl: 'https://proveedor.example/apple.svg' }),
    ['https://proveedor.example/apple.svg', '/assets/logos/apple.svg'],
  );
  assert.equal(assetLogoIdentity({ symbol: 'AL30', type: 'Bono soberano' }).localSrc, null);
  assert.equal(assetLogoIdentity({ symbol: 'AL30', type: 'Bono soberano' }).fallbackKind, 'bond');
  assert.equal(assetLogoIdentity({ symbol: 'FHD', type: 'Fondo común de inversión' }).fallbackKind, 'fund');
  assert.equal(assetLogoIdentity({ symbol: 'MEP', type: 'Conversión a dólar MEP' }).fallbackKind, 'currency');
});

test('el caso demo es reproducible y está marcado como simulación', () => {
  const first = createDemoProfileResult('2026-08-15T12:00:00.000Z');
  const second = createDemoProfileResult('2026-08-15T12:00:00.000Z');
  assert.deepEqual(first, second);
  assert.equal(first.answers.contribution.amount, '200');
  assert.equal(first.answers.contribution.currency, 'USD');
  assert.equal(first.demo.active, true);
  assert.equal(first.investorMap.tree.knowledge.safetyImpact, 'none');
});
