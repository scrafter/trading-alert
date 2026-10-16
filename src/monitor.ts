import type { Alert, Interval, MarketDataProvider, Notifier, Strategy } from "./types.ts";

export interface WatchTarget {
  /** Human-readable name used in alerts. */
  label: string;
  /** Symbol as the provider expects it. */
  symbol: string;
  provider: MarketDataProvider;
  strategies: Strategy[];
  interval: Interval;
  /** Drop the still-forming candle before evaluating. */
  closedCandlesOnly: boolean;
}

export interface MonitorOptions {
  targets: WatchTarget[];
  notifiers: Notifier[];
  candleHistory: number;
}

/**
 * Fetches candles for each target, runs its strategies and sends alerts.
 * Knows nothing about concrete providers, strategies or channels: everything
 * is injected, so each part can be swapped independently.
 */
export class AlertMonitor {
  private readonly opts: MonitorOptions;
  /**
   * Last state per target + strategy. An alert fires only when the state
   * changes to a non-null value, not on every check while it stays the same.
   */
  private readonly lastState = new Map<string, string | null>();

  constructor(opts: MonitorOptions) {
    this.opts = opts;
  }

  async checkAll(): Promise<void> {
    await Promise.all(
      this.opts.targets.map((t) =>
        this.check(t).catch((err) => console.error(`Check failed for ${t.label}:`, err)),
      ),
    );
  }

  private async check(t: WatchTarget): Promise<void> {
    let candles = await t.provider.getCandles(t.symbol, t.interval, this.opts.candleHistory);
    if (t.closedCandlesOnly) {
      candles = candles.filter((k) => k.closeTime < Date.now());
    }
    const last = candles.at(-1);
    if (!last) throw new Error(`No candles returned for ${t.label}`);

    for (const strategy of t.strategies) {
      const { state, summary, message, values } = strategy.evaluate(candles);

      const stateKey = `${t.label}|${t.interval}|${strategy.name}`;
      const previous = this.lastState.get(stateKey);
      this.lastState.set(stateKey, state);

      console.log(
        `${new Date().toISOString()}  ${t.label.padEnd(10)} ${t.interval.padEnd(3)} ${summary}  ` +
          `price ${last.close}  [${state ?? "neutral"}]`,
      );

      if (state === null || state === previous) continue;

      await this.notify({
        instrument: t.label,
        strategy: strategy.name,
        state,
        message,
        values,
        price: last.close,
        interval: t.interval,
        candleCloseTime: last.closeTime,
      });
    }
  }

  /** Delivers to every channel; one failing channel does not block the others. */
  private async notify(alert: Alert): Promise<void> {
    const { notifiers } = this.opts;
    const results = await Promise.allSettled(notifiers.map((n) => n.send(alert)));
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error(`Notifier "${notifiers[i].name}" failed:`, r.reason);
    });
  }
}
