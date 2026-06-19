import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { useTheme } from '../settings';
import { space } from '../theme';

/** Full-screen container that paints the themed background and respects safe areas. */
export function Screen({
  children,
  padded = true,
  center = false,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
}: {
  children: React.ReactNode;
  padded?: boolean;
  center?: boolean;
  edges?: Edges;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.inner,
          padded && { paddingHorizontal: space.xl },
          center && styles.center,
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
});
