import type { Alert, Interval, MarketDataProvider, Notifier, Strategy } from "./types.ts";
import { RsiStrategy } from "./strategies/rsi.ts";
import { MacdStrategy } from "./strategies/macd.ts";
import { BinanceProvider } from "./providers/binance.ts";
import { ConsoleNotifier } from "./notifiers/console.ts";
import { TelegramNotifier } from "./notifiers/telegram.ts";

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

/** Defaults for every instrument; any key can be overridden per instrument. */
const DEFAULTS: InstrumentDefaults = {
  /** Strategies to run (keys of STRATEGIES). */
  strategies: ["rsi"],
  /** Candle interval the strategies run on. */
  interval: "1h",
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

function buildNotifiers(): Notifier[] {
  const notifiers: Notifier[] = [new ConsoleNotifier()];
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    notifiers.push(new TelegramNotifier(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID));
  }
  return notifiers;
}

/**
 * Last state per instrument + strategy. An alert fires only when the state
 * changes to a non-null value, not on every check while it stays the same.
 */
const lastState = new Map<string, string | null>();

async function checkInstrument(cfg: InstrumentConfig, notifiers: Notifier[]): Promise<void> {
  const c = { ...DEFAULTS, ...cfg };
  const provider: MarketDataProvider = PROVIDERS[c.provider];

  let candles = await provider.getCandles(c.symbol, c.interval, CANDLE_HISTORY);
  if (c.closedCandlesOnly) {
    candles = candles.filter((k) => k.closeTime < Date.now());
  }
  const last = candles.at(-1);
  if (!last) throw new Error(`No candles returned for ${c.label}`);

  for (const key of c.strategies) {
    const strategy: Strategy = STRATEGIES[key];
    const { state, summary, message } = strategy.evaluate(candles);

    const stateKey = `${c.label}|${strategy.name}`;
    const previous = lastState.get(stateKey);
    lastState.set(stateKey, state);

    console.log(
      `${new Date().toISOString()}  ${c.label.padEnd(10)} ${c.interval.padEnd(3)} ${summary}  ` +
        `price ${last.close}  [${state ?? "neutral"}]`,
    );

    if (state === null || state === previous) continue;

    await notify(notifiers, {
      instrument: c.label,
      strategy: strategy.name,
      state,
      message,
      price: last.close,
      interval: c.interval,
      candleCloseTime: last.closeTime,
    });
  }
}

async function notify(notifiers: Notifier[], alert: Alert): Promise<void> {
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
