import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, Check, ChevronRight, CircleAlert, Clock3, Info, Layers3, RotateCcw, SlidersHorizontal, Sparkles, ThumbsDown, WalletCards, X } from 'lucide-react';
import { assetCatalog, instrumentCategories, sectorCategories } from '../domain/assets/catalog';
import { rankAssets } from '../domain/compatibility/engine';
import { createSimulatedPosition } from '../domain/portfolio/portfolio';
import { marketDataService } from '../services/marketData/marketDataService';
import { interactionRepository, portfolioRepository, profileRepository } from '../services/persistence/repositories';

const formatPrice = quote => new Intl.NumberFormat('es-AR',{style:'currency',currency:quote.currency==='USD'?'USD':'ARS',maximumFractionDigits:2}).format(quote.price);
const formatDate = date => new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(date));

function DataBadge({quote,error}) { const labels={realtime:'Tiempo real',delayed:'Datos diferidos',simulated:'Datos simulados'}; return <div className={`data-badge ${quote.status}`}><i/>{labels[quote.status]}{error&&<span title={error}> · fuente real no disponible</span>}</div>; }

function FlashCard({item,quote,error,onAction,onMore,drag}) {
 const {asset,compatibility}=item; const event=asset.events[0];
 return <article className="flash-card" style={{transform:`translateX(${drag.x}px) rotate(${drag.x/28}deg)`,transition:drag.active?'none':'transform .25s ease'}}>
  {drag.x>35&&<div className="swipe-label save">GUARDAR</div>}{drag.x<-35&&<div className="swipe-label discard">DESCARTAR</div>}
  <div className="flash-top"><div className="asset-logo">{asset.ticker.slice(0,2)}</div><div><span className="asset-type">{asset.type} <button aria-label="Información del tipo"><Info size={12}/></button></span><h2>{asset.name}</h2><p>{asset.company}</p></div><div className="match-score"><strong>{compatibility.score}%</strong><span>compatible</span></div></div>
  <p className="plain-copy">{asset.plainExplanation}</p>
  <div className="quote-row"><div><span>Valor de referencia</span><strong>{formatPrice(quote)}</strong></div><div className={quote.changePercent>=0?'change positive':'change negative'}>{quote.changePercent>=0?'+':''}{quote.changePercent.toFixed(2)}% <small>hoy</small></div></div>
  <DataBadge quote={quote} error={error}/>
  <div className="fact-grid"><div><span>Riesgo</span><strong>{asset.metrics.risk<35?'Bajo':asset.metrics.risk<70?'Medio':'Alto'}</strong></div><div><span>Horizonte</span><strong>{asset.suggestedHorizon}</strong></div><div><span>Liquidez</span><strong>{asset.liquidityLabel}</strong></div><div><span>Moneda</span><strong>{asset.currency}</strong></div></div>
  <div className="risk-explanation"><CircleAlert size={16}/><p><strong>Qué riesgo deberías considerar</strong><span>{asset.riskExplanation}</span></p></div>
  <div className="why-card"><Sparkles size={15}/><p><strong>Por qué Prisma te lo muestra</strong><span>{compatibility.positiveReasons[0] ?? 'Para que conozcas instrumentos de distintas características.'}</span></p></div>
  {compatibility.warnings[0]&&<div className="compat-warning">{compatibility.warnings[0]}</div>}
  <div className="event-line"><Clock3 size={15}/><p><span>Próximo evento · {new Date(event.date).toLocaleDateString('es-AR',{day:'numeric',month:'short'})}</span><strong>{event.title}</strong></p><ChevronRight size={16}/></div>
  <div className="card-source">Actualizado {formatDate(quote.updatedAt)} · {quote.source}</div>
  <div className="flash-actions"><button className="round-action discard" onClick={()=>onAction('discarded')} aria-label="Descartar"><X size={22}/></button><button className="secondary-action" onClick={onMore}>Ver más</button><button className="primary-action" onClick={()=>onAction('included')}><Layers3 size={16}/> Incluir</button><button className="round-action save" onClick={()=>onAction('saved')} aria-label="Guardar"><Bookmark size={20}/></button></div>
 </article>;
}

