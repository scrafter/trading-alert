import type { Alert, AlertFormatter, Notifier } from "../types.ts";

/**
 * Sends alerts to your own WhatsApp number through CallMeBot (free, personal use).
 * Setup and API key: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 */
export class WhatsAppNotifier implements Notifier {
  readonly name = "whatsapp";
  private readonly phone: string;
  private readonly apiKey: string;
  private readonly formatter: AlertFormatter;

  /** phone in international format, e.g. "+48123456789". */
  constructor(phone: string, apiKey: string, formatter: AlertFormatter) {
    this.formatter = formatter;
    this.phone = phone;
    this.apiKey = apiKey;
  }

  async send(alert: Alert): Promise<void> {
    const { title, body } = this.formatter.format(alert);
    const text = `*${title}*\n${body}`;
    const url = new URL("https://api.callmebot.com/whatsapp.php");
    url.searchParams.set("phone", this.phone);
    url.searchParams.set("text", text);
    url.searchParams.set("apikey", this.apiKey);

    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    // CallMeBot reports errors (e.g. an invalid API key) as HTTP 203 with an HTML page.
    if (res.status !== 200) {
      const body = (await res.text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      throw new Error(`CallMeBot ${res.status}: ${body}`);
    }
  }
}
