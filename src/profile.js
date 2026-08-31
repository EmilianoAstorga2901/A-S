export const profileQuestions = [
  {
    key: 'experience',
    group: 'optional',
    title: '¿Qué experiencia tenés invirtiendo?',
    helper: 'Esto solo cambia las palabras y el nivel de detalle que usa Prisma. No modifica tu perfil de riesgo.',
    whyWeAsk: 'Si nunca invertiste, Prisma evita términos técnicos o los explica en el momento. Si ya tenés experiencia, puede mostrar información más directa y avanzada.',
    options: [
      ['none', 'Nunca invertí'],
      ['low', 'Hice algunas inversiones'],
      ['medium', 'Invierto con cierta frecuencia'],
      ['high', 'Tengo experiencia avanzada'],
    ],
  },
  {
    key: 'goal',
    group: 'essential',
    title: '¿Cuál es tu objetivo principal?',
    helper: 'Esto personaliza la cartera, pero no aumenta tu nivel de riesgo.',
    options: [
      ['retirement', 'Jubilación'],
      ['purchase', 'Compra importante o vivienda'],
      ['growth', 'Hacer crecer mis ahorros'],
      ['income', 'Generar ingresos periódicos'],
      ['reserve', 'Proteger una reserva'],
      ['learn', 'Aprender y comenzar'],
      ['other', 'Otro objetivo'],
    ],
  },
  {
    key: 'purchaseType',
    group: 'essential',
    when: { key: 'goal', equals: 'purchase' },
    title: '¿Qué compra importante querés planificar?',
    helper: 'Esto elige un vector de objetivo más preciso. Los límites de seguridad siguen dependiendo de tu plazo, liquidez, respaldo y tolerancia.',
    whyWeAsk: 'Una vivienda y un auto suelen tener plazos y necesidades de liquidez diferentes. Prisma usa presets distintos, siempre subordinados a tu perfil de riesgo.',
    options: [
      ['home', 'Vivienda'],
      ['car', 'Auto'],
      ['education', 'Educación'],
      ['other_purchase', 'Otra compra importante'],
    ],
  },
  {
    key: 'horizon',
    group: 'essential',
    title: '¿Cuándo esperás utilizar este dinero?',
    helper: 'El tiempo que falta hasta usarlo limita cuánto puede subir y bajar una cartera recomendada.',
    copy: {
      simple: {
        title: '¿En cuánto tiempo pensás usar este dinero?',
        helper: 'A este tiempo también se lo llama plazo u horizonte. Si lo vas a necesitar pronto, Prisma prioriza opciones que varíen menos.',
      },
      intermediate: {
        title: '¿Cuál es el plazo de esta inversión?',
        helper: 'El plazo, también llamado horizonte, limita cuánto riesgo puede asumir la cartera.',
      },
      advanced: {
        title: '¿Cuál es tu horizonte de inversión?',
        helper: 'El horizonte funciona como una restricción de capacidad y liquidez para la cartera.',
      },
    },
    whyWeAsk: 'No suponemos que un plazo largo te vuelva agresivo. Solo indica cuánto tiempo tendrías para atravesar una caída sin vender.',
    options: [
      ['lt1', 'Menos de 1 año'],
      ['1to3', 'Entre 1 y 3 años'],
      ['3to5', 'Entre 3 y 5 años'],
      ['5to10', 'Entre 5 y 10 años'],
      ['gt10', 'Más de 10 años'],
    ],
  },
  {
    key: 'liquidity',
    group: 'essential',
    title: 'Ante un imprevisto, ¿podrías necesitar retirarlo antes?',
    copy: {
      simple: {
        title: 'Si pasa algo inesperado, ¿cuánto de este dinero podrías necesitar antes?',
        helper: 'Queremos evitar que tengas que vender una inversión en un mal momento para pagar un gasto urgente.',
      },
      intermediate: {
        title: 'Ante un imprevisto, ¿qué parte podrías necesitar retirar antes?',
        helper: 'Esta respuesta ayuda a reservar dinero disponible y a no asumir más riesgo del que tu liquidez permite.',
      },
    },
    whyWeAsk: 'La posibilidad de necesitar el dinero antes reduce la capacidad de asumir variaciones. No cambia cuánto riesgo te gusta, sino cuánto podés afrontar.',
    options: [
      ['none', 'No, podría mantenerlo'],
      ['small', 'Podría necesitar una parte pequeña'],
      ['important', 'Podría necesitar una parte importante'],
      ['almost_all', 'Probablemente necesitaría casi todo'],
    ],
  },
  {
    key: 'emergencyFund',
    group: 'essential',
    title: '¿Considerás suficiente tu fondo de emergencia?',
    helper: 'Es dinero disponible para gastos imprevistos y separado de lo que vas a invertir.',
    copy: {
      simple: {
        title: '¿Tenés dinero separado para una emergencia?',
        helper: 'Por ejemplo, para una reparación, un problema de salud o un mes con menos ingresos. No cuentes el dinero que querés invertir ahora.',
      },
      intermediate: {
        title: '¿Tu fondo de emergencia es suficiente?',
        helper: 'Pensá en un respaldo disponible y separado de esta inversión para cubrir gastos inesperados.',
      },
    },
    whyWeAsk: 'Sin un respaldo separado, podrías verte obligado a vender una inversión justo cuando bajó. Por eso esta respuesta nunca aumenta el riesgo: solo puede volver la propuesta más prudente.',
    options: [
      ['yes', 'Sí'],
      ['partial', 'Parcialmente'],
      ['no', 'No'],
      ['unsure', 'No estoy seguro'],
    ],
    optionsByLevel: {
      simple: [
        ['yes', 'Sí, tengo un respaldo suficiente'],
        ['partial', 'Tengo algo, pero no sé si alcanza'],
        ['no', 'No, todavía no'],
        ['unsure', 'No sé cuánto debería tener'],
      ],
    },
  },
  {
    key: 'debts',
    group: 'essential',
    title: '¿Cuál es tu situación respecto de tus deudas?',
    helper: 'Las deudas problemáticas activan una advertencia; no se usan para inflar el perfil.',
    options: [
      ['none', 'No tengo'],
      ['controlled', 'Controladas'],
      ['costly', 'Costosas pero al día'],
      ['late', 'Atrasadas o difíciles de pagar'],
      ['unsure', 'No estoy seguro'],
    ],
  },
  {
    key: 'income',
    group: 'essential',
    title: '¿Cómo describirías tus ingresos y capacidad de ahorro?',
    copy: {
      simple: {
        title: '¿Cómo son tus ingresos y qué tan seguido podés ahorrar?',
        helper: 'No importa cuánto ganás. Queremos saber si podrías seguir aportando sin necesitar sacar la inversión.',
      },
      intermediate: {
        title: '¿Cómo describirías tus ingresos y capacidad de ahorro?',
        helper: 'La regularidad ayuda a estimar si podés sostener aportes y evitar retiros anticipados.',
      },
    },
    whyWeAsk: 'No preguntamos el total de tus ahorros para premiar a quien tiene más. Medimos si los ingresos y el ahorro son suficientemente estables para sostener la estrategia.',
    options: [
      ['stable_regular', 'Estables y ahorro regularmente'],
      ['stable_irregular', 'Estables pero ahorro irregularmente'],
      ['variable', 'Variables pero manejables'],
      ['difficulties', 'Actualmente tengo dificultades'],
    ],
  },
  {
    key: 'reaction',
    group: 'essential',
    title: 'Si tu inversión cayera temporalmente 20%, ¿qué harías?',
    helper: 'No hay una respuesta correcta. Prisma usa la opción más prudente junto con tu pérdida tolerable.',
    options: [
      ['sell_all', 'Vendería todo'],
      ['sell_part', 'Vendería una parte'],
      ['hold', 'Mantendría la inversión'],
      ['buy_more', 'Invertiría más'],
    ],
  },
  {
    key: 'lossTolerance',
    group: 'essential',
    title: '¿Qué pérdida temporal máxima tolerarías?',
    options: [
      [5, 'Hasta 5%'],
      [10, 'Hasta 10%'],
      [20, 'Hasta 20%'],
      [30, '30% o más'],
    ],
  },
  {
    key: 'contribution',
    group: 'essential',
    type: 'money',
    title: '¿Cuánto pensás aportar mensualmente?',
    helper: 'El monto y la moneda sirven para revisar mínimos operativos. No aumentan el perfil de riesgo.',
    allowUnsure: true,
  },
  {
    key: 'age',
    group: 'optional',
    type: 'number',
    title: '¿Qué edad tenés?',
    helper: 'Opcional. Solo adapta el contexto y la forma de explicar; no aumenta el riesgo.',
    placeholder: 'Ejemplo: 22',
    min: 18,
    max: 100,
  },
  {
    key: 'initialAmount',
    group: 'optional',
    type: 'money',
    title: '¿Con qué monto inicial querés comenzar?',
    helper: 'Opcional. Ayuda a revisar mínimos y cantidades comprables.',
  },
  {
    key: 'products',
    group: 'optional',
    type: 'multi',
    title: '¿Qué productos conocés?',
    helper: 'Opcional. Elegí todos los que reconozcas; conocerlos no habilita más riesgo.',
    options: [
      ['dollar', 'Dólar MEP'],
      ['funds', 'Fondos comunes'],
      ['bonds', 'Bonos'],
      ['corporate_bonds', 'Obligaciones negociables'],
      ['stocks', 'Acciones o CEDEARs'],
      ['crypto', 'Criptomonedas'],
      ['derivatives', 'Derivados'],
      ['none', 'Ninguno por ahora'],
    ],
  },
  {
    key: 'sectors',
    group: 'preference',
    type: 'sectors',
    title: '¿Hay sectores que te interesen o en los que confíes?',
    helper: 'Opcional. Podés elegir hasta 3. Solo ordena el descubrimiento: no cambia tu perfil ni los límites de seguridad.',
    options: [
      ['Tecnología', 'Tecnología'],
      ['Energía', 'Energía'],
      ['Bancos y finanzas', 'Bancos y finanzas'],
      ['Salud', 'Salud'],
      ['Consumo y alimentos', 'Consumo y alimentos'],
      ['Industria', 'Industria'],
      ['Inmobiliario', 'Inmobiliario'],
      ['Agro', 'Agro'],
      ['Otro', 'Otro'],
      ['none', 'No tengo preferencia'],
    ],
  },
];

