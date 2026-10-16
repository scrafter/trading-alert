import type { Alert } from "../types.ts";

export function formatAlert(a: Alert): string {
  const direction = a.kind === "overbought" ? "above" : "below";
  return (
    `${a.instrument} RSI ${a.kind.toUpperCase()}: ${a.rsi.toFixed(2)} is ${direction} ${a.threshold} ` +
    `(${a.interval}, price ${a.price}, candle closes ${new Date(a.candleCloseTime).toISOString()})`
  );
}
