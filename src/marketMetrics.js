const commonMarketMetrics = [
  {
    key: 'dailyReturn', label: 'Variación diaria', format: 'percent', signed: true, fallbackField: 'dailyReturn',
    definition: 'Cambio porcentual del precio durante la rueda o período diario informado.',
    interpretation: 'Sirve para contexto inmediato; un día aislado no mide el riesgo total ni la calidad del activo.',
    formula: '(Precio actual / cierre anterior − 1) × 100',
    limits: 'Puede excluir dividendos, cupones, amortizaciones, impuestos y diferencias horarias.',
  },
  {
    key: 'monthlyReturn', label: 'Retorno 1 mes', format: 'percent', signed: true, fallbackField: 'monthlyReturn', providerKeys: ['monthToDatePriceReturnDaily', '4WeekPriceReturnDaily'],
    definition: 'Cambio del precio en aproximadamente un mes.',
    interpretation: 'Ayuda a dimensionar movimientos recientes, pero no anticipa el mes siguiente.',
    formula: '(Precio final / precio inicial − 1) × 100',
    limits: 'La ventana exacta y el tratamiento de distribuciones dependen del proveedor.',
  },
  {
    key: 'annualReturn', label: 'Retorno 1 año', format: 'percent', signed: true, fallbackField: 'annualReturn', providerKeys: ['52WeekPriceReturnDaily'],
    definition: 'Variación acumulada del precio durante los últimos doce meses.',
    interpretation: 'Permite comparar magnitud y dirección, no calidad ni retorno futuro.',
    formula: '(Precio final / precio inicial − 1) × 100',
    limits: 'No siempre incluye distribuciones y puede mezclar efectos cambiarios en CEDEARs.',
  },
  {
    key: 'beta', label: 'Beta', format: 'ratio', providerKeys: ['beta'],
    definition: 'Sensibilidad histórica del activo frente a movimientos de su mercado de referencia.',
    interpretation: 'Mayor que 1 indica que históricamente se movió más que el índice; no implica mayor retorno.',
    formula: 'Covarianza(activo, mercado) / Varianza(mercado)',
    limits: 'Depende del índice, ventana y frecuencia elegidos; cambia con el tiempo.',
  },
  {
    key: 'volatility', label: 'Volatilidad anualizada', format: 'percent', providerKeys: ['yearlyVolatility', 'volatilityAnnualized'],
    definition: 'Dispersión histórica de los retornos, expresada en términos anuales.',
    interpretation: 'Un valor alto indica movimientos más amplios, no necesariamente pérdidas permanentes.',
    formula: 'Desvío estándar de retornos × √períodos por año',
    limits: 'Mira el pasado y trata subas y bajas como variación del mismo tipo.',
  },
  {
    key: 'maxDrawdown', label: 'Máximo drawdown', format: 'percent', providerKeys: ['maxDrawdown'],
    definition: 'Mayor caída histórica desde un máximo hasta el mínimo posterior dentro de la ventana.',
    interpretation: 'Ayuda a imaginar cuánto dolor tuvo que tolerar una persona antes de una eventual recuperación.',
    formula: 'Mínimo[(valor / máximo previo) − 1] × 100',
    limits: 'Una caída futura puede superar a la histórica y la ventana elegida cambia el resultado.',
  },
  {
    key: 'week52Range', label: 'Rango de 52 semanas', format: 'range', providerKeys: [['52WeekLow', '52WeekHigh']],
    definition: 'Precio mínimo y máximo informados en aproximadamente un año.',
    interpretation: 'Ubica el precio actual dentro de su rango reciente; no determina si está caro o barato.',
    formula: 'Mínimo y máximo de cierres o ruedas según proveedor',
    limits: 'No incorpora valor intrínseco, cambios del negocio ni distribuciones.',
  },
];

