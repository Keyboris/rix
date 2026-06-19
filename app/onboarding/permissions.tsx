import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AudioModule } from 'expo-audio';

import { Screen } from '../../src/components/Screen';
import { Button } from '../../src/components/Button';
import { useSettings, useTheme } from '../../src/settings';
import { radius, space } from '../../src/theme';
import type { InteractionMode } from '../../src/types';

type PermState = 'unknown' | 'granted' | 'denied';

export default function Permissions() {
  const { colors, fs } = useTheme();
  const { completeOnboarding } = useSettings();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: InteractionMode = params.mode === 'voice' ? 'voice' : 'chat';

  const [perm, setPerm] = useState<PermState>('unknown');
  const [requesting, setRequesting] = useState(false);

  const requestMic = async () => {
    setRequesting(true);
    try {
      const res = await AudioModule.requestRecordingPermissionsAsync();
      setPerm(res.granted ? 'granted' : 'denied');
    } catch {
      setPerm('denied');
    } finally {
      setRequesting(false);
    }
  };

  const finish = () => {
    completeOnboarding(mode);
    router.replace('/home');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text, fontSize: fs(26) }]}
        >
          Microphone access
        </Text>
        <Text style={[styles.body, { color: colors.textMuted, fontSize: fs(16) }]}>
          Rix needs the microphone for Voice mode — turning your speech into text. We ask now so
          switching modes later never hits a permission wall. You can use Chat without it.
        </Text>
      </View>

      <View
        accessible
        accessibilityLabel={`Microphone permission status: ${
          perm === 'granted' ? 'allowed' : perm === 'denied' ? 'not allowed' : 'not requested yet'
        }`}
        style={[styles.status, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}
      >
        <Text style={{ fontSize: fs(22) }}>
          {perm === 'granted' ? '✅' : perm === 'denied' ? '⚠️' : '🎤'}
        </Text>
        <Text style={{ color: colors.text, fontSize: fs(16), flex: 1 }}>
          {perm === 'granted'
            ? 'Microphone allowed.'
            : perm === 'denied'
              ? 'Microphone not allowed. You can still use Chat, or enable it later in your phone Settings.'
              : 'Microphone not requested yet.'}
        </Text>
      </View>

      <View style={styles.actions}>
        {perm !== 'granted' && (
          <Button
            label={perm === 'denied' ? 'Try again' : 'Allow microphone'}
            onPress={requestMic}
            loading={requesting}
            accessibilityHint="Opens the system microphone permission prompt"
          />
        )}
        <Button
          label="Continue"
          big
          variant={perm === 'granted' ? 'primary' : 'secondary'}
          onPress={finish}
          accessibilityHint="Finishes setup and opens the app"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.md, marginTop: space.lg, marginBottom: space.xl },
  title: { fontWeight: '800' },
  body: { lineHeight: 24 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.lg,
  },
  actions: { marginTop: 'auto', gap: space.md, paddingBottom: space.lg },
});
