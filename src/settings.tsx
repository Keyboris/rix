/**
 * App settings: persisted user preferences + derived theme.
 *
 * Persisted with AsyncStorage. The provider gates the app until preferences are
 * hydrated so first paint already reflects saved font size / contrast / mode.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEV_ECHO_DEFAULT } from './env';
import { buildTheme, type FontSizeKey, type Theme } from './theme';
import type { InteractionMode } from './types';

export interface Settings {
  /** Whether first-run onboarding has been completed. */
  onboardingComplete: boolean;
  mode: InteractionMode;
  fontSize: FontSizeKey;
  highContrast: boolean;
  /** Whether responses are spoken aloud (TTS). */
  tts: boolean;
  /** Dev-only: simulate agent responses so the flow is demoable solo. */
  devEcho: boolean;
}

const DEFAULTS: Settings = {
  onboardingComplete: false,
  mode: 'chat',
  fontSize: 'default',
  highContrast: false,
  tts: false,
  devEcho: DEV_ECHO_DEFAULT,
};

const STORAGE_KEY = 'rix.settings.v1';

interface SettingsContextValue {
  settings: Settings;
  hydrated: boolean;
  theme: Theme;
  update: (patch: Partial<Settings>) => void;
  /** Apply the suggested TTS default for a mode (On for voice, Off for chat). */
  completeOnboarding: (mode: InteractionMode) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const writeQueued = useRef(false);

  // Load persisted settings once.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && raw) {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // ignore; fall back to defaults
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    writeQueued.current = true;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {
      // ignore persistence failure
    });
  }, [settings, hydrated]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const completeOnboarding = useCallback((mode: InteractionMode) => {
    setSettings((prev) => ({
      ...prev,
      mode,
      // Suggested defaults (PRD §6.6): On for Voice, Off for Chat. Overridable later.
      tts: mode === 'voice',
      onboardingComplete: true,
    }));
  }, []);

  const theme = useMemo(
    () => buildTheme(settings.fontSize, settings.highContrast),
    [settings.fontSize, settings.highContrast]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, hydrated, theme, update, completeOnboarding }),
    [settings, hydrated, theme, update, completeOnboarding]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function useTheme(): Theme {
  return useSettings().theme;
}
