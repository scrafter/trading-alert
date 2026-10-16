import type { Candle, Evaluation, Strategy } from "../types.ts";
import { rsi } from "../indicators/rsi.ts";

export interface RsiOptions {
  /** RSI lookback period (14 is the standard). */
  period: number;
  /** Alert when RSI rises above this value. */
  overbought: number;
  /** Alert when RSI drops below this value. */
  oversold: number;
}

/** Alerts when RSI enters the overbought or oversold zone. */
export class RsiStrategy implements Strategy {
  readonly name: string;
  private readonly opts: RsiOptions;

  constructor(opts: RsiOptions) {
    if (opts.oversold >= opts.overbought) {
      throw new Error(`RSI oversold (${opts.oversold}) must be below overbought (${opts.overbought})`);
    }
    this.opts = opts;
    this.name = `RSI(${opts.period})`;
  }

  evaluate(candles: Candle[]): Evaluation {
    const { period, overbought, oversold } = this.opts;
    const value = rsi(candles.map((k) => k.close), period).at(-1)!;
    const summary = `${this.name} = ${value.toFixed(2)}`;

    if (value > overbought) {
      return { state: "overbought", summary, message: `${summary} rose above ${overbought} (overbought)` };
    }
    if (value < oversold) {
      return { state: "oversold", summary, message: `${summary} dropped below ${oversold} (oversold)` };
    }
    return { state: null, summary, message: "" };
  }
}
