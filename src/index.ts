// ============================================================================
// CONFIGURATION — edit this section
// ============================================================================

/** Default RSI settings, used by every instrument unless it overrides them. */
const DEFAULTS = {
  /** Alert when RSI rises above this value. */
  overbought: 70,
  /** Alert when RSI drops below this value. */
  oversold: 30,
  /** RSI lookback period (14 is the standard). */
  rsiPeriod: 14,
  /** Candle interval the RSI is computed on. */
  interval: "1h",
  /**
   * true  = only use fully closed candles (no flickering alerts, but up to one candle late).
   * false = include the still-forming candle (faster, but RSI can cross back before close).
   */
  closedCandlesOnly: true,
} satisfies Omit<InstrumentConfig, "label" | "symbol" | "provider">;

/** Instruments to watch. Add more entries here; any DEFAULTS key can be overridden per entry. */
const INSTRUMENTS: InstrumentConfig[] = [
  { label: "BTC/USDC", symbol: "BTCUSDC", provider: "binance" },
  // { label: "ETH/USDC", symbol: "ETHUSDC", provider: "binance", interval: "4h" },
  // { label: "SOL/USDC", symbol: "SOLUSDC", provider: "binance", overbought: 75, oversold: 25 },
];

/** How often to re-check all instruments. */
const CHECK_EVERY_SECONDS = 60;

/** How many candles to download. More history = RSI closer to TradingView values. */
const CANDLE_HISTORY = 500;

// ============================================================================

import type { AlertKind, Interval, MarketDataProvider, Notifier } from "./types.ts";
import { rsi } from "./rsi.ts";
import { BinanceProvider } from "./providers/binance.ts";
import { ConsoleNotifier } from "./notifiers/console.ts";
import { TelegramNotifier } from "./notifiers/telegram.ts";

interface InstrumentConfig {
  /** Human-readable name used in alerts. */
  label: string;
  /** Symbol as the provider expects it. */
  symbol: string;
  provider: keyof typeof PROVIDERS;
  overbought?: number;
  oversold?: number;
  rsiPeriod?: number;
  interval?: Interval;
  closedCandlesOnly?: boolean;
}

/** Register new data sources here (e.g. a Yahoo Finance provider for stocks). */
const PROVIDERS = {
  binance: new BinanceProvider(),
} satisfies Record<string, MarketDataProvider>;

function buildNotifiers(): Notifier[] {
  const notifiers: Notifier[] = [new ConsoleNotifier()];
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    notifiers.push(new TelegramNotifier(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID));
  }
  return notifiers;
}

type Zone = AlertKind | "neutral";

/**
 * Last known zone per instrument. An alert fires only when an instrument
 * *enters* the overbought/oversold zone, not on every check while it stays there.
 */
const lastZone = new Map<string, Zone>();

async function checkInstrument(cfg: InstrumentConfig, notifiers: Notifier[]): Promise<void> {
  const c = { ...DEFAULTS, ...cfg };
  const provider: MarketDataProvider = PROVIDERS[c.provider];

  let candles = await provider.getCandles(c.symbol, c.interval, CANDLE_HISTORY);
  if (c.closedCandlesOnly) {
    candles = candles.filter((k) => k.closeTime < Date.now());
  }
  const last = candles.at(-1);
  if (!last) throw new Error(`No candles returned for ${c.label}`);

  const value = rsi(candles.map((k) => k.close), c.rsiPeriod).at(-1)!;
  const zone: Zone = value > c.overbought ? "overbought" : value < c.oversold ? "oversold" : "neutral";
  const previous = lastZone.get(c.label);
  lastZone.set(c.label, zone);

  console.log(
    `${new Date().toISOString()}  ${c.label.padEnd(10)} RSI(${c.rsiPeriod}, ${c.interval}) = ${value.toFixed(2)}  ` +
      `price ${last.close}  [${zone}]`,
  );

  if (zone === "neutral" || zone === previous) return;

  const alert = {
    instrument: c.label,
    kind: zone,
    rsi: value,
    threshold: zone === "overbought" ? c.overbought : c.oversold,
    price: last.close,
    interval: c.interval,
    candleCloseTime: last.closeTime,
  };
  const results = await Promise.allSettled(notifiers.map((n) => n.send(alert)));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`Notifier "${notifiers[i].name}" failed:`, r.reason);
  });
}

async function checkAll(notifiers: Notifier[]): Promise<void> {
  await Promise.all(
    INSTRUMENTS.map((cfg) =>
      checkInstrument(cfg, notifiers).catch((err) => console.error(`Check failed for ${cfg.label}:`, err)),
    ),
  );
}

async function main(): Promise<void> {
  const notifiers = buildNotifiers();
  console.log(`Notifiers: ${notifiers.map((n) => n.name).join(", ")}`);

  await checkAll(notifiers);
  if (process.argv.includes("--once")) return;

  setInterval(() => void checkAll(notifiers), CHECK_EVERY_SECONDS * 1000);
}

await main();
