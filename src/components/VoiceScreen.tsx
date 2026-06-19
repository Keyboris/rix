import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';

import { useSettings, useTheme } from '../settings';
import { speak, stopSpeaking } from '../speech';
import { RESPONSE_TIMEOUT_MS } from '../env';
import { devEcho, newId, pollForOutput, TimeoutError, writeInput } from '../mailbox';
import { transcribeAudio, TranscriptionError } from '../transcribe';
import { radius, space } from '../theme';

type VoiceState =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'transcribing'
  | 'waiting'
  | 'responding'
  | 'error';

const BUTTON_SIZE = 220;

export function VoiceScreen() {
  const { colors, fs } = useTheme();
  const { settings } = useSettings();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [errorText, setErrorText] = useState('');

  const signal = useRef<{ cancelled: boolean }>({ cancelled: false });
  const pulse = useRef(new Animated.Value(0)).current;

  // Cleanup on unmount.
  useEffect(
    () => () => {
      signal.current.cancelled = true;
      stopSpeaking();
      recorder.stop().catch(() => {});
    },
    [recorder]
  );

  // Pulse animation while listening (visual state cue, not colour-only).
  useEffect(() => {
    if (state === 'listening') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    pulse.setValue(0);
  }, [state, pulse]);

  const fail = useCallback((message: string) => {
    setErrorText(message);
    setState('error');
    speak(message); // errors must be audible in Voice mode (PRD §6.5)
  }, []);

  const startListening = useCallback(async () => {
    setErrorText('');
    setResponse('');
    setTranscript('');
    setState('requesting');
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        fail('Microphone access is off. Enable it in Settings to use Voice mode.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('listening');
    } catch {
      fail('Could not start recording. Please try again.');
    }
  }, [recorder, fail]);

  const stopAndProcess = useCallback(async () => {
    setState('transcribing');
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri ?? null;
    } catch {
      fail('Recording could not be saved. Please try again.');
      return;
    }
    if (!uri) {
      fail('No speech was detected. Please try again.');
      return;
    }

    // Transcribe.
    let text: string;
    try {
      text = await transcribeAudio(uri);
    } catch (e) {
      if (e instanceof TranscriptionError) fail(e.message);
      else fail('Transcription failed. Please try again.');
      return;
    }
    setTranscript(text);

    // Write input + wait for output, exactly like Chat.
    const id = newId();
    const input = await writeInput({ mode: 'voice', inputText: text, id });
    if (settings.devEcho) devEcho(input);

    setState('waiting');
    signal.current = { cancelled: false };
    try {
      const output = await pollForOutput(id, {
        timeoutMs: RESPONSE_TIMEOUT_MS,
        signal: signal.current,
      });
      if (output.status === 'error') {
        fail(output.error || 'The assistant reported an error.');
        return;
      }
      const reply = output.outputText || '(empty response)';
      setResponse(reply);
      setState('responding');
      if (settings.tts) speak(reply);
    } catch (e) {
      if (signal.current.cancelled) return;
      if (e instanceof TimeoutError) {
        fail('No response yet — the assistant timed out. Please try again.');
      } else {
        fail('Could not read the response. Please try again.');
      }
    }
  }, [recorder, settings.devEcho, settings.tts, fail]);

  const onPressButton = useCallback(() => {
    if (state === 'idle' || state === 'error' || state === 'responding') {
      startListening();
    } else if (state === 'listening') {
      stopAndProcess();
    }
    // transcribing / waiting / requesting: button is busy, ignore taps
  }, [state, startListening, stopAndProcess]);

  const ui = describe(state);
  const busy = state === 'transcribing' || state === 'waiting' || state === 'requesting';
  const buttonColor =
    state === 'listening'
      ? colors.accent
      : busy
        ? colors.surfaceAlt
        : colors.primary;
  const buttonTextColor = state === 'listening' ? colors.onAccent : colors.onPrimary;
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[styles.caption, { color: colors.textMuted, fontSize: fs(16) }]}>
        {ui.caption}
      </Text>

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPressButton}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={ui.a11yLabel}
          accessibilityHint={ui.a11yHint}
          accessibilityState={{ busy }}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: buttonColor,
              borderColor: colors.borderStrong,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="large" color={colors.primaryStrong} />
          ) : (
            <Text style={[styles.buttonGlyph, { color: buttonTextColor, fontSize: fs(44) }]}>
              {state === 'listening' ? '■' : '🎤'}
            </Text>
          )}
          <Text style={[styles.buttonLabel, { color: buttonTextColor, fontSize: fs(18) }]}>
            {ui.buttonLabel}
          </Text>
        </Pressable>
      </Animated.View>

      {!!errorText && (
        <View
          accessible
          accessibilityLabel={`Error: ${errorText}`}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}
        >
          <Text style={[styles.cardTitle, { color: colors.danger, fontSize: fs(14) }]}>⚠ Error</Text>
          <Text style={{ color: colors.text, fontSize: fs(17), lineHeight: fs(24) }}>{errorText}</Text>
        </View>
      )}

      {!!transcript && (
        <View
          accessible
          accessibilityLabel={`You said: ${transcript}`}
          style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textMuted, fontSize: fs(14) }]}>You said</Text>
          <Text style={{ color: colors.text, fontSize: fs(17), lineHeight: fs(24) }}>{transcript}</Text>
        </View>
      )}

      {!!response && (
        <View
          accessible
          accessibilityLabel={`Assistant: ${response}`}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
        >
          <Text style={[styles.cardTitle, { color: colors.primaryStrong, fontSize: fs(14) }]}>
            Assistant
          </Text>
          <Text style={{ color: colors.text, fontSize: fs(17), lineHeight: fs(24) }}>{response}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function describe(state: VoiceState): {
  caption: string;
  buttonLabel: string;
  a11yLabel: string;
  a11yHint?: string;
} {
  switch (state) {
    case 'idle':
      return {
        caption: 'Tap the button, then speak.',
        buttonLabel: 'Tap to speak',
        a11yLabel: 'Tap to speak',
        a11yHint: 'Starts recording your voice',
      };
    case 'requesting':
      return { caption: 'Checking microphone…', buttonLabel: 'Please wait', a11yLabel: 'Preparing microphone' };
    case 'listening':
      return {
        caption: 'Listening… tap again to stop.',
        buttonLabel: 'Tap to stop',
        a11yLabel: 'Listening. Tap to stop recording',
        a11yHint: 'Stops recording and sends your message',
      };
    case 'transcribing':
      return { caption: 'Transcribing your speech…', buttonLabel: 'Transcribing', a11yLabel: 'Transcribing your speech' };
    case 'waiting':
      return { caption: 'Waiting for a response…', buttonLabel: 'Waiting', a11yLabel: 'Waiting for a response' };
    case 'responding':
      return {
        caption: 'Here is the response. Tap to speak again.',
        buttonLabel: 'Tap to speak',
        a11yLabel: 'Tap to speak again',
        a11yHint: 'Starts a new recording',
      };
    case 'error':
      return {
        caption: 'Something went wrong. Tap to try again.',
        buttonLabel: 'Try again',
        a11yLabel: 'Try again',
        a11yHint: 'Starts a new recording',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: space.xl,
    gap: space.xl,
    paddingTop: space.xxl,
  },
  caption: { textAlign: 'center', fontWeight: '600' },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.sm,
  },
  buttonGlyph: { lineHeight: 52 },
  buttonLabel: { fontWeight: '800', textAlign: 'center' },
  card: {
    width: '100%',
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.xs,
  },
  cardTitle: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
