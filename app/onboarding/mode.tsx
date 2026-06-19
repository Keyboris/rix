import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/settings';
import { radius, space } from '../../src/theme';
import type { InteractionMode } from '../../src/types';

export default function ModeSelection() {
  const { colors, fs } = useTheme();

  const choose = (mode: InteractionMode) => {
    router.push({ pathname: '/onboarding/permissions', params: { mode } });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text, fontSize: fs(26) }]}
        >
          How would you like to use Rix?
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: fs(16) }]}>
          You can change this anytime in Settings.
        </Text>
      </View>

      <View style={styles.cards}>
        <ModeCard
          glyph="⌨️"
          title="Type & Chat"
          description="Read and write messages in a text chat."
          accentColor={colors.primary}
          onPress={() => choose('chat')}
        />
        <ModeCard
          glyph="🎤"
          title="Speak & Listen"
          description="Tap one big button to talk and hear replies."
          accentColor={colors.accent}
          onPress={() => choose('voice')}
        />
      </View>
    </Screen>
  );
}

function ModeCard({
  glyph,
  title,
  description,
  accentColor,
  onPress,
}: {
  glyph: string;
  title: string;
  description: string;
  accentColor: string;
  onPress: () => void;
}) {
  const { colors, fs } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderStrong,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.glyphWrap, { backgroundColor: accentColor, borderColor: colors.borderStrong }]}>
        <Text style={{ fontSize: fs(34) }}>{glyph}</Text>
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: colors.text, fontSize: fs(22) }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: colors.textMuted, fontSize: fs(16) }]}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.lg, marginBottom: space.xl },
  title: { fontWeight: '800', lineHeight: 34 },
  subtitle: {},
  cards: { gap: space.lg, flex: 1 },
  card: {
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    minHeight: 120,
  },
  glyphWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: { flex: 1, gap: space.xs },
  cardTitle: { fontWeight: '800' },
  cardDesc: { lineHeight: 22 },
});
