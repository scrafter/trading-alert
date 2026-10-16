import { test } from "node:test";
import assert from "node:assert/strict";
import { rsi } from "./rsi.ts";

// Reference data from Wilder's "New Concepts in Technical Trading Systems"
// as reproduced by StockCharts. Their table rounds the intermediate averages,
// so their published values (70.53, 66.32) differ from exact math by ~0.07.
const closes = [
  44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08,
  45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64,
];

test("matches reference RSI(14) values", () => {
  const values = rsi(closes, 14);
  assert.equal(values.length, closes.length - 14);
  assert.ok(Math.abs(values[0] - 70.53) < 0.1, `got ${values[0]}`);
  assert.ok(Math.abs(values[1] - 66.32) < 0.1, `got ${values[1]}`);
});

test("only rising prices give 100, flat prices give 50", () => {
  assert.equal(rsi([1, 2, 3, 4, 5], 3).at(-1), 100);
  assert.equal(rsi([5, 5, 5, 5, 5], 3).at(-1), 50);
});

test("throws when there is not enough data", () => {
  assert.throws(() => rsi([1, 2, 3], 14));
});
