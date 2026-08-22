export const KNOWLEDGE_VERSION = 'knowledge_v1.0';

export const knowledgeDimensions = {
  risk: 'Riesgo y variaciones',
  diversification: 'Diversificación',
  liquidity: 'Liquidez',
  inflation_fx: 'Inflación y moneda',
  instruments: 'Instrumentos',
  costs: 'Costos e impuestos',
};

const option = (value, label, score) => [value, label, score];
const unknown = option('unknown', 'No sé / prefiero que me lo expliquen', null);

export const knowledgeQuestionBank = [
  {
    id: 'gate-risk-div-1', stage: 'gateway', group: 'risk_diversification', dimensions: ['risk', 'diversification'],
    title: 'Una cartera tiene una sola acción que subió mucho. ¿Qué afirmación es más prudente?',
    helper: 'Elegí lo que harías con la información disponible; no se evalúa memoria técnica.',
    options: [
      option('a', 'Como ya subió, ahora es necesariamente menos riesgosa', 0),
      option('b', 'Puede seguir subiendo, pero depender de una sola empresa concentra el riesgo', 100),
      option('c', 'Una acción conocida elimina el riesgo de pérdida', 10),
      unknown,
    ],
    explanation: 'Una buena historia de rendimiento no elimina la concentración. Diversificar reduce dependencias, aunque no garantiza ganancias.',
  },
  {
    id: 'gate-risk-div-2', stage: 'gateway', group: 'risk_diversification', dimensions: ['risk', 'diversification'],
    title: 'Dos carteras rindieron lo mismo el último año. ¿Eso significa que tuvieron el mismo riesgo?',
    helper: 'Pensá qué información falta para comparar.',
    options: [
      option('a', 'Sí, el rendimiento final resume todo', 0),
      option('b', 'No; habría que mirar caídas, variaciones y concentración', 100),
      option('c', 'Sí, siempre que ambas tengan acciones', 10),
      unknown,
    ],
    explanation: 'Un mismo resultado puede haberse alcanzado con recorridos y riesgos muy diferentes.',
  },
  {
    id: 'gate-liquidity-instruments-1', stage: 'gateway', group: 'liquidity_instruments', dimensions: ['liquidity', 'instruments'],
    title: 'Podrías necesitar el dinero en tres meses. ¿Qué dato es clave antes de elegir una inversión?',
    helper: 'No hace falta conocer nombres de productos.',
    options: [
      option('a', 'Qué tan fácil es venderla y cuánto puede variar al hacerlo', 100),
      option('b', 'Solo cuánto rindió el año pasado', 10),
      option('c', 'Si aparece mucho en redes sociales', 0),
      unknown,
    ],
    explanation: 'Cuando el plazo es corto importan la disponibilidad, los tiempos de rescate y la posible pérdida al vender.',
  },
  {
    id: 'gate-liquidity-instruments-2', stage: 'gateway', group: 'liquidity_instruments', dimensions: ['liquidity', 'instruments'],
    title: 'Un bono y una acción pueden mostrar un precio todos los días. ¿Por eso funcionan igual?',
    helper: 'Buscamos reconocer la lógica general de cada instrumento.',
    options: [
      option('a', 'Sí, si cotizan en la misma moneda', 10),
      option('b', 'No; uno representa deuda y la otra una participación en una empresa', 100),
      option('c', 'Sí, porque ambos garantizan recuperar el capital', 0),
      unknown,
    ],
    explanation: 'Que dos activos coticen no los vuelve equivalentes: tienen derechos, riesgos y fuentes de resultado diferentes.',
  },
  {
    id: 'gate-inflation-costs-1', stage: 'gateway', group: 'inflation_costs', dimensions: ['inflation_fx', 'costs'],
    title: 'Una inversión ganó 8%, pero precios y costos subieron más. ¿Qué puede pasar con tu poder de compra?',
    helper: 'Pensá en lo que realmente podrías comprar al final.',
    options: [
      option('a', 'Puede bajar aunque el saldo nominal haya subido', 100),
      option('b', 'Siempre sube porque el rendimiento fue positivo', 0),
      option('c', 'No cambia si la app muestra el número en verde', 0),
      unknown,
    ],
    explanation: 'El resultado nominal puede ser positivo y, después de inflación, costos e impuestos, perder poder de compra.',
  },
  {
    id: 'gate-inflation-costs-2', stage: 'gateway', group: 'inflation_costs', dimensions: ['inflation_fx', 'costs'],
    title: 'Un activo dice “USD” en su referencia. ¿Eso garantiza que sea igual a tener dólares disponibles?',
    helper: 'Considerá moneda, precio y forma de cobro.',
    options: [
      option('a', 'Sí, cualquier referencia USD es efectivo', 0),
      option('b', 'No; puede tener riesgo de precio, emisor, conversión y costos', 100),
      option('c', 'Sí, siempre que se compre desde Argentina', 10),
      unknown,
    ],
    explanation: 'La moneda de referencia no elimina el riesgo del instrumento ni asegura disponibilidad inmediata en dólares.',
  },

  {
    id: 'risk-1', stage: 'adaptive', dimension: 'risk', difficulty: 1,
    title: 'Si una inversión puede dar un resultado alto, ¿qué suele ser razonable revisar?',
    options: [option('a', 'Qué pérdidas o variaciones podría implicar', 100), option('b', 'Solo el mejor escenario', 0), option('c', 'Nada, porque mayor retorno elimina el riesgo', 0), unknown],
    explanation: 'El potencial de retorno debe leerse junto con las pérdidas posibles, el plazo y la incertidumbre.',
  },
  {
    id: 'risk-2', stage: 'adaptive', dimension: 'risk', difficulty: 2,
    title: 'Una caída temporal de 20% requiere después una suba de…',
    options: [option('a', '20% para volver al mismo punto', 30), option('b', '25% para volver al mismo punto', 100), option('c', '10% porque la pérdida ya ocurrió', 0), unknown],
    explanation: 'Si 100 baja a 80, necesita subir 20 sobre 80: eso equivale a 25%.',
  },
  {
    id: 'risk-3', stage: 'adaptive', dimension: 'risk', difficulty: 2,
    title: '¿Qué describe mejor la volatilidad?',
    options: [option('a', 'Cuánto y con qué frecuencia varía un precio', 100), option('b', 'La pérdida máxima garantizada', 10), option('c', 'La rentabilidad futura esperada', 0), unknown],
    explanation: 'La volatilidad describe variaciones históricas; no predice por sí sola el próximo movimiento.',
  },
  {
    id: 'risk-4', stage: 'adaptive', dimension: 'risk', difficulty: 3,
    title: '¿Por qué un plazo largo no convierte automáticamente a alguien en agresivo?',
    options: [option('a', 'Porque también importan liquidez, respaldo y tolerancia', 100), option('b', 'Porque el plazo nunca importa', 0), option('c', 'Porque toda inversión larga es conservadora', 0), unknown],
    explanation: 'El plazo amplía posibilidades, pero no reemplaza las demás restricciones de capacidad y tolerancia.',
  },

  {
    id: 'diversification-1', stage: 'adaptive', dimension: 'diversification', difficulty: 1,
    title: 'Tener diez acciones del mismo sector, ¿garantiza buena diversificación?',
    options: [option('a', 'Sí, porque son diez símbolos', 20), option('b', 'No; pueden depender del mismo riesgo sectorial', 100), option('c', 'Sí, si todas subieron antes', 0), unknown],
    explanation: 'La cantidad de posiciones no alcanza: importa de qué factores, emisores y sectores dependen.',
  },
  {
    id: 'diversification-2', stage: 'adaptive', dimension: 'diversification', difficulty: 2,
    title: '¿Qué concentración conviene mirar además del peso de cada activo?',
    options: [option('a', 'Emisor, sector y moneda', 100), option('b', 'Solo el color del gráfico', 0), option('c', 'Solo cuántas compras hiciste', 10), unknown],
    explanation: 'Dos activos diferentes pueden exponer a la misma empresa, sector, país o moneda.',
  },
  {
    id: 'diversification-3', stage: 'adaptive', dimension: 'diversification', difficulty: 2,
    title: 'Un fondo amplio suele diversificar más que una sola acción, pero…',
    options: [option('a', 'No elimina el riesgo de mercado ni otros riesgos', 100), option('b', 'Garantiza ganancias', 0), option('c', 'No puede bajar de precio', 0), unknown],
    explanation: 'Diversificar reduce riesgos específicos; no vuelve segura ni rentable a una cartera por definición.',
  },
  {
    id: 'diversification-4', stage: 'adaptive', dimension: 'diversification', difficulty: 3,
    title: 'Dos fondos con nombres distintos tienen muchas posiciones iguales. ¿Qué implica?',
    options: [option('a', 'La diversificación real puede ser menor de lo que parece', 100), option('b', 'El riesgo se divide exactamente por dos', 10), option('c', 'No importa mientras sean fondos', 0), unknown],
    explanation: 'Para medir diversificación importa mirar las exposiciones subyacentes, no solo los nombres.',
  },

  {
    id: 'liquidity-1', stage: 'adaptive', dimension: 'liquidity', difficulty: 1,
    title: '¿Qué significa que un activo sea líquido?',
    options: [option('a', 'Que suele poder venderse con rapidez y sin perder demasiado por la operación', 100), option('b', 'Que nunca baja', 0), option('c', 'Que paga intereses', 10), unknown],
    explanation: 'Liquidez combina facilidad, tiempo y costo de convertir una posición en dinero disponible.',
  },
  {
    id: 'liquidity-2', stage: 'adaptive', dimension: 'liquidity', difficulty: 2,
    title: 'Un activo tiene precio publicado, pero casi no hay compradores. ¿Qué riesgo aparece?',
    options: [option('a', 'Tener que esperar o aceptar un precio peor para vender', 100), option('b', 'Que el precio publicado garantiza la venta', 0), option('c', 'Ninguno, porque cotiza', 0), unknown],
    explanation: 'Un precio de referencia no asegura que puedas operar esa cantidad al mismo valor.',
  },
  {
    id: 'liquidity-3', stage: 'adaptive', dimension: 'liquidity', difficulty: 2,
    title: '¿Qué conviene separar del dinero invertido a largo plazo?',
    options: [option('a', 'Un fondo disponible para imprevistos', 100), option('b', 'Nada; todo debería estar invertido', 0), option('c', 'Solo el dinero en otra moneda', 20), unknown],
    explanation: 'Un respaldo líquido reduce la necesidad de vender inversiones en un mal momento.',
  },
  {
    id: 'liquidity-4', stage: 'adaptive', dimension: 'liquidity', difficulty: 3,
    title: '¿Qué diferencia puede existir entre vender y tener el dinero utilizable?',
    options: [option('a', 'Plazo de liquidación o rescate y conversión de moneda', 100), option('b', 'Ninguna en todos los productos', 0), option('c', 'Solo cambia el nombre del activo', 0), unknown],
    explanation: 'La venta, liquidación, rescate y disponibilidad final pueden ocurrir en momentos distintos.',
  },

  {
    id: 'inflation-fx-1', stage: 'adaptive', dimension: 'inflation_fx', difficulty: 1,
    title: '¿Qué diferencia hay entre rendimiento nominal y real?',
    options: [option('a', 'El real considera el cambio del poder de compra', 100), option('b', 'Son siempre iguales', 0), option('c', 'El nominal siempre se expresa en dólares', 0), unknown],
    explanation: 'El rendimiento real descuenta el efecto de la inflación sobre lo que podés comprar.',
  },
  {
    id: 'inflation-fx-2', stage: 'adaptive', dimension: 'inflation_fx', difficulty: 2,
    title: 'Tu objetivo está en dólares y la inversión en pesos. ¿Qué riesgo adicional existe?',
    options: [option('a', 'Que cambie el tipo de cambio entre aporte y uso del dinero', 100), option('b', 'Ninguno si el saldo en pesos sube', 0), option('c', 'Solo el horario del mercado', 10), unknown],
    explanation: 'La moneda del objetivo y la del activo pueden moverse de forma diferente.',
  },
  {
    id: 'inflation-fx-3', stage: 'adaptive', dimension: 'inflation_fx', difficulty: 2,
    title: '¿Una cobertura frente a inflación garantiza conservar valor en todo momento?',
    options: [option('a', 'No; puede haber plazos, precios y otros riesgos', 100), option('b', 'Sí, por definición', 0), option('c', 'Sí, sin importar el precio de compra', 0), unknown],
    explanation: 'Una relación con inflación no elimina riesgo de precio, emisor, liquidez ni desfases temporales.',
  },
  {
    id: 'inflation-fx-4', stage: 'adaptive', dimension: 'inflation_fx', difficulty: 3,
    title: '¿Qué conviene comparar al evaluar el resultado de una meta concreta?',
    options: [option('a', 'Resultado neto en la moneda y poder de compra de la meta', 100), option('b', 'Solo el porcentaje nominal', 20), option('c', 'Solo el activo que más subió', 0), unknown],
    explanation: 'La vara correcta depende de qué querés comprar, cuándo y en qué moneda.',
  },

  {
    id: 'instruments-1', stage: 'adaptive', dimension: 'instruments', difficulty: 1,
    title: 'Al comprar una acción, en términos generales adquirís…',
    options: [option('a', 'Una participación en una empresa', 100), option('b', 'Un préstamo garantizado al Estado', 0), option('c', 'Dólares disponibles', 0), unknown],
    explanation: 'Una acción representa participación empresaria y su resultado no está garantizado.',
  },
  {
    id: 'instruments-2', stage: 'adaptive', dimension: 'instruments', difficulty: 1,
    title: 'Al comprar un bono, en términos generales…',
    options: [option('a', 'Prestás dinero a un emisor bajo ciertas condiciones', 100), option('b', 'Comprás una parte de todas las empresas', 0), option('c', 'Recibís una ganancia garantizada', 10), unknown],
    explanation: 'Un bono es deuda y depende de que el emisor cumpla; además su precio puede variar.',
  },
  {
    id: 'instruments-3', stage: 'adaptive', dimension: 'instruments', difficulty: 2,
    title: '¿Qué conviene revisar en un fondo además de su nombre?',
    options: [option('a', 'Qué contiene, costos, rescate y riesgos', 100), option('b', 'Solo el logo', 0), option('c', 'Nada, todos los fondos son iguales', 0), unknown],
    explanation: 'La cartera subyacente, las reglas y los costos definen cómo funciona realmente un fondo.',
  },
  {
    id: 'instruments-4', stage: 'adaptive', dimension: 'instruments', difficulty: 3,
    title: 'Un CEDEAR de una empresa extranjera puede variar por…',
    options: [option('a', 'La acción subyacente, la relación de conversión y el tipo de cambio implícito', 100), option('b', 'Solo la inflación argentina', 10), option('c', 'Nada si la empresa es grande', 0), unknown],
    explanation: 'El precio local puede reflejar más de un factor; no es idéntico a tener dólares ni elimina riesgo empresario.',
  },

  {
    id: 'costs-1', stage: 'adaptive', dimension: 'costs', difficulty: 1,
    title: 'Dos inversiones rinden 10% antes de costos. ¿El resultado final necesariamente es igual?',
    options: [option('a', 'No; comisiones, spreads e impuestos pueden diferir', 100), option('b', 'Sí, porque ambas muestran 10%', 0), option('c', 'Sí, si se compran el mismo día', 10), unknown],
    explanation: 'Para comparar importa el resultado neto después de todos los costos aplicables.',
  },
  {
    id: 'costs-2', stage: 'adaptive', dimension: 'costs', difficulty: 2,
    title: '¿Qué es el spread en una operación?',
    options: [option('a', 'La diferencia entre precios de compra y venta', 100), option('b', 'Un rendimiento garantizado', 0), option('c', 'El impuesto anual fijo de todo activo', 0), unknown],
    explanation: 'La diferencia entre punta compradora y vendedora puede representar un costo implícito.',
  },
  {
    id: 'costs-3', stage: 'adaptive', dimension: 'costs', difficulty: 2,
    title: 'Una app muestra “comisión cero”. ¿Qué conviene verificar igualmente?',
    options: [option('a', 'Spread, tipo de cambio, costos del producto e impuestos', 100), option('b', 'Nada, cero significa costo total cero', 0), option('c', 'Solo el color del botón', 0), unknown],
    explanation: 'No cobrar una comisión visible no descarta otros costos directos o indirectos.',
  },
  {
    id: 'costs-4', stage: 'adaptive', dimension: 'costs', difficulty: 3,
    title: '¿Por qué costos pequeños y recurrentes importan en un plazo largo?',
    options: [option('a', 'Porque reducen de manera acumulativa el capital que sigue rindiendo', 100), option('b', 'Porque se convierten en ganancias', 0), option('c', 'No importan si son menores a 1%', 10), unknown],
    explanation: 'Un costo recurrente afecta el resultado cada período y también la base sobre la que se capitaliza.',
  },
];

