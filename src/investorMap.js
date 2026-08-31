import { goalLabels, horizonLabels } from './profile.js';
import { knowledgeDimensions } from './knowledgeEngine.js';

export const INVESTOR_MAP_VERSION = 'investor_map_v1.0';

export const goalVectorPresets = {
  retirement: { label: 'Jubilación', horizonBias: 90, liquidityPriority: 35, stabilityPriority: 65, growthPriority: 75 },
  home: { label: 'Vivienda', horizonBias: 55, liquidityPriority: 70, stabilityPriority: 80, growthPriority: 35 },
  car: { label: 'Auto', horizonBias: 35, liquidityPriority: 85, stabilityPriority: 85, growthPriority: 20 },
  purchase: { label: 'Compra importante o vivienda', horizonBias: 50, liquidityPriority: 75, stabilityPriority: 80, growthPriority: 30 },
  growth: { label: 'Hacer crecer ahorros', horizonBias: 70, liquidityPriority: 45, stabilityPriority: 50, growthPriority: 75 },
  income: { label: 'Ingresos periódicos', horizonBias: 60, liquidityPriority: 55, stabilityPriority: 75, growthPriority: 40 },
  reserve: { label: 'Proteger una reserva', horizonBias: 20, liquidityPriority: 95, stabilityPriority: 90, growthPriority: 5 },
  learn: { label: 'Aprender y comenzar', horizonBias: 50, liquidityPriority: 65, stabilityPriority: 75, growthPriority: 30 },
  other: { label: 'Otro objetivo', horizonBias: 50, liquidityPriority: 60, stabilityPriority: 65, growthPriority: 45 },
};

const horizonScore = { lt1: 10, '1to3': 30, '3to5': 50, '5to10': 75, gt10: 100 };
const liquidityCapacityScore = { none: 100, small: 75, important: 40, almost_all: 5 };
const profilePrudence = { Conservador: 90, Moderado: 60, Agresivo: 30 };

const leaf = (value, confidence, evidence, updatedAt, extra = {}) => ({
  value,
  confidence,
  evidence,
  updatedAt,
  ...extra,
});

const initialBehavior = () => ({
  save: 0,
  discard: 0,
  open_detail: 0,
  add_portfolio: 0,
  remove_portfolio: 0,
  undo: 0,
  learn_card: 0,
  challenge_answer: 0,
  explanation_change: 0,
  sectorSignals: {},
  events: [],
});

function behaviorFrom(previousMap) {
  const previous = previousMap?.tree?.behavior?.raw;
  return previous ? {
    ...initialBehavior(),
    ...previous,
    sectorSignals: { ...(previous.sectorSignals || {}) },
    events: [...(previous.events || [])],
  } : initialBehavior();
}

function buildBehaviorBranch(raw, updatedAt) {
  const totalEvidence = ['save', 'discard', 'open_detail', 'add_portfolio', 'remove_portfolio', 'undo', 'learn_card', 'challenge_answer']
    .reduce((sum, key) => sum + Number(raw[key] || 0), 0);
  return {
    key: 'behavior',
    label: 'Decisiones observadas',
    description: 'Registra acciones explícitas dentro de Prisma. No diagnostica personalidad y nunca aumenta el riesgo permitido.',
    safetyImpact: 'none',
    confidence: Math.min(100, totalEvidence * 8),
    raw,
    children: {
      saved: leaf(raw.save, Math.min(100, raw.save * 15), `${raw.save} guardados explícitos`, updatedAt),
      discarded: leaf(raw.discard, Math.min(100, raw.discard * 15), `${raw.discard} descartes explícitos`, updatedAt),
      detailViews: leaf(raw.open_detail, Math.min(100, raw.open_detail * 12), `${raw.open_detail} fichas abiertas`, updatedAt),
      portfolioChanges: leaf(raw.add_portfolio + raw.remove_portfolio, Math.min(100, (raw.add_portfolio + raw.remove_portfolio) * 15), 'Cambios voluntarios en la cartera simulada', updatedAt),
      learningActions: leaf(raw.learn_card + raw.challenge_answer, Math.min(100, (raw.learn_card + raw.challenge_answer) * 12), 'Interacciones educativas, no operaciones', updatedAt),
      corrections: leaf(raw.undo + raw.explanation_change, Math.min(100, (raw.undo + raw.explanation_change) * 20), 'Deshacer y preferencias corregidas por la persona', updatedAt),
      sectorSignals: leaf(raw.sectorSignals, Math.min(100, totalEvidence * 8), 'Señales acotadas entre -6 y +6; solo reordenan dentro del mismo nivel de elegibilidad', updatedAt),
    },
  };
}

