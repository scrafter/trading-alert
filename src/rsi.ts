/**
 * Relative Strength Index using Wilder's smoothing (the same method as
 * TradingView and most exchanges).
 *
 * Returns one RSI value per input price starting at index `period`
 * (i.e. the result has `closes.length - period` elements).
 * More history gives values closer to what charting tools show, because
 * Wilder's smoothing needs a few hundred bars to converge.
 */
export function rsi(closes: number[], period = 14): number[] {
  if (period < 1) throw new Error(`RSI period must be >= 1, got ${period}`);
  if (closes.length <= period) {
    throw new Error(`Need more than ${period} prices to compute RSI(${period}), got ${closes.length}`);
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  const result = [toRsi(avgGain, avgLoss)];
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result.push(toRsi(avgGain, avgLoss));
  }
  return result;
}

function toRsi(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}
