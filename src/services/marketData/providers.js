const simulatedQuotes = {
  'cedear-spy': [48250, 0.72], 'cedear-aapl': [18750, -0.38], 'equity-ypfd': [52100, 1.14], 'on-ypf': [102.4, 0.05],
  'bond-al30': [71.35, -0.62], 'fund-money-market': [18.42, 0.08], 'fund-short-bond': [32.18, 0.16],
  'fund-cer': [54.72, -0.11], 'usd-mep': [1328.6, 0.43], 'fund-usd-bond': [1.08, 0.12],
};

export class MockMarketDataProvider {
  async getAssetQuote(assetId) {
    const [price, change] = simulatedQuotes[assetId] ?? [100, 0];
    return { assetId, price, changePercent: change, currency: assetId.includes('usd-bond') || assetId.startsWith('on-') ? 'USD' : 'ARS', status:'simulated', source:'Datos de demostración de Prisma', updatedAt:new Date().toISOString(), delayed:true };
  }
  async getAssetHistory(assetId) { return { assetId, points:[], status:'simulated' }; }
  async getAssetEvents(asset) { return asset.events ?? []; }
  async getMarketStatus() { return { isOpen:false, label:'Mercado cerrado', status:'simulated' }; }
}

export class RealMarketDataProvider {
  constructor({ baseUrl, apiKey, fetchImpl = globalThis.fetch } = {}) { this.baseUrl=baseUrl; this.apiKey=apiKey; this.fetchImpl=fetchImpl; }
  async request(path) {
    if (!this.baseUrl || !this.fetchImpl) throw new Error('Proveedor real no configurado');
    const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/,'')}${path}`, { headers:this.apiKey ? { Authorization:`Bearer ${this.apiKey}` } : {} });
    if (!response.ok) throw new Error(`Fuente de mercado respondió ${response.status}`);
    return response.json();
  }
  async getAssetQuote(assetId) {
    const data = await this.request(`/quotes/${encodeURIComponent(assetId)}`);
    if (!Number.isFinite(Number(data.price))) throw new Error('Cotización real inválida');
    return { assetId, price:Number(data.price), changePercent:Number(data.changePercent ?? 0), currency:data.currency ?? 'ARS', status:data.delayed ? 'delayed' : 'realtime', source:data.source ?? 'Proveedor configurado', updatedAt:data.updatedAt ?? new Date().toISOString(), delayed:Boolean(data.delayed) };
  }
  async getAssetHistory(assetId) { return this.request(`/history/${encodeURIComponent(assetId)}`); }
  async getAssetEvents(assetId) { return this.request(`/events/${encodeURIComponent(assetId)}`); }
  async getMarketStatus() { return this.request('/market/status'); }
}
