import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { calculateProfile } from './profile.js';
import { clearPrismaStorage, createDemoProfileResult, initializeDemoStorage } from './demoMode.js';
import {
  INVESTOR_STATE_KIND,
  INVESTOR_STATE_SCHEMA_VERSION,
  createInitialInvestorState,
  isLegacyProfileResult,
  migrateLegacyProfileResult,
  normalizeInvestorState,
  projectInvestorStateToLegacy,
  validateInvestorStateVersion,
} from './investorState.js';
import {
  INVESTOR_STATE_STORAGE_KEY,
  LEGACY_PROFILE_STORAGE_KEY,
  loadInvestorState,
  removeStorageKeys,
  resetPrismaStateStorage,
  saveInvestorState,
  saveLegacyProfileResult,
  writeStorageJson,
  writeStorageText,
} from './investorStateRepository.js';

const NOW = '2026-08-23T12:00:00.000Z';
const LATER = '2026-08-23T13:00:00.000Z';
const cloneForTest = (value) => JSON.parse(JSON.stringify(value));
const ALL_LEGACY_DOMAINS = ['financialSituation', 'risk', 'objectives', 'knowledge', 'behavior', 'preferences', 'evidence'];

function installDomGlobals(values) {
  const previous = new Map(Object.keys(values).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.entries(values).forEach(([key, value]) => {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  });
  return () => previous.forEach((descriptor, key) => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  });
}

async function buildClientModule(entry, name) {
  const outputDirectory = await mkdtemp(resolve(`.tmp-prisma-${name}-`));
  const { build } = await import('vite');
  try {
    await build({
      configFile: false,
      root: resolve('.'),
      logLevel: 'silent',
      build: {
        outDir: outputDirectory,
        emptyOutDir: true,
        lib: { entry: resolve(entry), formats: ['es'], fileName: () => `${name}.js` },
        rollupOptions: { external: ['react', 'react/jsx-runtime', 'react-dom/client'] },
      },
    });
    const module = await import(`${pathToFileURL(resolve(outputDirectory, `${name}.js`)).href}?test=${Date.now()}`);
    return { module, cleanup: () => rm(outputDirectory, { recursive: true, force: true }) };
  } catch (error) {
    await rm(outputDirectory, { recursive: true, force: true });
    throw error;
  }
}

const answers = {
  experience: 'medium',
  goal: 'retirement',
  horizon: '5to10',
  liquidity: 'small',
  emergencyFund: 'yes',
  debts: 'controlled',
  income: 'stable_regular',
  reaction: 'hold',
  lossTolerance: 20,
  contribution: { amount: '100', currency: 'USD', unsure: false },
  initialAmount: { amount: '500', currency: 'USD', unsure: false },
  sectors: ['Tecnología'],
  products: ['funds'],
};

function legacyProfile(overrides = {}) {
  const nextAnswers = { ...answers, ...(overrides.answers || {}) };
  return {
    profile: calculateProfile(nextAnswers),
    answers: nextAnswers,
    knowledge: { version: 'knowledge_v1.0', overallScore: 58, confidence: 70, dimensions: {} },
    knowledgeResponses: { question: 'answer' },
    investorMap: {
      version: 'investor_map_v1.0',
      tree: { behavior: { raw: { save: 2, sectorSignals: { Tecnología: 2 }, events: [] } } },
    },
    marker: { preserve: true },
    ...overrides,
  };
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function throwingStorage({ initial = {}, getError = null, failSetAt = null, removeError = null, failRemoveAt = null } = {}) {
  const values = new Map(Object.entries(initial));
  let setCalls = 0;
  let removeCalls = 0;
  const getCalls = new Map();
  return {
    getItem(key) {
      getCalls.set(key, (getCalls.get(key) || 0) + 1);
      if (getError) throw getError;
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      setCalls += 1;
      const failingCalls = Array.isArray(failSetAt) ? failSetAt : [failSetAt];
      if (failingCalls.includes(setCalls)) throw new DOMException('Storage failed', 'QuotaExceededError');
      values.set(key, String(value));
    },
    removeItem(key) {
      removeCalls += 1;
      const failingCalls = Array.isArray(failRemoveAt) ? failRemoveAt : [failRemoveAt];
      if (removeError || failingCalls.includes(removeCalls)) throw removeError || new DOMException('Remove failed', 'SecurityError');
      values.delete(key);
    },
    snapshot: () => Object.fromEntries(values),
    setCalls: () => setCalls,
    removeCalls: () => removeCalls,
    getCalls: (key) => getCalls.get(key) || 0,
  };
}

function adversarialStorage(initial = {}, hooks = {}) {
  const values = new Map(Object.entries(initial));
  const calls = { get: 0, remove: 0, set: 0 };
  const keyCalls = { get: new Map(), remove: new Map(), set: new Map() };
  const invoke = (operation, key, value) => {
    calls[operation] += 1;
    const count = (keyCalls[operation].get(key) || 0) + 1;
    keyCalls[operation].set(key, count);
    return hooks[operation]?.({ key, value, count, total: calls[operation], values });
  };
  return {
    getItem(key) {
      invoke('get', key);
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (invoke('set', key, String(value)) === false) return;
      values.set(key, String(value));
    },
    removeItem(key) {
      if (invoke('remove', key) === false) return;
      values.delete(key);
    },
    snapshot: () => Object.fromEntries(values),
    calls: () => ({ ...calls }),
  };
}

test('crea un estado integral inicial válido y con versiones independientes', () => {
  const state = createInitialInvestorState({ id: 'local-1', now: NOW });
  assert.equal(state.kind, INVESTOR_STATE_KIND);
  assert.equal(state.schemaVersion, INVESTOR_STATE_SCHEMA_VERSION);
  assert.equal(state.id, 'local-1');
  assert.equal(state.revision, 0);
  assert.equal(state.risk.modelVersion, null);
  assert.equal(state.versions.openingBooks, null);
  assert.deepEqual(validateInvestorStateVersion(state), { valid: true, schemaVersion: 1 });
});

test('reconoce y migra un perfil anterior conservando el original completo', () => {
  const legacy = legacyProfile();
  assert.equal(isLegacyProfileResult(legacy), true);
  const state = migrateLegacyProfileResult(legacy, { id: 'local-1', now: NOW });
  assert.equal(state.compatibility.migratedFrom, 'profile_result_v1');
  assert.deepEqual(state.compatibility.legacyProfileResult, legacy);
  assert.equal(state.financialSituation.debtStatus, answers.debts);
  assert.equal(state.objectives[0].kind, answers.goal);
});

test('la migración conserva exactamente la clasificación del modelo de riesgo actual', () => {
  for (const variant of [
    { horizon: 'lt1', reaction: 'sell_all', lossTolerance: 5 },
    { horizon: '5to10', reaction: 'hold', lossTolerance: 20 },
    { horizon: 'gt10', liquidity: 'none', reaction: 'buy_more', lossTolerance: 30 },
  ]) {
    const legacy = legacyProfile({ answers: variant });
    const state = migrateLegacyProfileResult(legacy, { id: 'local-1', now: NOW });
    assert.equal(state.risk.label, legacy.profile.profile);
    assert.equal(projectInvestorStateToLegacy(state).profile.profile, legacy.profile.profile);
    assert.equal(state.risk.modelVersion, 'profile_v2.0');
  }
});

test('normaliza estados parciales con valores seguros', () => {
  const state = normalizeInvestorState({ kind: INVESTOR_STATE_KIND, schemaVersion: 1, id: 'partial' }, { now: NOW });
  assert.equal(state.id, 'partial');
  assert.equal(state.risk.label, null);
  assert.equal(state.knowledge.status, 'not_assessed');
  assert.deepEqual(state.openingAffinities.items, []);
  assert.deepEqual(state.educationProgress.books, []);
});

test('normalizar dos veces es idempotente', () => {
  const partial = { kind: INVESTOR_STATE_KIND, schemaVersion: 1, id: 'partial', preferences: { sectors: ['Energía'] } };
  const once = normalizeInvestorState(partial, { now: NOW });
  const twice = normalizeInvestorState(once, { now: LATER });
  assert.deepEqual(twice, once);
});

test('crear, normalizar, migrar y proyectar no mutan sus entradas', () => {
  const legacy = legacyProfile();
  const before = JSON.stringify(legacy);
  const state = migrateLegacyProfileResult(legacy, { id: 'local-1', now: NOW });
  normalizeInvestorState(state, { now: LATER });
  projectInvestorStateToLegacy(state);
  assert.equal(JSON.stringify(legacy), before);
});

test('proyecta una vista compatible con los consumidores anteriores', () => {
  const legacy = legacyProfile();
  const projected = projectInvestorStateToLegacy(migrateLegacyProfileResult(legacy, { id: 'local-1', now: NOW }));
  assert.equal(projected.profile.profile, legacy.profile.profile);
  assert.equal(projected.profile.rules_version, legacy.profile.rules_version);
  assert.equal(projected.answers.goal, legacy.answers.goal);
  assert.equal(projected.investorMap.version, legacy.investorMap.version);
  assert.deepEqual(projected.investorMap.tree.behavior.raw, legacy.investorMap.tree.behavior.raw);
  assert.deepEqual(projected.marker, legacy.marker);
});

test('la carga legacy migra sólo en memoria y la persistencia conserva ambas claves', () => {
  const legacy = legacyProfile();
  const serialized = JSON.stringify(legacy);
  const storage = memoryStorage({ [LEGACY_PROFILE_STORAGE_KEY]: serialized });
  const loaded = loadInvestorState(storage, { id: 'local-1', now: NOW });
  assert.equal(loaded.source, 'legacy');
  assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), null);
  const saved = saveLegacyProfileResult(storage, legacy, { id: 'local-1', now: NOW, cryptoObject: null, changedDomains: ALL_LEGACY_DOMAINS });
  assert.ok(storage.getItem(INVESTOR_STATE_STORAGE_KEY));
  assert.deepEqual(JSON.parse(storage.getItem(LEGACY_PROFILE_STORAGE_KEY)), projectInvestorStateToLegacy(saved.state));
  assert.equal(loadInvestorState(storage, { now: LATER }).legacyProfileResult.profile.profile, legacy.profile.profile);
});

