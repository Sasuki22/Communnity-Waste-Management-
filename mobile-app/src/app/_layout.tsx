import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/auth/context';
import { ResidentThemeProvider } from '@/theme/resident-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <ResidentThemeProvider>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
      </ResidentThemeProvider>
    </AuthProvider>
  );
}
