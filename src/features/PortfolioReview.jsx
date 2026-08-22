import { AlertTriangle, Check, ChevronRight, CircleDollarSign, Gauge, PieChart, ShieldCheck, ShoppingBag, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { AssetLogo } from '../components/AssetLogo';
import { assets } from '../data/MockData';
import { assetModel, buildPortfolioProposal, roleLabel } from '../prismaEngine';

const formatMoney = (value, currency) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency,
  maximumFractionDigits: currency === 'ARS' ? 0 : 2,
}).format(Number(value || 0));

const visualAssetFor = (item) => assets.find((asset) => asset.id === item.assetId || asset.symbol === item.symbol) || {
  symbol: item.symbol,
  name: item.name,
  issuer: item.name,
  type: item.type || item.name,
};

function startingAmount(profileResult) {
  const initial = profileResult?.answers?.initialAmount;
  if (Number(initial?.amount) > 0) return { currency: initial.currency || 'ARS', amount: Number(initial.amount) };
  const contribution = profileResult?.answers?.contribution;
  if (!contribution?.unsure && Number(contribution?.amount) > 0) return { currency: contribution.currency || 'ARS', amount: Number(contribution.amount) };
  return { currency: 'ARS', amount: '' };
}

function fallbackPositions(selected) {
  if (!selected.length) return [];
  const base = Math.floor(100 / selected.length);
  return selected.map((asset, index) => ({
    asset,
    assetId: asset.id,
    model: assetModel(asset),
    role: assetModel(asset).role,
    weight: index === 0 ? 100 - base * (selected.length - 1) : base,
    compatibility: { personalized: false, label: 'Sin perfil', finalScore: null, eligibleForPortfolio: false },
    manualException: true,
  }));
}

