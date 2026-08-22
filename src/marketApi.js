const API_URL = import.meta.env.VITE_PRISMA_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const error = new Error(`Market request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function getMarketStatus(signal) {
  return request('/market/status', { signal });
}

export async function searchMarketAssets(query, signal) {
  const value = String(query || '').trim();
  if (value.length < 2) return { mode: 'idle', assets: [] };
  return request(`/market/search?q=${encodeURIComponent(value)}&limit=20`, { signal });
}

export async function getMarketAsset(symbol, signal) {
  return request(`/market/assets/${encodeURIComponent(symbol)}`, { signal });
}

export async function getMarketNews(symbols, signal) {
  const value = symbols.map((symbol) => String(symbol).trim().toUpperCase()).filter(Boolean).join(',');
  return request(`/market/news?symbols=${encodeURIComponent(value)}`, { signal });
}

export async function getMarketProfiles(symbols, signal) {
  const value = symbols.map((symbol) => String(symbol).trim().toUpperCase()).filter(Boolean).join(',');
  return request(`/market/profiles?symbols=${encodeURIComponent(value)}`, { signal });
}

export function rememberMarketAsset(asset) {
  sessionStorage.setItem('prisma-market-asset', JSON.stringify(asset));
}

export function readRememberedMarketAsset(symbol) {
  try {
    const asset = JSON.parse(sessionStorage.getItem('prisma-market-asset'));
    return asset?.symbol === symbol ? asset : null;
  } catch {
    return null;
  }
}
