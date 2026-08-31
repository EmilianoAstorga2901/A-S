import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Flame,
  List,
  MessageCircle,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { ActionGrid } from './components/ActionGrid';
import { InvestmentCard } from './components/InvestmentCard';
import { PromotionCard } from './components/PromotionCard';
import { BottomNav } from './components/BottomNav';
import { PerformanceChart } from './components/PerformanceChart';
import { NewsFeed } from './components/NewsFeed';
import { AssetLogo } from './components/AssetLogo';
import { assets, calendarEvents, portfolios, quickActions, services, user } from './data/MockData';
import { normalizeLiveNews, referenceNews } from './data/newsData';
import { getMarketNews } from './marketApi';
import { buildPortfolioProposal } from './prismaEngine';
import { goalLabels, horizonLabels } from './profile';
import { Onboarding } from './features/Onboarding';
import { Explore } from './features/Explore';
import { AssetDetail } from './features/AssetDetail';
import { MarketAssetDetail } from './features/MarketAssetDetail';
import { PortfolioComplete, PortfolioReview, PurchaseConfirmation } from './features/PortfolioReview';
import { addBehaviorSignal, setExplanationPreference } from './investorMap';
import { clearPrismaStorage, createDemoProfileResult, initializeDemoStorage } from './demoMode';
import { isPersistenceSuccess, loadInvestorState, readStorageText, saveLegacyProfileResult, writeStorageText } from './investorStateRepository';
import { projectInvestorStateToLegacy } from './investorState';
import './extended.css';
import './prisma-enhanced.css';

const ars = (value) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
const usd = (value) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const money = (value, currency) => currency === 'USD' ? usd(value) : ars(value);
const visualAssetFor = (item) => assets.find((asset) => asset.symbol === item.symbol) || {
  symbol: item.symbol,
  name: item.name,
  issuer: item.issuer || item.name,
  type: item.type || item.name,
};

const parseSaleInstruction = (command, portfolio) => {
  const normalized = command.toLowerCase().replace(',', '.');
  const holding = portfolio.holdings.find((item) => {
    const symbol = item.symbol.toLowerCase();
    const words = item.name.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
    return normalized.includes(symbol) || words.some((word) => normalized.includes(word));
  });
  if (!holding) return { error: 'No pude identificar el activo. Escribí su símbolo, por ejemplo SPY o AL30.' };
  const wantsAll = /\btodo\b|\btoda\b|100\s*%/.test(normalized);
  const percentageMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
  const percentage = wantsAll ? 100 : Number(percentageMatch?.[1]);
  if (!percentage || percentage <= 0 || percentage > 100) return { error: 'Indicá qué porcentaje querés vender, por ejemplo 10%, o escribí “todo”.' };
  return {
    portfolioId: portfolio.id,
    holdingSymbol: holding.symbol,
    percentage,
    estimatedAmount: holding.currentValue * percentage / 100,
    source: 'prisma',
    returnScreen: `portfolio:${portfolio.id}`,
  };
};

function SectionTitle({ children, action, onAction }) {
  return <div className="section-title"><h2>{children}</h2>{action && <button type="button" onClick={onAction}>{action}</button>}</div>;
}

export function BackHeader({ title, subtitle, onBack }) {
  return (
    <header className="sub-header">
      <button className="round-back" type="button" onClick={onBack} aria-label="Volver"><ArrowLeft size={20} /></button>
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    </header>
  );
}

function Home({ setScreen, inform }) {
  return (
    <>
      <div className="page-top"><Header user={user} onNotify={() => inform('No tenés notificaciones nuevas')} /><BalanceCard balance={user.balance} onDeposit={() => inform('Ingresar dinero')} onActivity={() => inform('Actividad: próximamente')} /></div>
      <SectionTitle>Acciones rápidas</SectionTitle><ActionGrid items={quickActions} onSelect={inform} />
      <SectionTitle action="Ver todos">Servicios</SectionTitle><ActionGrid items={services} variant="services" onSelect={inform} />
      <InvestmentCard user={user} onOpen={() => setScreen('investments')} />
      <SectionTitle action="Ver todos">Beneficios para vos</SectionTitle><PromotionCard />
      <p className="legal-note">Los rendimientos son simulados y no garantizan resultados futuros.</p>
    </>
  );
}