const equityGroups = [
  {
    id: 'valuation', title: 'Valuación', metrics: [
      { key: 'pe', label: 'P/E', format: 'ratio', providerKeys: ['peBasicExclExtraTTM', 'peTTM', 'peNormalizedAnnual'], definition: 'Precio por acción dividido por ganancia por acción.', interpretation: 'Muestra cuánto paga el mercado por una unidad de ganancia; debe compararse con crecimiento, calidad y pares.', formula: 'Precio / EPS', limits: 'Pierde sentido con ganancias negativas o extraordinarias.' },
      { key: 'evEbitda', label: 'EV / EBITDA', format: 'ratio', providerKeys: ['evEbitdaTTM', 'currentEv/freeCashFlowTTM'], definition: 'Valor de la empresa, incluyendo deuda neta, frente al EBITDA.', interpretation: 'Facilita comparaciones operativas entre empresas con distinta financiación.', formula: 'Enterprise value / EBITDA', limits: 'EBITDA no es flujo de caja y omite CAPEX, impuestos y capital de trabajo.' },
      { key: 'priceBook', label: 'P / valor libro', format: 'ratio', providerKeys: ['pbAnnual', 'pbQuarterly'], definition: 'Capitalización bursátil frente al patrimonio contable.', interpretation: 'Es especialmente útil en bancos y negocios intensivos en activos.', formula: 'Precio por acción / valor libro por acción', limits: 'El valor contable puede no reflejar calidad de activos, intangibles o inflación.' },
      { key: 'priceSales', label: 'P / ventas', format: 'ratio', providerKeys: ['psTTM', 'psAnnual'], definition: 'Valor de mercado frente a ingresos.', interpretation: 'Permite comparar empresas todavía sin ganancias, junto con margen y crecimiento.', formula: 'Capitalización / ingresos', limits: 'Las ventas no indican rentabilidad ni conversión en caja.' },
      { key: 'peg', label: 'PEG', format: 'ratio', providerKeys: ['pegTTM', 'pegAnnual'], definition: 'P/E dividido por una tasa de crecimiento de ganancias.', interpretation: 'Relaciona múltiplo y crecimiento, pero no reemplaza un modelo de flujos.', formula: 'P/E / crecimiento porcentual del EPS', limits: 'Es extremadamente sensible a estimaciones y no funciona bien con crecimiento negativo.' },
      { key: 'fcfYield', label: 'FCF yield', format: 'percent', providerKeys: ['freeCashFlowYieldTTM', 'freeCashFlowYieldAnnual'], definition: 'Flujo de caja libre generado frente al valor de mercado.', interpretation: 'Un valor más alto puede indicar más caja por peso invertido, si el flujo es sostenible.', formula: 'FCF / capitalización × 100', limits: 'CAPEX cíclico, capital de trabajo o partidas no recurrentes pueden distorsionarlo.' },
    ],
  },
  {
    id: 'profitability', title: 'Rentabilidad y márgenes', metrics: [
      { key: 'roe', label: 'ROE', format: 'percent', providerKeys: ['roeTTM', 'roeAnnual'], definition: 'Ganancia generada sobre el patrimonio promedio.', interpretation: 'Mide eficiencia para el accionista; debe leerse junto con deuda y calidad de ganancias.', formula: 'Ganancia neta / patrimonio promedio × 100', limits: 'Recompras, patrimonio bajo, inflación o apalancamiento pueden inflarlo.' },
      { key: 'roa', label: 'ROA', format: 'percent', providerKeys: ['roaTTM', 'roaAnnual'], definition: 'Ganancia neta sobre activos promedio.', interpretation: 'Compara cuánto resultado produce la base de activos.', formula: 'Ganancia neta / activos promedio × 100', limits: 'La intensidad de activos varía mucho entre sectores.' },
      { key: 'grossMargin', label: 'Margen bruto', format: 'percent', providerKeys: ['grossMarginTTM', 'grossMarginAnnual'], definition: 'Porción de ventas restante luego del costo directo.', interpretation: 'Ayuda a evaluar poder de precio y estructura productiva.', formula: '(Ventas − costo de ventas) / ventas × 100', limits: 'La clasificación contable de costos difiere entre empresas.' },
      { key: 'operatingMargin', label: 'Margen operativo', format: 'percent', providerKeys: ['operatingMarginTTM', 'operatingMarginAnnual'], definition: 'Resultado operativo frente a ventas.', interpretation: 'Mide rentabilidad del negocio antes de financiación e impuestos.', formula: 'Resultado operativo / ventas × 100', limits: 'Puede contener partidas no recurrentes y criterios contables distintos.' },
      { key: 'netMargin', label: 'Margen neto', format: 'percent', providerKeys: ['netProfitMarginTTM', 'netProfitMarginAnnual'], definition: 'Ganancia final atribuible por cada unidad vendida.', interpretation: 'Resume operación, financiación e impuestos.', formula: 'Ganancia neta / ventas × 100', limits: 'Eventos extraordinarios y ciclos pueden volverlo poco representativo.' },
    ],
  },
  {
    id: 'growth', title: 'Crecimiento', metrics: [
      { key: 'revenueGrowth', label: 'Crecimiento de ingresos', format: 'percent', providerKeys: ['revenueGrowthTTMYoy', 'revenueGrowthAnnual'], definition: 'Cambio interanual de ventas.', interpretation: 'Muestra expansión comercial; importa si se traduce en margen y caja.', formula: '(Ingresos actuales / anteriores − 1) × 100', limits: 'Adquisiciones, moneda e inflación pueden inflar el dato.' },
      { key: 'epsGrowth', label: 'Crecimiento de EPS', format: 'percent', providerKeys: ['epsGrowthTTMYoy', 'epsGrowthAnnual'], definition: 'Cambio de la ganancia por acción.', interpretation: 'Incluye negocio y cantidad de acciones, por eso refleja recompras o dilución.', formula: '(EPS actual / EPS anterior − 1) × 100', limits: 'No es interpretable si la base fue negativa o excepcional.' },
      { key: 'fcfGrowth', label: 'Crecimiento de FCF', format: 'percent', providerKeys: ['freeCashFlowGrowthTTMYoy', 'freeCashFlowGrowthAnnual'], definition: 'Cambio del flujo de caja libre.', interpretation: 'Ayuda a verificar si el crecimiento contable se convierte en efectivo.', formula: '(FCF actual / FCF anterior − 1) × 100', limits: 'Capital de trabajo y CAPEX hacen que sea volátil.' },
    ],
  },
  {
    id: 'balance', title: 'Balance y liquidez', metrics: [
      { key: 'debtEquity', label: 'Deuda / patrimonio', format: 'ratio', providerKeys: ['totalDebt/totalEquityQuarterly', 'totalDebt/totalEquityAnnual'], definition: 'Deuda financiera frente al patrimonio.', interpretation: 'Mide apalancamiento contable; debe compararse dentro del mismo sector.', formula: 'Deuda total / patrimonio', limits: 'No contempla caja, vencimientos, tasas ni capacidad real de pago.' },
      { key: 'netDebtEbitda', label: 'Deuda neta / EBITDA', format: 'ratio', providerKeys: ['netDebt/ebitdaTTM', 'netDebt/ebitdaAnnual'], definition: 'Deuda menos caja frente al EBITDA.', interpretation: 'Aproxima cuántos años de EBITDA equivalen a la deuda neta.', formula: '(Deuda − caja) / EBITDA', limits: 'No es un calendario de pagos y falla con EBITDA negativo.' },
      { key: 'currentRatio', label: 'Ratio corriente', format: 'ratio', providerKeys: ['currentRatioQuarterly', 'currentRatioAnnual'], definition: 'Activos corrientes frente a pasivos corrientes.', interpretation: 'Indica cobertura contable de obligaciones de corto plazo.', formula: 'Activo corriente / pasivo corriente', limits: 'Inventarios o créditos pueden no convertirse rápido en efectivo.' },
      { key: 'quickRatio', label: 'Prueba ácida', format: 'ratio', providerKeys: ['quickRatioQuarterly', 'quickRatioAnnual'], definition: 'Liquidez de corto plazo excluyendo inventarios.', interpretation: 'Es una prueba más exigente que el ratio corriente.', formula: '(Efectivo + inversiones cortas + créditos) / pasivo corriente', limits: 'La cobrabilidad y estacionalidad siguen siendo relevantes.' },
      { key: 'interestCoverage', label: 'Cobertura de intereses', format: 'ratio', providerKeys: ['netInterestCoverageAnnual', 'interestCoverageTTM'], definition: 'Resultado operativo disponible frente al gasto financiero.', interpretation: 'Mide margen para pagar intereses antes de amortizar capital.', formula: 'EBIT / intereses', limits: 'No considera vencimientos de capital ni volatilidad de la caja.' },
    ],
  },
  {
    id: 'shareholder', title: 'Accionista y mercado', metrics: [
      { key: 'dividendYield', label: 'Dividend yield', format: 'percent', providerKeys: ['dividendYieldIndicatedAnnual', 'dividendYieldTTM'], definition: 'Dividendo anual frente al precio.', interpretation: 'Mide distribución corriente, no retorno total ni sostenibilidad.', formula: 'Dividendo anual por acción / precio × 100', limits: 'Puede subir porque el precio cayó; el dividendo puede reducirse.' },
      { key: 'payout', label: 'Payout', format: 'percent', providerKeys: ['payoutRatioTTM', 'payoutRatioAnnual'], definition: 'Parte de la ganancia distribuida como dividendos.', interpretation: 'Ayuda a evaluar cuánto se reinvierte y cuánto se entrega.', formula: 'Dividendos / ganancia neta × 100', limits: 'Ganancias extraordinarias o negativas distorsionan el ratio.' },
      ...commonMarketMetrics,
    ],
  },
];

