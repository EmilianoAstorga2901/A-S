const clamp = (value, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const evenExposure = (prefix, count) => Object.fromEntries(Array.from({ length: count }, (_, index) => [`${prefix}-${index + 1}`, 1 / count]));

export const COMPATIBILITY_VERSION = 'compatibility_v1.0';
export const PORTFOLIO_VERSION = 'portfolio_v1.0';

const profilePolicy = {
  Conservador: { riskAnchor: 25, riskCeiling: 45, companyLimit: 5, sectorLimit: 15, satelliteLimit: 0, riskPolicyLimit: 35 },
  Moderado: { riskAnchor: 50, riskCeiling: 70, companyLimit: 8, sectorLimit: 20, satelliteLimit: 10, riskPolicyLimit: 55 },
  Agresivo: { riskAnchor: 70, riskCeiling: 84, companyLimit: 10, sectorLimit: 25, satelliteLimit: 25, riskPolicyLimit: 70 },
};

const horizonMonths = { lt1: 6, '1to3': 24, '3to5': 48, '5to10': 90, gt10: 120 };
const liquidityRequired = { none: 25, small: 50, important: 75, almost_all: 100 };

const objectiveFit = {
  retirement: { liquidity: 40, stability: 70, growth: 100, satellite: 50 },
  purchase: { liquidity: 80, stability: 100, growth: 50, satellite: 10 },
  growth: { liquidity: 40, stability: 70, growth: 100, satellite: 60 },
  income: { liquidity: 50, stability: 100, growth: 70, satellite: 40 },
  reserve: { liquidity: 100, stability: 90, growth: 20, satellite: 0 },
  learn: { liquidity: 80, stability: 80, growth: 70, satellite: 40 },
  other: { liquidity: 70, stability: 70, growth: 70, satellite: 50 },
};

const catalog = {
  al30: { role: 'satellite', components: [95, 95, 70, 70, 100], minimumHorizonMonths: 36, liquidityScore: 58, economicCurrency: 'USD', issuerGroup: 'República Argentina', country: 'Argentina', assetClass: 'Soberano', structureCount: 1, dataQuality: .94, lookthrough: 1, duration: 2.03, minimum: { USD: 1, ARS: 1500 } },
  gd30: { role: 'satellite', components: [92, 93, 68, 65, 100], minimumHorizonMonths: 36, liquidityScore: 62, economicCurrency: 'USD', issuerGroup: 'República Argentina', country: 'Argentina', assetClass: 'Soberano', structureCount: 1, dataQuality: .94, lookthrough: 1, duration: 2.1, minimum: { USD: 1, ARS: 1500 } },
  ypfd: { role: 'satellite', components: [95, 60, 10, 50, 100], minimumHorizonMonths: 60, liquidityScore: 82, economicCurrency: 'mixed', issuerGroup: 'YPF', country: 'Argentina', assetClass: 'Acción', structureCount: 1, dataQuality: .95, lookthrough: 1, minimum: { ARS: 1000, USD: 1 } },
  ggal: { role: 'satellite', components: [90, 55, 10, 40, 100], minimumHorizonMonths: 60, liquidityScore: 84, economicCurrency: 'ARS', issuerGroup: 'Galicia', country: 'Argentina', assetClass: 'Acción', structureCount: 1, dataQuality: .93, lookthrough: 1, minimum: { ARS: 1000, USD: 1 } },
  pamp: { role: 'satellite', components: [88, 48, 12, 42, 100], minimumHorizonMonths: 60, liquidityScore: 83, economicCurrency: 'mixed', issuerGroup: 'Pampa Energía', country: 'Argentina', assetClass: 'Acción', structureCount: 1, dataQuality: .93, lookthrough: 1, minimum: { ARS: 1000, USD: 1 } },
  aapl: { role: 'satellite', components: [100, 38, 20, 25, 100], minimumHorizonMonths: 60, liquidityScore: 88, economicCurrency: 'USD', issuerGroup: 'Apple', country: 'Estados Unidos', assetClass: 'Acción', structureCount: 1, dataQuality: .97, lookthrough: 1, minimum: { ARS: 1000, USD: 1 } },
  ko: { role: 'satellite', components: [72, 22, 8, 22, 100], minimumHorizonMonths: 48, liquidityScore: 86, economicCurrency: 'USD', issuerGroup: 'Coca-Cola', country: 'Estados Unidos', assetClass: 'Acción', structureCount: 1, dataQuality: .96, lookthrough: 1, minimum: { ARS: 1000, USD: 1 } },
  spy: { role: 'growth', components: [100, 20, 10, 10, 40], minimumHorizonMonths: 60, liquidityScore: 92, economicCurrency: 'USD', issuerGroup: 'SPDR S&P 500', issuerExposure: evenExposure('SPY-emisor', 20), sectorExposure: { Tecnología: .30, Finanzas: .13, Salud: .12, Consumo: .20, Industria: .08, Energía: .04, Otros: .13 }, country: 'Estados Unidos', assetClass: 'Índice amplio', structureCount: 500, dataQuality: .98, lookthrough: .96, minimum: { ARS: 1000, USD: 1 } },
  ymcxo: { role: 'stability', components: [48, 55, 55, 55, 65], minimumHorizonMonths: 24, liquidityScore: 55, economicCurrency: 'USD', issuerGroup: 'YPF', country: 'Argentina', assetClass: 'Deuda corporativa', structureCount: 1, dataQuality: .92, lookthrough: 1, duration: 3.2, minimum: { USD: 10, ARS: 15000 } },
  fund: { role: 'stability', components: [28, 30, 35, 25, 20], minimumHorizonMonths: 12, liquidityScore: 75, economicCurrency: 'USD', issuerGroup: 'Horizonte Asset Management', issuerExposure: evenExposure('FHD-emisor', 10), sectorExposure: { Finanzas: .25, Energía: .20, Industria: .20, Soberano: .20, Otros: .15 }, country: 'Diversificado', assetClass: 'Fondo de renta fija', structureCount: 30, dataQuality: .9, lookthrough: .82, duration: 1.8, minimum: { USD: 1, ARS: 1500 } },
  mep: { role: 'liquidity', components: [20, 5, 0, 10, 30], minimumHorizonMonths: 0, liquidityScore: 90, economicCurrency: 'USD', issuerGroup: 'Conversión MEP', country: 'Argentina', assetClass: 'Moneda', structureCount: 1, dataQuality: .96, lookthrough: 1, minimum: { USD: 1, ARS: 1500 } },
  money: { role: 'liquidity', components: [5, 10, 2, 5, 15], minimumHorizonMonths: 0, liquidityScore: 95, economicCurrency: 'ARS', issuerGroup: 'Fondo Liquidez Pesos', issuerExposure: evenExposure('FCIP-emisor', 8), sectorExposure: { Bancario: .45, Soberano: .35, Otros: .20 }, country: 'Argentina', assetClass: 'Money market', structureCount: 20, dataQuality: .93, lookthrough: .9, minimum: { ARS: 1000, USD: 1 } },
};

const roleLabels = {
  liquidity: 'liquidez',
  stability: 'estabilidad',
  growth: 'crecimiento diversificado',
  satellite: 'complemento de la cartera',
};

export function assetModel(asset) {
  const stored = catalog[asset.id] || {};
  const components = stored.components || [50, 50, 50, 50, 50];
  const riskAsset = Math.round(
    .35 * components[0]
    + .25 * components[1]
    + .15 * components[2]
    + .15 * components[3]
    + .10 * components[4],
  );
  return {
    ...stored,
    id: asset.id,
    sector: asset.sector,
    available: stored.available !== false,
    role: stored.role || 'satellite',
    riskAsset,
    riskBand: riskAsset < 25 ? 'Muy bajo' : riskAsset < 45 ? 'Bajo' : riskAsset < 65 ? 'Medio' : riskAsset < 85 ? 'Alto' : 'Muy alto',
  };
}

function exposureVector(selectedAssets) {
  if (!selectedAssets.length) return { issuer: {}, sector: {}, country: {}, currency: {}, assetClass: {} };
  const weight = 1 / selectedAssets.length;
  return selectedAssets.reduce((result, asset) => {
    const model = assetModel(asset);
    [
      ['issuer', model.issuerGroup],
      ['sector', model.sector],
      ['country', model.country],
      ['currency', model.economicCurrency],
      ['assetClass', model.assetClass],
    ].forEach(([factor, value]) => {
      result[factor][value] = (result[factor][value] || 0) + weight;
    });
    return result;
  }, { issuer: {}, sector: {}, country: {}, currency: {}, assetClass: {} });
}

function diversificationFit(model, exposures) {
  const structural = model.structureCount >= 50 ? 100 : model.structureCount >= 20 ? 90 : model.structureCount >= 5 ? 75 : model.structureCount >= 2 ? 60 : 40;
  const overlap = 100 * (
    .35 * (exposures.issuer[model.issuerGroup] || 0)
    + .20 * (exposures.sector[model.sector] || 0)
    + .20 * (exposures.country[model.country] || 0)
    + .15 * (exposures.currency[model.economicCurrency] || 0)
    + .10 * (exposures.assetClass[model.assetClass] || 0)
  );
  return clamp(Math.round(structural - overlap));
}

function accessibilityFit(model, answers) {
  const contribution = answers?.contribution;
  if (contribution?.unsure || !Number(contribution?.amount)) return 50;
  const currency = contribution.currency || 'ARS';
  const minimum = model.minimum?.[currency];
  if (!minimum) return 50;
  const initial = answers?.initialAmount?.currency === currency ? Number(answers.initialAmount?.amount || 0) : 0;
  if (initial >= minimum) return 100;
  const months = Math.ceil(Math.max(0, minimum - initial) / Number(contribution.amount));
  return ({ 0: 100, 1: 85, 2: 65, 3: 40 })[months] ?? 0;
}

function currencyFit(model, goalCurrency, userHorizonMonths) {
  if (!goalCurrency || goalCurrency === 'undefined') return 70;
  if (model.economicCurrency === goalCurrency || model.economicCurrency === 'mixed') return 100;
  if (model.structureCount >= 20) return 80;
  if (userHorizonMonths > 60) return 50;
  if (userHorizonMonths >= 36) return 35;
  return 0;
}

const gateMessages = {
  G01: 'El movimiento y las pérdidas posibles superan el límite automático de tu perfil.',
  G02: 'En esta versión, un activo de riesgo muy alto se muestra para explorar pero no entra automáticamente.',
  G03: 'El tiempo en que pensás usar el dinero es menor al sugerido para este activo.',
  G04: 'Podrías necesitar casi todo el dinero y este activo no ofrece la disponibilidad requerida.',
  G05: 'Podrías necesitar una parte importante y la disponibilidad de este activo no alcanza.',
  G06: 'El instrumento no está disponible dentro del universo operativo de esta demostración.',
  G07: 'Faltan datos esenciales o vigentes para presentarlo como compatible.',
  G09: 'Marcaste que este activo no te interesa en esta propuesta.',
};

const reasonCopy = {
  risk: 'su movimiento entra dentro del límite de tu perfil',
  horizon: 'podés dejar el dinero durante el tiempo sugerido',
  liquidity: 'su disponibilidad encaja con lo que respondiste',
  objective: 'cumple una función útil para tu objetivo',
  currency: 'su exposición monetaria es razonable para el objetivo',
  diversification: 'agrega una fuente distinta de resultado',
  accessibility: 'el monto o los aportes permiten acceder',
};

export function scoreCompatibility(asset, profileResult, options = {}) {
  const answers = profileResult?.answers || {};
  const profile = profileResult?.profile || {};
  const profileName = profile.profile;
  const policy = profilePolicy[profileName];
  const model = assetModel(asset);
  if (!policy) {
    return {
      assetId: asset.id,
      personalized: false,
      eligible: null,
      eligibleForPortfolio: false,
      finalScore: null,
      orderScore: null,
      label: 'Sin perfil',
      conciseText: 'Podés explorar este activo. Completá el recorrido si querés ver cómo encaja con tu situación.',
      components: null,
      gates: [],
      model,
      version: COMPATIBILITY_VERSION,
    };
  }

  const userHorizon = horizonMonths[answers.horizon] || 0;
  const requiredLiquidity = liquidityRequired[answers.liquidity] ?? 25;
  const exposures = exposureVector(options.currentAssets || []);
  const horizonRatio = model.minimumHorizonMonths === 0 ? Number.POSITIVE_INFINITY : userHorizon / model.minimumHorizonMonths;
  const components = {
    risk: clamp(100 - 2 * Math.max(0, model.riskAsset - policy.riskAnchor)),
    horizon: model.minimumHorizonMonths === 0 ? 100 : horizonRatio < 1 ? 0 : horizonRatio < 1.5 ? 70 : 100,
    liquidity: clamp(100 - 2 * Math.max(0, requiredLiquidity - model.liquidityScore)),
    objective: (objectiveFit[answers.goal] || objectiveFit.other)[model.role],
    currency: currencyFit(model, options.goalCurrency, userHorizon),
    diversification: diversificationFit(model, exposures),
    accessibility: accessibilityFit(model, answers),
  };

  const gates = [];
  if (model.riskAsset > policy.riskCeiling) gates.push('G01');
  if (model.riskAsset >= 85) gates.push('G02');
  if (userHorizon < model.minimumHorizonMonths) gates.push('G03');
  if (answers.liquidity === 'almost_all' && model.liquidityScore < 80) gates.push('G04');
  if (answers.liquidity === 'important' && model.liquidityScore < 60) gates.push('G05');
  if (!model.available) gates.push('G06');
  if (model.dataQuality < .6) gates.push('G07');
  if (options.excluded) gates.push('G09');

  const weights = { risk: .30, horizon: .15, liquidity: .15, objective: .15, currency: .10, diversification: .10, accessibility: .05 };
  const rawScore = Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0);
  const penalties = [];
  if (model.lookthrough < .8) penalties.push({ code: 'P02', points: 10, text: 'La cobertura de exposiciones indirectas es menor a 80%.' });
  if (model.dataQuality < .8) penalties.push({ code: 'P03', points: 15, text: 'La calidad de datos tiene incertidumbre relevante.' });
  const penaltyTotal = Math.min(30, penalties.reduce((sum, item) => sum + item.points, 0));
  const finalScore = Math.round(clamp(rawScore - penaltyTotal));
  const eligible = gates.length === 0;
  const eligibleForPortfolio = eligible && finalScore >= 65;
  const label = !eligible ? 'No elegible automáticamente' : finalScore >= 80 ? 'Compatibilidad alta' : finalScore >= 65 ? 'Compatible' : finalScore >= 50 ? 'Condicional' : 'Compatibilidad baja';
  const sectorBonus = profile.sectors?.includes(asset.sector) ? 4 : 0;
  const orderedReasons = Object.keys(weights)
    .sort((first, second) => components[second] * weights[second] - components[first] * weights[first]);
  const positives = orderedReasons.filter((key) => components[key] >= 70).slice(0, 2);
  const weakest = Object.keys(components).sort((first, second) => components[first] - components[second])[0];
  const conciseText = gates.length
    ? gateMessages[gates[0]]
    : positives.length
      ? `Encaja porque ${positives.map((key) => reasonCopy[key]).join(' y ')}.`
      : `La coincidencia es parcial; el principal límite está en ${reasonCopy[weakest]}.`;

  return {
    assetId: asset.id,
    personalized: true,
    eligible,
    eligibleForPortfolio,
    gates,
    gateExplanations: gates.map((code) => gateMessages[code]),
    components,
    rawScore: Math.round(rawScore),
    penalties,
    penaltyTotal,
    finalScore,
    orderScore: finalScore + sectorBonus,
    sectorBonus,
    label,
    conciseText,
    expandedText: [
      ...positives.map((key) => reasonCopy[key]),
      `Principal límite: ${reasonCopy[weakest]}`,
      ...(penalties.map((item) => item.text)),
    ],
    model,
    version: COMPATIBILITY_VERSION,
  };
}

