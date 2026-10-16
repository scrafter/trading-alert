import type { AlertFormatter, Notifier } from "../types.ts";
import { ConsoleNotifier } from "./console.ts";
import { TelegramNotifier } from "./telegram.ts";
import { WhatsAppNotifier } from "./whatsapp.ts";

/**
 * Available alert channels. Each factory reads its secrets from the environment
 * (.env), so credentials never live in code. To add a channel, implement
 * `Notifier` in this folder and register a factory here.
 */
export const NOTIFIERS = {
  console: (f) => new ConsoleNotifier(f),
  whatsapp: (f) => new WhatsAppNotifier(requireEnv("WHATSAPP_PHONE"), requireEnv("CALLMEBOT_API_KEY"), f),
  telegram: (f) => new TelegramNotifier(requireEnv("TELEGRAM_BOT_TOKEN"), requireEnv("TELEGRAM_CHAT_ID"), f),
} satisfies Record<string, (formatter: AlertFormatter) => Notifier>;

export type NotifierName = keyof typeof NOTIFIERS;

export function createNotifiers(names: NotifierName[], formatter: AlertFormatter): Notifier[] {
  return names.map((name) => NOTIFIERS[name](formatter));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Set it in .env (see .env.example) or disable that notifier.`);
  }
  return value;
}
