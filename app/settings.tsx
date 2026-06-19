import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/AppHeader';
import { useSettings, useTheme } from '../src/settings';
import { TRANSCRIPTION_CONFIGURED } from '../src/env';
import { MAILBOX_FILENAME } from '../src/mailbox';
import {
  FONT_SIZE_KEYS,
  FONT_SIZE_LABELS,
  radius,
  space,
  type FontSizeKey,
} from '../src/theme';
import type { InteractionMode } from '../src/types';

export default function Settings() {
  const { colors, fs } = useTheme();
  const { settings, update } = useSettings();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        title="Settings"
        left={{
          label: '‹ Back',
          accessibilityLabel: 'Back',
          accessibilityHint: 'Returns to the conversation',
          onPress: goBack,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Font size">
          <Segmented<FontSizeKey>
            options={FONT_SIZE_KEYS.map((k) => ({ value: k, label: FONT_SIZE_LABELS[k] }))}
            value={settings.fontSize}
            onChange={(v) => update({ fontSize: v })}
            ariaPrefix="Font size"
          />
          <Text style={[styles.preview, { color: colors.textMuted, fontSize: fs(15) }]}>
            Preview: the quick brown fox.
          </Text>
        </Section>

        <Section title="Display">
          <ToggleRow
            label="High contrast"
            description="Stronger colours and borders for easier reading."
            value={settings.highContrast}
            onChange={(v) => update({ highContrast: v })}
          />
        </Section>

        <Section title="Speech">
          <ToggleRow
            label="Text-to-speech"
            description="Read responses aloud. Default: on for Voice, off for Chat."
            value={settings.tts}
            onChange={(v) => update({ tts: v })}
          />
        </Section>

        <Section title="Interaction mode">
          <Segmented<InteractionMode>
            options={[
              { value: 'chat', label: 'Type & Chat' },
              { value: 'voice', label: 'Speak & Listen' },
            ]}
            value={settings.mode}
            onChange={(v) => update({ mode: v })}
            ariaPrefix="Interaction mode"
          />
          <Text style={[styles.preview, { color: colors.textMuted, fontSize: fs(15) }]}>
            Takes effect immediately when you go back.
          </Text>
        </Section>

        <Section title="Developer">
          <ToggleRow
            label="Simulate responses"
            description="Auto-reply to each message so you can demo without the logic layer. Turn off when the real assistant is connected."
            value={settings.devEcho}
            onChange={(v) => update({ devEcho: v })}
          />
          <View style={[styles.info, { borderColor: colors.border }]}>
            <InfoLine label="Transcription" value={TRANSCRIPTION_CONFIGURED ? 'Configured' : 'Not configured (set API key)'} />
            <InfoLine label="Mailbox file" value={MAILBOX_FILENAME} />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, fs } = useTheme();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.textMuted, fontSize: fs(13) }]}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
      >
        {children}
      </View>
    </View>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaPrefix,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaPrefix: string;
}) {
  const { colors, fs } = useTheme();
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${ariaPrefix}: ${opt.label}`}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: colors.borderStrong,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: selected ? colors.onPrimary : colors.text,
                fontWeight: selected ? '800' : '600',
                fontSize: fs(15),
                textAlign: 'center',
              }}
            >
              {selected ? `● ${opt.label}` : opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors, fs } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={{ color: colors.text, fontSize: fs(17), fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: colors.textMuted, fontSize: fs(14), lineHeight: fs(20) }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        trackColor={{ true: colors.primaryStrong, false: colors.borderStrong }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.borderStrong}
      />
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const { colors, fs } = useTheme();
  return (
    <View style={styles.infoLine}>
      <Text style={{ color: colors.textMuted, fontSize: fs(13) }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: fs(13), fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  section: { gap: space.sm },
  sectionTitle: { fontWeight: '800', letterSpacing: 1, marginLeft: space.xs },
  card: { borderWidth: 2, borderRadius: radius.md, padding: space.lg, gap: space.md },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  segment: {
    borderWidth: 2,
    borderRadius: radius.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    minHeight: 48,
    flexGrow: 1,
    justifyContent: 'center',
  },
  preview: { marginTop: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  rowText: { flex: 1, gap: space.xs },
  info: { borderTopWidth: 1, paddingTop: space.md, gap: space.sm },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
});
