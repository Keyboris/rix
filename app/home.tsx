import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/AppHeader';
import { ChatScreen } from '../src/components/ChatScreen';
import { VoiceScreen } from '../src/components/VoiceScreen';
import { useSettings, useTheme } from '../src/settings';

export default function Home() {
  const { colors } = useTheme();
  const { settings } = useSettings();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <AppHeader
        title={settings.mode === 'chat' ? 'Chat' : 'Voice'}
        right={{
          label: '⚙ Settings',
          accessibilityLabel: 'Settings',
          accessibilityHint: 'Opens font size, contrast, speech, and mode options',
          onPress: () => router.push('/settings'),
        }}
      />
      <View style={{ flex: 1 }}>
        {settings.mode === 'chat' ? <ChatScreen /> : <VoiceScreen />}
      </View>
    </SafeAreaView>
  );
}