function InvestmentDashboard({ setScreen, onStartDemo, onResetPrisma, hasPrismaData }) {
  const [period, setPeriod] = useState('month');
  const [newsItems, setNewsItems] = useState(referenceNews);
  const featuredPortfolio = portfolios[0];
  useEffect(() => {
    const controller = new AbortController();
    const ids = { AAPL: 'aapl', SPY: 'spy', KO: 'ko' };
    getMarketNews(Object.keys(ids), controller.signal)
      .then((result) => {
        if (!result.news?.length) return;
        setNewsItems(result.news.map((item) => ({
          ...normalizeLiveNews(item, ids),
          affectedPortfolioIds: ['future'],
          relevance: `La noticia se relaciona con ${item.symbol}; “Mi futuro” contiene SPY y puede compartir factores o posiciones.`,
        })));
      })
      .catch(() => setNewsItems(referenceNews));
    return () => controller.abort();
  }, []);
  return (
    <>
      <BackHeader title="Inversiones" subtitle="Tu dinero, tus carteras y el mercado" onBack={() => setScreen('home')} />
      <section className="demo-entry-card">
        <span><Sparkles size={20} /></span>
        <div><small>RECORRIDO PARA PRESENTAR</small><b>Modo demo documentado</b><p>Precarga un caso de 22 años, jubilación y USD 200 por mes. Podés reiniciarlo sin tocar las carteras de ejemplo de V6.</p></div>
        <button type="button" onClick={onStartDemo}>Iniciar demo</button>
        {hasPrismaData && <button type="button" className="demo-reset-data" onClick={onResetPrisma}><Trash2 size={14} />Borrar datos de Prisma</button>}
      </section>
      <section className="money-overview">
        <span>Resumen de tu dinero</span><strong>{ars(user.balance + user.investedArs + user.investedUsdArs)}</strong>
        <div className="money-grid"><div><small>Disponible</small><b>{ars(user.balance)}</b></div><div><small>Invertido en pesos</small><b>{ars(user.investedArs)}</b></div><div><small>Invertido en dólares</small><b>{usd(user.investedUsd)}</b></div></div>
      </section>
      <SectionTitle action="Ver activos" onAction={() => setScreen('asset-list')}>Mis carteras</SectionTitle>
      <div className="portfolio-strip">
        {portfolios.map((portfolio) => (
          <button className="portfolio-card" type="button" key={portfolio.id} onClick={() => setScreen(`portfolio:${portfolio.id}`)}>
            <span className={`portfolio-icon ${portfolio.tone}`}><WalletCards size={19} /></span><small>{portfolio.objective}</small><h3>{portfolio.name}</h3><b>{portfolio.currency === 'USD' ? usd(portfolio.value) : ars(portfolio.value)}</b><em className={portfolio.return >= 0 ? 'positive' : 'negative'}>{portfolio.return >= 0 ? '+' : ''}{portfolio.return}%</em>
          </button>
        ))}
        <button className="new-portfolio" type="button" onClick={() => setScreen('portfolio-choice')}><Plus size={24} /><b>Nueva cartera</b><span>Elegí cómo armarla</span></button>
      </div>
      <button className="catalog-entry" type="button" onClick={() => setScreen('asset-list')}>
        <span><List size={21} /></span>
        <div><b>Ver todos los activos</b><small>Buscá y recorré la lista libremente, sin cuestionario.</small></div>
        <ChevronRight size={18} />
      </button>
      <SectionTitle>Herramientas</SectionTitle>
      <div className="tool-grid">
        <button type="button" onClick={() => setScreen('thermometer')}><span className="tool-icon hot"><Flame size={22} /></span><div><b>Termómetro</b><small>Tensión del mercado</small></div><ChevronRight size={18} /></button>
        <button type="button" onClick={() => setScreen('calendar')}><span className="tool-icon"><CalendarDays size={22} /></span><div><b>Calendario</b><small>Próximos eventos</small></div><ChevronRight size={18} /></button>
      </div>
      <SectionTitle action="Ver detalle" onAction={() => setScreen('portfolio:future')}>Rendimiento</SectionTitle>
      <section className="dashboard-performance">
        <div className="dashboard-performance-total"><div><small>Ganancia total de “Mi futuro”</small><strong className="positive">+{usd(featuredPortfolio.generatedReturn)}</strong></div><span>Desde el primer aporte · sin mezclar depósitos</span></div>
        <PerformanceChart performance={featuredPortfolio.performance} period={period} onPeriodChange={setPeriod} compact />
      </section>
      <button className="assistant-preview" type="button" onClick={() => setScreen('assistant')}><span><MessageCircle size={22} /></span><div><b>Asistente operativo</b><small>Simulá retiros y cambios antes de confirmar</small></div><ChevronRight size={18} /></button>
      <NewsFeed
        items={newsItems}
        onOpenAsset={(assetId) => {
          sessionStorage.setItem('prisma-explore-origin', 'investments');
          setScreen(`asset:${assetId}`);
        }}
      />
    </>
  );
}