export function PortfolioReview({ BackHeader, setScreen, returnScreen = 'asset-list', profileResult, assetStates, setAssetStates, useInitialProposal, onPreparePurchase }) {
  const [pendingRemove, setPendingRemove] = useState(null);
  const [goalCurrency, setGoalCurrency] = useState('undefined');
  const initialFunding = startingAmount(profileResult);
  const [currency, setCurrency] = useState(initialFunding.currency);
  const [amount, setAmount] = useState(initialFunding.amount);
  const profile = profileResult?.profile;
  const selected = assets.filter((asset) => assetStates[asset.id] === 'portfolio');
  const proposal = profile ? buildPortfolioProposal(assets, profileResult, assetStates, { selectedOnly: true, goalCurrency }) : null;
  const weighted = proposal?.positions || fallbackPositions(selected);
  const averageRisk = weighted.reduce((sum, item) => sum + item.model.riskAsset * item.weight / 100, 0);
  const maxPosition = weighted.reduce((maximum, item) => Math.max(maximum, item.weight), 0);
  const highRiskWeight = weighted.filter((item) => item.model.riskAsset >= 65).reduce((sum, item) => sum + item.weight, 0);
  const total = Math.max(0, Number(amount || 0));
  const allocatedTotal = total * (100 - (proposal?.unallocatedWeight || 0)) / 100;
  const allocations = weighted.filter((item) => item.weight > 0).map((item, index, list) => ({
    assetId: item.asset.id,
    symbol: item.asset.symbol,
    name: item.asset.name,
    weight: item.weight,
    amount: index === list.length - 1
      ? allocatedTotal - list.slice(0, -1).reduce((sum, other) => sum + Math.round(total * other.weight) / 100, 0)
      : Math.round(total * item.weight) / 100,
    compatibility: item.compatibility.finalScore,
    manualException: item.manualException,
  }));
  const warnings = proposal?.warnings || [
    'Exploraste sin completar un perfil. La distribución es manual y no se presenta como recomendación personalizada.',
  ];
  const canContinue = total > 0 && Boolean(weighted.length) && (proposal?.unallocatedWeight || 0) === 0;

  const remove = (assetId) => {
    setAssetStates((states) => ({ ...states, [assetId]: 'seen' }));
    setPendingRemove(null);
  };

  if (!selected.length) {
    return (
      <>
        <BackHeader title="Revisar cartera" subtitle="Todavía no hay activos incluidos" onBack={() => setScreen(returnScreen)} />
        <section className="empty-review"><span><PieChart size={26} /></span><h1>Falta construir la propuesta</h1><p>Guardar o deslizar a la derecha no agrega un activo. Para incluirlo, usá “Agregar a cartera”.</p><button type="button" onClick={() => setScreen(returnScreen)}>{returnScreen === 'explore' ? 'Volver a las flash cards' : 'Volver a la lista de activos'}</button><button type="button" className="secondary" onClick={useInitialProposal}>Usar la propuesta de Prisma</button></section>
      </>
    );
  }

  return (
    <>
      <BackHeader title="Revisar y cerrar" subtitle="Cartera educativa y simulada" onBack={() => setScreen(returnScreen)} />
      <section className="review-hero"><Sparkles size={22} /><small>{proposal ? 'PORTFOLIO_V1.0' : 'COMPOSICIÓN MANUAL'}</small><h1>{weighted.filter((item) => item.weight > 0).length} activos · Riesgo conjunto {Math.round(averageRisk)}/100</h1><p>{proposal ? 'Prisma distribuye por funciones, compatibilidad y límites. Nada se compra hasta la confirmación final.' : 'Sin perfil, Prisma muestra controles generales pero no declara compatibilidad personalizada.'}</p></section>

      <section className="review-section goal-currency-card">
        <div className="review-check"><CircleDollarSign size={20} /><div><b>¿En qué moneda pensás usar este dinero?</b><p>No siempre coincide con la moneda en la que aportás. Si no lo sabés, Prisma mantiene la comparación neutral y te avisa.</p></div></div>
        <select value={goalCurrency} onChange={(event) => setGoalCurrency(event.target.value)} aria-label="Moneda en que se usará el dinero"><option value="undefined">Todavía no lo sé</option><option value="ARS">Pesos argentinos</option><option value="USD">Dólares estadounidenses</option></select>
      </section>

      <section className="review-section">
        <h2>Distribución propuesta</h2>
        <div className="review-allocation-bar">{weighted.filter((item) => item.weight > 0).map((item) => <i key={item.asset.id} style={{ width: `${item.weight}%` }} title={`${item.asset.symbol}: ${item.weight}%`} />)}{proposal?.unallocatedWeight > 0 && <i className="unallocated" style={{ width: `${proposal.unallocatedWeight}%` }} title={`${proposal.unallocatedWeight}% sin asignar`} />}</div>
        <div className="review-assets">
          {weighted.map((item) => (
            <div key={item.asset.id} className={item.manualException ? 'manual-exception' : ''}>
              <AssetLogo asset={item.asset} size="small" />
              <div><b>{item.asset.symbol} · {item.asset.name}</b><small>{roleLabel(item.role)} · Riesgo interno {item.model.riskAsset}/100</small>{item.compatibility.personalized && <em>{item.manualException ? 'Elección manual fuera de la propuesta automática' : `${item.compatibility.label} · ${item.compatibility.finalScore}/100`}</em>}</div>
              <strong>{item.weight}%<small>{formatMoney(total * item.weight / 100, currency)}</small></strong>
              <button type="button" onClick={() => setPendingRemove(item.asset.id)} aria-label={`Quitar ${item.asset.symbol}`}><X size={16} /></button>
            </div>
          ))}
          {proposal?.unallocatedWeight > 0 && <div className="unallocated-row"><span><AlertTriangle size={17} /></span><div><b>{proposal.unallocatedWeight}% sin asignar</b><small>Falta un activo apto para cubrir una función. Volvé a explorar o cargá la propuesta de Prisma.</small></div></div>}
        </div>
      </section>

      {pendingRemove && (
        <section className="remove-preview"><AlertTriangle size={20} /><div><b>Antes de quitar {assets.find((asset) => asset.id === pendingRemove)?.symbol}</b><p>Prisma volverá a calcular funciones, riesgo, concentración y dinero sin asignar.</p></div><button type="button" onClick={() => remove(pendingRemove)}>Confirmar</button><button type="button" onClick={() => setPendingRemove(null)}>Cancelar</button></section>
      )}

      <section className="review-section">
        <h2>Compatibilidad y controles</h2>
        <div className="review-check"><ShieldCheck size={20} /><div><b>Perfil {profile?.profile || 'no calculado'}</b><p>{profile?.contradiction || 'Exploraste sin perfil completo; las advertencias son generales.'}</p></div></div>
        <dl className="review-metrics"><div><dt>Mayor posición</dt><dd>{maxPosition}%</dd></div><div><dt>Riesgo alto</dt><dd>{highRiskWeight}%</dd></div><div><dt>Funciones cubiertas</dt><dd>{new Set(weighted.filter((item) => item.weight > 0).map((item) => item.role)).size}/4</dd></div>{proposal && <><div><dt>RiskPolicy</dt><dd>{proposal.riskPolicy}/{proposal.riskPolicyLimit}</dd></div><div><dt>HHI emisor</dt><dd>{proposal.issuerHhi.toFixed(2)}</dd></div><div><dt>Cobertura</dt><dd>{proposal.dataCoverage}%</dd></div></>}</dl>
        {proposal && <p className="model-version"><Gauge size={14} />{proposal.compatibilityVersion} · {proposal.version} · salida reproducible con las mismas entradas</p>}
      </section>

      {proposal?.bindingConstraints?.length > 0 && <section className="review-section"><h2>Límites que modificaron los porcentajes</h2><ul className="model-list">{proposal.bindingConstraints.map((constraint) => <li key={constraint}>{constraint}</li>)}{proposal.redistributions.map((item) => <li key={item}>{item}</li>)}</ul></section>}

      <section className="review-section warning-review"><h2>Qué revisar antes de cerrar</h2>{warnings.length ? <ul>{warnings.map((warning) => <li key={warning}><AlertTriangle size={16} />{warning}</li>)}</ul> : <div className="review-check"><Check size={20} /><p>No aparecen alertas básicas de concentración en esta maqueta.</p></div>}</section>

      {proposal && <section className="review-section"><h2>Escenarios educativos de estrés</h2><p className="stress-intro">Muestran sensibilidad aproximada, no la probabilidad de que ocurra cada escenario.</p>{proposal.stressResults.map((stress) => <div className="downside-row stress-row" key={stress.id}><b>{stress.impact}%</b><p><strong>{stress.label}</strong>{stress.explanation}</p><ChevronRight size={16} /></div>)}</section>}

      <section className="review-section"><h2>¿Qué podría salir mal?</h2>{weighted.slice(0, 3).map((item) => <div className="downside-row" key={item.asset.id}><b>{item.asset.symbol}</b><p>{item.asset.warning}</p><ChevronRight size={16} /></div>)}</section>

      <section className="review-section funding-review">
        <div className="funding-title"><CircleDollarSign size={21} /><div><h2>Monto para empezar</h2><p>Este es el dinero total que se distribuiría entre los activos. Podés cambiarlo antes de continuar.</p></div></div>
        <div className="funding-input"><select value={currency} onChange={(event) => setCurrency(event.target.value)} aria-label="Moneda del monto total"><option value="ARS">ARS</option><option value="USD">USD</option></select><input type="number" min="1" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} aria-label="Monto total para invertir" /></div>
        <dl className="funding-total"><div><dt>Monto destinado a activos</dt><dd>{formatMoney(allocatedTotal, currency)}</dd></div>{proposal?.unallocatedWeight > 0 && <div><dt>Sin asignar</dt><dd>{formatMoney(total - allocatedTotal, currency)}</dd></div>}<div><dt>Costos en esta maqueta</dt><dd>No incluidos</dd></div><div className="grand-total"><dt>Total ingresado</dt><dd>{formatMoney(total, currency)}</dd></div></dl>
        <p className="funding-caveat">En una integración real, la entidad mostraría cantidades comprables, tipo de cambio, comisiones e impuestos. La maqueta evita mostrarlos como cero y no ejecuta operaciones.</p>
      </section>

      <div className="review-actions"><button type="button" onClick={() => setScreen(returnScreen)}>Seguir editando</button><button type="button" disabled={!canContinue} onClick={() => onPreparePurchase({ currency, total, allocations, warnings, goalCurrency, proposal })}>{proposal?.unallocatedWeight > 0 ? 'Falta completar la cartera' : 'Revisar total y continuar'}</button></div>
    </>
  );
}

