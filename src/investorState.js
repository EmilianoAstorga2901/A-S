export const INVESTOR_STATE_KIND = 'prisma_investor_state';
export const INVESTOR_STATE_SCHEMA_VERSION = 1;
export const KNOWN_INVESTOR_STATE_SCHEMA_VERSIONS = Object.freeze([INVESTOR_STATE_SCHEMA_VERSION]);

const RISK_LABELS = new Set(['Conservador', 'Moderado', 'Agresivo']);
const EXPLANATION_LEVELS = new Set(['simple', 'intermediate', 'advanced']);

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor']);
const OMIT = Symbol('omit');
const hasCycle = (value, ancestors = new WeakSet()) => {
  if (!value || typeof value !== 'object') return false;
  if (ancestors.has(value)) return true;
  ancestors.add(value);
  const cyclic = Object.entries(value).some(([key, item]) => !unsafeKeys.has(key) && hasCycle(item, ancestors));
  ancestors.delete(value);
  return cyclic;
};
const sanitize = (value, inArray = false, ancestors = new WeakSet()) => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : (inArray ? null : OMIT);
  if (['undefined', 'bigint', 'function', 'symbol'].includes(typeof value)) return inArray ? null : OMIT;
  if (!value || typeof value !== 'object') return inArray ? null : OMIT;
  if (ancestors.has(value)) return OMIT;
  ancestors.add(value);
  if (Array.isArray(value)) {
    const result = value.map((item) => {
      if (hasCycle(item)) return null;
      const safe = sanitize(item, true, ancestors);
      return safe === OMIT ? null : safe;
    });
    ancestors.delete(value);
    return result;
  }
  const entries = Object.entries(value).flatMap(([key, item]) => {
    if (unsafeKeys.has(key) || hasCycle(item)) return [];
    const safe = sanitize(item, false, ancestors);
    return safe === OMIT ? [] : [[key, safe]];
  });
  ancestors.delete(value);
  return Object.fromEntries(entries);
};
const clone = (value, fallback = undefined) => {
  const safe = sanitize(value);
  return safe === OMIT ? fallback : safe;
};
const array = (value) => Array.isArray(value) ? clone(value, []) : [];
const object = (value) => {
  if (!isObject(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    if (unsafeKeys.has(key)) return [];
    const copied = clone(item);
    return copied === undefined ? [] : [[key, copied]];
  }));
};
const text = (value, fallback = null) => typeof value === 'string' && value ? value : fallback;
const finite = (value, fallback = null) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
  ? Number(value)
  : fallback;
const riskLabel = (value) => RISK_LABELS.has(value) ? value : null;
const explanationLevel = (value) => EXPLANATION_LEVELS.has(value) ? value : null;

export function validateInvestorStateVersion(value) {
  if (!isObject(value) || value.kind !== INVESTOR_STATE_KIND) {
    return { valid: false, reason: 'not_investor_state' };
  }
  if (!KNOWN_INVESTOR_STATE_SCHEMA_VERSIONS.includes(value.schemaVersion)) {
    return { valid: false, reason: 'unknown_schema_version', schemaVersion: value.schemaVersion ?? null };
  }
  return { valid: true, schemaVersion: value.schemaVersion };
}

export function isLegacyProfileResult(value) {
  return isObject(value) && isObject(value.profile) && isObject(value.answers);
}

function emptySections() {
  return {
    identity: { subjectId: null, status: 'active' },
    financialSituation: {
      liquidityNeed: null,
      emergencyFund: null,
      debtStatus: null,
      incomeStability: null,
      contribution: { amount: null, currency: null, unsure: false },
      initialAmount: null,
      asOf: null,
      verification: 'self_declared',
    },
    risk: {
      label: null,
      capacity: { label: null, score: null },
      tolerance: { label: null, score: null },
      limits: [],
      warnings: [],
      contradiction: null,
      allocation: {},
      assessmentQuality: {},
      modelVersion: null,
    },
    objectives: [],
    knowledge: {
      status: 'not_assessed',
      assessmentVersion: null,
      overallScore: null,
      confidence: null,
      dimensions: {},
      explanationLevel: null,
      assessedAt: null,
      responses: {},
    },
    behavior: { modelVersion: null, events: [], signals: {}, evidence: {} },
    openingAffinities: { modelVersion: null, items: [], safetyImpact: 'none' },
    educationProgress: { modelVersion: null, books: [], lastActivityAt: null },
    preferences: { sectors: [], explanationLevelOverride: null },
    evidence: { basis: 'self_declared', items: [] },
    versions: {
      riskModel: null,
      knowledgeModel: null,
      investorMap: null,
      goalVector: null,
      openingBooks: null,
    },
  };
}

