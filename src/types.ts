/** Shared types for the local-storage contract (PRD §7) and in-app messages. */

export type InteractionMode = 'chat' | 'voice';

/** Written by the interface on Chat send or Voice recording stop. */
export interface InputEntry {
  id: string; // uuid v4
  createdAt: string; // ISO 8601
  mode: InteractionMode;
  inputText: string;
}

export type OutputStatus = 'pending' | 'done' | 'error';

/** Written by the Swift logic layer; the interface only reads this. */
export interface OutputEntry {
  id: string; // matches the input id it responds to
  status: OutputStatus;
  outputText: string | null;
  error: string | null;
}

/** Shape of the flat JSON mailbox file on disk. */
export interface Mailbox {
  inputs: InputEntry[];
  outputs: OutputEntry[];
}

/** A rendered conversation entry (UI only, not persisted across restarts in MVP). */
export interface Message {
  id: string; // shares the input/output id for agent replies
  role: 'user' | 'agent';
  text: string;
  /** For agent messages: tracks the wait/render lifecycle. */
  status: 'pending' | 'done' | 'error';
  createdAt: number;
}
