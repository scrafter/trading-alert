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

/** Result of running a strategy on the latest candles. */
export interface Evaluation {
  /**
   * What the strategy currently sees, e.g. "overbought" or "bullish_cross".
   * null means nothing notable. An alert fires whenever the state changes
   * to a non-null value, so a state that persists does not re-alert.
   */
  state: string | null;
  /** Short status for the log line, e.g. "RSI(14) = 52.65". */
  summary: string;
  /** Human-readable alert text; used when state is non-null. */
  message: string;
}

/** Something to watch on an instrument (RSI levels, MACD crossovers, ...). */
export interface Strategy {
  /** Unique, includes parameters, e.g. "RSI(14)". */
  readonly name: string;
  /** candles are sorted oldest to newest. */
  evaluate(candles: Candle[]): Evaluation;
}

export interface Alert {
  instrument: string;
  strategy: string;
  state: string;
  message: string;
  price: number;
  interval: Interval;
  candleCloseTime: number;
}

/** A channel that delivers alerts (console, Telegram, e-mail, ...). */
export interface Notifier {
  readonly name: string;
  send(alert: Alert): Promise<void>;
}