const etfGroups = [
  { id: 'fund-structure', title: 'Estructura del fondo', metrics: [
    { key: 'expenseRatio', label: 'Expense ratio', format: 'percent', providerKeys: ['expenseRatio', 'annualManagementCharge'], definition: 'Gasto anual del fondo descontado del patrimonio.', interpretation: 'Reduce el retorno de forma acumulativa aunque no aparezca como un débito separado.', formula: 'Gastos operativos anuales / patrimonio promedio × 100', limits: 'No incluye spread, impuestos ni tracking difference.' },
    { key: 'aum', label: 'Patrimonio (AUM)', format: 'compact', providerKeys: ['aum', 'totalAssets'], definition: 'Valor total administrado por el fondo.', interpretation: 'Puede aportar escala y liquidez, pero mayor tamaño no garantiza mejor retorno.', formula: 'Suma del valor de todas las tenencias neta de pasivos', limits: 'Cambia con precios y flujos de inversores.' },
    { key: 'holdingsCount', label: 'Cantidad de posiciones', format: 'number', providerKeys: ['holdingsCount', 'numberOfHoldings'], definition: 'Número de instrumentos dentro del fondo.', interpretation: 'Es una primera medida de amplitud, no de diversificación efectiva.', formula: 'Conteo de posiciones informadas', limits: 'Muchas posiciones pueden estar concentradas en un sector o factor.' },
    { key: 'top10Weight', label: 'Peso del Top 10', format: 'percent', providerKeys: ['top10HoldingsWeight'], definition: 'Porcentaje concentrado en las diez posiciones más grandes.', interpretation: 'Cuanto mayor es, más depende el fondo de pocos nombres.', formula: 'Suma de los pesos de las 10 mayores posiciones', limits: 'No mide concentración sectorial ni exposición indirecta.' },
  ] },
  { id: 'tracking', title: 'Seguimiento del índice', metrics: [
    { key: 'trackingDifference', label: 'Tracking difference', format: 'percent', signed: true, providerKeys: ['trackingDifference'], definition: 'Diferencia de retorno entre el fondo y su índice.', interpretation: 'Resume costos, retenciones, réplica y fricciones realizadas.', formula: 'Retorno del fondo − retorno del índice', limits: 'Debe compararse en la misma moneda, período y versión de retorno total.' },
    { key: 'trackingError', label: 'Tracking error', format: 'percent', providerKeys: ['trackingError'], definition: 'Variabilidad de la diferencia de retornos frente al índice.', interpretation: 'Mide consistencia de réplica, no dirección del rendimiento.', formula: 'Desvío estándar de (retorno fondo − índice)', limits: 'Depende de la frecuencia y ventana elegidas.' },
    { key: 'premiumDiscount', label: 'Prima / descuento', format: 'percent', signed: true, providerKeys: ['premiumDiscount'], definition: 'Diferencia entre precio de mercado y valor neto de activos.', interpretation: 'Muestra si se negocia por encima o debajo del valor de su cartera.', formula: '(Precio / NAV − 1) × 100', limits: 'Puede variar intradía y depende del horario de los mercados subyacentes.' },
  ] },
  { id: 'etf-risk', title: 'Riesgo y retorno', metrics: [
    { key: 'sharpe', label: 'Sharpe', format: 'ratio', providerKeys: ['sharpeRatio'], definition: 'Exceso de retorno histórico por unidad de volatilidad.', interpretation: 'Ayuda a comparar eficiencia histórica de riesgo total.', formula: '(Retorno − tasa libre de riesgo) / volatilidad', limits: 'Supone que volatilidad resume riesgo y es sensible a la ventana.' },
    { key: 'sortino', label: 'Sortino', format: 'ratio', providerKeys: ['sortinoRatio'], definition: 'Exceso de retorno por unidad de volatilidad negativa.', interpretation: 'Distingue mejor las caídas de las subas que Sharpe.', formula: '(Retorno − objetivo) / desvío de retornos negativos', limits: 'Depende del objetivo, frecuencia y muestra.' },
    ...commonMarketMetrics,
  ] },
];