export function PurchaseConfirmation({ BackHeader, setScreen, draft, onFinish }) {
  const [reviewedPortfolio, setReviewedPortfolio] = useState(false);
  const [reviewedTotal, setReviewedTotal] = useState(false);
  if (!draft) return <><BackHeader title="Confirmar compra" onBack={() => setScreen('portfolio-review')} /><section className="empty-review"><h1>Falta revisar la cartera</h1><p>Volvé a la composición para elegir el monto total.</p><button type="button" onClick={() => setScreen('portfolio-review')}>Volver a revisar</button></section></>;
  const canBuy = reviewedPortfolio && reviewedTotal;
  return (
    <>
      <BackHeader title="Confirmar compra" subtitle="Última revisión antes de empezar" onBack={() => setScreen('portfolio-review')} />
      <section className="purchase-hero"><ShoppingBag size={24} /><small>TOTAL A PAGAR SIMULADO</small><strong>{formatMoney(draft.total, draft.currency)}</strong><p>Este importe se distribuiría entre {draft.allocations.length} activos. Nada se compra hasta que elijas una opción al final.</p></section>
      <section className="review-section purchase-breakdown"><h2>Qué comprarías</h2>{draft.allocations.map((item) => <div key={item.assetId}><AssetLogo asset={visualAssetFor(item)} size="small" /><p><b>{item.symbol} · {item.name}</b><small>{item.weight}% de la cartera{item.compatibility !== null ? ` · compatibilidad ${item.compatibility}/100` : ''}</small></p><strong>{formatMoney(item.amount, draft.currency)}</strong></div>)}</section>
      <section className="review-section payment-summary"><h2>Resumen del pago</h2><dl><div><dt>Activos</dt><dd>{formatMoney(draft.total, draft.currency)}</dd></div><div><dt>Costos</dt><dd>A confirmar por la entidad</dd></div><div><dt>Total de la simulación</dt><dd>{formatMoney(draft.total, draft.currency)}</dd></div></dl><p>Los costos reales y las cantidades finales dependerían de la entidad y del precio disponible al momento de comprar.</p></section>
      <section className="review-section purchase-checks"><h2>Confirmá que lo revisaste</h2><label><input type="checkbox" checked={reviewedPortfolio} onChange={(event) => setReviewedPortfolio(event.target.checked)} /><span><b>Revisé los activos y los porcentajes</b><small>Entendí qué incluye la cartera y sus principales advertencias.</small></span></label><label><input type="checkbox" checked={reviewedTotal} onChange={(event) => setReviewedTotal(event.target.checked)} /><span><b>Revisé el monto total a pagar</b><small>El total simulado es {formatMoney(draft.total, draft.currency)}; los costos reales todavía no están incluidos.</small></span></label></section>
      <section className="purchase-decision"><p><b>¿Querés comprar los activos para empezar a usar esta cartera?</b> También podés guardarla sin comprar y volver más tarde.</p><button type="button" disabled={!canBuy} onClick={() => onFinish(true)}>Comprar activos y activar mi cartera</button><button type="button" className="secondary" onClick={() => onFinish(false)}>Guardar cartera sin comprar</button></section>
    </>
  );
}

