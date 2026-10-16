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
npm test           # indicator unit tests
npm run typecheck
```

## Configuration

Everything lives at the top of [`src/index.ts`](src/index.ts):

- `STRATEGIES`: strategy instances and their parameters (RSI thresholds, MACD periods, ...)
- `NOTIFY_VIA`: alert channels, e.g. `["console", "whatsapp"]` or `["console", "telegram"]`
- `DEFAULTS`: which strategies run (`strategies: ["rsi"]`, or e.g. `["rsi", "macd"]`), candle `interval`, `closedCandlesOnly`
- `INSTRUMENTS`: list of instruments to watch; each entry can override any default
- `CHECK_EVERY_SECONDS`, `CANDLE_HISTORY`

An alert fires once when a strategy's state **changes** (e.g. RSI enters the overbought zone), not on every check while it stays there.

### Notifications

Pick channels in `NOTIFY_VIA` (default: `console` + `whatsapp`). Their credentials live in a `.env` file
(loaded automatically by `npm start` / `npm run once`); a selected channel with missing credentials stops startup with a clear error:

```bash
cp .env.example .env
```

**WhatsApp** (via [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/), free, sends to your own number):

1. Follow the CallMeBot page: add their number to your contacts and send it the activation message from WhatsApp.
2. You get a reply with your API key.
3. Set `WHATSAPP_PHONE` (e.g. `+48123456789`) and `CALLMEBOT_API_KEY` in `.env`.

**Telegram**: set `TELEGRAM_BOT_TOKEN` (from @BotFather) and `TELEGRAM_CHAT_ID`.

The startup line `Notifiers: ...` shows which channels are active.

## Extending

- **New instrument on Binance**: add a line to `INSTRUMENTS`.
- **New strategy** (Bollinger Bands, moving-average cross, ...): implement `Strategy` from `src/types.ts` in `src/strategies/` (pure indicator math goes in `src/indicators/`), then add it to `STRATEGIES`. `evaluate()` returns a `state` (null = nothing notable) and an alert message.
- **New data source** (e.g. Yahoo for stocks): implement `MarketDataProvider` from `src/types.ts` in `src/providers/`, then register it in `PROVIDERS`.
- **New alert channel** (e-mail, Slack, ...): implement `Notifier` in `src/notifiers/`, register a factory in `NOTIFIERS` (`src/notifiers/index.ts`), then add its name to `NOTIFY_VIA`.

## Architecture

```
src/index.ts       configuration + wiring (the only file you normally edit)
src/monitor.ts     AlertMonitor: fetch candles -> run strategies -> notify on state change
src/types.ts       interfaces: MarketDataProvider, Strategy, Notifier
src/providers/     data sources (Binance)
src/indicators/    pure indicator math (RSI, EMA, MACD)
src/strategies/    turn indicator values into alert states
src/notifiers/     alert channels (console, WhatsApp, Telegram) + registry
```

`AlertMonitor` only depends on the interfaces, so providers, strategies and channels can be swapped independently (and faked in tests).
