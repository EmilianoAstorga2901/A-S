import { ArrowDownRight, ArrowUpRight, Database, ExternalLink, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdvancedMetrics } from '../components/AdvancedMetrics';
import { AssetLogo } from '../components/AssetLogo';
import { NewsFeed } from '../components/NewsFeed';
import { normalizeLiveNews } from '../data/newsData';
import { getMarketAsset, readRememberedMarketAsset } from '../marketApi';

const priceFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 });

function genericAsset(symbol, remembered, snapshot) {
  const profile = snapshot?.profile || {};
  const quote = snapshot?.quote || {};
  return {
    id: `market-${symbol.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    symbol,
    name: profile.name || remembered?.description || symbol,
    issuer: profile.name || remembered?.description || remembered?.displaySymbol || symbol,
    type: remembered?.type || profile.type || 'Acción o instrumento listado',
    simpleType: remembered?.type || 'Activo del catálogo conectado',
    logoUrl: profile.logo || remembered?.logoUrl || null,
    priceDate: snapshot?.asOf ? new Date(snapshot.asOf).toLocaleString('es-AR') : 'Pendiente de actualización',
    dailyReturn: Number.isFinite(Number(quote.dp)) ? Number(quote.dp) : undefined,
    monthlyReturn: undefined,
    annualReturn: snapshot?.metrics?.['52WeekPriceReturnDaily'],
  };
}

export function MarketAssetDetail({ symbol, BackHeader, setScreen }) {
  const remembered = useMemo(() => readRememberedMarketAsset(symbol), [symbol]);
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    getMarketAsset(symbol, controller.signal)
      .then((data) => { setSnapshot(data); setStatus('ready'); })
      .catch((error) => { if (error.name !== 'AbortError') setStatus('unavailable'); });
    return () => controller.abort();
  }, [symbol]);

  const asset = genericAsset(symbol, remembered, snapshot);
  const quote = snapshot?.quote;
  const change = Number(quote?.dp);
  const providerData = snapshot ? {
    mode: snapshot.mode,
    metrics: snapshot.metrics || {},
    sourceLabel: snapshot.sourceLabel,
    asOf: asset.priceDate,
  } : null;
  const liveNews = (snapshot?.news || []).map((item) => normalizeLiveNews(item, { [symbol]: asset.id }));

  return (
    <>
      <BackHeader title={symbol} subtitle="Ficha del catálogo conectado" onBack={() => setScreen('asset-list')} />
      <section className="market-asset-hero">
        <div className="market-asset-identity"><AssetLogo asset={asset} size="large" /><div><small>{asset.type}</small><h1>{asset.name}</h1><p>{remembered?.displaySymbol || symbol}{remembered?.exchange ? ` · ${remembered.exchange}` : ''}</p></div></div>
        {quote?.c !== undefined ? (
          <div className="live-quote"><span><small>Último precio</small><b>{priceFormatter.format(quote.c)} {snapshot?.currency || snapshot?.profile?.currency || ''}</b></span>{Number.isFinite(change) && <em className={change >= 0 ? 'positive' : 'negative'}>{change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{change >= 0 ? '+' : ''}{change.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%</em>}</div>
        ) : <p className="market-loading">{status === 'loading' ? 'Consultando precio y ficha…' : 'No fue posible obtener una cotización en este momento.'}</p>}
        <div className="market-source-line"><Database size={14} /><span>{snapshot?.sourceLabel || 'Proveedor de mercado pendiente'}</span><time>{asset.priceDate}</time></div>
        {snapshot?.profile?.weburl && <a href={snapshot.profile.weburl} target="_blank" rel="noreferrer">Sitio del emisor <ExternalLink size={13} /></a>}
      </section>

      <section className="market-coverage-warning"><ShieldAlert size={18} /><p><b>Ficha informativa, todavía no elegible para la cartera guiada.</b> Para incorporarlo con Prisma faltan reglas de instrumento, riesgo, liquidez, horizonte y concentración. En la ruta manual podés explorarlo sin que la app finja esa validación.</p></section>

      <AdvancedMetrics asset={asset} providerData={providerData} />
      {liveNews.length > 0 && <NewsFeed items={liveNews} assets={[asset]} portfolios={[]} compact title={`Noticias relacionadas con ${symbol}`} subtitle="Aparecen en la ficha, sin ocultarse detrás de un botón." />}
      {status === 'unavailable' && <section className="prototype-warning"><ShieldAlert size={19} /><p>El proveedor no respondió o todavía no está configurado. La interfaz no reemplaza el dato por uno inventado.</p></section>}
    </>
  );
}