export function buildCompatibilityQueue(allAssets, profileResult, assetStates = {}, options = {}) {
  const currentAssets = allAssets.filter((asset) => assetStates[asset.id] === 'portfolio');
  const targets = profileResult?.profile?.allocation || {};
  const occupiedRoles = currentAssets.reduce((result, asset) => {
    const role = assetModel(asset).role;
    result[role] = (result[role] || 0) + 1;
    return result;
  }, {});

  return allAssets.map((asset) => {
    const compatibility = scoreCompatibility(asset, profileResult, {
      ...options,
      currentAssets: currentAssets.filter((item) => item.id !== asset.id),
      excluded: false,
    });
    const missingFunctionBonus = compatibility.personalized
      && Number(targets[compatibility.model.role] || 0) > 0
      && !occupiedRoles[compatibility.model.role] ? 6 : 0;
    return { asset, compatibility: { ...compatibility, missingFunctionBonus, orderScore: (compatibility.orderScore ?? 0) + missingFunctionBonus } };
  }).sort((first, second) => {
    const group = (item) => !item.compatibility.personalized ? 1
      : item.compatibility.eligibleForPortfolio ? 0
      : item.compatibility.eligible && item.compatibility.finalScore >= 50 ? 1
      : item.compatibility.eligible ? 2 : 3;
    return group(first) - group(second)
      || (second.compatibility.orderScore ?? 0) - (first.compatibility.orderScore ?? 0)
      || second.compatibility.model.dataQuality - first.compatibility.model.dataQuality
      || first.asset.id.localeCompare(second.asset.id);
  });
}

