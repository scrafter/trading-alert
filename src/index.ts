import type { Interval, MarketDataProvider, Strategy } from "./types.ts";
import { RsiStrategy } from "./strategies/rsi.ts";
import { MacdStrategy } from "./strategies/macd.ts";
import { BinanceProvider } from "./providers/binance.ts";
import { createNotifiers, type NotifierName } from "./notifiers/index.ts";
import { FORMATTERS, type Language } from "./messages/index.ts";
import { AlertMonitor } from "./monitor.ts";

// ============================================================================
// CONFIGURATION — edit this section
// ============================================================================

/**
 * What to watch. Enable, disable or tune strategies here; each one alerts on its own.
 * To add a new kind of signal, implement `Strategy` (src/types.ts) in src/strategies/.
 */
const STRATEGIES = {
  rsi: new RsiStrategy({ period: 14, overbought: 70, oversold: 30 }),
  macd: new MacdStrategy({ fast: 12, slow: 26, signal: 9 }),
} satisfies Record<string, Strategy>;

/**
 * Where alerts go: any of "console", "whatsapp", "telegram" (see src/notifiers/index.ts).
 * Credentials come from .env; a listed channel with missing credentials stops startup.
 */
const NOTIFY_VIA: NotifierName[] = ["console", "whatsapp"];

/** Language of alert messages: "pl" or "en" (see src/messages/). */
const ALERT_LANGUAGE: Language = "pl";

/** Defaults for every instrument; any key can be overridden per instrument. */
const DEFAULTS: InstrumentDefaults = {
  /** Strategies to run (keys of STRATEGIES). */
  strategies: ["rsi"],
  /** Candle interval the strategies run on. */
  interval: "15m",
  /**
   * true  = only use fully closed candles (no flickering alerts, but up to one candle late).
   * false = include the still-forming candle (faster, but signals can reverse before close).
   */
  closedCandlesOnly: true,
};

/** Instruments to watch. */
const INSTRUMENTS: InstrumentConfig[] = [
  { label: "BTC/USDC", symbol: "BTCUSDC", provider: "binance" },
  // { label: "ETH/USDC", symbol: "ETHUSDC", provider: "binance", strategies: ["rsi", "macd"], interval: "4h" },
];

/** How often to re-check all instruments. */
const CHECK_EVERY_SECONDS = 60;

/** How many candles to download. More history = indicator values closer to TradingView. */
const CANDLE_HISTORY = 500;

// ============================================================================

/** Register new data sources here (e.g. a Yahoo Finance provider for stocks). */
const PROVIDERS = {
  binance: new BinanceProvider(),
} satisfies Record<string, MarketDataProvider>;

interface InstrumentDefaults {
  strategies: (keyof typeof STRATEGIES)[];
  interval: Interval;
  closedCandlesOnly: boolean;
}

interface InstrumentConfig extends Partial<InstrumentDefaults> {
  /** Human-readable name used in alerts. */
  label: string;
  /** Symbol as the provider expects it. */
  symbol: string;
  provider: keyof typeof PROVIDERS;
}

async function main(): Promise<void> {
  const notifiers = createNotifiers(NOTIFY_VIA, FORMATTERS[ALERT_LANGUAGE]);
  console.log(`Notifiers: ${notifiers.map((n) => n.name).join(", ")}`);

  const monitor = new AlertMonitor({
    notifiers,
    candleHistory: CANDLE_HISTORY,
    targets: INSTRUMENTS.map((cfg) => {
      const c = { ...DEFAULTS, ...cfg };
      return {
        label: c.label,
        symbol: c.symbol,
        provider: PROVIDERS[c.provider],
        strategies: c.strategies.map((key) => STRATEGIES[key]),
        interval: c.interval,
        closedCandlesOnly: c.closedCandlesOnly,
      };
    }),
  });

  await monitor.checkAll();
  if (process.argv.includes("--once")) return;

  setInterval(() => void monitor.checkAll(), CHECK_EVERY_SECONDS * 1000);
}

await main();
