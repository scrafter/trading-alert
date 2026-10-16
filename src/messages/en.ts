import type { Alert, AlertFormatter, AlertText } from "../types.ts";

/** English alerts, built from the strategies' default messages. */
export class EnglishFormatter implements AlertFormatter {
  format(a: Alert): AlertText {
    return {
      title: `${a.instrument}: ${a.strategy} ${a.state.replace(/_/g, " ")}`,
      body: `${a.message}\nPrice ${a.price} · ${a.interval} · ${new Date(a.candleCloseTime + 1).toISOString()}`,
    };
  }
}
