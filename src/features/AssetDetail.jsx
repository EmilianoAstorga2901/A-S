import { Bookmark, Check, ChevronDown, ChevronUp, Info, MessageCircleQuestion, Send, ShieldAlert, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdvancedMetrics } from '../components/AdvancedMetrics';
import { AssetLogo } from '../components/AssetLogo';
import { NewsFeed } from '../components/NewsFeed';
import { PerformanceChart } from '../components/PerformanceChart';
import { assetCopyForLevel, assets } from '../data/MockData';
import { newsForAsset, normalizeLiveNews } from '../data/newsData';
import { getMarketAsset } from '../marketApi';
import { metricCoverage } from '../marketMetrics';
import { scoreCompatibility } from '../prismaEngine';
import { explanationLevelForExperience } from '../profile';

const levelRank = { simple: 0, intermediate: 1, advanced: 2 };

const answerAssetQuestion = (asset, question) => {
  const text = question.toLowerCase();
  if (text.includes('tiempo') || text.includes('horizonte') || text.includes('plazo')) return `Para ${asset.symbol}, el tiempo sugerido es ${asset.horizon}. Significa cuánto conviene poder dejar el dinero sin necesitar venderlo; no es una promesa de ganancia.`;
  if (text.includes('precio') || text.includes('caro') || text.includes('barato')) return `El precio de referencia es ${asset.price}, pero ese número solo no indica si está caro o barato. Prisma lo compara con su tipo de activo, sus riesgos, datos del emisor y el tiempo que pensás mantenerlo.`;
  if (text.includes('perder') || text.includes('riesgo') || text.includes('bajar')) return `${asset.warning} En la maqueta, su movimiento diario es ${asset.dailyReturn >= 0 ? '+' : ''}${asset.dailyReturn.toFixed(1)}%, pero un solo día no resume el riesgo.`;
  if (text.includes('rendir') || text.includes('ganar') || text.includes('rendimiento')) return `${asset.how} En la simulación figura ${asset.monthlyReturn >= 0 ? '+' : ''}${asset.monthlyReturn.toFixed(1)}% en un mes y ${asset.annualReturn >= 0 ? '+' : ''}${asset.annualReturn.toFixed(1)}% en un año; son datos ilustrativos, no una proyección.`;
  if (text.includes('vender') || text.includes('retirar')) return `${asset.simpleLiquidity} La venta siempre se revisa antes de confirmar y también puede hacerse de forma manual desde la cartera.`;
  return `Para responder sobre ${asset.symbol}, Prisma revisaría qué comprás, cómo puede rendir, el tiempo sugerido, la posibilidad de retiro y su lugar junto con tus otras inversiones. En esta maqueta: ${asset.explanation}`;
};

const challengeAsset = (asset, question) => {
  const text = question.toLowerCase();
  if (text.includes('conviene') || text.includes('comprar')) return `Antes de decidir, no alcanza con que ${asset.symbol} te guste: revisá si el plazo de ${asset.horizon.toLowerCase()} coincide con tu objetivo, cuánto ya tenés del mismo emisor o sector y cuánto podrías tolerar que baje.`;
  if (text.includes('todo') || text.includes('mucho') || text.includes('porcentaje')) return `Prisma no usaría todo el dinero en ${asset.symbol}. Su función es “${asset.function.toLowerCase()}” y el peso debería quedar limitado por riesgo y concentración.`;
  if (text.includes('miedo') || text.includes('cae') || text.includes('baja')) return `La pregunta clave es si podrías mantener la decisión durante una caída sin necesitar el dinero. ${asset.warning}`;
  return `Una forma de cuestionar esta inversión es comparar el motivo para elegirla con su principal límite: ${asset.reason} Al mismo tiempo, ${asset.warning.toLowerCase()}`;
};