export const explanationLevelForExperience = (experience) => {
  if (experience === 'high') return 'advanced';
  if (experience === 'medium') return 'intermediate';
  return 'simple';
};

export function questionForLevel(question, level) {
  const copy = question.copy?.[level] || question.copy?.simple || {};
  return {
    ...question,
    ...copy,
    options: question.optionsByLevel?.[level] || question.options,
  };
}

const scoreMaps = {
  horizon: { lt1: 0, '1to3': 35, '3to5': 55, '5to10': 75, gt10: 100 },
  liquidity: { none: 100, small: 75, important: 40, almost_all: 0 },
  emergencyFund: { yes: 100, partial: 60, unsure: 40, no: 0 },
  income: { stable_regular: 100, stable_irregular: 70, variable: 45, difficulties: 0 },
  reaction: { sell_all: 0, sell_part: 35, hold: 75, buy_more: 100 },
  lossTolerance: { 5: 10, 10: 35, 20: 65, 30: 90 },
};

const levelFromScore = (score) => (score < 40 ? 'Conservador' : score < 70 ? 'Moderado' : 'Agresivo');
const levelIndex = { Conservador: 0, Moderado: 1, Agresivo: 2 };

const allocationTable = {
  retirement: {
    Conservador: [30, 50, 20, 0], Moderado: [15, 35, 40, 10], Agresivo: [5, 15, 55, 25],
  },
  growth: {
    Conservador: [30, 50, 20, 0], Moderado: [15, 35, 40, 10], Agresivo: [5, 15, 55, 25],
  },
  purchase: {
    Conservador: [45, 45, 10, 0], Moderado: [30, 40, 25, 5], Agresivo: [20, 30, 35, 15],
  },
  income: {
    Conservador: [20, 60, 20, 0], Moderado: [10, 50, 30, 10], Agresivo: [5, 35, 40, 20],
  },
  reserve: {
    Conservador: [70, 30, 0, 0], Moderado: [70, 30, 0, 0], Agresivo: [70, 30, 0, 0],
  },
  learn: {
    Conservador: [40, 45, 15, 0], Moderado: [25, 40, 30, 5], Agresivo: [15, 30, 45, 10],
  },
  other: {
    Conservador: [30, 50, 20, 0], Moderado: [15, 35, 40, 10], Agresivo: [5, 15, 55, 25],
  },
};

