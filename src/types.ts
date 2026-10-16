export interface Candle {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Candle interval, using Binance notation. */
export type Interval =
  | "1m" | "3m" | "5m" | "15m" | "30m"
  | "1h" | "2h" | "4h" | "6h" | "8h" | "12h"
  | "1d" | "3d" | "1w" | "1M";

/** A source of OHLC candles (Binance, Yahoo, ...). */
export interface MarketDataProvider {
  readonly name: string;
  /** Returns candles sorted from oldest to newest. */
  getCandles(symbol: string, interval: Interval, limit: number): Promise<Candle[]>;
}

export type AlertKind = "overbought" | "oversold";

export interface Alert {
  instrument: string;
  kind: AlertKind;
  rsi: number;
  threshold: number;
  price: number;
  interval: Interval;
  candleCloseTime: number;
}

/** A channel that delivers alerts (console, Telegram, e-mail, ...). */
export interface Notifier {
  readonly name: string;
  send(alert: Alert): Promise<void>;
}