const bondGroups = [
  { id: 'bond-return', title: 'Precio y rendimiento', metrics: [
    { key: 'ytm', label: 'TIR / YTM', format: 'percent', providerKeys: ['yieldToMaturity', 'ytm'], definition: 'Tasa interna que iguala precio total y flujos prometidos hasta vencimiento.', interpretation: 'Permite comparar flujos si se cumplen y reinvierten; no es una ganancia garantizada.', formula: 'Precio total = Σ flujoₜ / (1 + TIR)ᵗ', limits: 'No representa default, reestructuración, rescate ni reinversión real.' },
    { key: 'currentYield', label: 'Current yield', format: 'percent', providerKeys: ['currentYield'], definition: 'Cupón anual frente al precio de mercado.', interpretation: 'Mide ingreso corriente, pero omite amortización y diferencia entre precio y par.', formula: 'Cupón anual / precio total × 100', limits: 'No equivale a TIR ni retorno total.' },
    { key: 'parity', label: 'Paridad', format: 'percent', providerKeys: ['parity'], definition: 'Precio de mercado frente al valor técnico.', interpretation: 'Ayuda a comparar cuánto se paga respecto de capital e intereses devengados.', formula: 'Precio / valor técnico × 100', limits: 'Una baja paridad puede reflejar alto riesgo, no una oportunidad segura.' },
    { key: 'accruedInterest', label: 'Interés corrido', format: 'number', providerKeys: ['accruedInterest'], definition: 'Interés devengado desde el último pago.', interpretation: 'Se suma al precio limpio para obtener el desembolso total.', formula: 'Cupón del período × días transcurridos / días del período', limits: 'La convención de días depende de las condiciones del título.' },
  ] },
  { id: 'bond-sensitivity', title: 'Sensibilidad de tasa', metrics: [
    { key: 'macaulayDuration', label: 'Duration Macaulay', format: 'years', providerKeys: ['macaulayDuration'], definition: 'Plazo promedio ponderado de los flujos.', interpretation: 'Resume cuándo se recupera económicamente el valor bajo los flujos prometidos.', formula: 'Σ(t × valor presente del flujoₜ) / precio', limits: 'Supone flujos contractuales y no modela default.' },
    { key: 'modifiedDuration', label: 'Duration modificada', format: 'years', providerKeys: ['modifiedDuration'], definition: 'Sensibilidad aproximada del precio ante un cambio pequeño de TIR.', interpretation: 'Una duration 4 implica cerca de 4% de cambio inverso por un punto de TIR.', formula: 'Duration Macaulay / (1 + TIR por período)', limits: 'La aproximación empeora con cambios grandes, opciones o riesgo de crédito.' },
    { key: 'convexity', label: 'Convexidad', format: 'ratio', providerKeys: ['convexity'], definition: 'Curvatura de la relación entre precio y tasa.', interpretation: 'Corrige la aproximación lineal de duration para movimientos mayores.', formula: 'Segunda derivada aproximada del precio respecto de la TIR', limits: 'No captura una reestructuración ni cambios de flujo.' },
    { key: 'dv01', label: 'DV01', format: 'number', providerKeys: ['dv01'], definition: 'Cambio monetario estimado ante un punto básico de tasa.', interpretation: 'Permite medir y sumar riesgo de tasa entre posiciones.', formula: 'Duration modificada × precio × 0,0001', limits: 'Es local, lineal y depende de moneda y valor nominal.' },
  ] },
  { id: 'bond-credit', title: 'Crédito y operación', metrics: [
    { key: 'spread', label: 'Spread de crédito', format: 'basisPoints', providerKeys: ['creditSpread', 'zSpread', 'optionAdjustedSpread'], definition: 'Rendimiento adicional frente a una curva de referencia.', interpretation: 'Aproxima la compensación exigida por crédito, liquidez y opciones.', formula: 'TIR del bono − tasa de referencia comparable', limits: 'La curva, ley, opción y liquidez elegidas cambian el resultado.' },
    { key: 'interestCoverage', label: 'Cobertura de intereses', format: 'ratio', providerKeys: ['interestCoverage'], definition: 'Capacidad operativa del emisor para pagar intereses.', interpretation: 'Mayor cobertura aporta margen, pero no elimina vencimientos ni riesgo de refinanciación.', formula: 'EBIT / intereses', limits: 'Debe ajustarse por ciclo, moneda y flujo real.' },
    { key: 'bidAskSpread', label: 'Spread comprador/vendedor', format: 'percent', providerKeys: ['bidAskSpreadPercent'], definition: 'Costo implícito entre mejor compra y mejor venta.', interpretation: 'Un spread amplio aumenta el costo de entrar o salir.', formula: '(Venta − compra) / precio medio × 100', limits: 'Cambia por monto, horario y profundidad de mercado.' },
    ...commonMarketMetrics.slice(0, 3),
  ] },
];

