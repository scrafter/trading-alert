import { test } from "node:test";
import assert from "node:assert/strict";
import { AlertMonitor } from "./monitor.ts";
import type { Alert, Candle, MarketDataProvider, Notifier, Strategy } from "./types.ts";

const candle: Candle = { openTime: 0, closeTime: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 };
const provider: MarketDataProvider = { name: "fake", getCandles: async () => [candle] };

test("alerts only when the strategy state changes to non-null", async () => {
  const states = ["overbought", "overbought", null, "overbought", "oversold"];
  let call = 0;
  const strategy: Strategy = {
    name: "FAKE",
    evaluate: () => ({ state: states[call++], summary: "", message: "msg", values: {} }),
  };
  const sent: Alert[] = [];
  const notifier: Notifier = { name: "spy", send: async (a) => void sent.push(a) };

  const monitor = new AlertMonitor({
    notifiers: [notifier],
    candleHistory: 10,
    targets: [{ label: "X", symbol: "X", provider, strategies: [strategy], interval: "1h", closedCandlesOnly: false }],
  });
  for (let i = 0; i < states.length; i++) await monitor.checkAll();

  assert.deepEqual(sent.map((a) => a.state), ["overbought", "overbought", "oversold"]);
});

test("a failing notifier does not block the others", async () => {
  const strategy: Strategy = { name: "FAKE", evaluate: () => ({ state: "on", summary: "", message: "", values: {} }) };
  const sent: string[] = [];
  const monitor = new AlertMonitor({
    candleHistory: 10,
    notifiers: [
      { name: "broken", send: async () => { throw new Error("down"); } },
      { name: "ok", send: async (a) => void sent.push(a.state) },
    ],
    targets: [{ label: "X", symbol: "X", provider, strategies: [strategy], interval: "1h", closedCandlesOnly: false }],
  });
  await monitor.checkAll();
  assert.deepEqual(sent, ["on"]);
});
