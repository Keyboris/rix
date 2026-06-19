import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../settings';
import { space } from '../theme';

/** Top bar with a title and optional left/right tappable actions (>=44pt). */
export function AppHeader({
  title,
  left,
  right,
}: {
  title: string;
  left?: HeaderAction;
  right?: HeaderAction;
}) {
  const { colors, fs } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.side}>{left ? <HeaderButton action={left} /> : null}</View>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[styles.title, { color: colors.text, fontSize: fs(18) }]}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        {right ? <HeaderButton action={right} /> : null}
      </View>
    </View>
  );
}

export interface HeaderAction {
  label: string; // visible glyph/text
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
}

function HeaderButton({ action }: { action: HeaderAction }) {
  const { colors, fs } = useTheme();
  return (
    <Pressable
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
      accessibilityHint={action.accessibilityHint}
      hitSlop={12}
      style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text style={{ color: colors.primaryStrong, fontSize: fs(16), fontWeight: '700' }}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  side: { minWidth: 72, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontWeight: '800' },
  btn: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
});
