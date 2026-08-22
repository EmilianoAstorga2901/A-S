import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCompatibilityQueue, buildPortfolioProposal, scoreCompatibility } from './prismaEngine.js';

const asset = (id, symbol, sector) => ({ id, symbol, name: symbol, issuer: symbol, sector });
const universe = [
  asset('al30', 'AL30', 'Soberano argentino'),
  asset('ypfd', 'YPFD', 'Energía'),
  asset('aapl', 'AAPL', 'Tecnología'),
  asset('spy', 'SPY', 'Índice global'),
  asset('ymcxo', 'YMCXO', 'Energía · crédito corporativo'),
  asset('fund', 'FHD', 'Renta fija diversificada'),
  asset('mep', 'MEP', 'Moneda y liquidez'),
  asset('money', 'FCI-P', 'Moneda y liquidez'),
  asset('ggal', 'GGAL', 'Bancos y finanzas'),
  asset('pamp', 'PAMP', 'Energía'),
  asset('ko', 'KO', 'Consumo y alimentos'),
  asset('gd30', 'GD30', 'Soberano argentino'),
];

const profileResult = (overrides = {}) => ({
  profile: {
    profile: 'Moderado',
    sectors: ['Tecnología'],
    allocation: { liquidity: 15, stability: 35, growth: 40, satellite: 10 },
    ...overrides.profile,
  },
  answers: {
    goal: 'retirement',
    horizon: 'gt10',
    liquidity: 'none',
    emergencyFund: 'yes',
    contribution: { currency: 'USD', amount: 200, unsure: false },
    initialAmount: { currency: 'USD', amount: 200 },
    ...overrides.answers,
  },
});

test('un activo que supera el techo de riesgo nunca entra automáticamente', () => {
  const conservative = profileResult({ profile: { profile: 'Conservador', sectors: [], allocation: { liquidity: 30, stability: 50, growth: 20, satellite: 0 } } });
  const result = scoreCompatibility(universe[0], conservative);
  assert.equal(result.eligible, false);
  assert.equal(result.eligibleForPortfolio, false);
  assert.ok(result.gates.includes('G01'));
});

test('el bono sectorial modifica el orden pero no Cfinal ni elegibilidad', () => {
  const preferred = scoreCompatibility(universe[2], profileResult());
  const neutral = scoreCompatibility(universe[2], profileResult({ profile: { sectors: [] } }));
  assert.equal(preferred.finalScore, neutral.finalScore);
  assert.equal(preferred.eligible, neutral.eligible);
  assert.equal(preferred.orderScore, neutral.orderScore + 4);
});

test('la misma entrada produce exactamente la misma cola', () => {
  const first = buildCompatibilityQueue(universe, profileResult()).map(({ asset: item, compatibility }) => [item.id, compatibility.finalScore]);
  const second = buildCompatibilityQueue(universe, profileResult()).map(({ asset: item, compatibility }) => [item.id, compatibility.finalScore]);
  assert.deepEqual(first, second);
});

test('portfolio_v1.0 suma 100 y respeta el límite satélite moderado', () => {
  const proposal = buildPortfolioProposal(universe, profileResult(), {}, { goalCurrency: 'USD' });
  assert.equal(proposal.positions.reduce((sum, position) => sum + position.weight, 0), 100);
  assert.equal(proposal.unallocatedWeight, 0);
  assert.ok(proposal.positions.filter((position) => position.role === 'satellite').reduce((sum, position) => sum + position.weight, 0) <= 10);
  assert.ok(proposal.positions.every((position) => position.compatibility.eligibleForPortfolio));
});

test('una elección manual incompatible queda identificada y limitada', () => {
  const conservative = profileResult({ profile: { profile: 'Conservador', sectors: [], allocation: { liquidity: 30, stability: 50, growth: 20, satellite: 0 } } });
  const proposal = buildPortfolioProposal(universe, conservative, { al30: 'portfolio', money: 'portfolio', fund: 'portfolio', spy: 'portfolio' }, { selectedOnly: true, goalCurrency: 'USD' });
  assert.ok(proposal.manualExceptions.includes('al30'));
  assert.ok(proposal.positions.find((position) => position.assetId === 'al30').weight <= 5);
});