function SaleCommandBox({ portfolio, onPrepareSale, compact = false }) {
  const [command, setCommand] = useState('');
  const [interpretation, setInterpretation] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    if (!command.trim()) return;
    setInterpretation(parseSaleInstruction(command, portfolio));
  };

  return (
    <section className={`sale-command-box ${compact ? 'compact' : ''}`}>
      <div className="sale-command-title"><span><MessageCircle size={20} /></span><div><b>Si no sabés cómo vender, escribile a Prisma</b><small>Prisma interpreta la instrucción y te muestra una simulación antes de confirmar.</small></div></div>
      <form onSubmit={submit}><input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Ejemplo: vendé un 10% de SPY" aria-label="Instrucción de venta para Prisma" /><button type="submit" aria-label="Interpretar instrucción"><Send size={17} /></button></form>
      <div className="sale-examples"><button type="button" onClick={() => setCommand(`Vendé 10% de ${portfolio.holdings[0]?.symbol}`)}>Vender 10%</button><button type="button" onClick={() => setCommand(`Vendé todo ${portfolio.holdings.at(-1)?.symbol}`)}>Vender todo</button></div>
      {interpretation?.error && <p className="sale-error">{interpretation.error}</p>}
      {interpretation && !interpretation.error && (
        <div className="sale-interpretation">
          <span>Prisma entendió</span>
          <b>Vender {interpretation.percentage}% de {interpretation.holdingSymbol}</b>
          <p>Monto estimado: {money(interpretation.estimatedAmount, portfolio.currency)}. Todavía no se ejecutó nada.</p>
          <button type="button" onClick={() => onPrepareSale(interpretation)}>Revisar la venta</button>
        </div>
      )}
    </section>
  );
}

function PortfolioDetail({ id, setScreen, onPrepareSale }) {
  const portfolio = portfolios.find((item) => item.id === id) || portfolios[0];
  const [period, setPeriod] = useState('month');
  const openManualSale = (holdingSymbol = portfolio.holdings[0]?.symbol) => onPrepareSale({
    portfolioId: portfolio.id,
    holdingSymbol,
    percentage: 10,
    source: 'manual',
    returnScreen: `portfolio:${portfolio.id}`,
  });
  return (
    <>
      <BackHeader title={portfolio.name} subtitle={portfolio.objective} onBack={() => setScreen('investments')} />
      <section className="portfolio-hero enhanced-portfolio-hero">
        <small>Valor actual</small><strong>{money(portfolio.value, portfolio.currency)}</strong><span className="positive">+{portfolio.return}% · {money(portfolio.generatedReturn, portfolio.currency)} generado</span>
        <div className="portfolio-summary-grid"><div><small>Monto invertido</small><b>{money(portfolio.investedAmount, portfolio.currency)}</b></div><div><small>Hoy</small><b className={portfolio.dailyReturn >= 0 ? 'positive' : 'negative'}>{portfolio.dailyReturn >= 0 ? '+' : ''}{portfolio.dailyReturn}%</b></div><div><small>Rendimiento total</small><b className="positive">+{portfolio.return}%</b></div></div>
      </section>
      <div className="portfolio-chart-wrap"><PerformanceChart performance={portfolio.performance} period={period} onPeriodChange={setPeriod} /></div>
      <SectionTitle>Activos de la cartera</SectionTitle>
      <div className="holding-list detailed-holdings">{portfolio.holdings.map((holding) => (
        <article key={holding.symbol}>
          <div className="holding-main"><AssetLogo asset={visualAssetFor(holding)} size="small" /><div><b>{holding.symbol} · {holding.name}</b><small>{holding.price} · {holding.weight}% de la cartera</small></div><span className={holding.dailyReturn >= 0 ? 'positive' : 'negative'}>{holding.dailyReturn >= 0 ? '+' : ''}{holding.dailyReturn}% hoy</span></div>
          <dl><div><dt>Monto invertido</dt><dd>{money(holding.investedAmount, portfolio.currency)}</dd></div><div><dt>Valor actual</dt><dd>{money(holding.currentValue, portfolio.currency)}</dd></div><div><dt>Rendimiento generado</dt><dd className={holding.generatedReturn >= 0 ? 'positive' : 'negative'}>{holding.generatedReturn >= 0 ? '+' : ''}{money(holding.generatedReturn, portfolio.currency)} · {holding.return >= 0 ? '+' : ''}{holding.return}%</dd></div></dl>
          <button type="button" onClick={() => openManualSale(holding.symbol)}>Vender manualmente</button>
        </article>
      ))}</div>
      <section className="movement-note"><CircleDollarSign size={21} /><div><b>Rendimiento real, sin mezclar aportes</b><p>Aportes y retiros se muestran por separado para que veas cuánto ganó realmente la cartera.</p></div></section>
      <SaleCommandBox portfolio={portfolio} onPrepareSale={onPrepareSale} />
      <div className="dual-actions portfolio-operations"><button type="button" onClick={() => setScreen('asset-list')}>Agregar activos</button><button type="button" onClick={() => openManualSale()}>Venta manual</button></div>
    </>
  );
}

