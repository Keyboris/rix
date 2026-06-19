/**
 * Local-storage mailbox (PRD §7).
 *
 * The interface and the Swift logic layer share a single flat JSON file in the
 * app's document directory. The interface WRITES input entries and READS output
 * entries; it never writes outputs (except the dev-echo simulator below, which
 * exists only so the UI is demoable before the logic layer is built).
 *
 * File shape (`agent_mailbox.json`):
 *   { "inputs": InputEntry[], "outputs": OutputEntry[] }
 *
 * We use the stable legacy expo-file-system API so behaviour is predictable
 * across SDK versions.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

import type { InputEntry, Mailbox, OutputEntry, InteractionMode } from './types';

export const MAILBOX_FILENAME = 'agent_mailbox.json';
export const MAILBOX_PATH = FileSystem.documentDirectory + MAILBOX_FILENAME;

const EMPTY: Mailbox = { inputs: [], outputs: [] };

export function newId(): string {
  return Crypto.randomUUID();
}

async function ensureFile(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MAILBOX_PATH);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(MAILBOX_PATH, JSON.stringify(EMPTY, null, 2));
  }
}

export async function readMailbox(): Promise<Mailbox> {
  try {
    await ensureFile();
    const raw = await FileSystem.readAsStringAsync(MAILBOX_PATH);
    const parsed = JSON.parse(raw) as Partial<Mailbox>;
    return {
      inputs: Array.isArray(parsed.inputs) ? parsed.inputs : [],
      outputs: Array.isArray(parsed.outputs) ? parsed.outputs : [],
    };
  } catch {
    // Corrupt or unreadable file: fall back to empty rather than crashing.
    return { ...EMPTY };
  }
}

async function writeMailbox(mailbox: Mailbox): Promise<void> {
  await FileSystem.writeAsStringAsync(MAILBOX_PATH, JSON.stringify(mailbox, null, 2));
}

/** Write an input entry (the moment the user finishes typing/speaking). */
export async function writeInput(args: {
  mode: InteractionMode;
  inputText: string;
  id?: string;
}): Promise<InputEntry> {
  const entry: InputEntry = {
    id: args.id ?? newId(),
    createdAt: new Date().toISOString(),
    mode: args.mode,
    inputText: args.inputText,
  };
  const mailbox = await readMailbox();
  mailbox.inputs.push(entry);
  await writeMailbox(mailbox);
  return entry;
}

/** Find the output entry matching an input id, if one exists yet. */
export async function findOutput(id: string): Promise<OutputEntry | undefined> {
  const mailbox = await readMailbox();
  return mailbox.outputs.find((o) => o.id === id);
}

export class TimeoutError extends Error {
  constructor() {
    super('No response arrived in time.');
    this.name = 'TimeoutError';
  }
}

/**
 * Poll the mailbox for an output entry matching `id` whose status is terminal
 * (`done` or `error`). Resolves with that entry, or rejects with TimeoutError.
 *
 * A file-change listener would be nicer (PRD §10 Should-have) but fixed-interval
 * polling is the simplest reliable MVP and is easy to tune.
 */
export function pollForOutput(
  id: string,
  options: {
    timeoutMs: number;
    intervalMs?: number;
    signal?: { cancelled: boolean };
  }
): Promise<OutputEntry> {
  const intervalMs = options.intervalMs ?? 800;
  const deadline = Date.now() + options.timeoutMs;

  return new Promise<OutputEntry>((resolve, reject) => {
    const tick = async () => {
      if (options.signal?.cancelled) {
        return; // caller abandoned the wait (e.g. left the screen)
      }
      try {
        const output = await findOutput(id);
        if (output && (output.status === 'done' || output.status === 'error')) {
          resolve(output);
          return;
        }
      } catch {
        // ignore a transient read error and try again next tick
      }
      if (Date.now() >= deadline) {
        reject(new TimeoutError());
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

/**
 * DEV ONLY — simulate the logic layer.
 *
 * Writes a `done` output entry a moment after an input, so the whole flow can be
 * demoed without the Swift side (PRD Acceptance Criteria, final bullet). This is
 * the ONLY place the interface writes to `outputs`. Disable in Settings or via
 * EXPO_PUBLIC_DEV_ECHO=false once the real logic layer is producing outputs.
 */
export function devEcho(input: InputEntry, delayMs = 1400): void {
  setTimeout(async () => {
    try {
      const mailbox = await readMailbox();
      if (mailbox.outputs.some((o) => o.id === input.id)) return; // real layer answered
      const output: OutputEntry = {
        id: input.id,
        status: 'done',
        outputText: `Done — (simulated) handled: "${input.inputText}".`,
        error: null,
      };
      mailbox.outputs.push(output);
      await writeMailbox(mailbox);
    } catch {
      // best-effort simulator; ignore failures
    }
  }, delayMs);
}