test('una versión desconocida se maneja sin sobrescribirla y puede usar el fallback legacy', () => {
  const unknown = { kind: INVESTOR_STATE_KIND, schemaVersion: 99, data: 'future' };
  assert.equal(validateInvestorStateVersion(unknown).reason, 'unknown_schema_version');
  assert.equal(normalizeInvestorState(unknown), null);
  const legacy = legacyProfile();
  const storage = memoryStorage({
    [INVESTOR_STATE_STORAGE_KEY]: JSON.stringify(unknown),
    [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(legacy),
  });
  const loaded = loadInvestorState(storage, { id: 'local-1', now: NOW });
  assert.equal(loaded.source, 'legacy_fallback');
  assert.equal(loaded.legacyProfileResult.profile.profile, legacy.profile.profile);
  assert.deepEqual(JSON.parse(storage.getItem(INVESTOR_STATE_STORAGE_KEY)), unknown);
  const attemptedSave = saveLegacyProfileResult(storage, legacy, { now: LATER, cryptoObject: null, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(attemptedSave.saved, false);
  assert.equal(attemptedSave.error, 'unknown_schema_version');
  assert.deepEqual(JSON.parse(storage.getItem(INVESTOR_STATE_STORAGE_KEY)), unknown);
});

test('guardar conserva datos existentes e incrementa revisión sólo ante cambios reales', () => {
  const storage = memoryStorage();
  const legacy = legacyProfile();
  const first = saveLegacyProfileResult(storage, legacy, { id: 'local-1', now: NOW, cryptoObject: null, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(first.saved, true);
  assert.equal(first.state.revision, 1);

  const same = saveLegacyProfileResult(storage, legacy, { id: 'ignored', now: LATER, cryptoObject: null, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(same.saved, false);
  assert.equal(same.state.revision, 1);
  assert.equal(same.state.id, 'local-1');

  const changedLegacy = { ...legacy, marker: { preserve: true, changed: true } };
  const changed = saveLegacyProfileResult(storage, changedLegacy, { now: LATER, cryptoObject: null, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(changed.saved, true);
  assert.equal(changed.state.revision, 2);
  assert.deepEqual(changed.state.compatibility.legacyProfileResult.marker, changedLegacy.marker);
});

test('el montaje cliente real de App bajo React StrictMode realiza cero escrituras', async () => {
  const legacy = legacyProfile();
  const canonical = migrateLegacyProfileResult(legacy, { id: 'stable', now: NOW });
  canonical.revision = 7;
  canonical.createdAt = NOW;
  canonical.updatedAt = LATER;
  canonical.educationProgress.books = [{ id: 'book-1', progress: 40 }];
  canonical.openingAffinities.items = [{ id: 'opening-1', score: 80 }];
  canonical.knowledge.extraCanonical = 'keep';
  canonical.behavior.extraCanonical = 'keep';
  const storage = throwingStorage({ initial: {
    [INVESTOR_STATE_STORAGE_KEY]: JSON.stringify(canonical),
    [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(legacy),
  } });
  let removeCalls = 0;
  const originalRemove = storage.removeItem;
  storage.removeItem = (key) => { removeCalls += 1; return originalRemove(key); };
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
  const session = memoryStorage();
  const restoreGlobals = installDomGlobals({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    localStorage: storage,
    sessionStorage: session,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  let clientBuild;
  let root;
  let act;
  try {
    const React = await import('react');
    ({ act } = React);
    const { createRoot } = await import('react-dom/client');
    clientBuild = await buildClientModule('src/App.jsx', 'strict-app');
    const { default: App } = clientBuild.module;
    const canonicalBefore = storage.getItem(INVESTOR_STATE_STORAGE_KEY);
    const legacyBefore = storage.getItem(LEGACY_PROFILE_STORAGE_KEY);
    const readsBeforeMount = storage.getCalls(INVESTOR_STATE_STORAGE_KEY);
    root = createRoot(dom.window.document.getElementById('root'));
    await act(async () => { root.render(React.createElement(React.StrictMode, null, React.createElement(App))); });
    const readsDuringMount = storage.getCalls(INVESTOR_STATE_STORAGE_KEY) - readsBeforeMount;
    assert.equal(storage.setCalls(), 0);
    assert.equal(removeCalls, 0);
    assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), canonicalBefore);
    assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), legacyBefore);
    const after = JSON.parse(storage.getItem(INVESTOR_STATE_STORAGE_KEY));
    assert.equal(after.id, canonical.id);
    assert.equal(after.revision, canonical.revision);
    assert.equal(after.createdAt, canonical.createdAt);
    assert.equal(after.updatedAt, canonical.updatedAt);
    for (const key of ['knowledge', 'behavior', 'openingAffinities', 'educationProgress', 'compatibility']) assert.deepEqual(after[key], canonical[key]);
    assert.equal(readsDuringMount, 2, 'Strict Mode ejecutó dos inicializaciones controladas de la carga canónica');
    await act(async () => root.unmount());
    root = null;

    const corruptRaw = '{not-json';
    const corruptStorage = throwingStorage({ initial: {
      [INVESTOR_STATE_STORAGE_KEY]: corruptRaw,
      [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(legacy),
    } });
    let corruptRemoveCalls = 0;
    const corruptRemove = corruptStorage.removeItem;
    corruptStorage.removeItem = (key) => { corruptRemoveCalls += 1; return corruptRemove(key); };
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: corruptStorage });
    const secondContainer = dom.window.document.createElement('div');
    dom.window.document.body.append(secondContainer);
    root = createRoot(secondContainer);
    await act(async () => { root.render(React.createElement(React.StrictMode, null, React.createElement(App))); });
    assert.equal(corruptStorage.setCalls(), 0);
    assert.equal(corruptRemoveCalls, 0);
    assert.equal(corruptStorage.getItem(INVESTOR_STATE_STORAGE_KEY), corruptRaw);
  } finally {
    if (root) await act(async () => root.unmount());
    if (clientBuild) await clientBuild.cleanup();
    dom.window.close();
    restoreGlobals();
  }
});

test('el repositorio informa almacenamiento inaccesible sin propagar errores', () => {
  const securityError = new DOMException('Denied', 'SecurityError');
  const loaded = loadInvestorState(throwingStorage({ getError: securityError }), { now: NOW });
  assert.equal(loaded.status, 'storage_unavailable');
  assert.equal(loaded.ok, false);
  const saved = saveLegacyProfileResult(throwingStorage({ getError: securityError }), legacyProfile(), { now: NOW, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(saved.status, 'storage_unavailable');
  assert.equal(saved.ok, false);
});

test('el repositorio distingue fallos en la primera y segunda escritura y recupera cuando puede', () => {
  const legacy = legacyProfile();
  const originalLegacy = JSON.stringify({ ...legacy, marker: { original: true } });
  const firstFails = throwingStorage({ initial: { [LEGACY_PROFILE_STORAGE_KEY]: originalLegacy }, failSetAt: 1 });
  const first = saveLegacyProfileResult(firstFails, legacy, { id: 'stable', now: NOW, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(first.status, 'write_failed');
  assert.equal(firstFails.getItem(INVESTOR_STATE_STORAGE_KEY), null);
  assert.equal(firstFails.getItem(LEGACY_PROFILE_STORAGE_KEY), originalLegacy);

  const secondFails = throwingStorage({ initial: { [LEGACY_PROFILE_STORAGE_KEY]: originalLegacy }, failSetAt: 2 });
  const second = saveLegacyProfileResult(secondFails, legacy, { id: 'stable', now: NOW, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(second.status, 'partial_failure');
  assert.equal(secondFails.getItem(INVESTOR_STATE_STORAGE_KEY), null);
  assert.equal(secondFails.getItem(LEGACY_PROFILE_STORAGE_KEY), originalLegacy);
});

test('los fallos de removeItem se informan sin propagarse', () => {
  const error = new DOMException('Denied', 'SecurityError');
  const result = removeStorageKeys(throwingStorage({ removeError: error }), ['one', 'two']);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'partial_failure');
  assert.equal(result.errors.length, 2);
  assert.equal(result.errors[0].error.name, 'SecurityError');
});

test('un fallo de rollback se informa sin ocultar la escritura parcial', () => {
  const legacy = legacyProfile();
  const originalLegacy = JSON.stringify({ ...legacy, marker: { original: true } });
  const storage = throwingStorage({ initial: { [LEGACY_PROFILE_STORAGE_KEY]: originalLegacy }, failSetAt: [2, 3] });
  const result = saveLegacyProfileResult(storage, legacy, { id: 'stable', now: NOW, changedDomains: ['risk'] });
  assert.equal(result.ok, false);
  assert.equal(result.status, 'partial_failure');
  assert.equal(result.rolledBack, false);
  assert.equal(result.rollbackError.name, 'QuotaExceededError');
});

test('estados equivalentes con distinto orden de claves no cambian revisión ni fecha', () => {
  const storage = memoryStorage();
  const legacy = legacyProfile();
  const first = saveLegacyProfileResult(storage, legacy, { id: 'stable', now: NOW, changedDomains: ALL_LEGACY_DOMAINS });
  const reordered = {
    ...legacy,
    profile: {
      ...legacy.profile,
      allocation: {
        satellite: legacy.profile.allocation.satellite,
        growth: legacy.profile.allocation.growth,
        stability: legacy.profile.allocation.stability,
        liquidity: legacy.profile.allocation.liquidity,
      },
      assessment_quality: {
        basis: legacy.profile.assessment_quality.basis,
        requires_review: legacy.profile.assessment_quality.requires_review,
        contradiction_gap: legacy.profile.assessment_quality.contradiction_gap,
        confidence: legacy.profile.assessment_quality.confidence,
        coverage: legacy.profile.assessment_quality.coverage,
      },
    },
  };
  const second = saveLegacyProfileResult(storage, reordered, { now: LATER, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(second.saved, false);
  assert.equal(second.state.revision, first.state.revision);
  assert.equal(second.state.updatedAt, first.state.updatedAt);
});

test('el orden de arrays y una versión canónica real sí constituyen cambios', () => {
  const storage = memoryStorage();
  const firstState = createInitialInvestorState({ id: 'stable', now: NOW });
  firstState.objectives = [{ id: 'one' }, { id: 'two' }];
  const first = saveInvestorState(storage, firstState, { now: NOW });
  const reordered = { ...first.state, objectives: [{ id: 'two' }, { id: 'one' }] };
  const second = saveInvestorState(storage, reordered, { now: LATER });
  assert.equal(second.status, 'saved');
  assert.equal(second.state.revision, first.state.revision + 1);
  const versionChanged = { ...second.state, versions: { ...second.state.versions, knowledgeModel: 'knowledge_v9.0' } };
  const third = saveInvestorState(storage, versionChanged, { now: '2026-08-23T14:00:00.000Z' });
  assert.equal(third.status, 'saved');
  assert.equal(third.state.revision, second.state.revision + 1);
});

test('un identificador diferente produce identity_conflict sin escrituras ni metadatos nuevos', () => {
  const storage = throwingStorage();
  const first = saveInvestorState(storage, createInitialInvestorState({ id: 'stable', now: NOW }), { now: NOW });
  const conflicting = { ...first.state, id: 'other' };
  const result = saveInvestorState(storage, conflicting, { now: LATER });
  assert.equal(result.status, 'identity_conflict');
  assert.equal(result.ok, false);
  assert.equal(storage.setCalls(), 1);
  const persisted = JSON.parse(storage.getItem(INVESTOR_STATE_STORAGE_KEY));
  assert.equal(persisted.id, 'stable');
  assert.equal(persisted.revision, first.state.revision);
  assert.equal(persisted.updatedAt, first.state.updatedAt);

  const omitted = { ...first.state };
  delete omitted.id;
  assert.equal(saveInvestorState(storage, omitted, { now: LATER }).status, 'unchanged');
  assert.equal(saveInvestorState(storage, first.state, { now: LATER }).status, 'unchanged');
});

test('un estado canónico corrupto y su legacy permanecen intactos al cargar e intentar guardar', () => {
  const legacy = legacyProfile();
  const corrupt = '{not-json';
  const serializedLegacy = JSON.stringify(legacy);
  const storage = memoryStorage({
    [INVESTOR_STATE_STORAGE_KEY]: corrupt,
    [LEGACY_PROFILE_STORAGE_KEY]: serializedLegacy,
  });
  const loaded = loadInvestorState(storage, { now: NOW });
  assert.equal(loaded.status, 'corrupt');
  assert.equal(loaded.legacyProfileResult.profile.profile, legacy.profile.profile);
  const saved = saveLegacyProfileResult(storage, legacy, { now: LATER, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(saved.status, 'corrupt');
  assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), corrupt);
  assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), serializedLegacy);
});

test('normalizar preserva extensiones JSON seguras superiores y anidadas', () => {
  const input = {
    ...createInitialInvestorState({ id: 'extensions', now: NOW }),
    topExtension: { enabled: true },
    metadata: { provider: 'local', metadataExtension: 1 },
    knowledge: { status: 'assessed', knowledgeExtension: { level: 2 } },
    behavior: { behaviorExtension: ['a'] },
    openingAffinities: { affinityExtension: { source: 'test' } },
    educationProgress: { progressExtension: true },
  };
  const normalized = normalizeInvestorState(input, { now: LATER });
  assert.deepEqual(normalized.topExtension, input.topExtension);
  assert.deepEqual(normalized.metadata, input.metadata);
  assert.deepEqual(normalized.knowledge.knowledgeExtension, input.knowledge.knowledgeExtension);
  assert.deepEqual(normalized.behavior.behaviorExtension, input.behavior.behaviorExtension);
  assert.deepEqual(normalized.openingAffinities.affinityExtension, input.openingAffinities.affinityExtension);
  assert.equal(normalized.educationProgress.progressExtension, true);
  assert.deepEqual(normalizeInvestorState(normalized, { now: LATER }), normalized);
});

test('extensiones JSON primitivas sobreviven y valores inseguros se descartan sin contaminar prototipos', () => {
  const cyclic = { label: 'cycle' };
  cyclic.self = cyclic;
  const input = createInitialInvestorState({ id: 'safe', now: NOW });
  input.metadata = JSON.parse('{"nullValue":null,"booleanValue":true,"stringValue":"ok","numberValue":3,"__proto__":{"polluted":true},"constructor":{"polluted":true},"prototype":{"polluted":true}}');
  input.extensions = { undefinedValue: undefined, nan: NaN, infinity: Infinity, fn: () => true, symbol: Symbol('x'), cyclic, big: 1n };
  const normalized = normalizeInvestorState(deepFreeze(input), { now: NOW });
  assert.equal(normalized.metadata.nullValue, null);
  assert.equal(normalized.metadata.booleanValue, true);
  assert.equal(normalized.metadata.stringValue, 'ok');
  assert.equal(normalized.metadata.numberValue, 3);
  assert.equal(Object.hasOwn(normalized.metadata, '__proto__'), false);
  assert.equal(Object.hasOwn(normalized.metadata, 'constructor'), false);
  assert.equal(Object.hasOwn(normalized.metadata, 'prototype'), false);
  assert.equal({}.polluted, undefined);
  assert.deepEqual(normalized.extensions, {});
});

test('la proyección legacy refleja los valores canónicos actuales y conserva datos sólo legacy', () => {
  const legacy = legacyProfile();
  const state = migrateLegacyProfileResult(legacy, { id: 'stable', now: NOW });
  state.risk = { ...state.risk, label: 'Conservador', modelVersion: 'profile_v2.0' };
  state.knowledge = { ...state.knowledge, overallScore: 99, confidence: 88, dimensions: { risk: { score: 99 } } };
  state.behavior = { ...state.behavior, events: [{ type: 'save', at: LATER }], signals: { sectorSignals: { Energía: 3 } }, evidence: { save: 3 } };
  const projected = projectInvestorStateToLegacy(state);
  assert.equal(projected.profile.profile, 'Conservador');
  assert.equal(projected.knowledge.overallScore, 99);
  assert.equal(projected.knowledge.confidence, 88);
  assert.deepEqual(projected.investorMap.tree.behavior.raw.events, state.behavior.events);
  assert.deepEqual(projected.investorMap.tree.behavior.raw.sectorSignals, { Energía: 3 });
  assert.deepEqual(projected.marker, legacy.marker);

  const minimal = projectInvestorStateToLegacy(createInitialInvestorState({ id: 'empty', now: NOW }));
  assert.ok(minimal.profile && minimal.answers && minimal.knowledge && minimal.investorMap);
  assert.ok(minimal.investorMap.vectorSummary);
  assert.ok(Array.isArray(minimal.investorMap.vector));
  assert.ok(minimal.investorMap.tree);
  assert.ok(Array.isArray(minimal.investorMap.guardrails));
});

test('knowledge.responses canónico domina cuando fue evaluado y legacy sólo es fallback no evaluado', () => {
  const legacy = legacyProfile();
  const state = migrateLegacyProfileResult(legacy, { id: 'stable', now: NOW });
  state.knowledge = { ...state.knowledge, status: 'assessed', responses: { recent: 'yes' } };
  assert.deepEqual(projectInvestorStateToLegacy(state).knowledgeResponses, { recent: 'yes' });
  state.knowledge = { ...state.knowledge, responses: {} };
  assert.deepEqual(projectInvestorStateToLegacy(state).knowledgeResponses, {});
  state.knowledge = { ...state.knowledge, status: 'not_assessed', responses: {} };
  assert.deepEqual(projectInvestorStateToLegacy(state).knowledgeResponses, legacy.knowledgeResponses);
});

test('InvestorMapPanel real renderiza la proyección mínima sin snapshot', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
  const restoreGlobals = installDomGlobals({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true });
  let clientBuild;
  let root;
  let act;
  try {
    const React = await import('react');
    ({ act } = React);
    const { createRoot } = await import('react-dom/client');
    clientBuild = await buildClientModule('src/App.jsx', 'panel-app');
    const { InvestorMapPanel } = clientBuild.module;
    const result = projectInvestorStateToLegacy(createInitialInvestorState({ id: 'empty', now: NOW }));
    root = createRoot(dom.window.document.getElementById('root'));
    await act(async () => {
      root.render(React.createElement(InvestorMapPanel, { result, onEdit() {}, onReset() {}, onExplanationChange() {} }));
    });
    assert.ok(dom.window.document.querySelector('.investor-map-panel'));
  } finally {
    if (root) await act(async () => root.unmount());
    if (clientBuild) await clientBuild.cleanup();
    dom.window.close();
    restoreGlobals();
  }
});

test('la proyección queda profundamente aislada del estado y snapshot', () => {
  const state = migrateLegacyProfileResult(legacyProfile(), { id: 'stable', now: NOW });
  const before = JSON.stringify(state);
  const projected = projectInvestorStateToLegacy(state);
  projected.profile.allocation.liquidity = 999;
  projected.answers.sectors.push('Mutado');
  projected.knowledge.dimensions.changed = true;
  projected.investorMap.tree.behavior.raw.events.push({ type: 'mutated' });
  assert.equal(JSON.stringify(state), before);
});

test('un cambio legacy explícito se aplica sin vaciar secciones canónicas desconocidas por la vista anterior', () => {
  const legacy = legacyProfile();
  const canonical = migrateLegacyProfileResult(legacy, { id: 'stable', now: NOW });
  canonical.revision = 4;
  canonical.openingAffinities.items = [{ id: 'opening-1', score: 75 }];
  canonical.educationProgress.books = [{ id: 'book-1', completed: false }];
  canonical.knowledge.canonicalExtension = { keep: true };
  canonical.behavior.canonicalExtension = { keep: true };
  const storage = memoryStorage({
    [INVESTOR_STATE_STORAGE_KEY]: JSON.stringify(canonical),
    [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(legacy),
  });
  const changedLegacy = { ...legacy, marker: { explicitChange: true } };
  const saved = saveLegacyProfileResult(storage, changedLegacy, { now: LATER, changedDomains: ALL_LEGACY_DOMAINS });
  assert.equal(saved.status, 'saved');
  assert.equal(saved.state.revision, 5);
  assert.deepEqual(saved.state.openingAffinities.items, canonical.openingAffinities.items);
  assert.deepEqual(saved.state.educationProgress.books, canonical.educationProgress.books);
  assert.deepEqual(saved.state.knowledge.canonicalExtension, canonical.knowledge.canonicalExtension);
  assert.deepEqual(saved.state.behavior.canonicalExtension, canonical.behavior.canonicalExtension);
});

test('los dominios legacy declarados impiden que comportamiento o preferencias reviertan otras ramas', () => {
  const legacy = legacyProfile();
  const canonical = migrateLegacyProfileResult(legacy, { id: 'stable', now: NOW });
  canonical.risk = { ...canonical.risk, label: 'Conservador' };
  canonical.knowledge = { ...canonical.knowledge, overallScore: 99 };
  canonical.objectives = [{ id: 'canonical-goal', kind: 'growth' }];
  canonical.preferences = { ...canonical.preferences, sectors: ['Salud'], explanationLevelOverride: 'simple' };
  canonical.openingAffinities.items = [{ id: 'opening' }];
  canonical.educationProgress.books = [{ id: 'book' }];
  canonical.metadata = { canonical: true };
  const storage = memoryStorage({
    [INVESTOR_STATE_STORAGE_KEY]: JSON.stringify(canonical),
    [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(legacy),
  });
  const behaviorLegacy = cloneForTest(legacy);
  behaviorLegacy.investorMap.tree.behavior.raw.save = 9;
  const behavior = saveLegacyProfileResult(storage, behaviorLegacy, { now: LATER, changedDomains: ['behavior'] });
  assert.equal(behavior.state.behavior.evidence.save, 9);
  for (const key of ['risk', 'knowledge', 'objectives', 'preferences', 'openingAffinities', 'educationProgress', 'metadata']) {
    assert.deepEqual(behavior.state[key], canonical[key]);
  }

  const preferenceLegacy = projectInvestorStateToLegacy(behavior.state);
  preferenceLegacy.profile.explanation_level = 'advanced';
  const preference = saveLegacyProfileResult(storage, preferenceLegacy, { now: '2026-08-23T14:00:00.000Z', changedDomains: ['preferences'] });
  assert.equal(preference.state.preferences.explanationLevelOverride, 'advanced');
  for (const key of ['risk', 'knowledge', 'objectives', 'behavior', 'openingAffinities', 'educationProgress', 'metadata']) {
    assert.deepEqual(preference.state[key], behavior.state[key]);
  }
});

test('Onboarding aplica sólo sus dominios y conserva metadata, afinidades y progreso', () => {
  const legacy = legacyProfile();
  const canonical = migrateLegacyProfileResult(legacy, { id: 'stable', now: NOW });
  canonical.metadata = { keep: true };
  canonical.openingAffinities.items = [{ id: 'opening' }];
  canonical.educationProgress.books = [{ id: 'book' }];
  const storage = memoryStorage({ [INVESTOR_STATE_STORAGE_KEY]: JSON.stringify(canonical), [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(legacy) });
  const next = legacyProfile({ answers: { horizon: 'gt10' } });
  const saved = saveLegacyProfileResult(storage, next, {
    now: LATER,
    changedDomains: ['financialSituation', 'risk', 'objectives', 'knowledge', 'preferences', 'evidence'],
  });
  assert.deepEqual(saved.state.metadata, canonical.metadata);
  assert.deepEqual(saved.state.openingAffinities, canonical.openingAffinities);
  assert.deepEqual(saved.state.educationProgress, canonical.educationProgress);
  assert.deepEqual(saved.state.behavior, canonical.behavior);
});

test('escritores auxiliares rechazan claves protegidas y permiten claves auxiliares', () => {
  const original = '{corrupt';
  const storage = memoryStorage({ [INVESTOR_STATE_STORAGE_KEY]: original, [LEGACY_PROFILE_STORAGE_KEY]: 'legacy-original' });
  assert.equal(writeStorageText(storage, INVESTOR_STATE_STORAGE_KEY, '{}').status, 'protected_key');
  assert.equal(writeStorageJson(storage, LEGACY_PROFILE_STORAGE_KEY, {}).status, 'protected_key');
  assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), original);
  assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), 'legacy-original');
  assert.equal(writeStorageText(storage, 'prisma-demo-mode', 'true').status, 'written');
  assert.equal(storage.getItem('prisma-demo-mode'), 'true');
});

test('las actualizaciones legacy exigen dominios explícitos y cerrados', () => {
  const storage = memoryStorage();
  assert.equal(saveLegacyProfileResult(storage, legacyProfile(), { now: NOW }).status, 'invalid_domains');
  assert.equal(saveLegacyProfileResult(storage, legacyProfile(), { now: NOW, changedDomains: ['unknown'] }).status, 'invalid_domains');
  assert.deepEqual(storage.snapshot(), {});
});

test('las claves de estado sólo pueden eliminarse mediante el reset explícito', () => {
  const storage = memoryStorage({ [INVESTOR_STATE_STORAGE_KEY]: '{}', [LEGACY_PROFILE_STORAGE_KEY]: '{}' });
  const generic = removeStorageKeys(storage, [INVESTOR_STATE_STORAGE_KEY, LEGACY_PROFILE_STORAGE_KEY]);
  assert.equal(generic.ok, false);
  assert.ok(storage.getItem(INVESTOR_STATE_STORAGE_KEY));
  const explicit = clearPrismaStorage(storage, memoryStorage());
  assert.equal(explicit.ok, true);
  assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), null);
  assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), null);
});

test('el modo demo aborta antes de persistir si no puede limpiar el canónico', () => {
  const storage = throwingStorage({ initial: { [INVESTOR_STATE_STORAGE_KEY]: '{}' }, removeError: new Error('blocked') });
  const result = initializeDemoStorage(createDemoProfileResult(NOW), storage, memoryStorage());
  assert.equal(result.status, 'reset_failed');
  assert.equal(result.ok, false);
  assert.equal(result.persistence, null);
  assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), '{}');
});

test('Onboarding no escribe historial ni completa persistencia si falla el estado', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  let activeStorage = memoryStorage();
  const storageProxy = {
    getItem: (key) => activeStorage.getItem(key),
    setItem: (key, value) => activeStorage.setItem(key, value),
    removeItem: (key) => activeStorage.removeItem(key),
  };
  const restoreGlobals = installDomGlobals({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, localStorage: storageProxy, IS_REACT_ACT_ENVIRONMENT: true });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline test'); };
  let clientBuild;
  let root;
  let act;
  try {
    const React = await import('react');
    ({ act } = React);
    const { createRoot } = await import('react-dom/client');
    clientBuild = await buildClientModule('src/features/Onboarding.jsx', 'onboarding-real');
    const { Onboarding } = clientBuild.module;
    const run = async (storage) => {
      activeStorage = storage;
      const container = dom.window.document.createElement('div');
      dom.window.document.body.append(container);
      let completions = 0;
      root = createRoot(container);
      await act(async () => root.render(React.createElement(Onboarding, {
        BackHeader: () => null,
        onCancel() {},
        initialResult: legacyProfile(),
        onComplete() { completions += 1; },
      })));
      for (let step = 0; step < 40 && completions === 0; step += 1) {
        const knowledgeQuestion = container.querySelector('.knowledge-question');
        if (knowledgeQuestion && !knowledgeQuestion.querySelector('.answer-list button.selected')) {
          await act(async () => knowledgeQuestion.querySelector('.answer-list button:not(:disabled)').click());
        }
        const nextButton = container.querySelector('.onboarding-action button');
        if (!nextButton || nextButton.disabled) break;
        await act(async () => { nextButton.click(); await Promise.resolve(); });
        if (storage.setCalls?.() > 0 && completions === 0) break;
      }
      await act(async () => { await new Promise((resolvePromise) => setTimeout(resolvePromise, 0)); });
      const result = { completions, history: storage.getItem('prisma-knowledge-history'), setCalls: storage.setCalls?.() };
      await act(async () => root.unmount());
      root = null;
      return result;
    };

    const failed = await run(throwingStorage({ failSetAt: 1 }));
    assert.equal(failed.completions, 0, `setCalls=${failed.setCalls}`);
    assert.equal(failed.history, null);
    const successful = await run(memoryStorage());
    assert.equal(successful.completions, 1);
    assert.ok(successful.history);
  } finally {
    if (root) await act(async () => root.unmount());
    if (clientBuild) await clientBuild.cleanup();
    if (previousFetch === undefined) delete globalThis.fetch; else globalThis.fetch = previousFetch;
    dom.window.close();
    restoreGlobals();
  }
});

test('reset elimina legacy primero, conserva canónico ante el primer fallo y restaura legacy ante el segundo', () => {
  const legacyRaw = JSON.stringify(legacyProfile());
  const canonicalRaw = JSON.stringify(migrateLegacyProfileResult(legacyProfile(), { id: 'stable', now: NOW }));

  const legacyFails = throwingStorage({
    initial: { [INVESTOR_STATE_STORAGE_KEY]: canonicalRaw, [LEGACY_PROFILE_STORAGE_KEY]: legacyRaw },
    failRemoveAt: 1,
  });
  const first = clearPrismaStorage(legacyFails, memoryStorage());
  assert.equal(first.ok, false);
  assert.equal(legacyFails.getItem(INVESTOR_STATE_STORAGE_KEY), canonicalRaw);
  assert.equal(legacyFails.getItem(LEGACY_PROFILE_STORAGE_KEY), legacyRaw);
  assert.equal(loadInvestorState(legacyFails, { now: LATER }).source, 'investor_state');

  const canonicalFails = throwingStorage({
    initial: { [INVESTOR_STATE_STORAGE_KEY]: canonicalRaw, [LEGACY_PROFILE_STORAGE_KEY]: legacyRaw },
    failRemoveAt: 2,
  });
  const second = clearPrismaStorage(canonicalFails, memoryStorage());
  assert.equal(second.ok, false);
  assert.equal(second.rolledBack, true);
  assert.equal(canonicalFails.getItem(INVESTOR_STATE_STORAGE_KEY), canonicalRaw);
  assert.equal(canonicalFails.getItem(LEGACY_PROFILE_STORAGE_KEY), legacyRaw);
  assert.equal(loadInvestorState(canonicalFails, { now: LATER }).source, 'investor_state');

  const rollbackFails = throwingStorage({
    initial: { [INVESTOR_STATE_STORAGE_KEY]: canonicalRaw, [LEGACY_PROFILE_STORAGE_KEY]: legacyRaw },
    failRemoveAt: 2,
    failSetAt: 1,
  });
  const rollback = clearPrismaStorage(rollbackFails, memoryStorage());
  assert.equal(rollback.ok, false);
  assert.equal(rollback.rolledBack, false);
  assert.equal(rollback.rollbackError.name, 'QuotaExceededError');

  const successful = memoryStorage({ [INVESTOR_STATE_STORAGE_KEY]: canonicalRaw, [LEGACY_PROFILE_STORAGE_KEY]: legacyRaw });
  assert.equal(clearPrismaStorage(successful, memoryStorage()).ok, true);
  assert.equal(loadInvestorState(successful, { now: LATER }).source, 'empty');
});

test('reset verifica eliminaciones, postcondición final y rollback raw completo', async (t) => {
  const legacyRaw = JSON.stringify(legacyProfile());
  const canonicalRaw = JSON.stringify(migrateLegacyProfileResult(legacyProfile(), { id: 'stable', now: NOW }));
  const initial = { [INVESTOR_STATE_STORAGE_KEY]: canonicalRaw, [LEGACY_PROFILE_STORAGE_KEY]: legacyRaw };
  const assertRestoredFailure = (storage, result, status = 'postcondition_failed') => {
    assert.equal(result.ok, false);
    assert.equal(result.status, status);
    assert.equal(result.rolledBack, true);
    assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), canonicalRaw);
    assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), legacyRaw);
    assert.equal(loadInvestorState(storage, { now: LATER }).source, 'investor_state');
  };

  await t.test('removeItem legacy no arroja pero no elimina', () => {
    const storage = adversarialStorage(initial, { remove: ({ key }) => key === LEGACY_PROFILE_STORAGE_KEY ? false : undefined });
    assertRestoredFailure(storage, resetPrismaStateStorage(storage));
  });
  await t.test('removeItem canónico no arroja pero no elimina', () => {
    const storage = adversarialStorage(initial, { remove: ({ key }) => key === INVESTOR_STATE_STORAGE_KEY ? false : undefined });
    assertRestoredFailure(storage, resetPrismaStateStorage(storage));
  });
  await t.test('ninguna eliminación elimina realmente', () => {
    const storage = adversarialStorage(initial, { remove: () => false });
    assertRestoredFailure(storage, resetPrismaStateStorage(storage));
  });
  await t.test('legacy reaparece antes de su verificación', () => {
    const storage = adversarialStorage(initial, { get: ({ key, count, values }) => {
      if (key === LEGACY_PROFILE_STORAGE_KEY && count === 2) values.set(key, legacyRaw);
    } });
    assertRestoredFailure(storage, resetPrismaStateStorage(storage));
  });
  await t.test('canónico reaparece antes de su verificación', () => {
    const storage = adversarialStorage(initial, { get: ({ key, count, values }) => {
      if (key === INVESTOR_STATE_STORAGE_KEY && count === 2) values.set(key, canonicalRaw);
    } });
    assertRestoredFailure(storage, resetPrismaStateStorage(storage));
  });
  await t.test('una clave reaparece durante la verificación final', () => {
    const storage = adversarialStorage(initial, { get: ({ key, count, values }) => {
      if (key === LEGACY_PROFILE_STORAGE_KEY && count === 3) values.set(key, legacyRaw);
    } });
    assertRestoredFailure(storage, resetPrismaStateStorage(storage));
  });
  await t.test('la clave canónica reaparece durante la verificación final', () => {
    const storage = adversarialStorage(initial, { get: ({ key, count, values }) => {
      if (key === INVESTOR_STATE_STORAGE_KEY && count === 3) values.set(key, canonicalRaw);
    } });
    const result = resetPrismaStateStorage(storage);
    assert.equal(result.ok, false);
    assert.equal(result.status, 'postcondition_failed');
    assert.equal(result.rolledBack, true);
    assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), legacyRaw);
    assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), canonicalRaw);
    const loaded = loadInvestorState(storage, { now: LATER });
    assert.equal(loaded.source, 'investor_state');
    assert.equal(loaded.state.id, JSON.parse(canonicalRaw).id);
  });
  await t.test('getItem arroja durante una verificación posterior', () => {
    const storage = adversarialStorage(initial, { get: ({ key, count }) => {
      if (key === LEGACY_PROFILE_STORAGE_KEY && count === 2) throw new DOMException('Read failed', 'SecurityError');
    } });
    assertRestoredFailure(storage, resetPrismaStateStorage(storage), 'verification_failed');
  });
  await t.test('rollback exitoso restaura exactamente ambos raw originales', () => {
    const storage = adversarialStorage(initial, { remove: ({ key }) => key === INVESTOR_STATE_STORAGE_KEY ? false : undefined });
    const result = resetPrismaStateStorage(storage);
    assertRestoredFailure(storage, result);
    assert.equal(result.rollbackError, null);
  });
  await t.test('setItem falla durante el rollback', () => {
    const storage = adversarialStorage(initial, {
      remove: ({ key }) => key === INVESTOR_STATE_STORAGE_KEY ? false : undefined,
      set: () => { throw new DOMException('Rollback write failed', 'QuotaExceededError'); },
    });
    const result = resetPrismaStateStorage(storage);
    assert.equal(result.ok, false);
    assert.equal(result.status, 'rollback_failed');
    assert.equal(result.rolledBack, false);
    assert.equal(result.failureStatus, 'postcondition_failed');
    assert.equal(result.rollbackError.name, 'QuotaExceededError');
    assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), canonicalRaw);
    assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), null);
    assert.equal(loadInvestorState(storage, { now: LATER }).source, 'investor_state');
  });
  await t.test('rollback aparente también verifica su postcondición', () => {
    const storage = adversarialStorage(initial, {
      remove: ({ key }) => key === INVESTOR_STATE_STORAGE_KEY ? false : undefined,
      set: ({ key }) => key === LEGACY_PROFILE_STORAGE_KEY ? false : undefined,
    });
    const result = resetPrismaStateStorage(storage);
    assert.equal(result.ok, false);
    assert.equal(result.status, 'rollback_failed');
    assert.equal(result.rolledBack, false);
    assert.equal(result.rollbackError.name, 'RollbackVerificationError');
    assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), canonicalRaw);
    assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), null);
    assert.equal(loadInvestorState(storage, { now: LATER }).source, 'investor_state');
  });
  await t.test('ambas claves ya ausentes cumplen la postcondición', () => {
    const storage = adversarialStorage();
    const result = resetPrismaStateStorage(storage);
    assert.equal(result.ok, true);
    assert.equal(result.status, 'removed');
    assert.deepEqual(storage.snapshot(), {});
    assert.equal(loadInvestorState(storage, { now: LATER }).source, 'empty');
  });
  await t.test('reset normal elimina y verifica ambas claves', () => {
    const storage = adversarialStorage(initial);
    const result = resetPrismaStateStorage(storage);
    assert.equal(result.ok, true);
    assert.equal(result.status, 'removed');
    assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), null);
    assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), null);
    assert.equal(loadInvestorState(storage, { now: LATER }).source, 'empty');
  });
});