function AssetDetail({item,quote,error,onBack,onInclude}) { const {asset,compatibility}=item; const [query,setQuery]=useState(''); const questions=asset.questions.filter(([question])=>question.toLowerCase().includes(query.toLowerCase())); return <div className="asset-detail">
 <header className="explore-header"><button className="round-back" onClick={onBack}><ArrowLeft size={20}/></button><div><span>CONOCÉ EL INSTRUMENTO</span><strong>{asset.ticker}</strong></div><span className="header-spacer"/></header>
 <div className="detail-hero"><div className="asset-logo large">{asset.ticker.slice(0,2)}</div><span>{asset.type}</span><h1>{asset.name}</h1><p>{asset.issuer}</p><div className="detail-price"><strong>{formatPrice(quote)}</strong><span className={quote.changePercent>=0?'positive':'negative'}>{quote.changePercent>=0?'+':''}{quote.changePercent.toFixed(2)}% hoy</span></div><DataBadge quote={quote} error={error}/></div>
 <section className="ask-prisma"><h2><Sparkles size={17}/> Preguntale a Prisma</h2><p>Elegí una pregunta. Las respuestas son educativas y predefinidas.</p><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar una pregunta…"/>{questions.length?questions.map(([question,answer])=><details key={question}><summary>{question}<ChevronRight size={16}/></summary><p>{answer}</p></details>):<div className="empty-search">No encontramos preguntas con ese texto.</div>}</section>
 <section className="detail-section"><h2>¿Qué se compra?</h2><p>{asset.plainExplanation}</p><h3>Función posible dentro de una cartera</h3><p>{asset.role}</p></section>
 <section className="detail-section"><h2>Evolución y próximo evento</h2><div className="event-detail"><Clock3 size={18}/><div><strong>{asset.events[0].title}</strong><span>{new Date(asset.events[0].date).toLocaleDateString('es-AR',{dateStyle:'long'})}</span><p>{asset.events[0].impact}</p><small>Fuente: {asset.events[0].source}</small></div></div></section>
 <section className="detail-section"><h2>Riesgos antes de incluirlo</h2><p>{asset.riskExplanation}</p>{compatibility.warnings.map(warning=><div className="detail-warning" key={warning}>{warning}</div>)}</section>
 <section className="detail-section"><h2>Por qué Prisma lo muestra</h2>{compatibility.positiveReasons.map(reason=><div className="reason-line" key={reason}><Check size={15}/>{reason}</div>)}<p className="educational-note">Una compatibilidad alta no significa que el activo vaya a subir.</p></section>
 <div className="detail-bottom"><button className="continue-button" onClick={onInclude}>Incluir en selección simulada</button><p>Prisma no ejecuta operaciones reales.</p></div>
 </div>; }

