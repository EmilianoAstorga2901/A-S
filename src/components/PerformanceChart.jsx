const chartPath = (points = []) => {
  if (!points.length) return '';
  const minimum = Math.min(...points);
  const maximum = Math.max(...points);
  const spread = maximum - minimum || 1;
  return points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * 320;
    const y = 78 - ((point - minimum) / spread) * 60;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
};

export function PerformanceChart({ performance, period, onPeriodChange, compact = false }) {
  const selected = performance?.[period] || performance?.month || { return: 0, points: [0, 0] };
  const path = chartPath(selected.points);
  const positive = selected.return >= 0;

  return (
    <section className={`performance-chart ${compact ? 'compact' : ''}`}>
      <div className="performance-chart-head">
        <div>
          <small>Rendimiento {period === 'month' ? 'del último mes' : 'del último año'}</small>
          <strong className={positive ? 'positive' : 'negative'}>{positive ? '+' : ''}{selected.return.toFixed(1)}%</strong>
        </div>
        <div className="chart-periods" role="group" aria-label="Período del gráfico">
          <button type="button" className={period === 'month' ? 'selected' : ''} onClick={() => onPeriodChange('month')}>1 mes</button>
          <button type="button" className={period === 'year' ? 'selected' : ''} onClick={() => onPeriodChange('year')}>1 año</button>
        </div>
      </div>
      <svg viewBox="0 0 320 92" role="img" aria-label={`Evolución simulada: ${selected.return.toFixed(1)}%`}>
        <defs>
          <linearGradient id={`chart-fill-${period}-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".24" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 320 90 L 0 90 Z`} fill={`url(#chart-fill-${period}-${positive ? 'up' : 'down'})`} />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="chart-caption"><span>{selected.startLabel || (period === 'month' ? 'Hace 30 días' : 'Hace 12 meses')}</span><b>Datos ilustrativos</b><span>Hoy</span></div>
      <p>El rendimiento pasado sirve para observar movimientos; no anticipa el resultado futuro.</p>
    </section>
  );
}
