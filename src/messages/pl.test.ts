import { test } from "node:test";
import assert from "node:assert/strict";
import { PolishFormatter } from "./pl.ts";
import type { Alert } from "../types.ts";

const base: Alert = {
  instrument: "BTC/USDC",
  strategy: "RSI(14)",
  state: "overbought",
  message: "RSI(14) = 72.41 rose above 70 (overbought)",
  values: { rsi: 72.4123, threshold: 70 },
  price: 82085.41,
  interval: "15m",
  candleCloseTime: Date.UTC(2026, 9, 16, 7, 14, 59, 999),
};

test("formats a known state with Polish numbers and local time", () => {
  const { title, body } = new PolishFormatter().format(base);
  assert.equal(title, "🔴 BTC/USDC: RSI wykupienie");
  // pl-PL groups thousands with a non-breaking space.
  assert.equal(body, "RSI(14) 72,41 > 70, możliwa korekta w dół.\nCena 82\u00a0085,41 · 15 min · 16.10, 09:15");
});

test("falls back to the strategy's English message for unknown states", () => {
  const { title, body } = new PolishFormatter().format({ ...base, state: "something_new" });
  assert.equal(title, "⚠️ BTC/USDC: RSI(14)");
  assert.ok(body.startsWith(base.message));
});
