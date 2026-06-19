import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '../../src/components/Screen';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/settings';
import { space } from '../../src/theme';

export default function Welcome() {
  const { colors, fs } = useTheme();
  return (
    <Screen center>
      <View style={styles.body}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.primaryStrong, fontSize: fs(40) }]}
        >
          Rix
        </Text>
        <Text style={[styles.tagline, { color: colors.text, fontSize: fs(20) }]}>
          Your accessible assistant — type or speak, and Rix gets it done.
        </Text>
      </View>
      <Button
        label="Get Started"
        big
        accessibilityHint="Begins setup"
        onPress={() => router.push('/onboarding/mode')}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: space.lg, marginBottom: space.xxl },
  title: { fontWeight: '900', letterSpacing: 1 },
  tagline: { textAlign: 'center', lineHeight: 30, paddingHorizontal: space.md },
  cta: { alignSelf: 'stretch' },
});
