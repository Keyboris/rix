/**
 * Speech-to-text via OpenAI Whisper.
 *
 * Records are captured by the Voice screen (expo-audio) and the resulting audio
 * file URI is passed here. We upload it as multipart/form-data to OpenAI's
 * transcription endpoint and return plaintext. The API key is read from
 * EXPO_PUBLIC_OPENAI_API_KEY (see .env.example).
 */

import { OPENAI_API_KEY } from './env';

const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
const MODEL = 'whisper-1';

export type TranscriptionErrorKind =
  | 'not_configured'
  | 'empty'
  | 'network'
  | 'api';

export class TranscriptionError extends Error {
  kind: TranscriptionErrorKind;
  constructor(kind: TranscriptionErrorKind, message: string) {
    super(message);
    this.name = 'TranscriptionError';
    this.kind = kind;
  }
}

/**
 * Transcribe a recorded audio file to plaintext.
 * @param uri local file URI from the recorder (e.g. .../recording.m4a)
 */
export async function transcribeAudio(uri: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new TranscriptionError(
      'not_configured',
      'Speech-to-text is not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.'
    );
  }

  const form = new FormData();
  // React Native's FormData accepts a { uri, name, type } file descriptor.
  form.append('file', {
    uri,
    name: 'speech.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  form.append('model', MODEL);
  form.append('response_format', 'json');

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        // Note: do NOT set Content-Type; fetch sets the multipart boundary itself.
      },
      body: form,
    });
  } catch (e) {
    throw new TranscriptionError(
      'network',
      'Could not reach the transcription service. Check your connection.'
    );
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error?.message ? `: ${body.error.message}` : '';
    } catch {
      // ignore body parse failure
    }
    throw new TranscriptionError('api', `Transcription failed (${res.status})${detail}.`);
  }

  const data = (await res.json()) as { text?: string };
  const text = (data.text ?? '').trim();
  if (!text) {
    throw new TranscriptionError('empty', 'No speech was detected. Please try again.');
  }
  return text;
}
