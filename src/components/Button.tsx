import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../settings';
import { radius, space } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost';

/**
 * App button. Primary actions are >=64pt tall (PRD §8); all targets >=44pt.
 * State is never signalled by colour alone — disabled/loading also change content.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  big = false,
  accessibilityHint,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Primary CTA sizing (taller, larger text). */
  big?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
}) {
  const { colors, fs } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.surface
        : 'transparent';
  const fg =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'secondary'
        ? colors.primaryStrong
        : colors.primaryStrong;
  const borderColor =
    variant === 'ghost' ? 'transparent' : colors.borderStrong;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          minHeight: big ? 64 : 48,
          paddingVertical: big ? space.lg : space.md,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading && <ActivityIndicator color={fg} style={{ marginRight: space.sm }} />}
        <Text
          style={{
            color: fg,
            fontSize: fs(big ? 20 : 17),
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {loading ? 'Working…' : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
