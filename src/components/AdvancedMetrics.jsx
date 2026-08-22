import { AlertTriangle, Calculator, ChevronDown, ChevronUp, Database, Info, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { assetMetricClass, buildMetricGroups } from '../marketMetrics';

const classLabels = {
  equity: 'acciones y CEDEARs de empresas',
  etf: 'ETF y fondos indexados',
  bond: 'bonos y obligaciones negociables',
  fund: 'fondos comunes de inversión',
  liquidity: 'dólar, conversión y liquidez',
};

function matchesQuery(metric, query) {
  if (!query) return true;
  return `${metric.label} ${metric.definition} ${metric.interpretation} ${metric.formula}`.toLowerCase().includes(query);
}

export function AdvancedMetrics({ asset, providerData = null, embedded = false }) {
  const [expandedMetric, setExpandedMetric] = useState(null);
  const [openGroups, setOpenGroups] = useState({});
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [calculationOpen, setCalculationOpen] = useState(false);
  const assetClass = assetMetricClass(asset);
  const groups = useMemo(() => buildMetricGroups(asset, providerData), [asset, providerData]);
  const metrics = groups.flatMap((group) => group.metrics);
  const availableCount = metrics.filter((metric) => metric.available).length;
  const liveCount = metrics.filter((metric) => metric.sourceKind === 'live').length;
  const demoCount = metrics.filter((metric) => ['asset', 'demo', 'series'].includes(metric.sourceKind)).length;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = groups
    .filter((group) => activeGroup === 'all' || group.id === activeGroup)
    .map((group) => ({
      ...group,
      metrics: group.metrics.filter((metric) => (!onlyAvailable || metric.available) && matchesQuery(metric, normalizedQuery)),
    }))
    .filter((group) => group.metrics.length > 0);
  const technicalFacts = asset.advancedFacts?.length > 0 ? asset.advancedFacts : [
    ['Instrumento', asset.type || 'Activo listado'],
    ['Símbolo', asset.symbol || 'Pendiente'],
    ['Emisor', asset.issuer || asset.name || 'Pendiente de confirmar'],
    ['Cobertura', 'Ficha del catálogo conectado; faltan reglas de elegibilidad para la cartera guiada'],
  ];
  const forcedOpen = Boolean(normalizedQuery) || activeGroup !== 'all' || onlyAvailable;

  return (
    <section className={`advanced-metrics-panel ${embedded ? 'embedded' : ''}`}>
      <header className="advanced-metrics-title">
        <span><Calculator size={21} /></span>
        <div>
          <small>ANÁLISIS DEL INSTRUMENTO</small>
          <h2>Ratios y cálculos</h2>
          <p>Herramientas específicas para {classLabels[assetClass]}. Ningún indicador aislado decide si una inversión conviene.</p>
        </div>
      </header>

      <div className={`metrics-data-status ${liveCount > 0 ? 'live' : 'reference'}`}>
        {liveCount > 0 ? <Database size={15} /> : <AlertTriangle size={15} />}
        <p>
          <b>{liveCount > 0 ? `${liveCount} métricas conectadas al proveedor` : 'Modo demostración V6'}</b>
          {liveCount > 0
            ? ` · ${demoCount} valores de referencia completan la ficha cuando el proveedor no tiene cobertura.`
            : ` · ${availableCount} de ${metrics.length} valores permiten probar el panel. Son ilustrativos y no deben usarse para tomar decisiones reales.`}
        </p>
      </div>

      <section className="advanced-fact-sheet">
        <header><div><small>FICHA TÉCNICA</small><h3>Qué instrumento estás mirando</h3></div><span>{technicalFacts.length} datos</span></header>
        <dl>
          {technicalFacts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </section>

      <section className="metrics-workbench">
        <header><div><small>EXPLORADOR DE RATIOS</small><h3>{availableCount} de {metrics.length} métricas con datos</h3></div><SlidersHorizontal size={17} /></header>
        <label className="metric-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar P/E, duration, volatilidad…" aria-label="Buscar ratios y métricas" />
        </label>
        <div className="metric-group-filters" aria-label="Categorías de métricas">
          <button type="button" className={activeGroup === 'all' ? 'selected' : ''} onClick={() => setActiveGroup('all')}>Todas</button>
          {groups.map((group) => <button type="button" className={activeGroup === group.id ? 'selected' : ''} key={group.id} onClick={() => setActiveGroup(group.id)}>{group.title}</button>)}
        </div>
        <button className={`metrics-availability-toggle ${onlyAvailable ? 'selected' : ''}`} type="button" aria-pressed={onlyAvailable} onClick={() => setOnlyAvailable((current) => !current)}>
          <span aria-hidden="true" /> Solo métricas con datos
        </button>
      </section>

      <div className="metric-groups">
        {filteredGroups.map((group, index) => {
          const open = openGroups[group.id] ?? (forcedOpen || index === 0);
          const groupAvailable = group.metrics.filter((metric) => metric.available).length;
          return (
            <section className={`metric-group ${open ? 'open' : ''}`} key={group.id}>
              <button className="metric-group-toggle" type="button" onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !open }))} aria-expanded={open}>
                <span><b>{group.title}</b><small>{groupAvailable} con datos · {group.metrics.length} herramientas</small></span>{open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
              {open && (
                <div className="metric-grid">
                  {group.metrics.map((metric) => {
                    const metricId = `${group.id}:${metric.key}`;
                    const expanded = expandedMetric === metricId;
                    return (
                      <article className={`metric-tile ${metric.available ? 'available' : 'unavailable'} ${expanded ? 'expanded' : ''}`} key={metric.key}>
                        <div className="metric-tile-main">
                          <span><small>{metric.label}</small><b>{metric.displayValue}</b><em className={metric.sourceKind}>{metric.sourceLabel}</em></span>
                          <button type="button" onClick={() => setExpandedMetric(expanded ? null : metricId)} aria-label={`Explicar ${metric.label}`} aria-expanded={expanded}><Info size={14} /></button>
                        </div>
                        {expanded && (
                          <div className="metric-explanation">
                            <p>{metric.definition}</p>
                            <dl>
                              <div><dt>Cómo leerlo</dt><dd>{metric.interpretation}</dd></div>
                              <div><dt>Fórmula</dt><dd>{metric.formula}</dd></div>
                              <div><dt>Límite</dt><dd>{metric.limits}</dd></div>
                            </dl>
                            {metric.asOf && <small>Fecha o referencia: {metric.asOf}</small>}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
        {filteredGroups.length === 0 && (
          <div className="metrics-empty"><Search size={19} /><b>No encontramos esa herramienta</b><p>Probá otro término o quitá el filtro de disponibilidad.</p><button type="button" onClick={() => { setQuery(''); setActiveGroup('all'); setOnlyAvailable(false); }}>Limpiar filtros</button></div>
        )}
      </div>

      {asset.advancedAnalysis?.length > 0 && (
        <section className="advanced-reading-card">
          <small>CÓMO ANALIZARLO</small>
          <h3>Lectura conjunta, no un semáforo</h3>
          <ul>{asset.advancedAnalysis.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      )}

      {asset.advancedCalculation && (
        <section className={`advanced-calculation-card ${calculationOpen ? 'open' : ''}`}>
          <button type="button" onClick={() => setCalculationOpen((current) => !current)} aria-expanded={calculationOpen}>
            <span><small>CÁLCULO EDUCATIVO</small><b>{asset.advancedCalculation.title}</b></span>
            <em>{calculationOpen ? 'Ocultar' : 'Expandir'}</em>
            {calculationOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
          {calculationOpen && <div><code>{asset.advancedCalculation.formula}</code><p><strong>Ejemplo.</strong> {asset.advancedCalculation.example}</p><p className="calculation-limit"><strong>Límite.</strong> {asset.advancedCalculation.limits}</p></div>}
        </section>
      )}

      <footer className="advanced-metrics-footer"><Database size={14} /><span>Fuente del instrumento: {asset.source || providerData?.sourceLabel || 'proveedor conectado'}</span><time>{asset.priceDate || providerData?.asOf || 'Fecha pendiente'}</time></footer>
    </section>
  );
}