const fundGroups = [
  { id: 'fund-operation', title: 'Cartera y operación', metrics: [
    { key: 'nav', label: 'Valor de cuotaparte', format: 'number', providerKeys: ['nav', 'unitValue'], definition: 'Valor neto correspondiente a cada cuotaparte.', interpretation: 'Es la base para medir aportes, rescates y rendimiento.', formula: 'Patrimonio neto / cuotapartes', limits: 'Debe usarse la misma clase, moneda y fecha.' },
    { key: 'expenseRatio', label: 'Gastos totales', format: 'percent', providerKeys: ['expenseRatio', 'totalExpenseRatio'], definition: 'Costos anuales descontados del patrimonio.', interpretation: 'Reducen el valor de cuotaparte de forma continua.', formula: 'Gastos / patrimonio promedio × 100', limits: 'Puede no incluir costos transaccionales o de entrada y salida.' },
    { key: 'redemptionTime', label: 'Plazo de rescate', format: 'text', providerKeys: ['redemptionTime'], definition: 'Tiempo operativo hasta acreditar un rescate.', interpretation: 'Debe coincidir con cuándo podrías necesitar el dinero.', formula: 'Convención contractual: T+0, T+1, etc.', limits: 'Horarios de corte, feriados y eventos excepcionales pueden alterarlo.' },
    { key: 'topIssuerWeight', label: 'Mayor emisor', format: 'percent', providerKeys: ['topIssuerWeight'], definition: 'Peso del emisor más grande dentro del fondo.', interpretation: 'Revela concentración que el número de títulos puede ocultar.', formula: 'Valor del mayor emisor / patrimonio × 100', limits: 'Debe sumar exposiciones directas e indirectas del mismo grupo.' },
  ] },
  { id: 'fund-risk', title: 'Rendimiento y riesgo', metrics: [
    { key: 'portfolioYtm', label: 'TIR de cartera', format: 'percent', providerKeys: ['portfolioYieldToMaturity'], definition: 'TIR ponderada de los instrumentos de renta fija.', interpretation: 'Describe la cartera actual bajo supuestos de cumplimiento, no el retorno garantizado.', formula: 'Promedio ponderado o cálculo por flujos de las tenencias', limits: 'Cambia con precios, rescates, gastos y composición.' },
    { key: 'modifiedDuration', label: 'Duration modificada', format: 'years', providerKeys: ['modifiedDuration'], definition: 'Sensibilidad aproximada del fondo a cambios de tasa.', interpretation: 'Ayuda a alinear la cartera con el horizonte de rescate.', formula: 'Suma ponderada de durations ajustada por derivados', limits: 'No resume riesgo de crédito ni rescates masivos.' },
    { key: 'realReturn', label: 'Retorno real', format: 'percent', signed: true, providerKeys: ['realReturn'], definition: 'Rendimiento luego de descontar inflación comparable.', interpretation: 'Distingue sumar pesos de aumentar poder de compra.', formula: '(1 + retorno nominal) / (1 + inflación) − 1', limits: 'Las fechas y frecuencia deben coincidir.' },
    ...commonMarketMetrics,
  ] },
];