test('reset aborta sin eliminar si falla una lectura inicial', () => {
  const legacyRaw = JSON.stringify(legacyProfile());
  const canonicalRaw = JSON.stringify(migrateLegacyProfileResult(legacyProfile(), { id: 'stable', now: NOW }));
  const storage = adversarialStorage({ [INVESTOR_STATE_STORAGE_KEY]: canonicalRaw, [LEGACY_PROFILE_STORAGE_KEY]: legacyRaw }, {
    get: ({ key, count }) => {
      if (key === LEGACY_PROFILE_STORAGE_KEY && count === 1) throw new DOMException('Read blocked', 'SecurityError');
    },
  });
  const result = resetPrismaStateStorage(storage);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'storage_unavailable');
  assert.equal(result.rolledBack, null);
  assert.equal(storage.calls().remove, 0);
  assert.deepEqual(storage.snapshot(), { [INVESTOR_STATE_STORAGE_KEY]: canonicalRaw, [LEGACY_PROFILE_STORAGE_KEY]: legacyRaw });
});

test('modo demo no acepta un reset cuya postcondición no se cumple', () => {
  const legacyRaw = JSON.stringify(legacyProfile());
  const canonicalRaw = JSON.stringify(migrateLegacyProfileResult(legacyProfile(), { id: 'stable', now: NOW }));
  const storage = adversarialStorage({ [INVESTOR_STATE_STORAGE_KEY]: canonicalRaw, [LEGACY_PROFILE_STORAGE_KEY]: legacyRaw }, {
    remove: ({ key }) => key === LEGACY_PROFILE_STORAGE_KEY ? false : undefined,
  });
  const result = initializeDemoStorage(createDemoProfileResult(NOW), storage, memoryStorage());
  assert.equal(result.ok, false);
  assert.equal(result.status, 'reset_failed');
  assert.equal(result.persistence, null);
  assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), canonicalRaw);
  assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), legacyRaw);
});

