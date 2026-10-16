import type { Alert, Notifier } from "../types.ts";
import { formatAlert } from "./format.ts";

export class ConsoleNotifier implements Notifier {
  readonly name = "console";

  async send(alert: Alert): Promise<void> {
    console.log(`\u{1F6A8} ${formatAlert(alert)}`);
  }
}
