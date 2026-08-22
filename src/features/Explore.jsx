import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Database,
  Info,
  List,
  ListFilter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AssetLogo } from '../components/AssetLogo';
import { assetCopyForLevel, assets } from '../data/MockData';
import { getMarketProfiles, getMarketStatus, rememberMarketAsset, searchMarketAssets } from '../marketApi';
import { buildCompatibilityQueue } from '../prismaEngine';
import { explanationLevelForExperience } from '../profile';

const categoryMatchers = {
  Todos: () => true,
  'Acciones y CEDEARs': (asset) => asset.type.includes('Acción') || asset.type.includes('CEDEAR'),
  'Bonos y ON': (asset) => asset.type.includes('Bono') || asset.type.includes('Obligación'),
  Fondos: (asset) => asset.type.includes('Fondo'),
  'Dólar y liquidez': (asset) => ['mep', 'money'].includes(asset.id),
};

function FlashAssetCard({
  asset,
  status,
  compatibility,
  onDecision,
  onNavigate,
  onPortfolio,
  onOpen,
  explanationLevel,
  position,
  total,
  disabled,
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [showDefinition, setShowDefinition] = useState(false);
  const [metricHelp, setMetricHelp] = useState(null);
  const gesture = useRef(null);
  const copy = assetCopyForLevel(asset, explanationLevel);
  const horizontalProgress = Math.min(1, Math.abs(drag.x) / 90);

  const pointerDown = (event) => {
    if (disabled || event.target.closest('button')) return;
    gesture.current = { x: event.clientX, y: event.clientY, dx: 0, dy: 0, axis: null };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const pointerMove = (event) => {
    if (!gesture.current || disabled) return;
    const dx = event.clientX - gesture.current.x;
    const dy = event.clientY - gesture.current.y;
    gesture.current.dx = dx;
    gesture.current.dy = dy;
    if (!gesture.current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 9) {
      gesture.current.axis = Math.abs(dx) > Math.abs(dy) * 1.12 ? 'horizontal' : 'vertical';
    }
    if (gesture.current.axis === 'horizontal') setDrag({ x: Math.max(-170, Math.min(170, dx)), y: 0 });
    if (gesture.current.axis === 'vertical') setDrag({ x: 0, y: Math.max(-120, Math.min(120, dy * .72)) });
  };

  const finishGesture = () => {
    if (!gesture.current || disabled) return;
    const { axis, dx, dy } = gesture.current;
    gesture.current = null;
    setDrag({ x: 0, y: 0 });
    if (axis === 'horizontal' && Math.abs(dx) >= 82) {
      onDecision(dx > 0 ? 'saved' : 'discarded', true, dx > 0 ? 'right' : 'left');
      return;
    }
    if (axis === 'vertical' && Math.abs(dy) >= 66) {
      onNavigate(dy < 0 ? 1 : -1);
    }
  };

  const cardStatus = status === 'portfolio' ? 'En tu cartera' : status === 'saved' ? 'Guardado' : status === 'discarded' ? 'No me interesa' : status === 'seen' ? 'Visto' : null;
  const stopGesture = (event) => event.stopPropagation();
  const openDetail = (event) => {
    event.stopPropagation();
    gesture.current = null;
    setDrag({ x: 0, y: 0 });
    onOpen();
  };
  const decideWithButton = (statusValue, direction) => {
    gesture.current = null;
    setDrag({ x: 0, y: 0 });
    onDecision(statusValue, false, direction);
  };
  const compatibilityText = compatibility?.personalized
    ? `${compatibility.label}${compatibility.finalScore !== null ? ` · ${compatibility.finalScore}/100` : ''}`
    : 'Exploración libre';
  const canAddAutomatically = compatibility?.personalized ? compatibility.eligibleForPortfolio : true;

  return (
    <div
      className={`swipe-stage ${drag.x > 8 ? 'revealing-save' : ''} ${drag.x < -8 ? 'revealing-discard' : ''}`}
      style={{ '--swipe-progress': horizontalProgress }}
    >
      <div className="swipe-reveal save"><Bookmark size={25} /><b>Guardar</b><span>Podés cambiarlo después</span></div>
      <div className="swipe-reveal discard"><X size={25} /><b>No me interesa</b><span>No se elimina</span></div>
      <article
        className={`flash-card ${drag.x || drag.y ? 'dragging' : ''}`}
        style={{
          transform: `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.x / 38}deg) scale(${1 - Math.min(.025, (Math.abs(drag.x) + Math.abs(drag.y)) / 9000)})`,
        }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') decideWithButton('discarded', 'left');
          if (event.key === 'ArrowRight') decideWithButton('saved', 'right');
          if (event.key === 'ArrowDown') onNavigate(1);
          if (event.key === 'ArrowUp') onNavigate(-1);
        }}
        tabIndex={0}
        aria-label={`${asset.name}. Deslizá horizontalmente para guardar o descartar y verticalmente para cambiar de activo.`}
      >
        <div className="flash-card-topline">
          <span className="risk-order">Tarjeta {position} de {total} · {copy.risk.short}</span>
          {cardStatus && <span className="asset-state"><Check size={12} />{cardStatus}</span>}
        </div>

        <div className="asset-head flash-identity">
          <AssetLogo asset={asset} size="large" />
          <div><small>{asset.issuer}</small><h2>{asset.name}</h2><p>{asset.symbol} · {copy.type}</p></div>
          <button className="type-info" type="button" onPointerDown={stopGesture} onClick={() => setShowDefinition((current) => !current)} aria-label={`Qué significa ${copy.type}`} aria-expanded={showDefinition}><Info size={16} /></button>
        </div>

        {showDefinition && <div className="type-popover"><Info size={15} /><p>{copy.typeDefinition}</p></div>}
        <p className="plain-explanation">{asset.explanation}</p>

        <section className="appearance-reason">
          <Sparkles size={17} />
          <div><small>{compatibility?.personalized ? 'Cómo encaja con tu punto de partida' : 'Por qué aparece'}</small><b>{compatibilityText}</b><p>{compatibility?.conciseText || copy.reason}</p></div>
        </section>
        <div className="asset-metrics explained">
          {[
            ['risk', copy.risk.title, copy.risk.value, copy.risk.help],
            ['horizon', copy.horizonTitle, asset.horizon, copy.horizonHelp],
            ['liquidity', copy.liquidityTitle, copy.liquidity, copy.liquidityHelp],
          ].map(([key, title, value, help]) => (
            <div className={metricHelp === key ? 'open' : ''} key={key}>
              <small>{title}</small><b>{value}</b>
              <button type="button" onPointerDown={stopGesture} onClick={() => setMetricHelp((current) => current === key ? null : key)} aria-label={`Explicar ${title}`} aria-expanded={metricHelp === key}><Info size={14} /></button>
              {metricHelp === key && <p>{help}</p>}
            </div>
          ))}
        </div>

        <div className="market-reference"><div><small>Referencia de mercado</small><b>{asset.price}</b><span>{asset.priceDate}</span></div><span className={`valuation ${asset.valuationTone}`}>{asset.valuation}</span></div>
        <div className="priority-warning"><b>Antes de decidir</b><p>{compatibility?.gateExplanations?.[0] || asset.warning}</p></div>

        <button className="detail-link" type="button" onPointerDown={stopGesture} onClick={openDetail}>Ver más sobre esta inversión <ChevronRight size={18} /></button>

        <div className="card-explicit-actions">
          <button type="button" onPointerDown={stopGesture} onClick={() => decideWithButton('discarded', 'left')}><X size={16} />No me interesa</button>
          <button type="button" onPointerDown={stopGesture} onClick={() => decideWithButton('saved', 'right')}><Bookmark size={16} />{status === 'saved' ? 'Guardado' : 'Guardar'}</button>
          <button className={status === 'portfolio' ? 'in-portfolio' : ''} type="button" onPointerDown={stopGesture} onClick={onPortfolio} disabled={!canAddAutomatically && status !== 'portfolio'} title={!canAddAutomatically ? 'Podés explorarlo, pero no entra automáticamente por los límites de esta propuesta.' : ''}>
            {status === 'portfolio' ? <><Check size={16} />En cartera</> : canAddAutomatically ? 'Agregar a cartera' : 'Solo explorar'}
          </button>
        </div>
      </article>
    </div>
  );
}

function ClosureCard({ states, onReview, onDecisions }) {
  const counts = {
    portfolio: Object.values(states).filter((state) => state === 'portfolio').length,
    saved: Object.values(states).filter((state) => state === 'saved').length,
    discarded: Object.values(states).filter((state) => state === 'discarded').length,
  };
  return (
    <article className="closure-card">
      <span><Check size={22} /></span><small>FIN DEL RECORRIDO</small>
      <h2>Ya llegaste al final de la cola preparada por Prisma</h2>
      <p>Podés volver a cualquier activo, revisar concentraciones o seguir editando antes de confirmar.</p>
      <div className="closure-counts"><div><b>{counts.portfolio}</b><span>En cartera</span></div><div><b>{counts.saved}</b><span>Guardados</span></div><div><b>{counts.discarded}</b><span>Descartados</span></div></div>
      {counts.portfolio === 0 && <p className="closure-alert">Todavía no agregaste activos. Volvé a las tarjetas o usá la propuesta inicial.</p>}
      <button type="button" className="primary-close" onClick={onReview}>Revisar y cerrar mi cartera</button>
      <button type="button" className="secondary-close" onClick={onDecisions}>Ver guardados y descartados</button>
    </article>
  );
}

export function Explore({ BackHeader, setScreen, guided = false, assetStates, setAssetStates, inform, profileResult, onBehavior = () => {} }) {
  const [mode, setMode] = useState(guided ? 'cards' : 'list');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [history, setHistory] = useState([]);
  const [activePosition, setActivePosition] = useState(() => {
    const stored = Number(sessionStorage.getItem('prisma-explore-position'));
    return Number.isFinite(stored) ? stored : 0;
  });
  const [deckMotion, setDeckMotion] = useState('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  const [marketConnection, setMarketConnection] = useState(null);
  const [marketResults, setMarketResults] = useState([]);
  const [marketSearchState, setMarketSearchState] = useState('idle');
  const [marketProfiles, setMarketProfiles] = useState({});
  const animationTimer = useRef(null);
  const explanationLevel = profileResult?.profile?.explanation_level || explanationLevelForExperience(profileResult?.answers?.experience);

  const assetsWithLogos = useMemo(() => assets.map((asset) => ({
    ...asset,
    logoUrl: marketProfiles[asset.symbol]?.logo || asset.logoUrl,
  })), [marketProfiles]);

  const ranked = useMemo(() => guided
    ? buildCompatibilityQueue(assetsWithLogos, profileResult, assetStates)
    : assetsWithLogos.map((asset) => ({ asset, compatibility: null })).sort((first, second) => first.asset.name.localeCompare(second.asset.name, 'es')),
  [assetStates, assetsWithLogos, guided, profileResult]);

  const visible = useMemo(() => ranked.filter(({ asset }) => {
    const haystack = `${asset.symbol} ${asset.name} ${asset.issuer} ${asset.type} ${asset.sector}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && categoryMatchers[category](asset);
  }), [category, query, ranked]);

  const origin = guided ? 'explore' : 'asset-list';
  const atClosure = activePosition >= visible.length;
  const currentItem = atClosure ? null : visible[activePosition];
  const previousItem = activePosition > 0 ? visible[activePosition - 1] : null;
  const nextItem = activePosition < visible.length - 1 ? visible[activePosition + 1] : null;

  const openAsset = (assetId) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!assetStates[assetId]) setAssetStates((states) => ({ ...states, [assetId]: 'seen' }));
    onBehavior('open_detail', { assetId, sector: asset?.sector });
    sessionStorage.setItem('prisma-explore-return', assetId);
    sessionStorage.setItem('prisma-explore-origin', origin);
    sessionStorage.setItem('prisma-explore-position', String(activePosition));
    setScreen(`asset:${assetId}`);
  };

  const openReview = () => {
    sessionStorage.setItem('prisma-review-return', origin);
    setScreen('portfolio-review');
  };

  const act = (assetId, nextStatus, fromGesture = false) => {
    const previous = assetStates[assetId];
    const asset = assets.find((item) => item.id === assetId);
    setHistory((items) => [...items, { id: assetId, previous }]);
    setAssetStates((states) => ({ ...states, [assetId]: nextStatus }));
    onBehavior(nextStatus === 'saved' ? 'save' : 'discard', { assetId, sector: asset?.sector });
    inform(nextStatus === 'saved' ? 'Guardado. Podés cambiar esta decisión cuando quieras.' : 'Marcado como “No me interesa”. Sigue disponible en Descartados.');
    if (fromGesture && navigator.vibrate) navigator.vibrate(15);
  };

  const transitionTo = (nextPosition, exitDirection, afterExit) => {
    if (isAnimating || nextPosition < 0 || nextPosition > visible.length) return;
    window.clearTimeout(animationTimer.current);
    setIsAnimating(true);
    setDeckMotion(`exit-${exitDirection}`);
    animationTimer.current = window.setTimeout(() => {
      afterExit?.();
      setActivePosition(nextPosition);
      setDeckMotion(exitDirection === 'up' ? 'enter-bottom' : exitDirection === 'down' ? 'enter-top' : 'enter-bottom');
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setDeckMotion('idle')));
      animationTimer.current = window.setTimeout(() => setIsAnimating(false), 260);
    }, 230);
  };

  const navigateDeck = (delta) => {
    if (isAnimating) return;
    const nextPosition = Math.max(0, Math.min(visible.length, activePosition + delta));
    if (nextPosition === activePosition) {
      setDeckMotion(delta > 0 ? 'edge-bottom' : 'edge-top');
      animationTimer.current = window.setTimeout(() => setDeckMotion('idle'), 260);
      return;
    }
    transitionTo(nextPosition, delta > 0 ? 'up' : 'down');
  };

  const decide = (assetId, nextStatus, fromGesture, direction) => {
    if (isAnimating) return;
    const nextPosition = Math.min(visible.length, activePosition + 1);
    transitionTo(nextPosition, direction, () => act(assetId, nextStatus, fromGesture));
  };

  const togglePortfolio = (assetId) => {
    const previous = assetStates[assetId];
    const nextStatus = previous === 'portfolio' ? 'seen' : 'portfolio';
    const asset = assets.find((item) => item.id === assetId);
    setHistory((items) => [...items, { id: assetId, previous }]);
    setAssetStates((states) => ({ ...states, [assetId]: nextStatus }));
    onBehavior(nextStatus === 'portfolio' ? 'add_portfolio' : 'remove_portfolio', { assetId, sector: asset?.sector });
    inform(nextStatus === 'portfolio' ? 'Agregado a la cartera simulada' : 'Quitado de la cartera simulada');
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last) return;
    setAssetStates((states) => {
      const next = { ...states };
      if (last.previous === undefined) delete next[last.id];
      else next[last.id] = last.previous;
      return next;
    });
    setHistory((items) => items.slice(0, -1));
    onBehavior('undo', { assetId: last.id });
    inform('Última acción deshecha');
  };

  useEffect(() => () => window.clearTimeout(animationTimer.current), []);

  useEffect(() => {
    const controller = new AbortController();
    getMarketProfiles(['AAPL', 'SPY', 'KO'], controller.signal)
      .then((result) => setMarketProfiles(result.profiles || {}))
      .catch(() => setMarketProfiles({}));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (guided) return undefined;
    const controller = new AbortController();
    getMarketStatus(controller.signal)
      .then(setMarketConnection)
      .catch(() => setMarketConnection({ mode: 'unavailable', message: 'Iniciá el backend para consultar el catálogo conectado.' }));
    return () => controller.abort();
  }, [guided]);

  useEffect(() => {
    if (guided || query.trim().length < 2 || marketConnection?.global?.configured === false) {
      setMarketResults([]);
      setMarketSearchState(query.trim().length >= 2 && marketConnection?.global?.configured === false ? 'not-configured' : 'idle');
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setMarketSearchState('loading');
      searchMarketAssets(query, controller.signal)
        .then((result) => {
          setMarketResults(result.assets || []);
          setMarketSearchState(result.assets?.length ? 'ready' : 'empty');
        })
        .catch((error) => { if (error.name !== 'AbortError') setMarketSearchState('error'); });
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [guided, marketConnection?.global?.configured, query]);

  const portfolioCount = Object.values(assetStates).filter((state) => state === 'portfolio').length;

  return (
    <>
      <BackHeader
        title={guided ? 'Explorar con Prisma' : 'Todos los activos'}
        subtitle={guided ? 'Una tarjeta por activo · orden explicable según tu punto de partida' : 'Lista libre y catálogo conectado, sin cuestionario'}
        onBack={() => setScreen(guided ? 'starting-point' : 'investments')}
      />
      <div className="search-box"><Search size={19} /><input value={query} onChange={(event) => { setQuery(event.target.value); setActivePosition(0); }} placeholder="Buscar activo, empresa o sector" /></div>
      <div className="category-chips" aria-label="Categorías">{Object.keys(categoryMatchers).map((item) => <button type="button" className={category === item ? 'selected' : ''} key={item} onClick={() => { setCategory(item); setActivePosition(0); }}>{item}</button>)}</div>
      {guided ? (
        <div className="explore-toolbar enhanced"><div><button type="button" className={mode === 'cards' ? 'selected' : ''} onClick={() => setMode('cards')}><SlidersHorizontal size={15} />Flash cards</button><button type="button" className={mode === 'list' ? 'selected' : ''} onClick={() => setMode('list')}><List size={15} />Lista</button></div><button type="button" onClick={undo} disabled={!history.length} aria-label="Deshacer"><RotateCcw size={17} /></button></div>
      ) : (
        <section className="free-list-intro"><div><List size={18} /><p><b>{visible.length} activos disponibles</b><span>Ordenados alfabéticamente. Tocá cualquiera para ver su ficha completa.</span></p></div><button type="button" onClick={undo} disabled={!history.length}><RotateCcw size={16} />Deshacer</button></section>
      )}

      {guided && mode === 'cards' && (
        <>
          <div className="gesture-guide"><span><ChevronUp size={15} />Subí: siguiente</span><span><ChevronDown size={15} />Bajá: anterior</span><span>↔ Guardar o descartar</span></div>
          <div className="risk-progress"><b>{Math.min(activePosition + 1, visible.length + 1)} de {visible.length + 1}</b><span>Cola de Prisma</span><i><em style={{ width: `${((activePosition + 1) / (visible.length + 1)) * 100}%` }} /></i><span>{currentItem?.compatibility?.label || 'Cierre'}</span></div>
          <section className="fixed-card-deck" aria-live="polite">
            {previousItem && <button type="button" className="deck-preview previous" onClick={() => navigateDeck(-1)} aria-label={`Volver a ${previousItem.asset.name}`}><ChevronUp size={14} /><span>{previousItem.asset.symbol} · anterior</span></button>}
            {nextItem && <button type="button" className="deck-preview next" onClick={() => navigateDeck(1)} aria-label={`Ir a ${nextItem.asset.name}`}><span>{nextItem.asset.symbol} · siguiente</span><ChevronDown size={14} /></button>}
            <div className={`deck-active ${deckMotion}`}>
              {currentItem ? (
                <FlashAssetCard
                  key={currentItem.asset.id}
                  asset={currentItem.asset}
                  status={assetStates[currentItem.asset.id]}
                  compatibility={currentItem.compatibility}
                  onDecision={(status, fromGesture, direction) => decide(currentItem.asset.id, status, fromGesture, direction)}
                  onNavigate={navigateDeck}
                  onPortfolio={() => togglePortfolio(currentItem.asset.id)}
                  onOpen={() => openAsset(currentItem.asset.id)}
                  explanationLevel={explanationLevel}
                  position={activePosition + 1}
                  total={visible.length}
                  disabled={isAnimating}
                />
              ) : (
                <ClosureCard states={assetStates} onReview={openReview} onDecisions={() => { sessionStorage.setItem('prisma-explore-origin', origin); setScreen('saved'); }} />
              )}
            </div>
            <div className="deck-controls" aria-label="Navegación de tarjetas"><button type="button" onClick={() => navigateDeck(-1)} disabled={activePosition === 0 || isAnimating}><ChevronUp size={17} />Anterior</button><button type="button" onClick={() => navigateDeck(1)} disabled={activePosition === visible.length || isAnimating}>Siguiente<ChevronDown size={17} /></button></div>
          </section>
        </>
      )}

      {mode === 'list' && (
        <div className="asset-table enhanced-list">
          {visible.map(({ asset, compatibility }) => (
            <article key={asset.id}><button type="button" className="list-main" onClick={() => openAsset(asset.id)} aria-label={`Ver ficha completa de ${asset.name}`}><AssetLogo asset={asset} size="small" /><div><b>{asset.name}</b><small>{asset.issuer}</small><em>{assetCopyForLevel(asset, explanationLevel).type}{compatibility?.personalized ? ` · ${compatibility.label} ${compatibility.finalScore}/100` : ''}</em></div><div className="list-market"><b>{asset.price}</b><span className={asset.dailyReturn >= 0 ? 'positive' : 'negative'}>{asset.dailyReturn >= 0 ? '+' : ''}{asset.dailyReturn.toFixed(1)}% hoy</span></div><ChevronRight size={17} /></button></article>
          ))}
          {!visible.length && <p className="empty-assets">No encontramos activos con esos filtros.</p>}
        </div>
      )}

      {!guided && mode === 'list' && (
        <section className="connected-catalog">
          <header><span><Database size={18} /></span><div><h2>Catálogo de mercado conectado</h2><p>Buscá por nombre o símbolo. Los resultados externos no entran automáticamente en la cartera guiada.</p></div></header>
          {marketConnection?.global?.configured
            ? <p className="catalog-status live"><b>Global activo · {marketConnection.global.provider}</b><span>{marketConnection.global.coverage}</span></p>
            : <p className="catalog-status reference"><b>Catálogo global preparado</b><span>{marketConnection?.message || 'Iniciá el backend y configurá FINNHUB_API_KEY para habilitarlo.'}</span></p>}
          {marketConnection?.argentina && <p className={`catalog-status ${marketConnection.argentina.configured ? 'live' : 'reference'}`}><b>Argentina · {marketConnection.argentina.configured ? 'conectado' : 'requiere contrato de Market Data'}</b><span>{marketConnection.argentina.coverage}</span></p>}
          {query.trim().length < 2 && <p className="catalog-hint">Escribí al menos dos letras para consultar el universo externo.</p>}
          {marketSearchState === 'loading' && <p className="catalog-hint">Consultando símbolos…</p>}
          {marketSearchState === 'not-configured' && <p className="catalog-hint">La búsqueda externa queda habilitada al agregar la clave del proveedor en el backend.</p>}
          {marketSearchState === 'empty' && <p className="catalog-hint">El proveedor no devolvió resultados para esta búsqueda.</p>}
          {marketSearchState === 'error' && <p className="catalog-hint error">No se pudo consultar el proveedor. Los 12 activos completos de V6 siguen disponibles arriba.</p>}
          {marketResults.length > 0 && <div className="market-result-list">{marketResults.map((item) => {
            const liveAsset = { symbol: item.symbol, name: item.description, issuer: item.description };
            return <button type="button" key={`${item.symbol}-${item.exchange}`} onClick={() => { rememberMarketAsset(item); setScreen(`market-asset:${item.symbol}`); }}><AssetLogo asset={liveAsset} size="small" /><span><b>{item.displaySymbol || item.symbol} · {item.description}</b><small>{item.type}{item.exchange ? ` · ${item.exchange}` : ''}</small></span><ChevronRight size={17} /></button>;
          })}</div>}
        </section>
      )}

      <div className="explore-closebar"><button type="button" onClick={() => { sessionStorage.setItem('prisma-explore-origin', origin); setScreen('saved'); }}><ListFilter size={17} />Decisiones</button><button type="button" className="review-button" onClick={openReview}>Revisar cartera · {portfolioCount}</button></div>
    </>
  );
}
