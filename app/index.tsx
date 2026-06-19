import { Redirect } from 'expo-router';

import { useSettings } from '../src/settings';

/** First launch -> onboarding. Later launches -> straight to Home (PRD §5). */
export default function Index() {
  const { settings } = useSettings();
  return (
    <Redirect href={settings.onboardingComplete ? '/home' : '/onboarding/welcome'} />
  );
}
