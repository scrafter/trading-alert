// LANGUAGE EXCEPTION: this file intentionally contains Polish text. It is the
// single boundary where alert messages are translated for a Polish-speaking
// recipient; everything else in the codebase stays in English. Keep Polish
// strings in this file only.

import type { Alert, AlertFormatter, AlertText, Interval } from "../types.ts";

const TIME_ZONE = "Europe/Warsaw";

const INTERVAL_NAMES: Record<Interval, string> = {
  "1m": "1 min", "3m": "3 min", "5m": "5 min", "15m": "15 min", "30m": "30 min",
  "1h": "1 godz.", "2h": "2 godz.", "4h": "4 godz.", "6h": "6 godz.", "8h": "8 godz.", "12h": "12 godz.",
  "1d": "1 dzień", "3d": "3 dni", "1w": "1 tydzień", "1M": "1 miesiąc",
};

type Template = (a: Alert) => AlertText;

/**
 * One template per strategy state; unknown states fall back to the strategy's
 * English message. Kept short on purpose: a title plus two lines.
 */
const TEMPLATES: Record<string, Template> = {
  overbought: (a) => ({
    title: `🔴 ${a.instrument}: RSI wykupienie`,
    body: `${a.strategy} ${num(a.values.rsi)} > ${num(a.values.threshold)}, możliwa korekta w dół.`,
  }),
  oversold: (a) => ({
    title: `🟢 ${a.instrument}: RSI wyprzedanie`,
    body: `${a.strategy} ${num(a.values.rsi)} < ${num(a.values.threshold)}, możliwe odbicie w górę.`,
  }),
  bullish_cross: (a) => ({
    title: `📈 ${a.instrument}: MACD przecięcie w górę`,
    body: `MACD ${num(a.values.macd)} przeciął sygnał ${num(a.values.signal)} od dołu, momentum wzrostowe.`,
  }),
  bearish_cross: (a) => ({
    title: `📉 ${a.instrument}: MACD przecięcie w dół`,
    body: `MACD ${num(a.values.macd)} przeciął sygnał ${num(a.values.signal)} od góry, momentum spadkowe.`,
  }),
};

export class PolishFormatter implements AlertFormatter {
  format(a: Alert): AlertText {
    const { title, body } = TEMPLATES[a.state]?.(a) ?? { title: `⚠️ ${a.instrument}: ${a.strategy}`, body: a.message };
    const context = `Cena ${price(a.price)} · ${INTERVAL_NAMES[a.interval]} · ${dateTime(a.candleCloseTime + 1)}`;
    return { title, body: `${body}\n${context}` };
  }
}

function num(n: number): string {
  return n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

function price(n: number): string {
  return n.toLocaleString("pl-PL", n >= 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 8 });
}

function dateTime(ms: number): string {
  return new Date(ms).toLocaleString("pl-PL", {
    timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}
