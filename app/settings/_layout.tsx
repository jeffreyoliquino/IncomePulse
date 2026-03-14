import { useTheme } from '@/src/lib/ThemeProvider';
import { Stack, router } from 'expo-router';
import { Image, Pressable, useWindowDimensions } from 'react-native';

const logoImage = require('@/assets/images/LoginLogo-NoBG.png');

export default function SettingsLayout() {
  const { isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth <= 768;
  const logoSize = isMobile ? 55 : 75;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
        },
        headerTintColor: isDark ? '#f1f5f9' : '#0f172a',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <Pressable onPress={() => router.push('/(tabs)/dashboard')} style={{ marginLeft: 15 }}>
            <Image
              source={logoImage}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="household" options={{ title: 'Household' }} />
      <Stack.Screen name="export" options={{ title: 'Export' }} />
    </Stack>
  );
}