export function PortfolioComplete({ BackHeader, setScreen, assetStates, purchaseDraft }) {
  const selected = assets.filter((asset) => assetStates[asset.id] === 'portfolio');
  const purchased = Boolean(purchaseDraft?.purchased);
  return (
    <>
      <BackHeader title={purchased ? 'Cartera activada' : 'Cartera guardada'} subtitle="Operación simulada" onBack={() => setScreen('portfolio-review')} />
      <section className="portfolio-complete"><span><Check size={30} /></span><small>RECORRIDO COMPLETO</small><h1>{purchased ? 'Tu cartera está lista para empezar' : 'Guardamos tu cartera sin comprar'}</h1><p>{purchased ? `Confirmaste una compra simulada de ${formatMoney(purchaseDraft.total, purchaseDraft.currency)} distribuida entre ${selected.length} activos.` : `La composición con ${selected.length} activos quedó guardada para que puedas revisarla o comprarla más adelante.`}</p><div className="completion-status"><b>{purchased ? 'Compra simulada confirmada' : 'No se compraron activos'}</b><small>Esta maqueta no envía órdenes ni debita dinero real.</small></div><button type="button" onClick={() => setScreen('portfolio-review')}>Revisar composición</button><button type="button" className="secondary" onClick={() => setScreen('investments')}>Volver a Inversiones</button></section>
    </>
  );
}
