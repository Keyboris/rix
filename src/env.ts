/**
 * Centralized access to build-time environment variables.
 *
 * Expo's Babel transform replaces `process.env.EXPO_PUBLIC_*` with literal values
 * at build time, so these MUST be referenced as static dotted property accesses
 * (not dynamic lookups) for the inlining to work.
 */

export const OPENAI_API_KEY: string | undefined =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY || undefined;

export const RESPONSE_TIMEOUT_MS: number = (() => {
  const raw = process.env.EXPO_PUBLIC_RESPONSE_TIMEOUT_MS;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 18000;
})();

/** Default for the in-app "simulate agent responses" toggle (overridable in Settings). */
export const DEV_ECHO_DEFAULT: boolean =
  (process.env.EXPO_PUBLIC_DEV_ECHO || 'true').toLowerCase() !== 'false';

/** Whether real Whisper transcription is available. */
export const TRANSCRIPTION_CONFIGURED: boolean = !!OPENAI_API_KEY;