function normalizeWeights(positions) {
  if (!positions.length) return positions;
  const targetTotal = Math.round(positions.reduce((sum, position) => sum + position.weight, 0));
  const rounded = positions.map((position) => ({ ...position, weight: Math.max(0, Math.round(position.weight)) }));
  const difference = targetTotal - rounded.reduce((sum, position) => sum + position.weight, 0);
  const recipient = rounded.find((position) => position.role === 'liquidity') || rounded[0];
  recipient.weight += difference;
  return rounded;
}

function hhi(positions, factor, exposureField) {
  const totals = positions.reduce((result, position) => {
    const vector = position.model[exposureField];
    if (vector) {
      Object.entries(vector).forEach(([key, share]) => {
        result[key] = (result[key] || 0) + position.weight / 100 * share;
      });
      return result;
    }
    const key = position.model[factor] || 'Sin clasificar';
    result[key] = (result[key] || 0) + position.weight / 100;
    return result;
  }, {});
  return Number(Object.values(totals).reduce((sum, exposure) => sum + exposure ** 2, 0).toFixed(3));
}

export function buildPortfolioProposal(allAssets, profileResult, assetStates = {}, options = {}) {
  const profile = profileResult?.profile;
  if (!profile?.profile) return null;
  const policy = profilePolicy[profile.profile];
  const queue = buildCompatibilityQueue(allAssets, profileResult, assetStates, options);
  const manuallySelected = options.selectedOnly
    ? queue.filter(({ asset }) => assetStates[asset.id] === 'portfolio')
    : [];
  const automaticCandidates = queue.filter(({ compatibility }) => compatibility.eligibleForPortfolio);
  const manualExceptions = manuallySelected.filter(({ compatibility }) => !compatibility.eligibleForPortfolio);
  const source = options.selectedOnly ? manuallySelected : automaticCandidates;
  const targetCounts = { liquidity: 1, stability: 2, growth: 2, satellite: 1 };
  const selected = [];
  Object.keys(targetCounts).forEach((role) => {
    const roleCandidates = source.filter(({ compatibility }) => compatibility.model.role === role);
    const chosen = [];
    for (const candidate of roleCandidates) {
      if (chosen.length >= targetCounts[role]) break;
      const repeatedIssuer = chosen.some((item) => item.compatibility.model.issuerGroup === candidate.compatibility.model.issuerGroup);
      const hasAlternative = roleCandidates.some((item) => !chosen.includes(item) && !chosen.some((chosenItem) => chosenItem.compatibility.model.issuerGroup === item.compatibility.model.issuerGroup));
      if (repeatedIssuer && hasAlternative) continue;
      chosen.push(candidate);
    }
    selected.push(...chosen);
  });

  const targets = { ...(profile.allocation || { liquidity: 15, stability: 35, growth: 40, satellite: 10 }) };
  const hasRole = (role) => selected.some(({ compatibility }) => compatibility.model.role === role);
  const redistributions = [];
  const moveTarget = (from, destinations) => {
    if (!targets[from] || hasRole(from)) return;
    const destination = destinations.find(hasRole);
    if (!destination) return;
    targets[destination] += targets[from];
    redistributions.push(`${targets[from]} puntos de ${roleLabels[from]} pasaron a ${roleLabels[destination]} porque no había un candidato apto.`);
    targets[from] = 0;
  };
  moveTarget('satellite', ['growth', 'stability', 'liquidity']);
  moveTarget('growth', ['stability', 'liquidity']);
  moveTarget('stability', ['liquidity']);
  moveTarget('liquidity', ['stability']);

  let positions = selected.map(({ asset, compatibility }) => {
    const peers = selected.filter((item) => item.compatibility.model.role === compatibility.model.role);
    const qualities = peers.map((item) => (item.compatibility.finalScore / 100) ** 2 * item.compatibility.model.dataQuality);
    const quality = (compatibility.finalScore / 100) ** 2 * compatibility.model.dataQuality;
    const roleTotal = qualities.reduce((sum, value) => sum + value, 0) || 1;
    return {
      asset,
      assetId: asset.id,
      role: compatibility.model.role,
      compatibility,
      model: compatibility.model,
      manualException: !compatibility.eligibleForPortfolio,
      weight: targets[compatibility.model.role] * quality / roleTotal,
    };
  });

  const bindingConstraints = [];
  let excess = 0;
  positions = positions.map((position) => {
    const diversified = position.model.structureCount >= 20;
    const roleCap = position.role === 'satellite' ? policy.satelliteLimit : 100;
    const companyCap = diversified || ['Moneda', 'Money market', 'Fondo de renta fija', 'Índice amplio'].includes(position.model.assetClass) ? 50 : policy.companyLimit;
    const manualCap = position.manualException ? Math.min(5, companyCap) : companyCap;
    const cap = Math.min(50, roleCap, manualCap);
    if (position.weight <= cap) return position;
    excess += position.weight - cap;
    bindingConstraints.push(`${position.asset.symbol} se limitó a ${cap}% para controlar ${position.manualException ? 'una excepción manual' : 'la concentración por empresa o función'}.`);
    return { ...position, weight: cap };
  });

  const recipients = [...positions].sort((first, second) => {
    const order = { liquidity: 0, stability: 1, growth: 2, satellite: 3 };
    return order[first.role] - order[second.role] || second.compatibility.finalScore - first.compatibility.finalScore;
  });
  for (const recipient of recipients) {
    if (excess <= .001) break;
    const index = positions.findIndex((position) => position.assetId === recipient.assetId);
    const cap = recipient.model.structureCount >= 20 ? 50 : recipient.role === 'satellite' ? policy.satelliteLimit : policy.companyLimit;
    const room = Math.max(0, cap - positions[index].weight);
    const moved = Math.min(room, excess);
    positions[index].weight += moved;
    excess -= moved;
  }
  if (excess > .001) {
    const liquidIndex = positions.findIndex((position) => position.role === 'liquidity');
    if (liquidIndex >= 0) {
      positions[liquidIndex].weight += excess;
      redistributions.push(`${Math.round(excess)} puntos restantes pasaron a liquidez.`);
      excess = 0;
    }
  }
  positions = normalizeWeights(positions);
  const unallocatedWeight = Math.max(0, 100 - positions.reduce((sum, position) => sum + position.weight, 0));

  const riskPolicy = Math.round(positions.reduce((sum, position) => sum + position.weight / 100 * position.model.riskAsset, 0));
  const issuerHhi = hhi(positions, 'issuerGroup', 'issuerExposure');
  const sectorHhi = hhi(positions, 'sector', 'sectorExposure');
  const dataCoverage = positions.length
    ? Math.round(100 * positions.reduce((sum, position) => sum + position.weight / 100 * Math.min(position.model.dataQuality, position.model.lookthrough), 0))
    : 0;
  const equityWeight = positions.filter((position) => ['growth', 'satellite'].includes(position.role)).reduce((sum, position) => sum + position.weight, 0);
  const rateShock = positions.filter((position) => position.model.duration).reduce((sum, position) => sum - position.weight / 100 * position.model.duration * .02, 0);
  const largestIssuer = positions.reduce((largest, position) => position.weight > (largest?.weight || 0) ? position : largest, null);
  const warnings = [
    manualExceptions.length ? `${manualExceptions.map((item) => item.asset.symbol).join(', ')} no entraría automáticamente; aparece como elección manual con peso limitado.` : null,
    unallocatedWeight > 0 ? `${unallocatedWeight}% todavía no tiene un activo compatible asignado. Completá las funciones faltantes antes de confirmar.` : null,
    riskPolicy > policy.riskPolicyLimit ? `El riesgo conjunto ${riskPolicy} supera el máximo ${policy.riskPolicyLimit} del perfil.` : null,
    issuerHhi > .25 ? 'La concentración por emisor es alta; conviene revisar sustituciones.' : issuerHhi > .15 ? 'La concentración por emisor es media.' : null,
    sectorHhi > .25 ? 'La concentración por sector es alta; conviene revisar sustituciones.' : sectorHhi > .15 ? 'La concentración por sector es media.' : null,
    dataCoverage < 80 ? 'La cobertura de datos es menor a 80%; Prisma no publica una volatilidad precisa.' : 'La volatilidad histórica no se publica en la maqueta porque no hay una matriz de covarianzas conectada.',
    options.goalCurrency === 'undefined' || !options.goalCurrency ? 'Falta definir en qué moneda se usará el dinero; la coincidencia monetaria se mantiene neutral.' : null,
  ].filter(Boolean);

  return {
    version: PORTFOLIO_VERSION,
    compatibilityVersion: COMPATIBILITY_VERSION,
    targets,
    positions,
    unallocatedWeight,
    manualExceptions: manualExceptions.map((item) => item.asset.id),
    candidateIds: automaticCandidates.map((item) => item.asset.id),
    selectedIds: positions.map((position) => position.assetId),
    bindingConstraints,
    redistributions,
    riskPolicy,
    riskPolicyLimit: policy.riskPolicyLimit,
    issuerHhi,
    sectorHhi,
    dataCoverage,
    covarianceVolatility: null,
    stressResults: [
      { id: 'equities', label: 'Acciones -20%', impact: Number((-equityWeight * .20).toFixed(1)), explanation: 'Aplica una caída educativa de 20% a crecimiento y complementos; no indica probabilidad.' },
      { id: 'rates', label: 'Tasas +2 puntos', impact: Number((rateShock * 100).toFixed(1)), explanation: 'Usa duration modificada para la renta fija disponible; es una aproximación.' },
      { id: 'issuer', label: `Problema en ${largestIssuer?.model.issuerGroup || 'un emisor'}`, impact: Number((-Math.min(30, largestIssuer?.weight || 0) * .30).toFixed(1)), explanation: 'Aplica una pérdida parametrizada a la mayor exposición directa; no afirma incumplimiento.' },
    ],
    warnings,
    solverStatus: excess <= .001 ? 'ok' : 'constraint_solver_fallback',
  };
}

export function roleLabel(role) {
  return roleLabels[role] || role;
}
