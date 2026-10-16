import type { Alert } from "../types.ts";

export function formatAlert(a: Alert): string {
  return (
    `${a.instrument}: ${a.message} ` +
    `(${a.interval}, price ${a.price}, candle closes ${new Date(a.candleCloseTime).toISOString()})`
  );
}