function SectionContent({ section, level, onSimplify }) {
  const simple = level === 'simple';
  const paragraphs = simple ? section.simpleParagraphs || section.paragraphs : section.paragraphs;
  const facts = simple ? section.simpleFacts || section.facts : section.facts;
  const bullets = simple ? section.simpleBullets || section.bullets : section.bullets;
  const scenarios = simple ? section.simpleScenarios || section.scenarios : section.scenarios;
  return (
    <div className="accordion-content">
      {paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {facts && (
        <dl className="detail-facts">
          {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      )}
      {bullets && <ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
      {scenarios && (
        <div className="detail-scenarios">
          {scenarios.map((scenario) => (
            <article className={`scenario-card ${scenario.tone || 'neutral'}`} key={scenario.label}>
              <header>
                <div><span>ESCENARIO</span><b>{scenario.label}</b></div>
                <strong>{scenario.range || scenario.value}</strong>
              </header>
              {scenario.conditions?.length > 0 && (
                <div className="scenario-block">
                  <small>Qué tendría que pasar</small>
                  <ul>{scenario.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
                </div>
              )}
              <div className="scenario-block">
                <small>Posible efecto en la inversión</small>
                <p>{scenario.impact || scenario.value}</p>
              </div>
              {scenario.watch?.length > 0 && level !== 'simple' && (
                <div className="scenario-block watch">
                  <small>Señales para seguir</small>
                  <ul>{scenario.watch.map((signal) => <li key={signal}>{signal}</li>)}</ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {levelRank[level] >= 1 && section.example && (
        <div className="explanation-layer example-layer">
          <b>Ver un ejemplo</b>
          <p>{section.example}</p>
        </div>
      )}
      {levelRank[level] >= 2 && (section.technicalBullets || section.technicalFacts || section.calculation) && (
        <div className="explanation-layer advanced-layer">
          <div className="advanced-heading"><span>CAPA AVANZADA</span><b>Datos, lectura y cálculo</b></div>
          {section.technicalFacts?.length > 0 && (
            <dl className="advanced-facts">
              {section.technicalFacts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          )}
          {section.technicalBullets?.length > 0 && (
            <div className="advanced-reading">
              <b>Cómo interpretar los datos</b>
              <ul>{section.technicalBullets.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
          {section.calculation && (
            <div className="advanced-calculation">
              <span>CÁLCULO EDUCATIVO</span>
              <b>{section.calculation.title}</b>
              <code>{section.calculation.formula}</code>
              <p><strong>Ejemplo.</strong> {section.calculation.example}</p>
              <p className="calculation-limit"><strong>Límite.</strong> {section.calculation.limits}</p>
            </div>
          )}
          {section.technicalNote && <p>{section.technicalNote}</p>}
        </div>
      )}
      {level !== 'simple' && <button className="simplify-button" type="button" onClick={onSimplify}>Explicámelo más simple</button>}
    </div>
  );
}

export function AssetDetail({ id, BackHeader, setScreen, profileResult, assetStates, setAssetStates, inform }) {
  const asset = assets.find((item) => item.id === id) || assets[0];
  const [openSection, setOpenSection] = useState('main');
  const [faq, setFaq] = useState(null);
  const [period, setPeriod] = useState('month');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [challengeQuestion, setChallengeQuestion] = useState('');
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [marketSnapshot, setMarketSnapshot] = useState(null);
  const suggestedLevel = profileResult?.profile?.explanation_level
    || explanationLevelForExperience(profileResult?.answers?.experience);
  const [explanationLevel, setExplanationLevel] = useState(suggestedLevel);
  const copy = assetCopyForLevel(asset, explanationLevel);
  const status = assetStates[asset.id];
  const returnScreen = sessionStorage.getItem('prisma-explore-origin') || 'asset-list';
  const currentAssets = assets.filter((item) => item.id !== asset.id && assetStates[item.id] === 'portfolio');
  const compatibility = scoreCompatibility(asset, profileResult, { currentAssets, goalCurrency: 'undefined' });
  const guidedRestriction = returnScreen === 'explore' && compatibility.personalized && !compatibility.eligibleForPortfolio;
  const liveSymbol = ['AAPL', 'SPY', 'KO'].includes(asset.symbol) ? asset.symbol : null;
  const referenceItems = newsForAsset(asset.id);
  const liveItems = (marketSnapshot?.news || []).map((item) => normalizeLiveNews(item, { [asset.symbol]: asset.id }));
  const relatedNews = liveItems.length ? liveItems : referenceItems;
  const providerData = marketSnapshot ? {
    mode: marketSnapshot.mode,
    metrics: marketSnapshot.metrics || {},
    sourceLabel: marketSnapshot.sourceLabel,
    asOf: marketSnapshot.asOf ? new Date(marketSnapshot.asOf).toLocaleString('es-AR') : asset.priceDate,
  } : null;
  const coverage = metricCoverage(asset, providerData);
  const dynamicSections = asset.sections.map((section) => {
    if (section.id === 'advanced') {
      return {
        ...section,
        title: 'Análisis avanzado y ratios',
        simpleTitle: 'Datos técnicos y ratios',
        preview: `${coverage.available} de ${coverage.total} métricas con datos · ficha técnica · cálculo`,
        simplePreview: `${coverage.available} métricas disponibles con explicación y límites`,
      };
    }
    if (section.id === 'why' && compatibility.personalized) {
      return {
        ...section,
        preview: `${compatibility.label} · ${compatibility.finalScore}/100`,
        simplePreview: compatibility.conciseText,
        paragraphs: [compatibility.conciseText, ...compatibility.expandedText, `Versión: ${compatibility.version}.`],
        simpleParagraphs: [compatibility.conciseText, compatibility.gateExplanations?.[0] || 'El puntaje ordena activos compatibles; no predice precios ni rendimientos.'],
        facts: [['Resultado', compatibility.label], ['Puntaje', `${compatibility.finalScore}/100`], ['Elegible automáticamente', compatibility.eligibleForPortfolio ? 'Sí' : 'No'], ['Versión', compatibility.version]],
      };
    }
    if (section.id === 'portfolio' && compatibility.personalized) {
      return {
        ...section,
        paragraphs: [section.paragraphs?.[0], `Prisma calculó ${compatibility.finalScore}/100 de compatibilidad aislada. La cartera vuelve a revisar emisor, sector, moneda y superposiciones antes de asignar un porcentaje.`],
      };
    }
    return section;
  });

  useEffect(() => {
    if (!liveSymbol) return undefined;
    const controller = new AbortController();
    getMarketAsset(liveSymbol, controller.signal).then(setMarketSnapshot).catch(() => setMarketSnapshot(null));
    return () => controller.abort();
  }, [liveSymbol]);

  const save = () => {
    setAssetStates((states) => ({ ...states, [asset.id]: 'saved' }));
    inform('Activo guardado. Esto no lo agrega a la cartera.');
  };

  const togglePortfolio = () => {
    if (guidedRestriction && status !== 'portfolio') {
      inform('Podés seguir explorándolo, pero no entra automáticamente por los límites de esta propuesta.');
      return;
    }
    const next = status === 'portfolio' ? 'seen' : 'portfolio';
    setAssetStates((states) => ({ ...states, [asset.id]: next }));
    inform(next === 'portfolio' ? 'Agregado a la cartera simulada' : 'Quitado de la cartera simulada');
  };

  return (
    <>
      <BackHeader title={asset.symbol} subtitle="Ficha ampliada" onBack={() => setScreen(returnScreen)} />
      <section className="asset-detail-intro">
        <div className="detail-title-row">
          <AssetLogo asset={{ ...asset, logoUrl: marketSnapshot?.profile?.logo || asset.logoUrl }} size="large" />
          <div>
            <small>{asset.issuer}</small>
            <h1>{asset.name}</h1>
            <p>{copy.type}</p>
          </div>
        </div>
        <p className="detail-simple">{asset.explanation}</p>
        <div className="type-definition"><Info size={17} /><p><b>¿Qué significa?</b> {copy.typeDefinition}</p></div>
        <div className="detail-source"><span>{asset.source}</span><b>{asset.priceDate}</b></div>
      </section>

      <section className="detail-language">
        <div>
          <b>Nivel de explicación</b>
          <p>Prisma eligió una profundidad según tu experiencia. Podés cambiarla sin modificar tu perfil ni el riesgo del activo.</p>
        </div>
        <div className="language-options" role="group" aria-label="Nivel de explicación">
          {[['simple', 'Simple'], ['intermediate', 'Con ejemplo'], ['advanced', 'Avanzada']].map(([value, label]) => (
            <button type="button" className={explanationLevel === value ? 'selected' : ''} key={value} onClick={() => setExplanationLevel(value)}>{label}</button>
          ))}
        </div>
      </section>

      <section className={`detail-compatibility ${compatibility.eligibleForPortfolio ? 'eligible' : 'limited'}`}>
        <Sparkles size={19} />
        <div>
          <small>{compatibility.personalized ? 'COMPATIBILIDAD CON TU PUNTO DE PARTIDA' : 'EXPLORACIÓN LIBRE'}</small>
          <h2>{compatibility.personalized ? `${compatibility.label} · ${compatibility.finalScore}/100` : 'Sin puntaje personalizado'}</h2>
          <p>{compatibility.conciseText}</p>
          {compatibility.personalized && <span>{compatibility.version} · no predice rendimiento</span>}
        </div>
      </section>

      <section className="ask-prisma">
        <div className="ask-title"><MessageCircleQuestion size={19} /><div><b>Preguntale a Prisma</b><small>Escribí con tus palabras. La maqueta responde con reglas explicables.</small></div></div>
        <form className="prisma-question-form" onSubmit={(event) => { event.preventDefault(); if (!customQuestion.trim()) return; setCustomAnswer(answerAssetQuestion(asset, customQuestion)); }}>
          <input value={customQuestion} onChange={(event) => setCustomQuestion(event.target.value)} placeholder={`Ejemplo: ¿cuánto tiempo debería mantener ${asset.symbol}?`} aria-label={`Pregunta sobre ${asset.symbol}`} />
          <button type="submit" aria-label="Enviar pregunta"><Send size={17} /></button>
        </form>
        <div className="faq-chips">
          {asset.faqs.map(([question]) => <button type="button" className={faq === question ? 'selected' : ''} key={question} onClick={() => setFaq(faq === question ? null : question)}>{question}</button>)}
        </div>
        {customAnswer && <div className="faq-answer custom"><Sparkles size={16} /><p>{customAnswer}</p></div>}
        {faq && <div className="faq-answer"><Sparkles size={16} /><p>{asset.faqs.find(([question]) => question === faq)?.[1]}</p></div>}
      </section>

      <section className="valuation-summary">
        <div><small>Precio de referencia</small><b>{asset.price}</b><span>{asset.priceDate}</span></div>
        <div>
          <small>{explanationLevel === 'simple' ? 'Cómo leer este precio' : 'Valoración relativa'}</small>
          <b className={explanationLevel === 'simple' ? 'neutral' : asset.valuationTone}>{explanationLevel === 'simple' ? 'El precio solo no dice si conviene' : asset.valuation}</b>
          <span>{explanationLevel === 'simple' ? 'Hace falta compararlo con el activo, sus riesgos y el tiempo que pensás mantenerlo.' : asset.valuationReference}</span>
        </div>
      </section>

      <section className="asset-performance-section">
        <div className="detail-section-heading inline"><h2>Evolución del rendimiento</h2><p>Precio y porcentaje con período visible.</p></div>
        <PerformanceChart performance={asset.performance} period={period} onPeriodChange={setPeriod} />
      </section>

      <div className="detail-section-heading">
        <h2>Información completa del activo</h2>
        <p>Solo el resumen está abierto. Tocá cada fila para ver la sección que te interese.</p>
      </div>
      <div className="detail-accordions">
        {dynamicSections.map((section) => {
          const open = openSection === section.id;
          return (
            <section className={`detail-accordion ${section.id === 'advanced' ? 'advanced-accordion' : ''} ${open ? 'open' : ''}`} key={section.id}>
              <button type="button" onClick={() => setOpenSection(open ? null : section.id)} aria-expanded={open}>
                <div>
                  <h2>{explanationLevel === 'simple' ? section.simpleTitle || section.title : section.title}</h2>
                  {!open && <p>{explanationLevel === 'simple' ? section.simplePreview || section.preview : section.preview}</p>}
                </div>
                {open ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
              </button>
              {open && section.id === 'advanced'
                ? <AdvancedMetrics asset={asset} providerData={providerData} embedded />
                : open && <SectionContent section={section} level={explanationLevel} onSimplify={() => setExplanationLevel('simple')} />}
              {open && section.id === 'challenge' && (
                <form className="challenge-form" onSubmit={(event) => { event.preventDefault(); if (!challengeQuestion.trim()) return; setChallengeAnswer(challengeAsset(asset, challengeQuestion)); }}>
                  <label htmlFor={`challenge-${asset.id}`}>¿Qué te genera dudas de esta inversión?</label>
                  <div><input id={`challenge-${asset.id}`} value={challengeQuestion} onChange={(event) => setChallengeQuestion(event.target.value)} placeholder="Ejemplo: ¿conviene si ya tengo otra empresa de energía?" /><button type="submit">Cuestionarla</button></div>
                  {challengeAnswer && <p className="challenge-answer"><Sparkles size={15} />{challengeAnswer}</p>}
                </form>
              )}
            </section>
          );
        })}
      </div>

      <NewsFeed
        items={relatedNews}
        compact
        title={`Noticias relacionadas con ${asset.symbol}`}
        subtitle="Se muestran dentro de la ficha y explican qué exposición podría verse afectada."
        onOpenAsset={(assetId) => { if (assetId !== asset.id) setScreen(`asset:${assetId}`); }}
      />

      <section className="prototype-warning"><ShieldAlert size={19} /><p>Contenido educativo y simulado. No constituye una recomendación ni una predicción de rendimiento.</p></section>

      <div className="detail-actionbar">
        <button type="button" onClick={save}><Bookmark size={17} />{status === 'saved' ? 'Guardado' : 'Guardar'}</button>
        <button type="button" className={status === 'portfolio' ? 'selected' : ''} onClick={togglePortfolio} disabled={guidedRestriction && status !== 'portfolio'}>
          {status === 'portfolio' ? <><Check size={17} />En mi cartera</> : guidedRestriction ? 'Solo explorar' : 'Agregar a mi cartera'}
        </button>
      </div>
    </>
  );
}
