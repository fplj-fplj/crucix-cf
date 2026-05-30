import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: number;
  marketState?: string;
}

interface YahooResponse {
  quoteResponse: {
    result: YahooQuote[];
    error: unknown;
  };
}

interface MarketItem {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

const INDEX_SYMBOLS = '^GSPC,^IXIC,^DJI,^RUT';
const CRYPTO_SYMBOLS = 'BTC-USD,ETH-USD';
const ENERGY_SYMBOLS = 'CL=F,BZ=F,NG=F';
const METAL_SYMBOLS = 'GC=F,SI=F';

function toMarketItem(q: YahooQuote): MarketItem {
  return {
    symbol: q.symbol,
    name: q.shortName || q.longName || q.symbol,
    price: q.regularMarketPrice ?? null,
    change: q.regularMarketChange ?? null,
    changePercent: q.regularMarketChangePercent ?? null,
  };
}

export async function fetchYahooData(): Promise<SourceResult> {
  try {
    const allSymbols = [INDEX_SYMBOLS, CRYPTO_SYMBOLS, ENERGY_SYMBOLS, METAL_SYMBOLS].join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${allSymbols}`;

    const result = await safeFetchJSON<YahooResponse>(url);
    const quotes = result.quoteResponse?.result || [];

    const indexSet = new Set(INDEX_SYMBOLS.split(','));
    const cryptoSet = new Set(CRYPTO_SYMBOLS.split(','));
    const energySet = new Set(ENERGY_SYMBOLS.split(','));
    const metalSet = new Set(METAL_SYMBOLS.split(','));

    const indexes: MarketItem[] = [];
    const crypto: MarketItem[] = [];
    const energy: MarketItem[] = [];
    const metals: MarketItem[] = [];

    for (const q of quotes) {
      const item = toMarketItem(q);
      if (indexSet.has(q.symbol)) indexes.push(item);
      else if (cryptoSet.has(q.symbol)) crypto.push(item);
      else if (energySet.has(q.symbol)) energy.push(item);
      else if (metalSet.has(q.symbol)) metals.push(item);
    }

    return {
      name: 'yahoo-finance', source: 'yahoo-finance',
      success: true,
      data: { indexes, crypto, energy, metals },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'yahoo-finance', source: 'yahoo-finance',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