export function ExploreScreen({onBack,onCreateProfile}) {
 const [profile,setProfile]=useState(()=>profileRepository.getProfile());
 const [positions,setPositions]=useState(()=>portfolioRepository.getPositions());
 const [interactions,setInteractions]=useState(()=>interactionRepository.getInteractions());
 const [quotes,setQuotes]=useState({}); const [errors,setErrors]=useState({}); const [loading,setLoading]=useState(true);
 const [instrument,setInstrument]=useState('Todos'); const [sector,setSector]=useState('Todos'); const [index,setIndex]=useState(0); const [detail,setDetail]=useState(null); const [toast,setToast]=useState('');
 const pointer=useRef({start:0}); const [drag,setDrag]=useState({x:0,active:false});
 useEffect(()=>{let mounted=true; Promise.all(assetCatalog.map(async asset=>{const result=await marketDataService.getAssetQuote(asset.id);return [asset.id,result];})).then(results=>{if(!mounted)return;setQuotes(Object.fromEntries(results.map(([id,result])=>[id,result.data])));setErrors(Object.fromEntries(results.filter(([,result])=>result.error).map(([id,result])=>[id,result.error])));setLoading(false);});return()=>{mounted=false};},[]);
 const ranked=useMemo(()=>rankAssets(assetCatalog.filter(asset=>(instrument==='Todos'||asset.type===instrument)&&(sector==='Todos'||asset.sector===sector)&&!interactions.discarded[asset.id]),profile,positions),[instrument,sector,profile,positions,interactions]);
 useEffect(()=>setIndex(0),[instrument,sector]);
 const current=ranked[index%Math.max(ranked.length,1)];
 const notify=message=>{setToast(message);setTimeout(()=>setToast(''),1800)};
 const action=type=>{if(!current)return;const updated=interactionRepository.record(current.asset.id,type);setInteractions(updated);if(type==='included'){const quote=quotes[current.asset.id];const position=createSimulatedPosition(current.asset,quote);setPositions(portfolioRepository.addPosition(position));notify('Incluido en tu selección simulada');}else{notify(type==='saved'?'Guardado para revisar después':'Descartado del feed');}setDrag({x:0,active:false});if(type!=='discarded')setIndex(value=>value+1);};
 const release=()=>{if(drag.x>85)action('saved');else if(drag.x<-85)action('discarded');else setDrag({x:0,active:false});};
 if(detail&&quotes[detail.asset.id]) return <AssetDetail item={detail} quote={quotes[detail.asset.id]} error={errors[detail.asset.id]} onBack={()=>setDetail(null)} onInclude={()=>{action('included');setDetail(null)}}/>;
 return <div className="explore-screen">
  <header className="explore-header"><button className="round-back" onClick={onBack}><ArrowLeft size={20}/></button><div><span>PRISMA INVERSIONES</span><strong>Explorar</strong></div><button className="portfolio-count" aria-label="Selección simulada"><WalletCards size={18}/>{positions.length>0&&<i>{positions.length}</i>}</button></header>
  {!profile&&<div className="profile-nudge"><Sparkles size={18}/><p><strong>Personalizá lo que ves</strong><span>Sin perfil, mostramos contenido general y educativo.</span></p><button onClick={onCreateProfile}>Crear perfil</button></div>}
  {profile&&<div className="applied-profile"><span>Perfil {profile.name}</span><i/>Capacidad {profile.capacityLabel} · Tolerancia {profile.toleranceLabel}</div>}
  <div className="category-label"><SlidersHorizontal size={14}/> Instrumentos</div><div className="category-scroll">{instrumentCategories.map(value=><button className={instrument===value?'active':''} onClick={()=>setInstrument(value)} key={value}>{value==='Obligación negociable'?'ONs':value}</button>)}</div>
  <div className="category-scroll sectors">{sectorCategories.map(value=><button className={sector===value?'active':''} onClick={()=>setSector(value)} key={value}>{value}</button>)}</div>
  <div className="deck-status"><span>{ranked.length} instrumentos</span><span>Deslizá para decidir</span></div>
  <div className="card-deck" onPointerDown={event=>{pointer.current.start=event.clientX;event.currentTarget.setPointerCapture(event.pointerId);setDrag({x:0,active:true})}} onPointerMove={event=>drag.active&&setDrag({x:event.clientX-pointer.current.start,active:true})} onPointerUp={release}>
   {loading?<div className="feed-state"><div className="loader"/><strong>Consultando el mercado…</strong><span>Si la fuente no responde, usaremos datos simulados.</span></div>:!current?<div className="feed-state"><CircleAlert size={28}/><strong>No hay activos en esta categoría</strong><span>Probá con otro filtro o recuperá los descartados.</span><button onClick={()=>{interactionRepository.clear();setInteractions(interactionRepository.getInteractions())}}><RotateCcw size={15}/> Reiniciar preferencias</button></div>:quotes[current.asset.id]&&<><div className="deck-shadow second"/><div className="deck-shadow first"/><FlashCard item={current} quote={quotes[current.asset.id]} error={errors[current.asset.id]} onAction={action} onMore={()=>setDetail(current)} drag={drag}/></>}
  </div>
  <div className="simulation-banner"><Info size={15}/><span>Simulación educativa. Prisma no mueve dinero ni ejecuta compras. Los rendimientos pasados no garantizan resultados futuros.</span></div>
  {toast&&<div className="toast" role="status">{toast}</div>}
 </div>;
}