const purchaseSubtypeAllocation = {
  car: {
    Conservador: [65, 30, 5, 0],
    Moderado: [50, 35, 15, 0],
    Agresivo: [40, 35, 20, 5],
  },
};

function normalizeAllocation(values) {
  const rounded = values.map((value) => Math.max(0, Math.round(value)));
  const difference = 100 - rounded.reduce((sum, value) => sum + value, 0);
  rounded[0] += difference;
  return { liquidity: rounded[0], stability: rounded[1], growth: rounded[2], satellite: rounded[3] };
}

function transfer(values, fromOrder, amount, targetIndex) {
  let remaining = Math.max(0, amount);
  for (const source of fromOrder) {
    if (!remaining) break;
    const moved = Math.min(values[source], remaining);
    values[source] -= moved;
    values[targetIndex] += moved;
    remaining -= moved;
  }
}

function applySafetyRules(base, answers) {
  const values = [...base];
  if (answers.horizon === 'lt1') return [80, 20, 0, 0];
  if (answers.horizon === '1to3') {
    transfer(values, [3, 2], values[3], 0);
    if (values[2] > 10) transfer(values, [2], values[2] - 10, 1);
    if (values[0] < 40) transfer(values, [2, 1], 40 - values[0], 0);
    if (values[0] + values[1] < 90) transfer(values, [2], 90 - values[0] - values[1], 1);
  }
  if (answers.horizon === '3to5') {
    if (values[3] > 5) transfer(values, [3], values[3] - 5, 1);
    if (values[0] < 20) transfer(values, [3, 2, 1], 20 - values[0], 0);
    if (values[0] + values[1] < 60) transfer(values, [3, 2], 60 - values[0] - values[1], 1);
  }
  if (answers.liquidity === 'almost_all') return [80, 20, 0, 0];
  if (answers.liquidity === 'important') {
    transfer(values, [3], values[3], 0);
    if (values[0] < 40) transfer(values, [2, 1], 40 - values[0], 0);
    if (values[0] + values[1] < 80) transfer(values, [2], 80 - values[0] - values[1], 1);
  }
  if (answers.liquidity === 'small' && values[0] < 20) transfer(values, [3, 2, 1], 20 - values[0], 0);
  if (answers.emergencyFund === 'no') {
    transfer(values, [3], values[3], 0);
    if (values[0] < 50) transfer(values, [2, 1], 50 - values[0], 0);
  }
  if (['partial', 'unsure'].includes(answers.emergencyFund) && values[0] < 30) {
    transfer(values, [3, 2, 1], 30 - values[0], 0);
  }
  return values;
}

