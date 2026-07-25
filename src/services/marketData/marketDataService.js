import { MockMarketDataProvider, RealMarketDataProvider } from './providers.js';

export function createMarketDataService({ realProvider, fallbackProvider = new MockMarketDataProvider() } = {}) {
  const real = realProvider ?? new RealMarketDataProvider({ baseUrl:import.meta.env?.VITE_MARKET_DATA_URL, apiKey:import.meta.env?.VITE_MARKET_DATA_TOKEN });
  async function withFallback(method, ...args) {
    try {
      const data = await real[method](...args);
      return { data, fallbackUsed:false, error:null };
    } catch (error) {
      const data = await fallbackProvider[method](...args);
      return { data, fallbackUsed:true, error:error.message };
    }
  }
  return {
    getAssetQuote: assetId => withFallback('getAssetQuote', assetId),
    getAssetHistory: assetId => withFallback('getAssetHistory', assetId),
    getAssetEvents: asset => withFallback('getAssetEvents', asset),
    getMarketStatus: () => withFallback('getMarketStatus'),
  };
}

export const marketDataService = createMarketDataService();
