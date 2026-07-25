import { normalizeProfile } from '../investorProfile/normalize.js';

const closeness = (a,b) => Math.max(0,100-Math.abs(a-b));
const goalScores = {
  protect: asset => Math.round((100-asset.metrics.risk)*.45 + asset.metrics.liquidity*.3 + asset.metrics.inflation*.25),
  home: asset => Math.round(asset.metrics.liquidity*.45 + (100-asset.metrics.risk)*.35 + asset.metrics.inflation*.2),
  income: asset => Math.round(asset.metrics.credit*.45 + (100-asset.metrics.risk)*.25 + asset.metrics.liquidity*.3),
  growth: asset => Math.round(asset.metrics.equity*.55 + asset.metrics.international*.3 + asset.metrics.horizon*.15),
  retirement: asset => Math.round(asset.metrics.international*.4 + asset.metrics.horizon*.35 + (100-asset.metrics.risk)*.25),
  education: () => 60,
};

export function calculateCompatibility(asset, savedProfile, positions = []) {
  const profile = normalizeProfile(savedProfile);
  const risk = closeness(profile.risk, asset.metrics.risk);
  const horizon = closeness(profile.horizon, asset.metrics.horizon);
  const liquidity = asset.metrics.liquidity >= profile.liquidity ? 100 : closeness(profile.liquidity,asset.metrics.liquidity);
  const knowledge = asset.metrics.complexity <= profile.knowledge ? 100 : closeness(profile.knowledge,asset.metrics.complexity);
  const goal = (goalScores[profile.goal] ?? goalScores.education)(asset);
  const financial = asset.metrics.risk <= profile.financialCapacity + 20 ? 90 : closeness(profile.financialCapacity,asset.metrics.risk);
  const existingAssets = new Set(positions.map(position => position.assetId));
  const duplicateExposure = asset.overlaps?.some(id => existingAssets.has(id)) ? 12 : 0;
  const sameIssuerCount = positions.filter(position => position.issuer === asset.issuer).length;
  const concentration = sameIssuerCount ? Math.min(18,sameIssuerCount*9) : 0;
  const weighted = risk*.28+horizon*.18+liquidity*.14+knowledge*.12+goal*.16+financial*.12-duplicateExposure-concentration;
  const positiveReasons=[]; const warnings=[];
  if(horizon>78) positiveReasons.push('Coincide con tu horizonte de inversión');
  if(asset.metrics.international>70) positiveReasons.push('Aporta diversificación internacional');
  if(asset.metrics.liquidity>80) positiveReasons.push('Ofrece una liquidez compatible con tus preferencias');
  if(asset.metrics.inflation>70) positiveReasons.push('Puede aportar exposición vinculada a la inflación');
  if(!savedProfile) positiveReasons.push('Aporta valor educativo para conocer este instrumento');
  if(asset.metrics.risk>70) warnings.push(asset.riskExplanation);
  if(duplicateExposure) warnings.push('Se superpone con una exposición que ya tenés en tu selección');
  if(concentration) warnings.push(`Aumentaría tu concentración en ${asset.issuer}`);
  if(asset.metrics.liquidity<profile.liquidity) warnings.push('Su plazo de rescate puede no coincidir con tu necesidad de liquidez');
  return { score:Math.max(0,Math.min(100,Math.round(weighted))), breakdown:{risk,horizon,liquidity,knowledge,goal,financial,duplicateExposure,concentration}, positiveReasons:positiveReasons.slice(0,3), warnings: warnings.slice(0,3) };
}

export function rankAssets(assets, profile, positions = []) {
  return assets.map(asset=>({asset,compatibility:calculateCompatibility(asset,profile,positions)})).sort((a,b)=>b.compatibility.score-a.compatibility.score || a.asset.type.localeCompare(b.asset.type));
}