export function buildInvestorMap({ profile, answers, knowledge, previousMap = null, now = new Date().toISOString() }) {
  const behavior = behaviorFrom(previousMap);
  const requestedPurchasePreset = answers?.goal === 'purchase' && ['home', 'car'].includes(answers?.purchaseType)
    ? answers.purchaseType
    : answers?.goal;
  const goalKey = goalVectorPresets[requestedPurchasePreset] ? requestedPurchasePreset : 'other';
  const goalPreset = goalVectorPresets[goalKey];
  const knowledgeChildren = Object.fromEntries(Object.entries(knowledgeDimensions).map(([dimension, label]) => {
    const result = knowledge?.dimensions?.[dimension] || {};
    return [dimension, leaf(
      Number(result.score || 0),
      Number(result.confidence || 0),
      `${result.evidenceCount || 0} respuestas · ${result.unknownCount || 0} “No sé”`,
      now,
      { label, uncertainty: 100 - Number(result.confidence || 0) },
    )];
  }));

  const safetyBranch = {
    key: 'safety',
    label: 'Capacidad y tolerancia',
    description: 'Es la única rama que fija los límites de riesgo de la propuesta.',
    safetyImpact: 'binding',
    confidence: profile?.assessment_quality?.confidence ?? 60,
    children: {
      capacity: leaf(profile?.capacity_score ?? 0, 100, `Capacidad objetiva: ${profile?.capacity || 'sin calcular'}`, now),
      tolerance: leaf(profile?.tolerance_score ?? 0, 100, `Tolerancia declarada: ${profile?.tolerance || 'sin calcular'}`, now),
      horizon: leaf(horizonScore[answers?.horizon] ?? 0, answers?.horizon ? 100 : 0, horizonLabels[answers?.horizon] || 'Sin respuesta', now),
      liquidity: leaf(liquidityCapacityScore[answers?.liquidity] ?? 0, answers?.liquidity ? 100 : 0, `Necesidad de liquidez: ${answers?.liquidity || 'sin respuesta'}`, now),
    },
  };

  const knowledgeBranch = {
    key: 'knowledge',
    label: 'Conocimiento observado',
    description: 'Solo ajusta vocabulario, ejemplos y cantidad de explicación. No cambia el perfil de riesgo.',
    safetyImpact: 'none',
    confidence: knowledge?.confidence || 0,
    children: knowledgeChildren,
  };

  const goalBranch = {
    key: 'goal',
    label: 'Objetivo',
    description: 'Usa un vector predeterminado para ordenar funciones de cartera; después se somete a los límites de seguridad.',
    safetyImpact: 'bounded',
    confidence: answers?.goal ? 100 : 0,
    preset: goalPreset,
    children: {
      objective: leaf(goalPreset.label, answers?.goal ? 100 : 0, goalLabels[answers?.goal] || 'Sin objetivo', now),
      horizonBias: leaf(goalPreset.horizonBias, 100, 'Vector predeterminado del objetivo', now),
      liquidityPriority: leaf(goalPreset.liquidityPriority, 100, 'Vector predeterminado del objetivo', now),
      stabilityPriority: leaf(goalPreset.stabilityPriority, 100, 'Vector predeterminado del objetivo', now),
      growthPriority: leaf(goalPreset.growthPriority, 100, 'Vector predeterminado del objetivo', now),
    },
  };

  const sectors = (answers?.sectors || []).filter((sector) => sector !== 'none').slice(0, 3);
  const preferencesBranch = {
    key: 'preferences',
    label: 'Preferencias explícitas',
    description: 'Solo cambia el orden de descubrimiento. No altera compatibilidad, elegibilidad ni límites.',
    safetyImpact: 'none',
    confidence: sectors.length ? 100 : 0,
    children: {
      sectors: leaf(sectors, sectors.length ? 100 : 0, sectors.length ? `${sectors.length} sectores elegidos` : 'Sin preferencia sectorial', now),
      explanationLevel: leaf(profile?.explanation_level || 'simple', 100, 'Evaluación de conocimiento o corrección explícita', now),
    },
  };

  const behaviorBranch = buildBehaviorBranch(behavior, now);
  const vector = [safetyBranch, knowledgeBranch, goalBranch, preferencesBranch, behaviorBranch];
  return {
    version: INVESTOR_MAP_VERSION,
    updatedAt: now,
    profileLabel: profile?.profile || 'Sin calcular',
    vectorSummary: {
      prudence: profilePrudence[profile?.profile] ?? 50,
      capacity: profile?.capacity_score ?? 0,
      tolerance: profile?.tolerance_score ?? 0,
      knowledge: knowledge?.overallScore ?? 0,
      horizon: horizonScore[answers?.horizon] ?? 0,
      liquidityCapacity: liquidityCapacityScore[answers?.liquidity] ?? 0,
    },
    vector,
    tree: Object.fromEntries(vector.map((branch) => [branch.key, branch])),
    guardrails: [
      'Conocimiento y comportamiento no pueden elevar el perfil de riesgo.',
      'Las preferencias sectoriales solo ordenan el contenido.',
      'No se infieren diagnósticos psicológicos ni intención de compra.',
    ],
  };
}