export function createInitialInvestorState({ id = 'local-profile', now = '1970-01-01T00:00:00.000Z' } = {}) {
  return normalizeInvestorState({
    kind: INVESTOR_STATE_KIND,
    schemaVersion: INVESTOR_STATE_SCHEMA_VERSION,
    id,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    ...emptySections(),
    compatibility: { migratedFrom: null, legacyProfileResult: null },
  });
}

export function normalizeInvestorState(value, { id = 'local-profile', now = '1970-01-01T00:00:00.000Z' } = {}) {
  const version = validateInvestorStateVersion(value);
  if (!version.valid) return null;
  const defaults = emptySections();
  const financial = isObject(value.financialSituation) ? value.financialSituation : {};
  const contribution = isObject(financial.contribution) ? financial.contribution : {};
  const risk = isObject(value.risk) ? value.risk : {};
  const capacity = isObject(risk.capacity) ? risk.capacity : {};
  const tolerance = isObject(risk.tolerance) ? risk.tolerance : {};
  const knowledge = isObject(value.knowledge) ? value.knowledge : {};
  const behavior = isObject(value.behavior) ? value.behavior : {};
  const affinities = isObject(value.openingAffinities) ? value.openingAffinities : {};
  const progress = isObject(value.educationProgress) ? value.educationProgress : {};
  const preferences = isObject(value.preferences) ? value.preferences : {};
  const evidence = isObject(value.evidence) ? value.evidence : {};
  const versions = isObject(value.versions) ? value.versions : {};
  const compatibility = isObject(value.compatibility) ? value.compatibility : {};

  return {
    ...object(value),
    kind: INVESTOR_STATE_KIND,
    schemaVersion: INVESTOR_STATE_SCHEMA_VERSION,
    id: text(value.id, id),
    revision: Math.max(0, Math.trunc(finite(value.revision, 0))),
    createdAt: text(value.createdAt, now),
    updatedAt: text(value.updatedAt, text(value.createdAt, now)),
    identity: {
      ...object(value.identity),
      subjectId: text(value.identity?.subjectId),
      status: text(value.identity?.status, defaults.identity.status),
    },
    financialSituation: {
      ...object(financial),
      liquidityNeed: text(financial.liquidityNeed),
      emergencyFund: text(financial.emergencyFund),
      debtStatus: text(financial.debtStatus),
      incomeStability: text(financial.incomeStability),
      contribution: {
        ...object(contribution),
        amount: finite(contribution.amount),
        currency: text(contribution.currency),
        unsure: Boolean(contribution.unsure),
      },
      initialAmount: isObject(financial.initialAmount) ? clone(financial.initialAmount) : finite(financial.initialAmount),
      asOf: text(financial.asOf),
      verification: text(financial.verification, defaults.financialSituation.verification),
    },
    risk: {
      ...object(risk),
      label: riskLabel(risk.label),
      capacity: { ...object(capacity), label: riskLabel(capacity.label), score: finite(capacity.score) },
      tolerance: { ...object(tolerance), label: riskLabel(tolerance.label), score: finite(tolerance.score) },
      limits: array(risk.limits),
      warnings: array(risk.warnings),
      contradiction: text(risk.contradiction),
      allocation: object(risk.allocation),
      assessmentQuality: object(risk.assessmentQuality),
      modelVersion: text(risk.modelVersion),
    },
    objectives: array(value.objectives),
    knowledge: {
      ...object(knowledge),
      status: text(knowledge.status, knowledge.assessmentVersion ? 'assessed' : defaults.knowledge.status),
      assessmentVersion: text(knowledge.assessmentVersion),
      overallScore: finite(knowledge.overallScore),
      confidence: finite(knowledge.confidence),
      dimensions: object(knowledge.dimensions),
      explanationLevel: explanationLevel(knowledge.explanationLevel),
      assessedAt: text(knowledge.assessedAt),
      responses: object(knowledge.responses),
    },
    behavior: {
      ...object(behavior),
      modelVersion: text(behavior.modelVersion),
      events: array(behavior.events),
      signals: object(behavior.signals),
      evidence: object(behavior.evidence),
    },
    openingAffinities: {
      ...object(affinities),
      modelVersion: text(affinities.modelVersion),
      items: array(affinities.items),
      safetyImpact: 'none',
    },
    educationProgress: {
      ...object(progress),
      modelVersion: text(progress.modelVersion),
      books: array(progress.books),
      lastActivityAt: text(progress.lastActivityAt),
    },
    preferences: {
      ...object(preferences),
      sectors: array(preferences.sectors).filter((sector) => typeof sector === 'string').slice(0, 3),
      explanationLevelOverride: explanationLevel(preferences.explanationLevelOverride),
    },
    evidence: {
      ...object(evidence),
      basis: text(evidence.basis, defaults.evidence.basis),
      items: array(evidence.items),
    },
    versions: {
      ...object(versions),
      riskModel: text(versions.riskModel),
      knowledgeModel: text(versions.knowledgeModel),
      investorMap: text(versions.investorMap),
      goalVector: text(versions.goalVector),
      openingBooks: text(versions.openingBooks),
    },
    compatibility: {
      ...object(compatibility),
      migratedFrom: text(compatibility.migratedFrom),
      legacyProfileResult: isObject(compatibility.legacyProfileResult) ? clone(compatibility.legacyProfileResult) : null,
    },
  };
}

