const commons = (fileName) => `https://commons.wikimedia.org/wiki/File:${fileName}`;

export const assetLogoRegistry = Object.freeze({
  AAPL: {
    label: 'Apple',
    localSrc: '/assets/logos/apple.svg',
    fit: 'symbol',
    fallbackKind: 'company',
    sourceName: 'Wikimedia Commons · Apple logo black.svg',
    sourcePage: commons('Apple_logo_black.svg'),
  },
  YPFD: {
    label: 'YPF',
    localSrc: '/assets/logos/ypf.svg',
    fit: 'wordmark',
    fallbackKind: 'company',
    sourceName: 'Wikimedia Commons · YPF S.A. logo.svg',
    sourcePage: commons('YPF_S.A._logo.svg'),
  },
  YMCXO: {
    label: 'YPF',
    localSrc: '/assets/logos/ypf.svg',
    fit: 'wordmark',
    fallbackKind: 'bond',
    sourceName: 'Wikimedia Commons · YPF S.A. logo.svg',
    sourcePage: commons('YPF_S.A._logo.svg'),
  },
  SPY: {
    label: 'State Street SPDR',
    localSrc: '/assets/logos/state-street.svg',
    fit: 'wordmark',
    fallbackKind: 'fund',
    sourceName: 'Wikimedia Commons · State Street logo',
    sourcePage: commons('State-street-logo-final.svg'),
  },
  KO: {
    label: 'The Coca-Cola Company',
    localSrc: '/assets/logos/coca-cola.svg',
    fit: 'wordmark',
    fallbackKind: 'company',
    sourceName: 'Wikimedia Commons · The Coca-Cola Company (2020).svg',
    sourcePage: commons('The_Coca-Cola_Company_(2020).svg'),
  },
  GGAL: {
    label: 'Grupo Financiero Galicia',
    localSrc: '/assets/logos/galicia.svg',
    fit: 'wordmark',
    fallbackKind: 'company',
    sourceName: 'Wikimedia Commons · Grupo Financiero Galicia.svg',
    sourcePage: commons('Grupo_Financiero_Galicia.svg'),
  },
  PAMP: {
    label: 'Pampa Energía',
    localSrc: '/assets/logos/pampa-energia.svg',
    fit: 'wordmark',
    fallbackKind: 'company',
    sourceName: 'Wikimedia Commons · Pampa Energia Logo.svg',
    sourcePage: commons('Pampa_Energia_Logo.svg'),
  },
  AL30: { label: 'Bono soberano AL30', fallbackKind: 'bond' },
  GD30: { label: 'Bono soberano GD30', fallbackKind: 'bond' },
  FHD: { label: 'Fondo Horizonte Dólar · producto ilustrativo', fallbackKind: 'fund' },
  MEP: { label: 'Conversión dólar MEP', fallbackKind: 'currency' },
  'FCI-P': { label: 'Fondo Liquidez Pesos · producto ilustrativo', fallbackKind: 'fund' },
});

export function inferAssetLogoKind(asset = {}) {
  const text = `${asset.type || ''} ${asset.simpleType || ''} ${asset.sector || ''}`.toLocaleLowerCase('es');
  if (/bono|bond|obligaci[oó]n|deuda|renta fija|fixed income|treasury|letra|tesoro/.test(text)) return 'bond';
  if (/fondo|fund|\betf\b|money market|[ií]ndice|index/.test(text)) return 'fund';
  if (/d[oó]lar|dollar|currency|moneda|conversi[oó]n|divisa|forex/.test(text)) return 'currency';
  if (/acci[oó]n|stock|equity|cedear|empresa|company/.test(text)) return 'company';
  return 'listed';
}

export function assetLogoIdentity(asset = {}) {
  const symbol = String(asset.symbol || '').trim().toUpperCase();
  const registered = assetLogoRegistry[symbol];
  return {
    symbol,
    label: registered?.label || asset.issuer || asset.name || symbol || 'Activo listado',
    localSrc: registered?.localSrc || null,
    fit: registered?.fit || 'symbol',
    fallbackKind: registered?.fallbackKind || inferAssetLogoKind(asset),
    sourceName: registered?.sourceName || null,
    sourcePage: registered?.sourcePage || null,
  };
}

export function logoCandidatesForAsset(asset = {}) {
  const identity = assetLogoIdentity(asset);
  return [...new Set([asset.logoUrl, identity.localSrc].filter((value) => typeof value === 'string' && value.trim()))];
}