const byId = new Map(knowledgeQuestionBank.map((question) => [question.id, question]));

const historyCount = (history, id) => history.filter((item) => item === id).length;

function leastSeen(candidates, history) {
  return [...candidates].sort((first, second) => {
    const usage = historyCount(history, first.id) - historyCount(history, second.id);
    if (usage) return usage;
    const firstRecent = history.lastIndexOf(first.id);
    const secondRecent = history.lastIndexOf(second.id);
    return firstRecent - secondRecent || first.id.localeCompare(second.id);
  })[0];
}

export function selectGatewayQuestions(history = []) {
  return ['risk_diversification', 'liquidity_instruments', 'inflation_costs'].map((group) => (
    leastSeen(knowledgeQuestionBank.filter((question) => question.stage === 'gateway' && question.group === group), history)
  ));
}

function scoreFor(question, answer) {
  return question?.options.find(([value]) => value === answer)?.[2];
}

export function evaluateKnowledgeResponses(responses = {}) {
  const accumulator = Object.fromEntries(Object.keys(knowledgeDimensions).map((dimension) => [dimension, { points: 0, answered: 0, unknown: 0, questions: 0 }]));
  Object.entries(responses).forEach(([questionId, answer]) => {
    const question = byId.get(questionId);
    if (!question) return;
    const dimensions = question.dimensions || [question.dimension];
    const rawScore = scoreFor(question, answer);
    dimensions.forEach((dimension) => {
      const current = accumulator[dimension];
      current.questions += 1;
      if (rawScore === null || rawScore === undefined) {
        current.unknown += 1;
        return;
      }
      current.points += rawScore;
      current.answered += 1;
    });
  });

  const dimensions = Object.fromEntries(Object.entries(accumulator).map(([dimension, value]) => {
    const score = value.answered ? Math.round(value.points / value.answered) : 0;
    const certainty = value.questions ? value.answered / value.questions : 0;
    const confidence = Math.round(100 * Math.min(1, value.questions / 2) * certainty);
    return [dimension, {
      label: knowledgeDimensions[dimension],
      score,
      confidence,
      evidenceCount: value.questions,
      answeredCount: value.answered,
      unknownCount: value.unknown,
    }];
  }));
  const assessed = Object.values(dimensions).filter((dimension) => dimension.evidenceCount > 0);
  const overallScore = assessed.length
    ? Math.round(assessed.reduce((sum, dimension) => sum + dimension.score, 0) / assessed.length)
    : 0;
  const coverage = Math.round(100 * assessed.length / Object.keys(knowledgeDimensions).length);
  const averageConfidence = assessed.length
    ? Math.round(assessed.reduce((sum, dimension) => sum + dimension.confidence, 0) / assessed.length)
    : 0;
  const explanationLevel = overallScore >= 78 && averageConfidence >= 65
    ? 'advanced'
    : overallScore >= 52 && averageConfidence >= 45
      ? 'intermediate'
      : 'simple';
  const label = explanationLevel === 'advanced' ? 'Avanzado' : explanationLevel === 'intermediate' ? 'Intermedio' : 'En desarrollo';
  return {
    version: KNOWLEDGE_VERSION,
    overallScore,
    coverage,
    confidence: averageConfidence,
    explanationLevel,
    label,
    dimensions,
    responseCount: Object.keys(responses).length,
    assessedAt: new Date().toISOString(),
    safetyImpact: 'none',
  };
}

