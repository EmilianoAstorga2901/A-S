const event = (title, date, impact, source) => ({ title, date, impact, source, updatedAt: '2026-07-25T12:00:00-03:00' });

export const assetCatalog = [
  {
    id:'cedear-spy', ticker:'SPY', name:'SPDR S&P 500 ETF', issuer:'State Street Global Advisors', company:'500 grandes empresas de Estados Unidos', type:'CEDEAR', sector:'Otros', country:'Estados Unidos', currency:'ARS / USD',
    plainExplanation:'Un certificado local que sigue a un fondo compuesto por 500 grandes empresas estadounidenses.', role:'Diversificación internacional', riskExplanation:'Puede caer cuando baja el mercado estadounidense, aunque reparte la exposición entre muchas empresas.', suggestedHorizon:'Más de 5 años', liquidityLabel:'Alta',
    metrics:{risk:62,liquidity:92,horizon:80,complexity:45,usd:95,inflation:35,argentina:5,credit:5,equity:90,international:95,sensitivity:70}, overlaps:['aapl'],
    events:[event('Próxima actualización trimestral de composición','2026-09-18','Puede modificar el peso de algunas empresas dentro del índice.','S&P Dow Jones Indices')], questions:[['¿Qué estoy comprando?','Un CEDEAR que representa una participación en un ETF listado en Estados Unidos.'],['¿Está diversificado?','Sí, distribuye la exposición entre unas 500 empresas, aunque sigue concentrado en el mercado estadounidense.']],
  },
  {
    id:'cedear-aapl', ticker:'AAPL', name:'Apple Inc.', issuer:'Apple Inc.', company:'Apple Inc.', type:'CEDEAR', sector:'Tecnología', country:'Estados Unidos', currency:'ARS / USD',
    plainExplanation:'Un certificado negociado en Argentina que representa acciones de Apple en el exterior.', role:'Crecimiento y exposición tecnológica', riskExplanation:'Su precio puede caer con fuerza en períodos cortos y depende del desempeño de una sola empresa.', suggestedHorizon:'Más de 5 años', liquidityLabel:'Alta',
    metrics:{risk:78,liquidity:90,horizon:85,complexity:52,usd:95,inflation:25,argentina:5,credit:5,equity:100,international:90,sensitivity:82}, overlaps:['cedear-spy'],
    events:[event('Presentación estimada de resultados','2026-10-29','El mercado observará ventas, márgenes y perspectivas; el efecto sobre el precio no es predecible.','Apple Investor Relations')], questions:[['¿Qué mueve su precio?','Resultados, expectativas de ventas, márgenes y las condiciones generales del mercado.'],['¿Es igual a comprar dólares?','No. Tiene exposición al dólar, pero también al precio de Apple y al ratio del CEDEAR.']],
  },
  {
    id:'equity-ypfd', ticker:'YPFD', name:'YPF S.A.', issuer:'YPF S.A.', company:'YPF S.A.', type:'Acción', sector:'Energía', country:'Argentina', currency:'ARS',
    plainExplanation:'Una participación en la principal compañía integrada de energía de Argentina.', role:'Exposición a energía argentina', riskExplanation:'Puede variar mucho por petróleo, regulación, resultados y condiciones económicas argentinas.', suggestedHorizon:'Más de 5 años', liquidityLabel:'Alta',
    metrics:{risk:86,liquidity:82,horizon:85,complexity:50,usd:45,inflation:50,argentina:100,credit:20,equity:100,international:15,sensitivity:90}, overlaps:['on-ypf'],
    events:[event('Próxima presentación de resultados','2026-08-07','Permitirá revisar producción, inversiones y deuda; no determina por sí sola la dirección del precio.','YPF Relaciones con Inversores')], questions:[['¿De qué obtiene ingresos?','Principalmente de producción, refinación y venta de petróleo, gas y combustibles.'],['¿Qué riesgo argentino tiene?','Alto: regulación, actividad local y condiciones macroeconómicas pueden afectar su negocio.']],
  },
  {
    id:'on-ypf', ticker:'YMCJO', name:'ON YPF Clase XXXI', issuer:'YPF S.A.', company:'YPF S.A.', type:'Obligación negociable', sector:'Energía', country:'Argentina', currency:'USD',
    plainExplanation:'Deuda emitida por YPF: la empresa se compromete a pagar intereses y devolver capital según sus condiciones.', role:'Renta fija corporativa en dólares', riskExplanation:'Depende de que YPF pueda cumplir sus pagos; vender antes del vencimiento puede implicar una pérdida.', suggestedHorizon:'2 a 4 años', liquidityLabel:'Media',
    metrics:{risk:58,liquidity:55,horizon:55,complexity:66,usd:100,inflation:20,argentina:90,credit:85,equity:5,international:5,sensitivity:55}, overlaps:['equity-ypfd'],
    events:[event('Próximo servicio de intereses','2026-09-12','Se verificará el pago previsto en las condiciones de emisión.','BYMA / Emisor')], questions:[['¿Es una acción de YPF?','No. Es deuda de la compañía y tiene condiciones de pago definidas.'],['¿Puedo vender antes?','Sí, si existe demanda, pero el precio puede ser mayor o menor al pagado.']],
  },
  {
    id:'bond-al30', ticker:'AL30', name:'Bono República Argentina 2030', issuer:'República Argentina', company:'Tesoro Nacional', type:'Bono', sector:'Otros', country:'Argentina', currency:'USD',
    plainExplanation:'Deuda soberana argentina con pagos programados hasta 2030.', role:'Renta fija soberana en dólares', riskExplanation:'Tiene riesgo elevado de crédito soberano y su precio puede variar mucho aun antes del vencimiento.', suggestedHorizon:'3 a 5 años', liquidityLabel:'Alta',
    metrics:{risk:88,liquidity:84,horizon:65,complexity:72,usd:100,inflation:15,argentina:100,credit:100,equity:0,international:0,sensitivity:92}, overlaps:[],
    events:[event('Servicio programado de renta y amortización','2027-01-09','El cumplimiento y las condiciones fiscales son relevantes para su valuación.','Ministerio de Economía')], questions:[['¿Qué riesgo tiene?','Depende de la capacidad y voluntad de pago del Estado argentino.'],['¿El precio en dólares es estable?','No. Puede tener variaciones importantes por riesgo país y expectativas fiscales.']],
  },
  {
    id:'fund-money-market', ticker:'MM-PESOS', name:'Fondo Money Market Pesos', issuer:'Administradora regulada', company:'Fondo común de inversión', type:'Fondo', sector:'Otros', country:'Argentina', currency:'ARS',
    plainExplanation:'Un fondo de muy corto plazo que busca mantener el dinero disponible mientras genera un rendimiento variable.', role:'Liquidez y fondo de corto plazo', riskExplanation:'Tiene variaciones generalmente acotadas, pero el rendimiento no está garantizado ni es un depósito bancario.', suggestedHorizon:'Días a meses', liquidityLabel:'Inmediata',
    metrics:{risk:12,liquidity:100,horizon:5,complexity:18,usd:0,inflation:20,argentina:85,credit:28,equity:0,international:0,sensitivity:8}, overlaps:[],
    events:[event('Publicación diaria del valor de cuotaparte','2026-07-27','Actualiza el valor de referencia según la cartera del fondo.','CAFCI')], questions:[['¿Es una cuenta bancaria?','No. Es un fondo de inversión con rescate habitualmente inmediato.'],['¿El rendimiento es fijo?','No, cambia según los instrumentos de corto plazo que componen el fondo.']],
  },
  {
    id:'fund-short-bond', ticker:'RF-CP', name:'Fondo de Renta Fija Corto Plazo', issuer:'Administradora regulada', company:'Fondo común de inversión', type:'Fondo', sector:'Otros', country:'Argentina', currency:'ARS',
    plainExplanation:'Un fondo que reúne instrumentos de deuda de vencimiento relativamente cercano.', role:'Estabilidad con algo más de plazo', riskExplanation:'Puede mostrar pequeñas caídas si cambian las tasas o el crédito de sus instrumentos.', suggestedHorizon:'6 a 18 meses', liquidityLabel:'24–48 horas',
    metrics:{risk:30,liquidity:88,horizon:25,complexity:30,usd:10,inflation:35,argentina:85,credit:62,equity:0,international:0,sensitivity:28}, overlaps:[],
    events:[event('Publicación del informe mensual','2026-08-05','Permitirá revisar duración, emisores y composición del fondo.','Administradora / CAFCI')], questions:[['¿Puede bajar?','Sí. Aunque suele variar menos que una acción, no tiene capital garantizado.'],['¿Cuándo se acredita el rescate?','Depende del fondo; este ejemplo contempla entre 24 y 48 horas.']],
  },
  {
    id:'fund-cer', ticker:'FCI-CER', name:'Fondo Ajustado por Inflación', issuer:'Administradora regulada', company:'Fondo común de inversión', type:'Fondo', sector:'Otros', country:'Argentina', currency:'ARS',
    plainExplanation:'Un fondo con instrumentos que buscan acompañar la inflación argentina mediante ajuste CER.', role:'Protección parcial frente a inflación', riskExplanation:'Puede bajar por cambios de tasas reales, plazos y riesgo de los emisores; no replica exactamente tu inflación personal.', suggestedHorizon:'Más de 2 años', liquidityLabel:'24–48 horas',
    metrics:{risk:46,liquidity:82,horizon:48,complexity:54,usd:5,inflation:95,argentina:95,credit:68,equity:0,international:0,sensitivity:48}, overlaps:[],
    events:[event('Publicación del IPC nacional','2026-08-13','El dato se incorpora con rezago al coeficiente CER; no define por sí solo el valor diario.','INDEC')], questions:[['¿Sigue exactamente al IPC?','No. El CER tiene rezago y el fondo también se mueve por tasas y precios de mercado.'],['¿Sirve para el corto plazo?','Puede fluctuar; suele requerir un horizonte mayor que un money market.']],
  },
  {
    id:'usd-mep', ticker:'DÓLAR MEP', name:'Dólar MEP', issuer:'Mercado de capitales argentino', company:'Operación con títulos públicos', type:'Dólar', sector:'Otros', country:'Argentina', currency:'USD',
    plainExplanation:'Una forma legal de obtener dólares mediante la compra y venta de bonos en el mercado local.', role:'Disponibilidad y exposición al dólar', riskExplanation:'El tipo de cambio puede variar durante la operación y existen costos, plazos y regulaciones aplicables.', suggestedHorizon:'Corto o mediano plazo', liquidityLabel:'Alta',
    metrics:{risk:35,liquidity:90,horizon:20,complexity:58,usd:100,inflation:55,argentina:65,credit:8,equity:0,international:30,sensitivity:35}, overlaps:[],
    events:[event('Próxima rueda hábil de mercado','2026-07-27','La cotización surgirá de precios negociados y puede cambiar durante el día.','BYMA')], questions:[['¿Es un activo que paga rendimiento?','No por sí mismo. Es una operatoria para obtener dólares; luego pueden mantenerse o invertirse.'],['¿Su precio es fijo?','No. Surge de las cotizaciones de los títulos utilizados.']],
  },
  {
    id:'fund-usd-bond', ticker:'RF-USD', name:'Fondo de Renta Fija en Dólares', issuer:'Administradora regulada', company:'Fondo común de inversión', type:'Fondo', sector:'Otros', country:'Argentina', currency:'USD',
    plainExplanation:'Un fondo que agrupa bonos y obligaciones negociables denominados en dólares.', role:'Ingresos potenciales y diversificación en dólares', riskExplanation:'Puede perder valor por incumplimientos, suba de tasas o falta de liquidez, aunque esté expresado en dólares.', suggestedHorizon:'Más de 2 años', liquidityLabel:'48 horas',
    metrics:{risk:52,liquidity:72,horizon:55,complexity:55,usd:100,inflation:20,argentina:65,credit:82,equity:0,international:25,sensitivity:50}, overlaps:[],
    events:[event('Actualización mensual de cartera','2026-08-07','Mostrará emisores, calidad crediticia y vencimientos del fondo.','Administradora / CAFCI')], questions:[['¿Estar en dólares elimina el riesgo?','No. Existe riesgo de crédito, tasa y precio de los bonos.'],['¿Qué diversifica?','Puede distribuir la inversión entre varios emisores y vencimientos.']],
  },
];

export const instrumentCategories = ['Todos','Acción','CEDEAR','Bono','Obligación negociable','Fondo','Dólar'];
export const sectorCategories = ['Todos','Energía','Bancos','Tecnología','Alimentos','Salud','Otros'];