const liquidityGroups = [
  { id: 'fx-operation', title: 'Conversión y ejecución', metrics: [
    { key: 'effectiveFx', label: 'Tipo de cambio efectivo', format: 'number', providerKeys: ['effectiveFxRate'], definition: 'Pesos totales debitados por cada dólar neto acreditado.', interpretation: 'Es la comparación correcta entre alternativas de conversión.', formula: 'Pesos debitados / USD netos', limits: 'Cambia con precios, costos, monto y tiempo de liquidación.' },
    { key: 'bidAskSpread', label: 'Spread', format: 'percent', providerKeys: ['bidAskSpreadPercent'], definition: 'Diferencia relativa entre precios comprador y vendedor.', interpretation: 'Cuanto mayor, más caro resulta entrar y salir.', formula: '(Venta − compra) / precio medio × 100', limits: 'La profundidad puede no alcanzar para todo el monto visible.' },
    { key: 'settlement', label: 'Liquidación', format: 'text', providerKeys: ['settlement'], definition: 'Plazo hasta que dinero y títulos quedan acreditados.', interpretation: 'Define disponibilidad real, no solo la cotización vista.', formula: 'Convención operativa vigente', limits: 'Reglas, feriados y horarios pueden cambiar.' },
    { key: 'volume', label: 'Volumen', format: 'compact', providerKeys: ['10DayAverageTradingVolume', 'averageVolume'], definition: 'Monto o cantidad negociada en una ventana.', interpretation: 'Más volumen suele facilitar ejecución, pero no la garantiza.', formula: 'Promedio de volumen diario', limits: 'No reemplaza profundidad ni spread para el monto concreto.' },
    ...commonMarketMetrics.slice(0, 3),
  ] },
];

export function assetMetricClass(asset) {
  const type = `${asset?.type || ''} ${asset?.simpleType || ''}`.toLowerCase();
  if (asset?.id === 'mep' || type.includes('conversión')) return 'liquidity';
  if (type.includes('bono') || type.includes('obligación negociable') || type.includes('deuda')) return 'bond';
  if (type.includes('etf') || asset?.symbol === 'SPY') return 'etf';
  if (type.includes('fondo') || type.includes('cuotaparte') || asset?.symbol?.startsWith('FCI')) return 'fund';
  return 'equity';
}

const catalogs = { equity: equityGroups, etf: etfGroups, bond: bondGroups, fund: fundGroups, liquidity: liquidityGroups };

// Valores de demostración para probar la interfaz sin credenciales de mercado.
// Nunca se presentan como cotizaciones actuales y cualquier dato del proveedor
// conectado tiene prioridad métrica por métrica.
const equityDemo = {
  pe: 20.8, evEbitda: 9.4, priceBook: 2.8, priceSales: 2.3, peg: 1.6, fcfYield: 4.8,
  roe: 18.5, roa: 7.8, grossMargin: 42, operatingMargin: 18, netMargin: 13,
  revenueGrowth: 8, epsGrowth: 10, fcfGrowth: 9, debtEquity: 1.1, netDebtEbitda: 1.3,
  currentRatio: 1.4, quickRatio: 1.1, interestCoverage: 7.4, dividendYield: 2, payout: 43,
  beta: 1.05, volatility: 24, maxDrawdown: -28, week52Range: [80, 125],
};

const bondDemo = {
  ytm: 12.4, currentYield: 7.8, parity: 92, accruedInterest: 1.8, macaulayDuration: 3.9,
  modifiedDuration: 3.6, convexity: 15.2, dv01: 0.035, spread: 620, interestCoverage: 3.8,
  bidAskSpread: 0.8,
};

const fundDemo = {
  nav: 1.184, expenseRatio: 1.35, redemptionTime: 'T+1', topIssuerWeight: 14.5,
  portfolioYtm: 8.6, modifiedDuration: 1.9, realReturn: 1.2, beta: 0.32,
  volatility: 7.8, maxDrawdown: -4.6, week52Range: [1.08, 1.23],
};