export function selectAdaptiveQuestions(gatewayResponses, gatewayQuestions, history = []) {
  const provisional = evaluateKnowledgeResponses(gatewayResponses);
  const dimensions = Object.entries(provisional.dimensions).sort(([, first], [, second]) => (
    first.score - second.score || first.confidence - second.confidence
  ));
  const unknownCount = Object.values(gatewayResponses).filter((answer) => answer === 'unknown').length;
  const weakCount = dimensions.filter(([, result]) => result.score < 60).length;
  const targetCount = Math.max(3, Math.min(6, 3 + unknownCount + Math.floor(weakCount / 2)));
  const selected = [];

  for (let index = 0; selected.length < targetCount && index < dimensions.length * 2; index += 1) {
    const [dimension, result] = dimensions[index % dimensions.length];
    const preferredDifficulty = result.score >= 80 ? 3 : result.score >= 50 ? 2 : 1;
    const candidates = knowledgeQuestionBank.filter((question) => (
      question.stage === 'adaptive'
      && question.dimension === dimension
      && !selected.some((item) => item.id === question.id)
      && !gatewayQuestions.some((item) => item.id === question.id)
    ));
    const difficultyCandidates = candidates.filter((question) => Math.abs(question.difficulty - preferredDifficulty) <= 1);
    const picked = leastSeen(difficultyCandidates.length ? difficultyCandidates : candidates, history);
    if (picked) selected.push(picked);
  }
  return selected;
}

export function mergeKnowledgeIntoProfile(profile, knowledge) {
  return {
    ...profile,
    explanation_level: knowledge?.explanationLevel || profile?.explanation_level || 'simple',
    knowledge_version: knowledge?.version || KNOWLEDGE_VERSION,
  };
}

export function appendKnowledgeHistory(previousHistory = [], questionIds = []) {
  return [...previousHistory, ...questionIds].slice(-72);
}

export function findKnowledgeQuestion(questionId) {
  return byId.get(questionId) || null;
}
