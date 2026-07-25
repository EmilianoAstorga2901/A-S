import test from 'node:test';
import assert from 'node:assert/strict';
import { assetCatalog } from '../src/domain/assets/catalog.js';
import { calculateCompatibility, rankAssets } from '../src/domain/compatibility/engine.js';
import { createMarketDataService } from '../src/services/marketData/marketDataService.js';
import { MockMarketDataProvider } from '../src/services/marketData/providers.js';
import { profileRepository, interactionRepository } from '../src/services/persistence/repositories.js';

const conservative={answers:{goal:'protect',horizon:'short',liquidity:'essential',knowledge:'basic'},capacity:.5,tolerance:.5};
const aggressive={answers:{goal:'growth',horizon:'very-long',liquidity:'none',knowledge:'advanced'},capacity:2.8,tolerance:2.8};

test('different profiles receive a different asset order',()=>{
 const conservativeOrder=rankAssets(assetCatalog,conservative).map(item=>item.asset.id);
 const aggressiveOrder=rankAssets(assetCatalog,aggressive).map(item=>item.asset.id);
 assert.notDeepEqual(conservativeOrder,aggressiveOrder);
 assert.equal(conservativeOrder[0],'fund-money-market');
 assert.ok(aggressiveOrder.slice(0,3).includes('cedear-spy')||aggressiveOrder.slice(0,3).includes('cedear-aapl'));
});

test('an overlapping position lowers compatibility and explains why',()=>{
 const apple=assetCatalog.find(asset=>asset.id==='cedear-aapl');
 const before=calculateCompatibility(apple,aggressive,[]);
 const after=calculateCompatibility(apple,aggressive,[{assetId:'cedear-spy',issuer:'State Street'}]);
 assert.ok(after.score<before.score);
 assert.ok(after.warnings.some(reason=>reason.includes('superpone')));
});

test('profile and card interactions persist through repositories',()=>{
 profileRepository.clearProfile(); interactionRepository.clear();
 profileRepository.saveProfile(conservative);
 interactionRepository.record('cedear-spy','saved');
 assert.equal(profileRepository.getProfile().answers.goal,'protect');
 assert.ok(interactionRepository.getInteractions().saved['cedear-spy']);
});

test('market service falls back without presenting mock data as real',async()=>{
 const failing={getAssetQuote:async()=>{throw new Error('offline')}};
 const service=createMarketDataService({realProvider:failing,fallbackProvider:new MockMarketDataProvider()});
 const result=await service.getAssetQuote('cedear-spy');
 assert.equal(result.fallbackUsed,true);
 assert.equal(result.data.status,'simulated');
 assert.equal(result.error,'offline');
});

test('simulated portfolio recalculates position percentages', async()=>{
 const { portfolioRepository } = await import('../src/services/persistence/repositories.js');
 portfolioRepository.clear();
 portfolioRepository.addPosition({assetId:'one',simulatedAmount:100,issuer:'A'});
 const positions=portfolioRepository.addPosition({assetId:'two',simulatedAmount:300,issuer:'B'});
 assert.deepEqual(positions.map(item=>item.portfolioPercentage),[25,75]);
});
