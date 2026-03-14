import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { ThemeProvider, useTheme } from '@/src/lib/ThemeProvider';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { useAppStore } from '@/src/stores/appStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isPasswordRecovery } = useAuth();
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const fetchSavingsTargetFromCloud = useAppStore((s) => s.fetchSavingsTargetFromCloud);
  const segments = useSegments();
  const router = useRouter();

  // Sync settings from cloud when authenticated
  useEffect(() => {
    if (isAuthenticated && isSupabaseConfigured) {
      fetchSavingsTargetFromCloud();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    // Skip auth wall when Supabase isn't configured (demo/offline mode)
    if (!isSupabaseConfigured) {
      if (inAuthGroup) {
        if (!hasCompletedOnboarding) {
          router.replace('/(onboarding)/welcome');
        } else {
          router.replace('/(tabs)/dashboard');
        }
      }
      return;
    }

    // If password recovery, redirect to reset-password screen
    if (isPasswordRecovery) {
      router.replace('/(auth)/reset-password');
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (!hasCompletedOnboarding) {
        router.replace('/(onboarding)/welcome');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } else if (isAuthenticated && !inOnboarding && !hasCompletedOnboarding) {
      router.replace('/(onboarding)/welcome');
    }
  }, [isAuthenticated, isLoading, segments, hasCompletedOnboarding, isPasswordRecovery]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useTheme();

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(modals)" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </NavThemeProvider>
  );
}