export const referenceMetricValuesById = {
  ypfd: {
    ...equityDemo, pe: 11.8, evEbitda: 4.7, priceBook: 2.1, priceSales: 0.9, peg: 0.9,
    fcfYield: 7.2, roe: 21.4, roa: 6.9, grossMargin: 35.8, operatingMargin: 16.4,
    netMargin: 8.1, revenueGrowth: 14.2, epsGrowth: 18.7, fcfGrowth: 12.1,
    debtEquity: 1.35, netDebtEbitda: 1.75, currentRatio: 1.08, quickRatio: 0.72,
    interestCoverage: 4.6, dividendYield: 0, payout: 0, beta: 1.48, volatility: 43,
    maxDrawdown: -49, week52Range: [28, 55],
  },
  aapl: {
    ...equityDemo, pe: 29.4, evEbitda: 22.7, priceBook: 44.1, priceSales: 7.2, peg: 2.2,
    fcfYield: 3.4, roe: 154, roa: 27.6, grossMargin: 46.2, operatingMargin: 31.4,
    netMargin: 24.8, revenueGrowth: 6.5, epsGrowth: 8.9, fcfGrowth: 7.1,
    debtEquity: 1.52, netDebtEbitda: -0.3, currentRatio: 0.95, quickRatio: 0.82,
    interestCoverage: 26.4, dividendYield: 0.45, payout: 15.2, beta: 1.18,
    volatility: 28.5, maxDrawdown: -31.2, week52Range: [169, 260],
  },
  ggal: {
    ...equityDemo, pe: 8.9, evEbitda: 'No aplica en bancos', priceBook: 2.35, priceSales: 3.1,
    peg: 0.8, fcfYield: 'No comparable', roe: 27.8, roa: 4.1, grossMargin: 'No aplica',
    operatingMargin: 36.5, netMargin: 22.4, revenueGrowth: 12.8, epsGrowth: 21.5,
    fcfGrowth: 'No comparable', debtEquity: 'Usar solvencia regulatoria', netDebtEbitda: 'No aplica',
    currentRatio: 'Usar liquidez bancaria', quickRatio: 'No aplica', interestCoverage: 'Usar margen financiero',
    dividendYield: 1.1, payout: 9.8, beta: 1.62, volatility: 48, maxDrawdown: -54,
    week52Range: [42, 88],
  },
  pamp: {
    ...equityDemo, pe: 9.7, evEbitda: 5.2, priceBook: 1.8, priceSales: 1.5, peg: 1.1,
    fcfYield: 6.1, roe: 16.2, roa: 7.4, grossMargin: 39.6, operatingMargin: 24.2,
    netMargin: 14.7, revenueGrowth: 10.9, epsGrowth: 13.2, fcfGrowth: 8.4,
    debtEquity: 0.72, netDebtEbitda: 1.15, currentRatio: 1.42, quickRatio: 1.18,
    interestCoverage: 8.2, dividendYield: 0, payout: 0, beta: 1.23, volatility: 38,
    maxDrawdown: -42, week52Range: [55, 92],
  },
  ko: {
    ...equityDemo, pe: 24.8, evEbitda: 20.3, priceBook: 9.6, priceSales: 6.1, peg: 2.6,
    fcfYield: 3.6, roe: 41.5, roa: 10.1, grossMargin: 61.2, operatingMargin: 29.5,
    netMargin: 22.3, revenueGrowth: 4.7, epsGrowth: 6.2, fcfGrowth: 5.1,
    debtEquity: 1.62, netDebtEbitda: 2.25, currentRatio: 1.05, quickRatio: 0.86,
    interestCoverage: 8.7, dividendYield: 2.8, payout: 68, beta: 0.58,
    volatility: 17.2, maxDrawdown: -22.4, week52Range: [58, 74],
  },
  spy: {
    expenseRatio: 0.09, aum: 650000000000, holdingsCount: 503, top10Weight: 36.8,
    trackingDifference: -0.12, trackingError: 0.06, premiumDiscount: 0.01,
    sharpe: 1.12, sortino: 1.71, beta: 1, volatility: 18.4, maxDrawdown: -33.7,
    week52Range: [480, 620],
  },
  al30: {
    ...bondDemo, ytm: 19.2, currentYield: 0.78, parity: 64.2, accruedInterest: 0.12,
    macaulayDuration: 2.14, modifiedDuration: 2.03, convexity: 6.34, dv01: 0.013,
    spread: 1180, interestCoverage: 'No aplica al soberano', bidAskSpread: 1.15,
  },
  gd30: {
    ...bondDemo, ytm: 17.9, currentYield: 1.1, parity: 68.1, accruedInterest: 0.16,
    macaulayDuration: 2.31, modifiedDuration: 2.18, convexity: 7.05, dv01: 0.015,
    spread: 1090, interestCoverage: 'No aplica al soberano', bidAskSpread: 0.95,
  },
  ymcxo: {
    ...bondDemo, ytm: 7.4, currentYield: 8, parity: 106.7, accruedInterest: 3.23,
    macaulayDuration: 3.42, modifiedDuration: 3.18, convexity: 13.8, dv01: 0.034,
    spread: 510, interestCoverage: 4.6, bidAskSpread: 0.65,
  },
  fund: {
    ...fundDemo, nav: 1.184, expenseRatio: 1.35, redemptionTime: 'T+1', topIssuerWeight: 14.5,
    portfolioYtm: 8.6, modifiedDuration: 1.9, realReturn: 1.2, beta: 0.32,
    volatility: 7.8, maxDrawdown: -4.6, week52Range: [1.08, 1.23],
  },
  money: {
    ...fundDemo, nav: 1.084, expenseRatio: 2.1, redemptionTime: 'T+0 sujeto a horario',
    topIssuerWeight: 22, portfolioYtm: 36.2, modifiedDuration: 0.05, realReturn: -0.8,
    beta: 0.02, volatility: 1.4, maxDrawdown: -0.35, week52Range: [0.78, 1.12],
  },
  mep: {
    effectiveFx: 1450, bidAskSpread: 0.72, settlement: 'Contado inmediato / según especie',
    volume: 840000000,
  },
};

