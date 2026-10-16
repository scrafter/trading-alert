import type { Alert, AlertFormatter, Notifier } from "../types.ts";

/** Sends alerts to a Telegram chat through a bot (https://core.telegram.org/bots/api#sendmessage). */
export class TelegramNotifier implements Notifier {
  readonly name = "telegram";
  private readonly botToken: string;
  private readonly chatId: string;
  private readonly formatter: AlertFormatter;

  constructor(botToken: string, chatId: string, formatter: AlertFormatter) {
    this.formatter = formatter;
    this.botToken = botToken;
    this.chatId = chatId;
  }

  async send(alert: Alert): Promise<void> {
    const { title, body } = this.formatter.format(alert);
    const text = `${title}\n${body}`;
    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: this.chatId, text }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Telegram ${res.status}: ${await res.text()}`);
    }
  }
}