export function migrateLegacyProfileResult(legacy, { id = 'local-profile', now = '1970-01-01T00:00:00.000Z' } = {}) {
  if (!isLegacyProfileResult(legacy)) return null;
  const profile = legacy.profile;
  const answers = legacy.answers;
  const knowledge = isObject(legacy.knowledge) ? legacy.knowledge : {};
  const rawBehavior = legacy.investorMap?.tree?.behavior?.raw || {};
  const contribution = isObject(answers.contribution) ? answers.contribution : {};
  const initialAmount = isObject(answers.initialAmount) ? answers.initialAmount : null;
  const objective = answers.goal ? [{
    id: 'primary',
    kind: answers.goal,
    subtype: answers.purchaseType || null,
    priority: 'primary',
    horizon: { code: answers.horizon || null, estimatedYears: null },
    status: 'active',
  }] : [];

  return normalizeInvestorState({
    ...createInitialInvestorState({ id, now }),
    revision: 0,
    financialSituation: {
      liquidityNeed: answers.liquidity || null,
      emergencyFund: answers.emergencyFund || null,
      debtStatus: answers.debts || null,
      incomeStability: answers.income || null,
      contribution: {
        amount: contribution.unsure ? null : finite(contribution.amount),
        currency: contribution.currency || null,
        unsure: Boolean(contribution.unsure),
      },
      initialAmount: initialAmount ? clone(initialAmount) : null,
      asOf: now.slice(0, 10),
      verification: 'self_declared',
    },
    risk: {
      label: profile.profile,
      capacity: { label: profile.capacity, score: profile.capacity_score },
      tolerance: { label: profile.tolerance, score: profile.tolerance_score },
      limits: profile.safety_limits,
      warnings: profile.warnings,
      contradiction: profile.contradiction,
      allocation: profile.allocation,
      assessmentQuality: profile.assessment_quality,
      modelVersion: profile.rules_version,
    },
    objectives: objective,
    knowledge: {
      status: Object.keys(knowledge).length ? 'assessed' : 'not_assessed',
      assessmentVersion: knowledge.version || profile.knowledge_version || null,
      overallScore: knowledge.overallScore,
      confidence: knowledge.confidence,
      dimensions: knowledge.dimensions,
      explanationLevel: profile.explanation_level,
      assessedAt: knowledge.assessedAt,
      responses: legacy.knowledgeResponses,
    },
    behavior: {
      modelVersion: legacy.investorMap?.version || null,
      events: rawBehavior.events,
      signals: { sectorSignals: rawBehavior.sectorSignals || {} },
      evidence: rawBehavior,
    },
    preferences: {
      sectors: profile.sectors || answers.sectors,
      explanationLevelOverride: null,
    },
    evidence: {
      basis: profile.assessment_quality?.basis || 'self_declared',
      items: [],
    },
    versions: {
      riskModel: profile.rules_version || null,
      knowledgeModel: knowledge.version || profile.knowledge_version || null,
      investorMap: legacy.investorMap?.version || null,
      goalVector: profile.goal_vector_version || null,
      openingBooks: null,
    },
    compatibility: {
      migratedFrom: 'profile_result_v1',
      legacyProfileResult: clone(legacy),
    },
  }, { id, now });
}

