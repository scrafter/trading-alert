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
  /** Default (English) alert text; used when state is non-null and no translation exists. */
  message: string;
  /** Raw numbers behind the signal, e.g. { rsi: 72.4, threshold: 70 }, for message templates. */
  values: Record<string, number>;
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
  /** Strategy name with parameters, e.g. "RSI(14)". */
  strategy: string;
  state: string;
  /** Default (English) text from the strategy. */
  message: string;
  values: Record<string, number>;
  price: number;
  interval: Interval;
  candleCloseTime: number;
}

/** Alert rendered for people: a short title and a longer body. */
export interface AlertText {
  title: string;
  body: string;
}

/** Turns an alert into human-readable text (one implementation per language). */
export interface AlertFormatter {
  format(alert: Alert): AlertText;
}

/** A channel that delivers alerts (console, Telegram, e-mail, ...). */
export interface Notifier {
  readonly name: string;
  send(alert: Alert): Promise<void>;
}
