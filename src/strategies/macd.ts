import type { Candle, Evaluation, Strategy } from "../types.ts";
import { macd } from "../indicators/macd.ts";

export interface MacdOptions {
  fast: number;
  slow: number;
  signal: number;
}

/**
 * Alerts when the MACD line crosses its signal line on the latest candle:
 * crossing up = bullish, crossing down = bearish.
 */
export class MacdStrategy implements Strategy {
  readonly name: string;
  private readonly opts: MacdOptions;

  constructor(opts: MacdOptions) {
    this.opts = opts;
    this.name = `MACD(${opts.fast},${opts.slow},${opts.signal})`;
  }

  evaluate(candles: Candle[]): Evaluation {
    const { fast, slow, signal } = this.opts;
    const points = macd(candles.map((k) => k.close), fast, slow, signal);
    const [prev, last] = points.slice(-2);
    const summary = `${this.name} = ${last.macd.toFixed(2)} / signal ${last.signal.toFixed(2)}`;

    if (prev.histogram <= 0 && last.histogram > 0) {
      return { state: "bullish_cross", summary, message: `${this.name} crossed above signal line (bullish)` };
    }
    if (prev.histogram >= 0 && last.histogram < 0) {
      return { state: "bearish_cross", summary, message: `${this.name} crossed below signal line (bearish)` };
    }
    return { state: null, summary, message: "" };
  }
}
