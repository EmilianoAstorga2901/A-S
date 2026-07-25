export function createSimulatedPosition(asset, quote, amount = 100000) {
  const quantity = quote.price > 0 ? amount / quote.price : 0;
  return { assetId:asset.id, issuer:asset.issuer, type:asset.type, currency:asset.currency, sector:asset.sector, simulatedAmount:amount, estimatedQuantity:Number(quantity.toFixed(4)), referencePrice:quote.price, addedAt:new Date().toISOString(), portfolioPercentage:0, simulatedGainLoss:0 };
}

export function analyzePortfolio(positions) {
  const warnings=[];
  const countBy = key => positions.reduce((result,item)=>({...result,[item[key]]:(result[item[key]]??0)+1}),{});
  for(const [issuer,count] of Object.entries(countBy('issuer'))) if(count>1) warnings.push(`Hay ${count} posiciones vinculadas a ${issuer}.`);
  for(const [sector,count] of Object.entries(countBy('sector'))) if(count>2) warnings.push(`Existe una concentración elevada en ${sector}.`);
  return warnings;
}
