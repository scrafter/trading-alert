import type { AlertFormatter } from "../types.ts";
import { EnglishFormatter } from "./en.ts";
import { PolishFormatter } from "./pl.ts";

/** Alert languages. To add one, implement `AlertFormatter` in this folder and register it here. */
export const FORMATTERS = {
  en: new EnglishFormatter(),
  pl: new PolishFormatter(),
} satisfies Record<string, AlertFormatter>;

export type Language = keyof typeof FORMATTERS;
