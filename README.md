# trading-alert

Watches market instruments and sends alerts based on pluggable strategies:

- **RSI**: RSI rises above an "overbought" level (default 70) or drops below an "oversold" level (default 30). Enabled by default.
- **MACD**: MACD line crosses its signal line (bullish / bearish). Available, off by default.

Market data comes from the public Binance spot API (no API key needed). Currently watching **BTC/USDC**.

## Requirements

Node.js >= 23.6 (runs TypeScript directly, no build step).

## Usage

```bash
npm install
npm start          # check every CHECK_EVERY_SECONDS, runs until stopped
npm run once       # single check, then exit (handy for cron)
npm test           # RSI unit tests
npm run typecheck
```

## Configuration

Everything lives at the top of [`src/index.ts`](src/index.ts):

- `STRATEGIES`: strategy instances and their parameters (RSI thresholds, MACD periods, ...)
- `DEFAULTS`: which strategies run (`strategies: ["rsi"]`, or e.g. `["rsi", "macd"]`), candle `interval`, `closedCandlesOnly`
- `INSTRUMENTS`: list of instruments to watch; each entry can override any default
- `CHECK_EVERY_SECONDS`, `CANDLE_HISTORY`

An alert fires once when a strategy's state **changes** (e.g. RSI enters the overbought zone), not on every check while it stays there.

### Notifications

Alerts are always printed to the console. To also get them on Telegram, set:

```bash
export TELEGRAM_BOT_TOKEN=...   # from @BotFather
export TELEGRAM_CHAT_ID=...
```

## Extending

- **New instrument on Binance**: add a line to `INSTRUMENTS`.
- **New strategy** (Bollinger Bands, moving-average cross, ...): implement `Strategy` from `src/types.ts` in `src/strategies/` (pure indicator math goes in `src/indicators/`), then add it to `STRATEGIES`. `evaluate()` returns a `state` (null = nothing notable) and an alert message.
- **New data source** (e.g. Yahoo for stocks): implement `MarketDataProvider` from `src/types.ts` in `src/providers/`, then register it in `PROVIDERS`.
- **New alert channel** (e-mail, Slack, ...): implement `Notifier` in `src/notifiers/` and add it in `buildNotifiers()`.
