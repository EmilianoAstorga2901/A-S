import { knowledgeDimensions } from './knowledgeEngine.js';

export const DISCOVER_VERSION = 'discover_v1.0';
export const DISCOVER_CARD_LIMIT = 11;

function compatibilityGroup(item) {
  const compatibility = item.compatibility;
  if (!compatibility?.personalized) return 1;
  if (compatibility.eligibleForPortfolio) return 0;
  if (compatibility.eligible && compatibility.finalScore >= 50) return 1;
  if (compatibility.eligible) return 2;
  return 3;
}

export function applyBehaviorOrdering(rankedItems = [], profileResult = null) {
  const signals = profileResult?.investorMap?.tree?.behavior?.raw?.sectorSignals || {};
  return rankedItems.map((item, originalIndex) => {
    const rawSignal = Number(signals[item.asset.sector] || 0);
    const boundedSignal = Math.max(-6, Math.min(6, rawSignal));
    return {
      ...item,
      compatibility: {
        ...item.compatibility,
        behaviorOrderSignal: boundedSignal,
        behaviorOrderReason: boundedSignal
          ? `El orden se movió de forma acotada por decisiones explícitas previas sobre ${item.asset.sector}. La compatibilidad no cambió.`
          : null,
      },
      originalIndex,
    };
  }).sort((first, second) => (
    compatibilityGroup(first) - compatibilityGroup(second)
    || (first.originalIndex - first.compatibility.behaviorOrderSignal * .35) - (second.originalIndex - second.compatibility.behaviorOrderSignal * .35)
    || first.asset.id.localeCompare(second.asset.id)
  )).map(({ originalIndex: _originalIndex, ...item }) => item);
}

const conceptCopy = {
  risk: {
    title: 'Riesgo no significa “va a bajar”',
    body: 'Describe cuánto puede variar, qué pérdidas podrían ocurrir y qué tan incierto es el resultado. Una cifra histórica no predice la próxima caída.',
    takeaway: 'Leé retorno posible y pérdida posible juntos.',
  },
  diversification: {
    title: 'Más símbolos no siempre significan más diversificación',
    body: 'Distintos activos pueden depender de la misma empresa, sector, moneda o país. La diversificación real mira esas dependencias.',
    takeaway: 'Revisá qué riesgos se repiten debajo de cada nombre.',
  },
  liquidity: {
    title: 'Tener precio no es lo mismo que tener el dinero disponible',
    body: 'Entre vender y usar el dinero puede haber poca demanda, un precio diferente, plazos de liquidación o rescate y conversión de moneda.',
    takeaway: 'Para necesidades cercanas, tiempo y costo de salida importan.',
  },
  inflation_fx: {
    title: 'La meta es la verdadera vara de comparación',
    body: 'Un saldo puede subir y aun así comprar menos. Importan inflación, moneda del objetivo y costos, no solo el porcentaje nominal.',
    takeaway: 'Compará el resultado neto con lo que querés comprar.',
  },
  instruments: {
    title: 'Cada instrumento promete algo distinto',
    body: 'Una acción representa una participación; un bono, deuda; un fondo, una cartera administrada. Cotizar en la misma pantalla no los vuelve equivalentes.',
    takeaway: 'Primero entendé de dónde puede venir el resultado.',
  },
  costs: {
    title: 'El rendimiento que importa es el neto',
    body: 'Comisiones, spread, costos internos, tipo de cambio e impuestos pueden hacer que dos rendimientos publicados terminen siendo diferentes.',
    takeaway: 'Pedí siempre el costo total, no una sola comisión.',
  },
};

function weakestKnowledgeDimension(profileResult) {
  const dimensions = profileResult?.knowledge?.dimensions || {};
  return Object.keys(knowledgeDimensions).sort((first, second) => {
    const firstResult = dimensions[first] || {};
    const secondResult = dimensions[second] || {};
    return (firstResult.score || 0) - (secondResult.score || 0)
      || (firstResult.confidence || 0) - (secondResult.confidence || 0);
  })[0] || 'diversification';
}