function PortfolioPathChoice({ setScreen }) {
  return (
    <>
      <BackHeader title="Nueva cartera" subtitle="Elegí cómo querés armarla" onBack={() => setScreen('investments')} />
      <section className="path-choice-intro">
        <span>VOS DECIDÍS CUÁNTA AYUDA QUERÉS</span>
        <h2>¿Querés armarla con Prisma o por tu cuenta?</h2>
        <p>Las dos opciones crean una cartera simulada. Podés cambiar de camino antes de confirmarla.</p>
      </section>
      <div className="path-choices">
        <button type="button" onClick={() => setScreen('onboarding')}>
          <span className="path-icon guided"><Sparkles size={24} /></span>
          <div>
            <b>Armarla con Prisma</b>
            <p>Respondé preguntas breves y recorré flash cards ordenadas para completar una propuesta.</p>
            <small>Recomendado si estás empezando o querés una guía.</small>
          </div>
          <ChevronRight size={20} />
        </button>
        <button type="button" onClick={() => setScreen('asset-list')}>
          <span className="path-icon manual"><List size={24} /></span>
          <div>
            <b>Armarla por mi cuenta</b>
            <p>Entrá directamente a la lista completa, buscá activos y agregá los que quieras.</p>
            <small>Sin preguntas y sin flash cards.</small>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </>
  );
}

function ToolsPage({ type, setScreen }) {
  const thermometer = type === 'thermometer';
  return (
    <>
      <BackHeader title={thermometer ? 'Termómetro del mercado' : 'Calendario financiero'} subtitle={thermometer ? 'Contexto, no una señal de compra o venta' : 'Eventos relevantes para tus carteras'} onBack={() => setScreen('investments')} />
      {thermometer ? (
        <><section className="thermometer-card"><small>Tensión actual</small><div className="temp-score"><strong>68</strong><span>/100</span></div><h2>Mercado caliente</h2><div className="temperature-bar"><i /></div><p>Hay más volatilidad y precios exigentes que lo habitual. No significa que el mercado vaya a caer.</p></section><div className="factor-list"><h3>¿Qué mueve el indicador?</h3>{[['Volatilidad', 'Alta', 'warning'], ['Valuaciones', 'Por encima del promedio', 'warning'], ['Liquidez', 'Normal', 'ok'], ['Eventos cercanos', '3 relevantes', 'neutral']].map(([label, value, tone]) => <div key={label}><span>{label}</span><b className={tone}>{value}</b></div>)}</div></>
      ) : <div className="event-list">{calendarEvents.map((event) => <article key={event.id}><time><b>{event.day}</b><span>{event.month}</span></time><div><span className={`event-tag ${event.tone}`}>{event.type}</span><h3>{event.title}</h3><p>{event.impact}</p></div></article>)}</div>}
    </>
  );
}

const explanationLabels = { simple: 'Simple', intermediate: 'Intermedio', advanced: 'Avanzado' };

function mapValue(value, score = true) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Sin preferencias';
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    return entries.length ? entries.map(([key, item]) => `${key}: ${item > 0 ? '+' : ''}${item}`).join(' · ') : 'Sin señales todavía';
  }
  if (typeof value === 'number') return score ? `${value}/100` : String(value);
  return String(value ?? 'Sin datos');
}

export function InvestorMapPanel({ result, onEdit, onReset, onExplanationChange }) {
  const map = result?.investorMap;
  const knowledge = result?.knowledge;
  if (!map) return null;
  const summary = map.vectorSummary;
  return (
    <section className="investor-map-panel">
      <header><span><BrainCircuit size={21} /></span><div><small>MAPA DINÁMICO · {map.version}</small><h2>Cómo Prisma te está entendiendo</h2><p>Podés abrir cada rama, ver su evidencia y corregirla. No es un diagnóstico psicológico.</p></div></header>
      <div className="investor-vector-summary">
        <div><b>{summary.capacity}</b><span>Capacidad</span></div>
        <div><b>{summary.tolerance}</b><span>Tolerancia</span></div>
        <div><b>{summary.knowledge}</b><span>Conocimiento</span></div>
        <div><b>{summary.horizon}</b><span>Plazo</span></div>
      </div>
      <div className="investor-tree">
        {map.vector.map((branch) => (
          <details key={branch.key} open={branch.key === 'safety' || branch.key === 'knowledge'}>
            <summary><span className={`tree-icon ${branch.key}`}>{branch.key === 'safety' ? <ShieldCheck size={16} /> : branch.key === 'goal' ? <Target size={16} /> : branch.key === 'knowledge' ? <BrainCircuit size={16} /> : <SlidersHorizontal size={16} />}</span><div><b>{branch.label}</b><small>{branch.safetyImpact === 'binding' ? 'Define límites' : branch.safetyImpact === 'bounded' ? 'Opera dentro de los límites' : 'No cambia el riesgo'}</small></div><em>{branch.confidence}% confianza</em></summary>
            <p>{branch.description}</p>
            <dl>{Object.entries(branch.children).map(([key, item]) => (
              <div key={key}><dt>{item.label || key.replaceAll(/([A-Z])/g, ' $1')}</dt><dd><b>{mapValue(item.value, branch.key !== 'behavior')}</b><span>{item.evidence}</span></dd></div>
            ))}</dl>
          </details>
        ))}
      </div>
      <div className="explanation-control">
        <div><b>Nivel de explicación</b><span>La evaluación sugiere {knowledge?.label || 'En desarrollo'}, pero vos tenés el control.</span></div>
        <div>{Object.entries(explanationLabels).map(([level, label]) => <button type="button" key={level} className={result.profile.explanation_level === level ? 'selected' : ''} onClick={() => onExplanationChange(level)}>{label}</button>)}</div>
      </div>
      <ul className="map-guardrails">{map.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}</ul>
      <div className="map-actions"><button type="button" onClick={onEdit}>Corregir respuestas</button><button type="button" onClick={onReset}><RotateCcw size={14} />Reiniciar perfil</button></div>
    </section>
  );
}

