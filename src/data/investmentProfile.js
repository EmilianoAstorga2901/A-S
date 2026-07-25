export const questionnaire = [
  {
    id: 'age',
    section: 'Sobre vos',
    eyebrow: 'Datos personales',
    title: '¿Qué edad tenés?',
    helper: 'La edad nos ayuda a estimar cuánto tiempo tenés para atravesar los ciclos del mercado.',
    options: [
      { label: '18 a 30 años', value: '18-30', capacity: 3 },
      { label: '31 a 45 años', value: '31-45', capacity: 2 },
      { label: '46 a 60 años', value: '46-60', capacity: 1 },
      { label: 'Más de 60 años', value: '60+', capacity: 0 },
    ],
  },
  {
    id: 'horizon',
    section: 'Tus objetivos',
    eyebrow: 'Horizonte de inversión',
    title: '¿Cuándo pensás usar este dinero?',
    helper: 'Un plazo mayor permite tolerar mejor las variaciones temporales.',
    options: [
      { label: 'En menos de 1 año', detail: 'Necesito disponibilidad pronto', value: 'short', capacity: 0 },
      { label: 'Entre 1 y 5 años', detail: 'Tengo un objetivo cercano', value: 'medium', capacity: 1 },
      { label: 'Entre 5 y 10 años', detail: 'Puedo esperar', value: 'long', capacity: 2 },
      { label: 'Dentro de más de 10 años', detail: 'Es un plan de largo plazo', value: 'very-long', capacity: 3 },
    ],
  },
  {
    id: 'goal',
    section: 'Tus objetivos',
    eyebrow: 'Objetivo principal',
    title: '¿Qué querés lograr con tu inversión?',
    helper: 'Elegí el objetivo que mejor represente tu prioridad actual.',
    options: [
      { label: 'Proteger mis ahorros', value: 'protect', capacity: 0 },
      { label: 'Comprar una vivienda', value: 'home', capacity: 1 },
      { label: 'Generar ingresos periódicos', value: 'income', capacity: 1 },
      { label: 'Hacer crecer mi capital', value: 'growth', capacity: 2 },
      { label: 'Planificar mi jubilación', value: 'retirement', capacity: 2 },
    ],
  },
  {
    id: 'income',
    section: 'Tu situación',
    eyebrow: 'Ingresos y ahorro',
    title: '¿Cómo describirías tus ingresos?',
    helper: 'No necesitamos montos exactos. Esto permite medir tu capacidad para asumir riesgo.',
    options: [
      { label: 'Variables y no logro ahorrar', value: 'unstable', capacity: 0 },
      { label: 'Variables, pero ahorro algunos meses', value: 'variable', capacity: 1 },
      { label: 'Estables y ahorro menos del 15%', value: 'stable', capacity: 2 },
      { label: 'Estables y ahorro más del 15%', value: 'very-stable', capacity: 3 },
    ],
  },
  {
    id: 'emergency',
    section: 'Tu situación',
    eyebrow: 'Respaldo financiero',
    title: '¿Tenés un fondo de emergencia?',
    helper: 'Es dinero disponible para cubrir gastos inesperados sin vender tus inversiones.',
    options: [
      { label: 'No tengo todavía', value: 'none', capacity: 0 },
      { label: 'Cubre menos de 3 meses de gastos', value: 'partial', capacity: 1 },
      { label: 'Cubre entre 3 y 6 meses', value: 'ready', capacity: 2 },
      { label: 'Cubre más de 6 meses', value: 'strong', capacity: 3 },
    ],
  },
  {
    id: 'debt',
    section: 'Tu situación',
    eyebrow: 'Deudas y patrimonio',
    title: '¿Qué peso tienen tus deudas hoy?',
    helper: 'Las deudas de alto costo reducen la capacidad objetiva de inversión.',
    options: [
      { label: 'Comprometen gran parte de mis ingresos', value: 'high', capacity: 0 },
      { label: 'Son manejables, pero relevantes', value: 'medium', capacity: 1 },
      { label: 'Son bajas y están bajo control', value: 'low', capacity: 2 },
      { label: 'No tengo deudas', value: 'none', capacity: 3 },
    ],
  },
  {
    id: 'experience',
    section: 'Tu experiencia',
    eyebrow: 'Experiencia inversora',
    title: '¿Qué experiencia tenés invirtiendo?',
    helper: 'La experiencia ayuda a comprender cómo se comportan los activos.',
    options: [
      { label: 'Nunca invertí', value: 'none', tolerance: 0 },
      { label: 'Menos de 2 años', value: 'beginner', tolerance: 1 },
      { label: 'Entre 2 y 5 años', value: 'intermediate', tolerance: 2 },
      { label: 'Más de 5 años', value: 'advanced', tolerance: 3 },
    ],
  },
  {
    id: 'knowledge',
    section: 'Tu experiencia',
    eyebrow: 'Conocimientos',
    title: '¿Qué productos financieros conocés?',
    helper: 'No hay respuestas correctas. Vamos a explicarte cada alternativa antes de invertir.',
    options: [
      { label: 'Plazos fijos o cuentas remuneradas', value: 'basic', tolerance: 0 },
      { label: 'Bonos y fondos comunes', value: 'funds', tolerance: 1 },
      { label: 'Acciones y ETFs', value: 'stocks', tolerance: 2 },
      { label: 'También criptomonedas y derivados', value: 'advanced', tolerance: 3 },
    ],
  },
  {
    id: 'loss',
    section: 'Cómo decidís',
    eyebrow: 'Tolerancia psicológica',
    title: 'Tu inversión cae un 20% en una semana. ¿Qué harías?',
    helper: 'Imaginá que ocurre de verdad. Tu reacción importa más que el rendimiento que te gustaría obtener.',
    options: [
      { label: 'Vendería todo inmediatamente', detail: 'Prefiero evitar más pérdidas', value: 'sell', tolerance: 0 },
      { label: 'Vendería una parte', detail: 'Reduciría mi exposición', value: 'reduce', tolerance: 1 },
      { label: 'Mantendría mi inversión', detail: 'Esperaría la recuperación', value: 'hold', tolerance: 2 },
      { label: 'Invertiría un poco más', detail: 'Aprovecharía precios más bajos', value: 'buy', tolerance: 3 },
    ],
  },
  {
    id: 'liquidity',
    section: 'Cómo decidís',
    eyebrow: 'Liquidez',
    title: '¿Qué tan importante es retirar el dinero rápido?',
    helper: 'Algunos activos necesitan más tiempo para venderse sin resignar valor.',
    options: [
      { label: 'Es indispensable retirarlo en cualquier momento', value: 'essential', capacity: 0 },
      { label: 'Podría esperar hasta una semana', value: 'week', capacity: 1 },
      { label: 'Podría esperar algunos meses', value: 'months', capacity: 2 },
      { label: 'No necesito liquidez inmediata', value: 'none', capacity: 3 },
    ],
  },
];