function educationalCards(rankedItems, profileResult) {
  const first = rankedItems[0]?.asset;
  const second = rankedItems[1]?.asset;
  const profile = profileResult?.profile || {};
  const answers = profileResult?.answers || {};
  const weakDimension = weakestKnowledgeDimension(profileResult);
  const concept = conceptCopy[weakDimension];
  const allocation = profile.allocation || { liquidity: 0, stability: 0, growth: 0, satellite: 0 };
  const objectiveCopy = answers.goal === 'retirement'
    ? 'Imaginá que faltan muchos años para jubilarte, pero aparece un gasto urgente mañana.'
    : answers.goal === 'purchase'
      ? 'Imaginá que la fecha de una compra importante se adelanta seis meses.'
      : 'Imaginá que necesitás una parte del dinero antes de la fecha prevista.';

  return [
    {
      id: `concept-${weakDimension}`,
      kind: 'concept',
      eyebrow: `CONCEPTO · ${knowledgeDimensions[weakDimension]}`,
      title: concept.title,
      body: concept.body,
      takeaway: concept.takeaway,
      whyShown: `Aparece porque esta dimensión tiene la menor combinación de puntaje y confianza en tu evaluación actual.`,
      sourceNote: 'Contenido educativo Prisma · metodología knowledge_v1.0',
    },
    {
      id: 'comparison-first-assets',
      kind: 'comparison',
      eyebrow: 'COMPARACIÓN GUIADA',
      title: first && second ? `${first.symbol} y ${second.symbol} pueden cumplir funciones distintas` : 'Dos activos pueden parecer similares y funcionar distinto',
      body: first && second
        ? `${first.name} se presenta como “${first.function}”. ${second.name} se presenta como “${second.function}”. La comparación no decide cuál comprar: muestra qué problema intenta resolver cada uno.`
        : 'Comparar función, plazo, liquidez, riesgo y costos suele ser más útil que mirar solo el último rendimiento.',
      comparison: first && second ? [
        { label: first.symbol, value: first.risk, detail: first.horizon },
        { label: second.symbol, value: second.risk, detail: second.horizon },
      ] : [],
      takeaway: 'La mejor comparación depende de tu objetivo y restricciones.',
      whyShown: 'Intercala una comparación para evitar que el recorrido sea solo una sucesión de productos.',
      sourceNote: first && second ? `Fichas ilustrativas de activos · ${first.priceDate}` : 'Contenido educativo Prisma',
    },
    {
      id: 'scenario-liquidity-shock',
      kind: 'scenario',
      eyebrow: 'ESCENARIO · ¿QUÉ CAMBIA?',
      title: 'Tu objetivo sigue igual, pero la necesidad de liquidez cambia',
      body: objectiveCopy,
      scenario: [
        { label: 'Antes', value: 'Podías mantener la inversión' },
        { label: 'Ahora', value: 'Podrías necesitar una parte pronto' },
        { label: 'A revisar', value: 'Liquidez, plazo y pérdida al vender' },
      ],
      takeaway: 'El perfil es dinámico: un cambio real debe corregirse en las respuestas, no inferirse en secreto.',
      whyShown: 'Este caso conecta la propuesta con un cambio concreto de situación.',
      sourceNote: 'Escenario educativo; no es una predicción',
    },
    {
      id: 'challenge-diversification',
      kind: 'challenge',
      dimension: 'diversification',
      eyebrow: 'MINICASO · ELEGÍ UNA RESPUESTA',
      title: 'Una cartera tiene cinco activos, pero cuatro dependen del mismo sector. ¿Qué revisarías primero?',
      body: 'La respuesta se suma como evidencia educativa y no modifica tu perfil de riesgo.',
      options: [
        ['symbols', 'La cantidad de símbolos solamente'],
        ['exposure', 'La exposición total al sector y a los emisores'],
        ['past', 'Cuál fue el que más subió el mes pasado'],
        ['unknown', 'No sé / quiero ver la explicación'],
      ],
      correctAnswer: 'exposure',
      explanation: 'La concentración real puede esconderse detrás de símbolos distintos. Conviene sumar exposiciones por sector y emisor.',
      whyShown: 'Los minicasos permiten observar comprensión sin pedir una autoevaluación.',
      sourceNote: 'Contenido educativo Prisma · no habilita operaciones',
    },
    {
      id: 'portfolio-observation',
      kind: 'portfolio',
      eyebrow: 'LECTURA DE TU PROPUESTA',
      title: `La estructura ${profile.profile || 'inicial'} asigna funciones antes que productos`,
      body: 'Los porcentajes son un punto de partida educativo. Los límites de capacidad y tolerancia se aplican antes que intereses sectoriales o comportamiento en el feed.',
      allocation: [
        ['Liquidez', allocation.liquidity],
        ['Estabilidad', allocation.stability],
        ['Crecimiento', allocation.growth],
        ['Complementos', allocation.satellite],
      ],
      takeaway: 'Si una función queda sin cubrir, Prisma lo muestra en lugar de forzar un activo incompatible.',
      whyShown: 'Aparece para conectar lo aprendido con la cartera que después vas a revisar.',
      sourceNote: `${profile.rules_version || 'profile_v1.0'} · salida reproducible`,
    },
  ];
}

export function buildDiscoverSession(rankedItems = [], profileResult = null) {
  const assets = rankedItems.slice(0, 6).map((item) => ({
    id: `asset-${item.asset.id}`,
    kind: 'asset',
    label: item.asset.symbol,
    ...item,
  }));
  const education = educationalCards(rankedItems, profileResult);
  const session = [];
  const slots = [assets[0], education[0], assets[1], education[1], assets[2], education[2], assets[3], education[3], assets[4], education[4], assets[5]];
  slots.filter(Boolean).forEach((item) => session.push(item));
  return session.slice(0, DISCOVER_CARD_LIMIT);
}

export function discoverItemLabel(item) {
  if (!item) return 'Cierre';
  if (item.kind === 'asset') return item.asset.symbol;
  const labels = {
    concept: 'Concepto',
    comparison: 'Comparación',
    scenario: 'Escenario',
    challenge: 'Minicaso',
    portfolio: 'Tu propuesta',
  };
  return labels[item.kind] || 'Aprendizaje';
}
