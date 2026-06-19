import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useSettings, useTheme } from '../settings';
import { speak, stopSpeaking } from '../speech';
import { RESPONSE_TIMEOUT_MS } from '../env';
import {
  devEcho,
  newId,
  pollForOutput,
  TimeoutError,
  writeInput,
} from '../mailbox';
import { radius, space } from '../theme';
import type { Message } from '../types';

export function ChatScreen() {
  const { colors, fs } = useTheme();
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const signals = useRef<{ cancelled: boolean }[]>([]);

  // Cancel in-flight polls and stop speech when leaving the screen.
  useEffect(
    () => () => {
      signals.current.forEach((s) => (s.cancelled = true));
      stopSpeaking();
    },
    []
  );

  const patchMessage = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');

    const id = newId();
    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: `${id}-u`, role: 'user', text: trimmed, status: 'done', createdAt: now },
      { id, role: 'agent', text: '', status: 'pending', createdAt: now },
    ]);

    const input = await writeInput({ mode: 'chat', inputText: trimmed, id });
    if (settings.devEcho) devEcho(input);

    const signal = { cancelled: false };
    signals.current.push(signal);
    try {
      const output = await pollForOutput(id, {
        timeoutMs: RESPONSE_TIMEOUT_MS,
        signal,
      });
      if (output.status === 'error') {
        const msg = output.error || 'Something went wrong.';
        patchMessage(id, { text: msg, status: 'error' });
        if (settings.tts) speak(msg);
      } else {
        const msg = output.outputText || '(empty response)';
        patchMessage(id, { text: msg, status: 'done' });
        if (settings.tts) speak(msg);
      }
    } catch (e) {
      if (signal.cancelled) return;
      const msg =
        e instanceof TimeoutError
          ? 'No response yet — the assistant timed out. Please try again.'
          : 'Could not read the response. Please try again.';
      patchMessage(id, { text: msg, status: 'error' });
      if (settings.tts) speak(msg);
    }
  }, [text, settings.devEcho, settings.tts, patchMessage]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: colors.textMuted, fontSize: fs(16), textAlign: 'center' }}>
              Type a message below to get started.
            </Text>
          </View>
        ) : (
          messages.map((m) => <Bubble key={m.id} message={m} />)
        )}
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          placeholderTextColor={colors.textMuted}
          multiline
          accessibilityLabel="Message input"
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.borderStrong,
              fontSize: fs(17),
            },
          ]}
        />
        <Pressable
          onPress={send}
          disabled={!text.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !text.trim() }}
          style={({ pressed }) => [
            styles.send,
            {
              backgroundColor: colors.primary,
              borderColor: colors.borderStrong,
              opacity: !text.trim() ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '800', fontSize: fs(16) }}>
            Send
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: Message }) {
  const { colors, fs } = useTheme();
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const pending = message.status === 'pending';

  const bg = isUser ? colors.bubbleUser : isError ? colors.surface : colors.bubbleAgent;
  const fg = isUser ? colors.bubbleUserText : isError ? colors.danger : colors.bubbleAgentText;
  const senderLabel = isUser ? 'You' : 'Assistant';

  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isUser ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        accessible
        accessibilityLabel={
          pending
            ? 'Assistant is responding'
            : `${senderLabel}${isError ? ', error' : ''}: ${message.text}`
        }
        style={[
          styles.bubble,
          {
            backgroundColor: bg,
            borderColor: isError ? colors.danger : colors.borderStrong,
            borderTopLeftRadius: isUser ? radius.md : radius.sm,
            borderTopRightRadius: isUser ? radius.sm : radius.md,
          },
        ]}
      >
        <Text style={[styles.sender, { color: isError ? colors.danger : colors.textMuted, fontSize: fs(12) }]}>
          {isError ? `⚠ ${senderLabel}` : senderLabel}
        </Text>
        {pending ? (
          <Text style={{ color: colors.textMuted, fontSize: fs(17) }}>Responding…</Text>
        ) : (
          <Text style={{ color: fg, fontSize: fs(17), lineHeight: fs(24) }}>{message.text}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { padding: space.lg, gap: space.md, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  bubbleRow: { flexDirection: 'row' },
  bubble: {
    maxWidth: '86%',
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.xs,
  },
  sender: { fontWeight: '700' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    padding: space.md,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 140,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  send: {
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: space.lg,
    borderWidth: 2,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