export const profiles = {
  conservative: {
    name: 'Conservador', tone: 'Bajo', color: '#1F9D68',
    summary: 'Priorizás estabilidad y disponibilidad por sobre grandes variaciones de rendimiento.',
    allocation: [
      { name: 'Bonos', percentage: 60, color: '#173B57', reason: 'Aportan previsibilidad y estabilidad a tu cartera.' },
      { name: 'ETFs de mercado', percentage: 25, color: '#2F80ED', reason: 'Suman diversificación con una exposición limitada.' },
      { name: 'Oro', percentage: 10, color: '#E5A93D', reason: 'Puede actuar como cobertura en períodos de incertidumbre.' },
      { name: 'Efectivo', percentage: 5, color: '#A7B4BF', reason: 'Mantiene una parte disponible para necesidades cercanas.' },
    ],
  },
  moderate: {
    name: 'Moderado', tone: 'Medio', color: '#E5A93D',
    summary: 'Buscás un equilibrio entre crecimiento, estabilidad y diversificación en el tiempo.',
    allocation: [
      { name: 'ETFs diversificados', percentage: 55, color: '#2F80ED', reason: 'Distribuyen el riesgo entre diferentes empresas y mercados.' },
      { name: 'Bonos', percentage: 20, color: '#173B57', reason: 'Amortiguan parte de las variaciones del mercado.' },
      { name: 'Acciones', percentage: 15, color: '#7A5AF8', reason: 'Agregan potencial de crecimiento a largo plazo.' },
      { name: 'Oro y REITs', percentage: 10, color: '#E5A93D', reason: 'Diversifican con activos de comportamiento diferente.' },
    ],
  },
  aggressive: {
    name: 'Agresivo', tone: 'Alto', color: '#D64545',
    summary: 'Aceptás variaciones importantes para buscar mayor crecimiento potencial a largo plazo.',
    allocation: [
      { name: 'Acciones', percentage: 70, color: '#7A5AF8', reason: 'Concentran el potencial de crecimiento de largo plazo.' },
      { name: 'ETFs tecnológicos', percentage: 15, color: '#2F80ED', reason: 'Aportan exposición diversificada a sectores innovadores.' },
      { name: 'Criptoactivos', percentage: 10, color: '#E5A93D', reason: 'Suman una exposición acotada a activos de alta volatilidad.' },
      { name: 'Efectivo', percentage: 5, color: '#A7B4BF', reason: 'Conserva liquidez para oportunidades o necesidades.' },
    ],
  },
};

export function calculateProfile(answers) {
  const answered = questionnaire.map(question =>
    question.options.find(option => option.value === answers[question.id]),
  ).filter(Boolean);
  const capacityValues = answered.filter(option => option.capacity !== undefined).map(option => option.capacity);
  const toleranceValues = answered.filter(option => option.tolerance !== undefined).map(option => option.tolerance);
  const capacity = capacityValues.reduce((sum, value) => sum + value, 0) / Math.max(capacityValues.length, 1);
  const tolerance = toleranceValues.reduce((sum, value) => sum + value, 0) / Math.max(toleranceValues.length, 1);
  const combined = capacity * 0.6 + tolerance * 0.4;
  const key = combined < 1.15 ? 'conservative' : combined < 2.15 ? 'moderate' : 'aggressive';
  return { ...profiles[key], key, capacity, tolerance };
}