export function addBehaviorSignal(profileResult, type, metadata = {}, now = new Date().toISOString()) {
  if (!profileResult?.profile || !profileResult?.answers) return profileResult;
  const existingMap = profileResult.investorMap || buildInvestorMap({
    profile: profileResult.profile,
    answers: profileResult.answers,
    knowledge: profileResult.knowledge,
    now,
  });
  const raw = behaviorFrom(existingMap);
  if (Object.prototype.hasOwnProperty.call(raw, type) && typeof raw[type] === 'number') raw[type] += 1;
  if (metadata.sector && ['save', 'discard', 'add_portfolio', 'remove_portfolio', 'open_detail'].includes(type)) {
    const direction = ['discard', 'remove_portfolio'].includes(type) ? -1 : 1;
    raw.sectorSignals[metadata.sector] = Math.max(-6, Math.min(6, Number(raw.sectorSignals[metadata.sector] || 0) + direction));
  }
  raw.events = [...raw.events, {
    type,
    at: now,
    assetId: metadata.assetId || null,
    cardId: metadata.cardId || null,
    dimension: metadata.dimension || null,
    answer: metadata.answer || null,
    correct: metadata.correct ?? null,
  }].slice(-24);
  const previousWithBehavior = {
    ...existingMap,
    tree: { ...existingMap.tree, behavior: { ...existingMap.tree.behavior, raw } },
  };
  return {
    ...profileResult,
    investorMap: buildInvestorMap({
      profile: profileResult.profile,
      answers: profileResult.answers,
      knowledge: profileResult.knowledge,
      previousMap: previousWithBehavior,
      now,
    }),
  };
}

export function setExplanationPreference(profileResult, level, now = new Date().toISOString()) {
  if (!['simple', 'intermediate', 'advanced'].includes(level) || !profileResult?.profile) return profileResult;
  const updated = {
    ...profileResult,
    profile: { ...profileResult.profile, explanation_level: level },
  };
  const withSignal = addBehaviorSignal(updated, 'explanation_change', {}, now);
  return {
    ...withSignal,
    investorMap: buildInvestorMap({
      profile: withSignal.profile,
      answers: withSignal.answers,
      knowledge: withSignal.knowledge,
      previousMap: withSignal.investorMap,
      now,
    }),
  };
}