export function allocationForProfile(profile, answers) {
  const goalKey = allocationTable[answers.goal] ? answers.goal : 'other';
  const subtype = answers.goal === 'purchase' ? purchaseSubtypeAllocation[answers.purchaseType] : null;
  const baseAllocation = subtype?.[profile] || allocationTable[goalKey][profile];
  return normalizeAllocation(applySafetyRules(baseAllocation, answers));
}

export function applyGoalVectorToProfile(profile, answers) {
  if (!profile?.profile) return profile;
  return {
    ...profile,
    allocation: allocationForProfile(profile.profile, answers),
    goal_vector_version: 'goal_vector_v1.0',
  };
}

export function calculateProfile(answers) {
  const capacityScore = Math.round(
    0.30 * scoreMaps.horizon[answers.horizon]
    + 0.30 * scoreMaps.liquidity[answers.liquidity]
    + 0.25 * scoreMaps.emergencyFund[answers.emergencyFund]
    + 0.15 * scoreMaps.income[answers.income],
  );
  const toleranceScore = Math.min(
    scoreMaps.reaction[answers.reaction],
    scoreMaps.lossTolerance[answers.lossTolerance],
  );
  const capacity = levelFromScore(capacityScore);
  const tolerance = levelFromScore(toleranceScore);
  let profile = levelIndex[capacity] <= levelIndex[tolerance] ? capacity : tolerance;
  const limits = [];
  const warnings = [];

  const capAt = (maximum, message) => {
    if (levelIndex[profile] > levelIndex[maximum]) profile = maximum;
    limits.push(message);
  };
  if (answers.horizon === 'lt1') capAt('Conservador', 'El plazo menor a un año exige una cartera conservadora.');
  if (answers.horizon === '1to3') capAt('Moderado', 'El horizonte de uno a tres años impide una cartera agresiva.');
  if (answers.emergencyFund === 'no') capAt('Conservador', 'Sin fondo de emergencia se prioriza liquidez y estabilidad.');
  if (answers.emergencyFund === 'partial') capAt('Moderado', 'El fondo de emergencia parcial limita el perfil a Moderado.');
  if (answers.emergencyFund === 'unsure') capAt('Moderado', 'Conviene revisar el fondo de emergencia antes de aumentar riesgo.');
  if (answers.liquidity === 'almost_all') capAt('Conservador', 'La necesidad probable de retirar casi todo exige alta liquidez.');
  if (answers.liquidity === 'important') capAt('Moderado', 'Necesitar una parte importante limita el perfil a Moderado.');
  if (answers.debts === 'costly') capAt('Moderado', 'La deuda costosa limita el perfil hasta comparar su costo efectivo.');
  if (answers.debts === 'late') capAt('Conservador', 'Las deudas atrasadas requieren estabilizar las finanzas antes de asumir riesgo.');

  if (answers.debts === 'costly') warnings.push('Tenés deuda costosa: compará su costo con el beneficio incierto de invertir.');
  if (answers.debts === 'late') warnings.push('Antes de invertir, revisá las deudas atrasadas o difíciles de pagar.');
  if (answers.debts === 'unsure') warnings.push('Aclarar tu situación de deuda puede cambiar las decisiones operativas.');

  const contradiction = capacity === tolerance
    ? 'Tu situación financiera y tu tolerancia a las fluctuaciones son coherentes con este perfil.'
    : levelIndex[capacity] > levelIndex[tolerance]
      ? 'Tu situación permitiría más variación de la que hoy te resulta cómoda. La propuesta respeta tu tolerancia.'
      : 'Te sentís dispuesto a asumir más riesgo del que tu situación permite. La propuesta prioriza tu capacidad.';

  const reasons = [
    `Tu capacidad objetiva es ${capacity.toLowerCase()} por plazo, liquidez, respaldo e ingresos.`,
    `Tu tolerancia emocional es ${tolerance.toLowerCase()} según tu reacción y pérdida máxima.`,
  ];
  if (limits.length) reasons.push(limits[0]);

  const allocation = allocationForProfile(profile, answers);
  const essentialKeys = ['goal', 'horizon', 'liquidity', 'emergencyFund', 'debts', 'income', 'reaction', 'lossTolerance', 'contribution'];
  const answeredCount = essentialKeys.filter((key) => {
    const value = answers[key];
    return key === 'contribution' ? Boolean(value?.unsure || Number(value?.amount) > 0) : value !== undefined && value !== null && value !== '';
  }).length;
  const coverage = Math.round(100 * answeredCount / essentialKeys.length);
  const contradictionGap = Math.abs(capacityScore - toleranceScore);
  const uncertaintyPenalty = (answers.emergencyFund === 'unsure' ? 10 : 0) + (answers.debts === 'unsure' ? 10 : 0);
  const confidence = Math.max(35, Math.min(90, coverage - uncertaintyPenalty - (contradictionGap >= 40 ? 10 : 0)));
  const requiresReview = ['costly', 'late', 'unsure'].includes(answers.debts)
    || answers.income === 'difficulties'
    || answers.emergencyFund === 'no'
    || contradictionGap >= 40;

  return {
    profile,
    capacity,
    tolerance,
    capacity_score: capacityScore,
    tolerance_score: toleranceScore,
    reasons,
    safety_limits: limits,
    warnings,
    contradiction,
    sectors: (answers.sectors || []).filter((sector) => sector !== 'none').slice(0, 3),
    allocation,
    explanation_level: explanationLevelForExperience(answers.experience),
    assessment_quality: { coverage, confidence, contradiction_gap: contradictionGap, requires_review: requiresReview, basis: 'Autodeclarado; no validado externamente' },
    rules_version: 'profile_v2.0',
    goal_vector_version: 'goal_vector_v1.0',
  };
}