export function projectInvestorStateToLegacy(value) {
  const state = normalizeInvestorState(value);
  if (!state) return null;
  const legacy = object(state.compatibility.legacyProfileResult);
  const primaryObjective = state.objectives.find((item) => item?.priority === 'primary') || state.objectives[0] || {};
  const canonicalBehavior = {
    ...object(state.behavior.evidence),
    events: clone(state.behavior.events, []),
    sectorSignals: clone(state.behavior.signals?.sectorSignals, {}),
  };
  const legacyMap = object(legacy.investorMap);
  const behaviorBranch = {
    ...object(legacyMap.tree?.behavior),
    raw: canonicalBehavior,
  };
  const tree = { ...object(legacyMap.tree), behavior: behaviorBranch };
  const vector = Array.isArray(legacyMap.vector)
    ? legacyMap.vector.map((branch) => branch?.key === 'behavior' ? behaviorBranch : clone(branch))
    : [];
  const investorMap = {
    ...legacyMap,
    version: state.versions.investorMap || legacyMap.version || null,
    updatedAt: legacyMap.updatedAt || state.updatedAt,
    vectorSummary: {
      ...object(legacyMap.vectorSummary),
      prudence: 50,
      capacity: state.risk.capacity.score ?? 0,
      tolerance: state.risk.tolerance.score ?? 0,
      knowledge: state.knowledge.overallScore ?? 0,
      horizon: 0,
      liquidityCapacity: 0,
    },
    vector,
    tree,
    guardrails: array(legacyMap.guardrails),
  };
  const canonicalKnowledge = {
    ...object(legacy.knowledge),
    version: state.knowledge.assessmentVersion,
    overallScore: state.knowledge.overallScore,
    confidence: state.knowledge.confidence,
    dimensions: clone(state.knowledge.dimensions, {}),
    assessedAt: state.knowledge.assessedAt,
    explanationLevel: state.knowledge.explanationLevel,
  };
  return {
    ...legacy,
    profile: {
      ...object(legacy.profile),
      profile: state.risk.label,
      capacity: state.risk.capacity.label,
      tolerance: state.risk.tolerance.label,
      capacity_score: state.risk.capacity.score,
      tolerance_score: state.risk.tolerance.score,
      safety_limits: clone(state.risk.limits),
      warnings: clone(state.risk.warnings),
      contradiction: state.risk.contradiction,
      allocation: clone(state.risk.allocation),
      assessment_quality: clone(state.risk.assessmentQuality),
      sectors: clone(state.preferences.sectors),
      explanation_level: state.preferences.explanationLevelOverride || state.knowledge.explanationLevel || legacy.profile?.explanation_level || 'simple',
      rules_version: state.risk.modelVersion,
      goal_vector_version: state.versions.goalVector,
      knowledge_version: state.versions.knowledgeModel,
    },
    answers: {
      ...object(legacy.answers),
      ...(primaryObjective.kind ? { goal: primaryObjective.kind } : {}),
      ...(primaryObjective.subtype ? { purchaseType: primaryObjective.subtype } : {}),
      ...(primaryObjective.horizon?.code ? { horizon: primaryObjective.horizon.code } : {}),
      liquidity: state.financialSituation.liquidityNeed,
      emergencyFund: state.financialSituation.emergencyFund,
      debts: state.financialSituation.debtStatus,
      income: state.financialSituation.incomeStability,
      contribution: clone(state.financialSituation.contribution),
      initialAmount: clone(state.financialSituation.initialAmount),
      sectors: clone(state.preferences.sectors),
    },
    knowledge: canonicalKnowledge,
    knowledgeResponses: state.knowledge.status === 'assessed'
      ? clone(state.knowledge.responses, {})
      : Object.keys(legacy.knowledgeResponses || {}).length
        ? clone(legacy.knowledgeResponses)
        : clone(state.knowledge.responses, {}),
    investorMap,
  };
}

export function investorStateContent(value) {
  const normalized = normalizeInvestorState(value);
  if (!normalized) return null;
  const content = clone(normalized);
  delete content.revision;
  delete content.updatedAt;
  return content;
}