test('vectorSummary conserva campos sólo legacy pero superpone valores canónicos representables', () => {
  const state = migrateLegacyProfileResult(legacyProfile(), { id: 'stable', now: NOW });
  state.risk.capacity.score = 91;
  state.risk.tolerance.score = 82;
  state.knowledge.overallScore = 73;
  state.compatibility.legacyProfileResult.investorMap.vectorSummary = {
    capacity: 1,
    tolerance: 2,
    knowledge: 3,
    legacyOnly: 'keep',
  };
  const summary = projectInvestorStateToLegacy(state).investorMap.vectorSummary;
  assert.deepEqual(summary, {
    prudence: 50,
    capacity: 91,
    tolerance: 82,
    knowledge: 73,
    horizon: 0,
    liquidityCapacity: 0,
    legacyOnly: 'keep',
  });
});

test('ninguna opción del helper genérico permite eliminar claves protegidas', () => {
  for (const keys of [[INVESTOR_STATE_STORAGE_KEY], [LEGACY_PROFILE_STORAGE_KEY], [INVESTOR_STATE_STORAGE_KEY, LEGACY_PROFILE_STORAGE_KEY]]) {
    const storage = memoryStorage({ [INVESTOR_STATE_STORAGE_KEY]: 'canonical', [LEGACY_PROFILE_STORAGE_KEY]: 'legacy', auxiliary: 'yes' });
    const result = removeStorageKeys(storage, keys, { allowProtected: true, force: true, internal: true });
    assert.equal(result.ok, false);
    assert.equal(storage.getItem(INVESTOR_STATE_STORAGE_KEY), 'canonical');
    assert.equal(storage.getItem(LEGACY_PROFILE_STORAGE_KEY), 'legacy');
    assert.equal(removeStorageKeys(storage, ['auxiliary'], { allowProtected: true }).ok, true);
  }
});

