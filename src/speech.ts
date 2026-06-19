/** Thin wrapper around expo-speech for spoken output (TTS). */

import * as Speech from 'expo-speech';

export function speak(text: string): void {
  if (!text) return;
  // Stop anything currently being spoken so responses don't overlap.
  Speech.stop();
  Speech.speak(text, { language: 'en-US', rate: 1.0, pitch: 1.0 });
}

export function stopSpeaking(): void {
  Speech.stop();
}
