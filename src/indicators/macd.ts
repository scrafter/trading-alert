/**
 * Exponential moving average, seeded with the simple average of the first
 * `period` values. Result[0] corresponds to values[period - 1].
 */
export function ema(values: number[], period: number): number[] {
  if (period < 1) throw new Error(`EMA period must be >= 1, got ${period}`);
  if (values.length < period) {
    throw new Error(`Need at least ${period} values to compute EMA(${period}), got ${values.length}`);
  }
  const k = 2 / (period + 1);
  let current = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const result = [current];
  for (let i = period; i < values.length; i++) {
    current = values[i] * k + current * (1 - k);
    result.push(current);
  }
  return result;
}

export interface MacdPoint {
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * MACD = EMA(fast) - EMA(slow); signal = EMA(MACD, signalPeriod).
 * Returns points aligned to the end of `closes` (the last point is the latest candle).
 */
export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): MacdPoint[] {
  if (fast >= slow) throw new Error(`MACD fast period (${fast}) must be below slow (${slow})`);

  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const offset = slow - fast;
  const macdLine = emaSlow.map((s, i) => emaFast[i + offset] - s);
  const signalLine = ema(macdLine, signalPeriod);

  const start = signalPeriod - 1;
  return signalLine.map((signal, i) => {
    const m = macdLine[i + start];
    return { macd: m, signal, histogram: m - signal };
  });
}