test('sanitiza cada valor inseguro aisladamente y conserva hermanas y posiciones de arrays', () => {
  const cyclic = { nestedSafe: 'inside' };
  cyclic.self = cyclic;
  const unsafeValues = {
    undefinedValue: undefined,
    nanValue: NaN,
    infinityValue: Infinity,
    functionValue: () => true,
    symbolValue: Symbol('unsafe'),
    cycle: cyclic,
    bigintValue: 1n,
  };
  for (const [key, unsafe] of Object.entries(unsafeValues)) {
    const state = createInitialInvestorState({ id: key, now: NOW });
    state.extensions = { safe: 'keep', [key]: unsafe };
    const normalized = normalizeInvestorState(deepFreeze(state), { now: NOW });
    assert.equal(normalized.extensions.safe, 'keep', key);
    assert.equal(Object.hasOwn(normalized.extensions, key), false, key);
  }

  const state = createInitialInvestorState({ id: 'array', now: NOW });
  state.extensions = {
    safe: 'keep',
    dangerous: JSON.parse('{"safeNested":true,"__proto__":{"polluted":true},"prototype":1,"constructor":2}'),
    list: ['first', undefined, NaN, Infinity, () => true, Symbol('x'), 1n, 'last'],
  };
  const normalized = normalizeInvestorState(deepFreeze(state), { now: NOW });
  assert.deepEqual(normalized.extensions.dangerous, { safeNested: true });
  assert.deepEqual(normalized.extensions.list, ['first', null, null, null, null, null, null, 'last']);
  assert.equal({}.polluted, undefined);
});

