import { ArrowLeftRight, BadgeDollarSign, Building2, ChartPie, Landmark } from 'lucide-react';
import { useState } from 'react';
import { assetLogoIdentity, logoCandidatesForAsset } from '../data/assetLogoRegistry';

const fallbackIcons = {
  bond: Landmark,
  company: Building2,
  currency: ArrowLeftRight,
  fund: ChartPie,
  listed: BadgeDollarSign,
};

export function AssetLogo({ asset, size = 'medium', className = '' }) {
  const [failedSources, setFailedSources] = useState([]);
  const identity = assetLogoIdentity(asset);
  const candidates = logoCandidatesForAsset(asset);
  const currentSource = candidates.find((source) => !failedSources.includes(source));
  const FallbackIcon = fallbackIcons[identity.fallbackKind] || BadgeDollarSign;
  const sourceKind = currentSource === asset?.logoUrl ? 'provider' : currentSource ? 'local' : 'instrument';

  return (
    <span
      className={`asset-brand-logo ${size} ${currentSource ? 'with-image' : 'instrument-fallback'} ${currentSource && identity.fit === 'wordmark' ? 'wordmark' : ''} ${className}`.trim()}
      aria-label={`Identidad visual de ${identity.label}`}
      data-logo-source={sourceKind}
      data-logo-kind={identity.fallbackKind}
    >
      {currentSource
        ? <img src={currentSource} alt={`Logo de ${identity.label}`} onError={() => setFailedSources((sources) => sources.includes(currentSource) ? sources : [...sources, currentSource])} />
        : <FallbackIcon className="asset-logo-glyph" aria-hidden="true" />}
    </span>
  );
}
