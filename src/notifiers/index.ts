import type { Notifier } from "../types.ts";
import { ConsoleNotifier } from "./console.ts";
import { TelegramNotifier } from "./telegram.ts";
import { WhatsAppNotifier } from "./whatsapp.ts";

/**
 * Available alert channels. Each factory reads its secrets from the environment
 * (.env), so credentials never live in code. To add a channel, implement
 * `Notifier` in this folder and register a factory here.
 */
export const NOTIFIERS = {
  console: () => new ConsoleNotifier(),
  whatsapp: () => new WhatsAppNotifier(requireEnv("WHATSAPP_PHONE"), requireEnv("CALLMEBOT_API_KEY")),
  telegram: () => new TelegramNotifier(requireEnv("TELEGRAM_BOT_TOKEN"), requireEnv("TELEGRAM_CHAT_ID")),
} satisfies Record<string, () => Notifier>;

export type NotifierName = keyof typeof NOTIFIERS;

export function createNotifiers(names: NotifierName[]): Notifier[] {
  return names.map((name) => NOTIFIERS[name]());
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Set it in .env (see .env.example) or disable that notifier.`);
  }
  return value;
}
