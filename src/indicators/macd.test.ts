import { test } from "node:test";
import assert from "node:assert/strict";
import { ema, macd } from "./macd.ts";

test("EMA is seeded with SMA and then smoothed", () => {
  // EMA(3): seed = (1+2+3)/3 = 2, k = 0.5 -> 4*0.5 + 2*0.5 = 3
  assert.deepEqual(ema([1, 2, 3, 4], 3), [2, 3]);
});

test("MACD of a flat series is zero", () => {
  const points = macd(Array(60).fill(100));
  assert.equal(points.length, 60 - 26 - 9 + 2);
  assert.deepEqual(points.at(-1), { macd: 0, signal: 0, histogram: 0 });
});

test("MACD is above its signal line when an uptrend accelerates", () => {
  const closes = Array.from({ length: 80 }, (_, i) => (i < 60 ? 100 : 100 + (i - 59) ** 2));
  const last = macd(closes).at(-1)!;
  assert.ok(last.macd > 0 && last.histogram > 0, JSON.stringify(last));
});
