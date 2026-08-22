import { ExternalLink, Newspaper, Radio, ShieldCheck } from 'lucide-react';
import { assets as defaultAssets, portfolios as defaultPortfolios } from '../data/MockData';

const impactLabels = {
  favorable: 'Favorable',
  adverse: 'Adverso',
  mixed: 'Mixto',
  uncertain: 'Incierto',
};

export function NewsFeed({
  items = [],
  assets = defaultAssets,
  portfolios = defaultPortfolios,
  onOpenAsset,
  title = 'Noticias y eventos que pueden afectarte',
  subtitle = 'Separados del mazo de activos y vinculados con tus exposiciones.',
  compact = false,
}) {
  const assetById = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
  const portfolioById = Object.fromEntries(portfolios.map((portfolio) => [portfolio.id, portfolio]));
  const hasLiveItems = items.some((item) => item.source?.kind === 'live');

  return (
    <section className={`portfolio-news ${compact ? 'compact' : ''}`}>
      <header className="portfolio-news-heading">
        <span><Newspaper size={20} /></span>
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </header>
      <div className={`news-mode-note ${hasLiveItems ? 'live' : 'reference'}`}>
        {hasLiveItems ? <Radio size={15} /> : <ShieldCheck size={15} />}
        <p><b>{hasLiveItems ? 'Fuentes conectadas' : 'Vista de referencia'}</b>{hasLiveItems ? ' Revisá siempre fuente, fecha y alcance.' : ' Estos ejemplos muestran el diseño y no se presentan como noticias actuales.'}</p>
      </div>
      <div className="news-story-list">
        {items.map((item, index) => {
          const affectedAssets = (item.affectedAssetIds || []).map((id) => assetById[id]).filter(Boolean);
          const affectedPortfolios = (item.affectedPortfolioIds || []).map((id) => portfolioById[id]).filter(Boolean);
          const sourceUrl = item.url || item.source?.url;
          return (
            <article className={`news-story ${index % 2 ? 'media-right' : 'media-left'}`} key={item.id}>
              <figure className="news-story-media">
                <img src={item.imageUrl || '/news/market-context.svg'} alt={item.imageAlt || ''} loading="lazy" onError={(event) => { if (!event.currentTarget.src.endsWith('/news/market-context.svg')) event.currentTarget.src = '/news/market-context.svg'; }} />
                <span className={`news-impact ${item.impact || 'uncertain'}`}>{item.impactLabel || impactLabels[item.impact] || 'Impacto incierto'}</span>
              </figure>
              <div className="news-story-content">
                <div className="news-source-row"><span><Newspaper size={12} />{item.source?.name}</span><time>{item.publishedLabel}</time></div>
                <h3>{item.headline}</h3>
                <p className="news-summary">{item.summary}</p>
                <small className="news-fact-status">{item.factStatus}</small>
                {affectedAssets.length > 0 && (
                  <div className="news-links"><small>Activos relacionados</small><div>{affectedAssets.map((asset) => <button type="button" key={asset.id} onClick={() => onOpenAsset?.(asset.id)}>{asset.symbol}</button>)}</div></div>
                )}
                <div className="news-story-context">
                  {affectedPortfolios.length > 0 && <p className="news-portfolio"><b>Afecta tu cartera:</b> {affectedPortfolios.map((portfolio) => portfolio.name).join(' · ')}</p>}
                  <p className="news-relevance">{item.relevance}</p>
                </div>
                {sourceUrl && <a className="news-source-link" href={sourceUrl} target="_blank" rel="noreferrer">{item.source?.kind === 'live' ? 'Abrir noticia original' : 'Ver fuente de referencia'} <ExternalLink size={13} /></a>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
