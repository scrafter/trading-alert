import type { Alert, AlertFormatter, Notifier } from "../types.ts";

export class ConsoleNotifier implements Notifier {
  readonly name = "console";
  private readonly formatter: AlertFormatter;

  constructor(formatter: AlertFormatter) {
    this.formatter = formatter;
  }

  async send(alert: Alert): Promise<void> {
    const { title, body } = this.formatter.format(alert);
    console.log(`\u{1F6A8} ${title}\n${body.replace(/^/gm, "   ")}`);
  }
}