test('la frontera React adopta outcome.state y conserva el estado previo ante fallos', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
  const restoreGlobals = installDomGlobals({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true });
  let clientBuild;
  let root;
  let act;
  try {
    const React = await import('react');
    ({ act } = React);
    const { createRoot } = await import('react-dom/client');
    clientBuild = await buildClientModule('src/App.jsx', 'profile-boundary');
    const { ProfilePersistenceBoundary } = clientBuild.module;

    const stale = legacyProfile();
    stale.profile.explanation_level = 'advanced';
    const canonical = migrateLegacyProfileResult(stale, { id: 'stable', now: NOW });
    canonical.risk.label = 'Conservador';
    canonical.preferences.explanationLevelOverride = 'advanced';
    canonical.compatibility.legacyProfileResult = cloneForTest(stale);
    const storage = memoryStorage({
      [INVESTOR_STATE_STORAGE_KEY]: JSON.stringify(canonical),
      [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(stale),
    });
    let controller;
    const renderBoundary = (targetStorage, initialResult) => React.createElement(
      ProfilePersistenceBoundary,
      { storage: targetStorage, initialResult },
      (value) => { controller = value; return React.createElement('output', null, value.profileResult.profile.profile); },
    );
    root = createRoot(dom.window.document.getElementById('root'));
    await act(async () => root.render(renderBoundary(storage, stale)));
    let outcome;
    await act(async () => { outcome = controller.persistProfileResult(stale, ['preferences']); });
    assert.equal(outcome.status, 'unchanged');
    assert.equal(dom.window.document.querySelector('output').textContent, 'Conservador');

    for (const [failure, expectedStatus] of [[1, 'write_failed'], [2, 'partial_failure']]) {
      await act(async () => root.unmount());
      const failing = throwingStorage({
        initial: { [INVESTOR_STATE_STORAGE_KEY]: JSON.stringify(canonical), [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(stale) },
        failSetAt: failure,
      });
      const container = dom.window.document.createElement('div');
      dom.window.document.body.append(container);
      root = createRoot(container);
      await act(async () => root.render(renderBoundary(failing, stale)));
      const changed = cloneForTest(stale);
      changed.profile.explanation_level = 'simple';
      await act(async () => { outcome = controller.persistProfileResult(changed, ['preferences']); });
      assert.equal(outcome.status, expectedStatus);
      assert.equal(container.querySelector('output').textContent, stale.profile.profile);
    }
  } finally {
    if (root) await act(async () => root.unmount());
    if (clientBuild) await clientBuild.cleanup();
    dom.window.close();
    restoreGlobals();
  }
});

test('App real no avanza demo ni reset ante fallos y avanza cuando la operación completa tiene éxito', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  const restoreGlobals = installDomGlobals({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true });
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline test'); };
  dom.window.confirm = () => true;
  let clientBuild;
  let root;
  let act;
  try {
    const React = await import('react');
    ({ act } = React);
    const { createRoot } = await import('react-dom/client');
    clientBuild = await buildClientModule('src/App.jsx', 'demo-reset-app');
    const { default: App } = clientBuild.module;
    const legacy = legacyProfile();
    const canonical = migrateLegacyProfileResult(legacy, { id: 'stable', now: NOW });
    const initial = { [INVESTOR_STATE_STORAGE_KEY]: JSON.stringify(canonical), [LEGACY_PROFILE_STORAGE_KEY]: JSON.stringify(legacy) };
    const button = (container, label) => [...container.querySelectorAll('button')].find((item) => item.textContent.includes(label));
    const mount = async (storage) => {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: storage });
      Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, writable: true, value: memoryStorage() });
      const container = dom.window.document.createElement('div');
      dom.window.document.body.append(container);
      root = createRoot(container);
      await act(async () => root.render(React.createElement(App)));
      await act(async () => button(container, 'Invertir').click());
      return container;
    };
    const unmount = async () => { await act(async () => root.unmount()); root = null; };

    const demoFailureStorage = throwingStorage({ initial, failRemoveAt: 1 });
    let container = await mount(demoFailureStorage);
    await act(async () => button(container, 'Iniciar demo').click());
    assert.ok(button(container, 'Iniciar demo'));
    assert.equal(container.textContent.includes('Tu punto de partida'), false);
    assert.equal(demoFailureStorage.getItem('prisma-demo-mode'), null);
    assert.equal(demoFailureStorage.getItem(INVESTOR_STATE_STORAGE_KEY), initial[INVESTOR_STATE_STORAGE_KEY]);
    assert.equal(container.textContent.includes('Modo demo iniciado'), false);
    await unmount();

    const resetFailureStorage = throwingStorage({ initial, failRemoveAt: 1 });
    container = await mount(resetFailureStorage);
    await act(async () => button(container, 'Borrar datos de Prisma').click());
    assert.ok(button(container, 'Borrar datos de Prisma'));
    assert.equal(resetFailureStorage.getItem(INVESTOR_STATE_STORAGE_KEY), initial[INVESTOR_STATE_STORAGE_KEY]);
    assert.equal(resetFailureStorage.getItem(LEGACY_PROFILE_STORAGE_KEY), initial[LEGACY_PROFILE_STORAGE_KEY]);
    assert.equal(container.textContent.includes('Se borraron el perfil'), false);
    await unmount();

    const persistenceFailureStorage = throwingStorage({ initial, failSetAt: 1 });
    container = await mount(persistenceFailureStorage);
    await act(async () => button(container, 'Iniciar demo').click());
    assert.ok(button(container, 'Iniciar demo'));
    assert.equal(container.textContent.includes('Tu punto de partida'), false);
    assert.equal(persistenceFailureStorage.getItem('prisma-demo-mode'), null);
    assert.equal(container.textContent.includes('Modo demo iniciado'), false);
    await unmount();

    const successfulStorage = memoryStorage(initial);
    container = await mount(successfulStorage);
    await act(async () => button(container, 'Iniciar demo').click());
    assert.equal(successfulStorage.getItem('prisma-demo-mode'), 'true');
    assert.ok(successfulStorage.getItem(INVESTOR_STATE_STORAGE_KEY));
    assert.equal(container.textContent.includes('Tu punto de partida'), true);
  } finally {
    if (root) await act(async () => root.unmount());
    if (clientBuild) await clientBuild.cleanup();
    if (previousFetch === undefined) delete globalThis.fetch; else globalThis.fetch = previousFetch;
    dom.window.close();
    restoreGlobals();
  }
});

test('todas las funciones puras aceptan entradas congeladas y no mutan ningún nivel', () => {
  const legacy = deepFreeze(legacyProfile());
  const legacyBefore = JSON.stringify(legacy);
  const migrated = migrateLegacyProfileResult(legacy, { id: 'frozen', now: NOW });
  assert.equal(JSON.stringify(legacy), legacyBefore);

  const migratedBefore = JSON.stringify(migrated);
  deepFreeze(migrated);
  const normalized = normalizeInvestorState(migrated, { now: LATER });
  const projected = projectInvestorStateToLegacy(migrated);
  assert.equal(JSON.stringify(migrated), migratedBefore);
  assert.notEqual(normalized, migrated);
  assert.notEqual(projected, migrated.compatibility.legacyProfileResult);

  const partial = deepFreeze({ kind: INVESTOR_STATE_KIND, schemaVersion: 1, knowledge: { dimensions: { risk: { score: 2 } } } });
  const partialBefore = JSON.stringify(partial);
  normalizeInvestorState(partial, { now: NOW });
  assert.equal(JSON.stringify(partial), partialBefore);
  assert.equal(JSON.stringify(normalized.compatibility.legacyProfileResult), legacyBefore);
});
