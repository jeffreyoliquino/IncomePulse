import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useTheme } from '@/src/lib/ThemeProvider';
import { Stack, router } from 'expo-router';
import { Image, Pressable, useWindowDimensions } from 'react-native';

const logoImage = require('@/assets/images/newlogo0425.png');

export default function OnboardingLayout() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth <= 768;
  const logoSize = isMobile ? 55 : 75;

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        headerStyle: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
        },
        headerTintColor: isDark ? '#f1f5f9' : '#0f172a',
        headerTitle: '',
        headerShadowVisible: false,
        headerLeft: () => (
          <Pressable
            onPress={() => isAuthenticated && router.push('/(tabs)/dashboard')}
            style={{ marginLeft: 15 }}
          >
            <Image
              source={logoImage}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="features" />
      <Stack.Screen name="setup" />
    </Stack>
  );
}
