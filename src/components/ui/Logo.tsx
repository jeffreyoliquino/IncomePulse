import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

const logoImage = require('@/assets/images/LoginLogo-NoBG.png');

interface LogoProps {
  mobileSize?: number;
  webSize?: number;
}

export function Logo({ mobileSize = 65, webSize = 90 }: LogoProps) {
  const { isAuthenticated } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth <= 768;
  const size = isMobile ? mobileSize : webSize;

  const handlePress = () => {
    if (isAuthenticated) {
      router.push('/(tabs)/dashboard');
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Image
        source={logoImage}
        style={{
          width: size,
          height: size,
        }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
  },
});