export function toProfilePayload(answers) {
  const horizonYears = { lt1: 0.5, '1to3': 2, '3to5': 4, '5to10': 7, gt10: 12 }[answers.horizon];
  return {
    goal: answers.goal,
    horizon: answers.horizon,
    horizon_years: horizonYears,
    liquidity_need: answers.liquidity,
    emergency_fund: answers.emergencyFund,
    debt_status: answers.debts,
    income_stability: answers.income,
    loss_reaction: answers.reaction,
    loss_tolerance_pct: Number(answers.lossTolerance),
    monthly_contribution: answers.contribution?.unsure ? 0 : Number(answers.contribution?.amount || 0),
    contribution_currency: answers.contribution?.currency || 'ARS',
    contribution_unsure: Boolean(answers.contribution?.unsure),
    age: answers.age ? Number(answers.age) : null,
    initial_amount: answers.initialAmount?.amount ? Number(answers.initialAmount.amount) : null,
    experience: answers.experience || null,
    known_products: answers.products || [],
    sectors: (answers.sectors || []).filter((sector) => sector !== 'none'),
  };
}

export const goalLabels = Object.fromEntries(profileQuestions.find((question) => question.key === 'goal').options);
export const horizonLabels = Object.fromEntries(profileQuestions.find((question) => question.key === 'horizon').options);
