import type { Candle, Interval, MarketDataProvider } from "../types.ts";

/**
 * Binance spot market data via the public REST API (no API key needed).
 * Symbols use Binance notation without a separator, e.g. "BTCUSDC".
 * Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints
 */
export class BinanceProvider implements MarketDataProvider {
  readonly name = "binance";
  private readonly baseUrl: string;

  constructor(baseUrl = "https://api.binance.com") {
    this.baseUrl = baseUrl;
  }

  async getCandles(symbol: string, interval: Interval, limit: number): Promise<Candle[]> {
    const url = new URL("/api/v3/klines", this.baseUrl);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("limit", String(Math.min(limit, 1000)));

    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      throw new Error(`Binance ${res.status} for ${symbol}: ${await res.text()}`);
    }

    // Each kline: [openTime, open, high, low, close, volume, closeTime, ...]
    const rows = (await res.json()) as [number, string, string, string, string, string, number][];
    return rows.map((r) => ({
      openTime: r[0],
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
      closeTime: r[6],
    }));
  }
}