function valueAtPath(data, key) {
  if (!data || key === undefined) return undefined;
  if (Array.isArray(key)) {
    const values = key.map((item) => valueAtPath(data, item));
    return values.every((value) => value !== undefined && value !== null) ? values : undefined;
  }
  return String(key).split('.').reduce((current, part) => current?.[part], data);
}

function providerValue(metric, providerData) {
  for (const key of metric.providerKeys || []) {
    const value = valueAtPath(providerData?.metrics, key);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

export function formatMetricValue(value, format = 'number', signed = false) {
  if (value === undefined || value === null || value === '') return 'No disponible';
  if (format === 'range' && Array.isArray(value)) return `${formatMetricValue(value[0], 'number')} – ${formatMetricValue(value[1], 'number')}`;
  if (format === 'text') return String(value);
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (format === 'percent') return `${signed && number > 0 ? '+' : ''}${number.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
  if (format === 'ratio') return `${number.toLocaleString('es-AR', { maximumFractionDigits: 2 })}x`;
  if (format === 'years') return `${number.toLocaleString('es-AR', { maximumFractionDigits: 2 })} años`;
  if (format === 'basisPoints') return `${number.toLocaleString('es-AR', { maximumFractionDigits: 0 })} pb`;
  if (format === 'compact') return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(number);
  return number.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

export function buildMetricGroups(asset, providerData = null) {
  const assetClass = assetMetricClass(asset);
  return (catalogs[assetClass] || catalogs.equity).map((group) => ({
    ...group,
    metrics: group.metrics.map((metric) => {
      const liveValue = providerValue(metric, providerData);
      const explicitValue = asset?.metricValues?.[metric.key];
      const demoValue = referenceMetricValuesById[asset?.id]?.[metric.key];
      const seriesValue = metric.fallbackField ? asset?.[metric.fallbackField] : undefined;
      const hasLiveValue = liveValue !== undefined;
      const hasExplicitValue = explicitValue !== undefined && explicitValue !== null;
      const hasDemoValue = demoValue !== undefined && demoValue !== null;
      const hasSeriesValue = seriesValue !== undefined && seriesValue !== null;
      const value = hasLiveValue ? liveValue : hasExplicitValue ? explicitValue : hasDemoValue ? demoValue : seriesValue;
      const sourceKind = hasLiveValue ? 'live' : hasExplicitValue ? 'asset' : hasDemoValue ? 'demo' : hasSeriesValue ? 'series' : 'missing';
      return {
        ...metric,
        rawValue: value,
        displayValue: formatMetricValue(value, metric.format, metric.signed),
        available: sourceKind !== 'missing',
        sourceKind,
        sourceLabel: sourceKind === 'live'
          ? providerData?.sourceLabel || 'Proveedor conectado'
          : sourceKind === 'asset'
            ? asset?.metricSourceLabel || 'Referencia del instrumento'
            : sourceKind === 'demo'
              ? 'Dato demostrativo V6'
              : sourceKind === 'series'
                ? 'Serie ilustrativa V6'
                : 'Pendiente de datos',
        asOf: hasLiveValue ? providerData?.asOf : asset?.priceDate,
      };
    }),
  }));
}

export function metricCoverage(asset, providerData = null) {
  const metrics = buildMetricGroups(asset, providerData).flatMap((group) => group.metrics);
  return {
    total: metrics.length,
    available: metrics.filter((metric) => metric.available).length,
    live: metrics.filter((metric) => metric.sourceKind === 'live').length,
    demo: metrics.filter((metric) => ['asset', 'demo', 'series'].includes(metric.sourceKind)).length,
  };
}