function StartingPoint({ result, setScreen, onUseProposal, onResetProfile, onExplanationChange }) {
  const profile = result?.profile;
  const answers = result?.answers;
  if (!profile || !answers) return null;
  const allocation = profile.allocation;
  const amount = answers.contribution?.unsure
    ? 'A confirmar'
    : `${answers.contribution?.currency || 'ARS'} ${Number(answers.contribution?.amount || 0).toLocaleString('es-AR')}/mes`;
  return (
    <>
      <BackHeader title="Tu punto de partida" onBack={() => setScreen('onboarding')} />
      <section className="starting-card enhanced-starting">
        <Sparkles size={25} /><span>PERFIL RECOMENDADO</span><h1>{profile.profile}</h1>
        <p>{profile.contradiction}</p>
        <div><small>Capacidad<b>{profile.capacity}</b></small><small>Tolerancia<b>{profile.tolerance}</b></small><small>Reglas<b>{profile.rules_version}</b></small></div>
      </section>
      <section className="starting-explanation">
        <h2>Por qué llegamos a este resultado</h2>
        <ul>{profile.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        {profile.warnings?.map((warning) => <p className="profile-warning" key={warning}>{warning}</p>)}
      </section>
      <InvestorMapPanel result={result} onEdit={() => setScreen('onboarding')} onReset={onResetProfile} onExplanationChange={onExplanationChange} />
      <section className="proposal enhanced-proposal">
        <h2>Propuesta inicial por función</h2>
        <p>No es una compra. Es una estructura educativa que después completás o ajustás con las flash cards.</p>
        <div className="allocation four"><i style={{ width: `${allocation.liquidity}%` }} /><i style={{ width: `${allocation.stability}%` }} /><i style={{ width: `${allocation.growth}%` }} /><i style={{ width: `${allocation.satellite}%` }} /></div>
        <ul>
          <li><span className="dot liquidity" />Liquidez <b>{allocation.liquidity}%</b></li>
          <li><span className="dot stability" />Estabilidad <b>{allocation.stability}%</b></li>
          <li><span className="dot growth" />Crecimiento <b>{allocation.growth}%</b></li>
          <li><span className="dot satellite" />Complementos de la cartera <b>{allocation.satellite}%</b></li>
        </ul>
        <dl className="starting-data"><div><dt>Objetivo</dt><dd>{goalLabels[answers.goal]}</dd></div><div><dt>Horizonte</dt><dd>{horizonLabels[answers.horizon]}</dd></div><div><dt>Aporte</dt><dd>{amount}</dd></div></dl>
      </section>
      <div className="starting-actions"><button type="button" onClick={onUseProposal}>Ver cartera propuesta</button><button type="button" onClick={() => setScreen('asset-list')}>Explorar por mi cuenta</button></div>
    </>
  );
}

function Saved({ setScreen, assetStates, setAssetStates }) {
  const [tab, setTab] = useState('saved');
  const tabs = [['saved', 'Guardados'], ['portfolio', 'En cartera'], ['discarded', 'Descartados'], ['seen', 'Vistos']];
  const selected = assets.filter((asset) => assetStates[asset.id] === tab);
  return (
    <>
      <BackHeader title="Tus decisiones" subtitle="Todo se puede cambiar" onBack={() => setScreen(sessionStorage.getItem('prisma-explore-origin') || 'asset-list')} />
      <div className="decision-tabs">{tabs.map(([value, label]) => <button type="button" className={tab === value ? 'selected' : ''} key={value} onClick={() => setTab(value)}>{label}<b>{assets.filter((asset) => assetStates[asset.id] === value).length}</b></button>)}</div>
      <section className="decision-group enhanced-decisions">
        {selected.length ? selected.map((asset) => (
          <div key={asset.id}><AssetLogo asset={asset} size="small" /><button type="button" className="decision-open" onClick={() => setScreen(`asset:${asset.id}`)}><b>{asset.symbol} · {asset.name}</b><small>{asset.type}</small></button><button type="button" onClick={() => setAssetStates((states) => ({ ...states, [asset.id]: tab === 'discarded' ? 'seen' : 'discarded' }))}>{tab === 'discarded' ? 'Restaurar' : 'Quitar'}</button></div>
        )) : <p>Todavía no hay activos en esta sección.</p>}
      </section>
    </>
  );
}

function Assistant({ setScreen, inform, onPrepareSale }) {
  const [percent, setPercent] = useState(20);
  const [portfolioId, setPortfolioId] = useState(portfolios[0].id);
  const portfolio = portfolios.find((item) => item.id === portfolioId) || portfolios[0];
  return (
    <>
      <BackHeader title="Asistente operativo" subtitle="Interpreta y simula; nunca vende sin confirmación" onBack={() => setScreen('investments')} />
      <section className="assistant-card assistant-selector"><span><MessageCircle size={25} /></span><h2>¿Sobre qué cartera querés operar?</h2><p>Elegí una cartera y escribí la instrucción con tus palabras.</p><select value={portfolioId} onChange={(event) => setPortfolioId(event.target.value)}>{portfolios.map((item) => <option key={item.id} value={item.id}>{item.name} · {money(item.value, item.currency)}</option>)}</select></section>
      <SaleCommandBox key={portfolio.id} portfolio={portfolio} onPrepareSale={onPrepareSale} />
      <section className="withdrawal"><h2>Retiro proporcional de toda la cartera</h2><label>Porcentaje a retirar <b>{percent}%</b></label><input type="range" min="5" max="80" step="5" value={percent} onChange={(event) => setPercent(Number(event.target.value))} /><div><span>Recibirías aproximadamente</span><strong>{money(portfolio.value * percent / 100, portfolio.currency)}</strong></div><p>Esta opción reparte la venta entre las posiciones. Si querés vender un activo específico, escribilo arriba o usá la venta manual.</p><button type="button" onClick={() => inform('Simulación lista · Todavía no se ejecutó ninguna operación')}>Ver impacto en la cartera</button></section>
      <button className="manual-sale-entry" type="button" onClick={() => onPrepareSale({ portfolioId: portfolio.id, holdingSymbol: portfolio.holdings[0]?.symbol, percentage: 10, source: 'manual', returnScreen: 'assistant' })}>Prefiero vender manualmente</button>
    </>
  );
}

function SaleSimulator({ draft, setScreen, inform }) {
  const portfolio = portfolios.find((item) => item.id === draft?.portfolioId) || portfolios[0];
  const [holdingSymbol, setHoldingSymbol] = useState(draft?.holdingSymbol || portfolio.holdings[0]?.symbol);
  const [mode, setMode] = useState(draft?.percentage === 100 ? 'all' : 'percent');
  const [percentage, setPercentage] = useState(draft?.percentage || 10);
  const [confirmed, setConfirmed] = useState(false);
  const holding = portfolio.holdings.find((item) => item.symbol === holdingSymbol) || portfolio.holdings[0];
  const salePercentage = mode === 'all' ? 100 : Number(percentage);
  const estimatedAmount = holding.currentValue * salePercentage / 100;
  const remainingAmount = holding.currentValue - estimatedAmount;

  if (confirmed) {
    return (
      <>
        <BackHeader title="Venta simulada" subtitle="No se envió una orden real" onBack={() => setScreen(draft?.returnScreen || `portfolio:${portfolio.id}`)} />
        <section className="sale-complete"><span><Check size={28} /></span><h1>La simulación quedó preparada</h1><p>La instrucción sería vender {salePercentage}% de {holding.symbol} por aproximadamente {money(estimatedAmount, portfolio.currency)}.</p><div><b>En una integración real</b><small>La entidad mostraría precio, cantidad, costos y vigencia de la orden antes de pedir una confirmación final.</small></div><button type="button" onClick={() => setScreen(`portfolio:${portfolio.id}`)}>Volver a la cartera</button></section>
      </>
    );
  }

  return (
    <>
      <BackHeader title="Vender una inversión" subtitle={draft?.source === 'prisma' ? 'Prisma interpretó tu pedido; revisalo' : 'Carga manual'} onBack={() => setScreen(draft?.returnScreen || `portfolio:${portfolio.id}`)} />
      <section className="manual-sale-card">
        <div className="sale-safety"><Sparkles size={18} /><p><b>Nada se vende automáticamente.</b> Elegí el activo y el monto; después revisá la simulación.</p></div>
        <label>Activo de {portfolio.name}<select value={holdingSymbol} onChange={(event) => setHoldingSymbol(event.target.value)}>{portfolio.holdings.map((item) => <option value={item.symbol} key={item.symbol}>{item.symbol} · {item.name}</option>)}</select></label>
        <div className="sale-position"><div><small>Valor actual de la posición</small><strong>{money(holding.currentValue, portfolio.currency)}</strong></div><span className={holding.dailyReturn >= 0 ? 'positive' : 'negative'}>{holding.dailyReturn >= 0 ? '+' : ''}{holding.dailyReturn}% hoy</span></div>
        <div className="sale-mode"><button type="button" className={mode === 'percent' ? 'selected' : ''} onClick={() => setMode('percent')}>Vender una parte</button><button type="button" className={mode === 'all' ? 'selected' : ''} onClick={() => setMode('all')}>Vender todo</button></div>
        {mode === 'percent' && <label>Porcentaje a vender <b>{percentage}%</b><input type="range" min="1" max="99" value={percentage} onChange={(event) => setPercentage(Number(event.target.value))} /></label>}
      </section>
      <section className="sale-preview-card"><span>SIMULACIÓN ANTES DE CONFIRMAR</span><h2>Vender {salePercentage}% de {holding.symbol}</h2><dl><div><dt>Monto estimado de la venta</dt><dd>{money(estimatedAmount, portfolio.currency)}</dd></div><div><dt>Quedaría invertido en {holding.symbol}</dt><dd>{money(remainingAmount, portfolio.currency)}</dd></div><div><dt>Precio usado</dt><dd>{holding.price}</dd></div></dl><p>El precio final y los costos pueden cambiar. La maqueta no envía órdenes al mercado.</p><button type="button" onClick={() => { setConfirmed(true); inform('Venta simulada preparada'); }}>Confirmar simulación</button></section>
    </>
  );
}

function readStoredProfile() {
  return loadInvestorState(localStorage).legacyProfileResult;
}

function readStoredAssetStates() {
  try {
    return JSON.parse(localStorage.getItem('prisma-asset-states')) || {};
  } catch {
    return {};
  }
}

function useProfilePersistence(storage, initializer = () => loadInvestorState(storage).legacyProfileResult) {
  const [profileResult, setProfileResult] = useState(initializer);
  const persistProfileResult = (result, changedDomains) => {
    if (!result) return { ok: false, status: 'invalid' };
    const outcome = saveLegacyProfileResult(storage, result, { changedDomains });
    if (isPersistenceSuccess(outcome)) setProfileResult(projectInvestorStateToLegacy(outcome.state));
    return outcome;
  };
  return { profileResult, setProfileResult, persistProfileResult };
}

export function ProfilePersistenceBoundary({ storage, initialResult, children }) {
  return children(useProfilePersistence(storage, () => initialResult));
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [active, setActive] = useState('Inicio');
  const [toast, setToast] = useState('');
  const [assetStates, setAssetStates] = useState(readStoredAssetStates);
  const { profileResult, setProfileResult, persistProfileResult } = useProfilePersistence(localStorage, readStoredProfile);
  const [isDemo, setIsDemo] = useState(() => readStorageText(localStorage, 'prisma-demo-mode').value === 'true');
  const [saleDraft, setSaleDraft] = useState(null);
  const [purchaseDraft, setPurchaseDraft] = useState(null);
  const persistedAssetStates = useRef(Object.keys(assetStates).length ? JSON.stringify(assetStates) : null);

  const inform = (message) => {
    setToast(message);
    window.clearTimeout(inform.timer);
    inform.timer = window.setTimeout(() => setToast(''), 2400);
  };

  const navigate = (name) => {
    setActive(name);
    if (name === 'Inicio') setScreen('home');
    else if (name === 'Invertir') setScreen('investments');
    else inform(`${name}: próximamente`);
  };

  useEffect(() => {
    const serialized = Object.keys(assetStates).length ? JSON.stringify(assetStates) : null;
    if (serialized === persistedAssetStates.current) return;
    if (serialized) localStorage.setItem('prisma-asset-states', serialized);
    else localStorage.removeItem('prisma-asset-states');
    persistedAssetStates.current = serialized;
  }, [assetStates]);

  const startDemo = () => {
    const result = createDemoProfileResult();
    const initialized = initializeDemoStorage(result);
    if (!initialized.ok) return;
    setProfileResult(projectInvestorStateToLegacy(initialized.persistence.state));
    setAssetStates({});
    setSaleDraft(null);
    setPurchaseDraft(null);
    setIsDemo(true);
    writeStorageText(localStorage, 'prisma-demo-mode', 'true');
    setActive('Invertir');
    setScreen('starting-point');
    inform('Modo demo iniciado. El caso se puede reiniciar en cualquier momento.');
  };

  const resetPrismaData = () => {
    const cleared = clearPrismaStorage();
    if (!cleared.ok) return;
    setProfileResult(null);
    setAssetStates({});
    setSaleDraft(null);
    setPurchaseDraft(null);
    setIsDemo(false);
    setActive('Invertir');
    setScreen('investments');
    inform('Se borraron el perfil y las decisiones de Prisma. Las carteras de ejemplo de V6 siguen intactas.');
  };

  const requestResetPrismaData = () => {
    if (window.confirm('¿Querés borrar el perfil, las respuestas y las decisiones guardadas dentro de Prisma? Las carteras de ejemplo de V6 no se modifican.')) resetPrismaData();
  };

  const recordBehavior = (type, metadata = {}) => {
    persistProfileResult(addBehaviorSignal(profileResult, type, metadata), ['behavior']);
  };

  const changeExplanationLevel = (level) => {
    const saved = persistProfileResult(setExplanationPreference(profileResult, level), ['preferences']);
    if (isPersistenceSuccess(saved)) inform(`Prisma va a usar explicaciones de nivel ${explanationLabels[level].toLowerCase()}.`);
  };

  const useInitialProposal = () => {
    const proposal = buildPortfolioProposal(assets, profileResult, {}, { goalCurrency: 'undefined' });
    const selectedIds = proposal?.selectedIds || [];
    setAssetStates((states) => {
      const next = { ...states };
      Object.keys(next).forEach((id) => {
        if (next[id] === 'portfolio') next[id] = 'seen';
      });
      selectedIds.forEach((id) => { next[id] = 'portfolio'; });
      return next;
    });
    setScreen('explore');
    inform(`Propuesta ${proposal?.version || ''} cargada con ${selectedIds.length} activos. Podés modificarla.`);
  };

  const prepareSale = (draft) => {
    setSaleDraft(draft);
    setScreen('sell');
  };

  const preparePurchase = (draft) => {
    setPurchaseDraft(draft);
    setScreen('purchase-review');
  };

  const finishPurchase = (purchased) => {
    setPurchaseDraft((draft) => ({ ...draft, purchased }));
    setScreen('portfolio-complete');
    inform(purchased ? 'Compra simulada confirmada' : 'Cartera guardada sin comprar');
  };

  let content = <Home setScreen={setScreen} inform={inform} />;
  if (screen === 'investments') content = <InvestmentDashboard setScreen={setScreen} onStartDemo={startDemo} onResetPrisma={requestResetPrismaData} hasPrismaData={Boolean(profileResult || Object.keys(assetStates).length)} />;
  else if (screen === 'portfolio-choice') content = <PortfolioPathChoice setScreen={setScreen} />;
  else if (screen.startsWith('portfolio:')) content = <PortfolioDetail id={screen.split(':')[1]} setScreen={setScreen} onPrepareSale={prepareSale} />;
  else if (screen === 'thermometer' || screen === 'calendar') content = <ToolsPage type={screen} setScreen={setScreen} />;
  else if (screen === 'onboarding') content = <Onboarding BackHeader={BackHeader} onCancel={() => setScreen('investments')} initialResult={profileResult} onComplete={(result) => { setProfileResult(result); setScreen('starting-point'); }} />;
  else if (screen === 'starting-point') content = <StartingPoint result={profileResult} setScreen={setScreen} onUseProposal={useInitialProposal} onResetProfile={requestResetPrismaData} onExplanationChange={changeExplanationLevel} />;
  else if (screen === 'explore' || screen === 'asset-list') content = <Explore BackHeader={BackHeader} setScreen={setScreen} guided={screen === 'explore'} assetStates={assetStates} setAssetStates={setAssetStates} inform={inform} profileResult={profileResult} onBehavior={recordBehavior} />;
  else if (screen.startsWith('market-asset:')) content = <MarketAssetDetail key={screen} symbol={screen.slice('market-asset:'.length)} BackHeader={BackHeader} setScreen={setScreen} />;
  else if (screen.startsWith('asset:')) content = <AssetDetail key={screen} id={screen.split(':')[1]} BackHeader={BackHeader} setScreen={setScreen} profileResult={profileResult} assetStates={assetStates} setAssetStates={setAssetStates} inform={inform} />;
  else if (screen === 'saved') content = <Saved setScreen={setScreen} assetStates={assetStates} setAssetStates={setAssetStates} />;
  else if (screen === 'portfolio-review') content = <PortfolioReview BackHeader={BackHeader} setScreen={setScreen} returnScreen={sessionStorage.getItem('prisma-review-return') || 'asset-list'} profileResult={profileResult} assetStates={assetStates} setAssetStates={setAssetStates} useInitialProposal={useInitialProposal} onPreparePurchase={preparePurchase} />;
  else if (screen === 'purchase-review') content = <PurchaseConfirmation BackHeader={BackHeader} setScreen={setScreen} draft={purchaseDraft} onFinish={finishPurchase} />;
  else if (screen === 'portfolio-complete') content = <PortfolioComplete BackHeader={BackHeader} setScreen={setScreen} assetStates={assetStates} purchaseDraft={purchaseDraft} />;
  else if (screen === 'assistant') content = <Assistant setScreen={setScreen} inform={inform} onPrepareSale={prepareSale} />;
  else if (screen === 'sell') content = <SaleSimulator draft={saleDraft} setScreen={setScreen} inform={inform} />;

  return (
    <div className="app-shell">
      <main className={`phone-content screen-${screen.split(':')[0]}`}>
        {isDemo && <div className="demo-mode-banner"><div><Sparkles size={15} /><span><b>Modo demo</b><small>{profileResult?.demo?.description || 'Caso documentado de presentación'}</small></span></div><button type="button" onClick={startDemo}>Reiniciar</button><button type="button" onClick={resetPrismaData}>Salir</button></div>}
        {content}
      </main>
      <BottomNav active={active} onChange={navigate} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
