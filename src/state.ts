import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/** Last strategy state per instrument, keyed like "BTC/USDC|15m|RSI(14)". */
export type AlertState = Map<string, string | null>;

/**
 * Keeps alert state on disk so a restart (or a fresh CI run) does not
 * re-send an alert for a zone that was already reported.
 */
export class FileStateStore {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  async load(): Promise<AlertState> {
    try {
      return new Map(Object.entries(JSON.parse(await readFile(this.path, "utf8"))));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return new Map();
      console.warn(`Ignoring unreadable state file ${this.path}:`, err);
      return new Map();
    }
  }

  async save(state: AlertState): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(Object.fromEntries(state), null, 2) + "\n");
  }
}
