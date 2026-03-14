import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '../../../stores/authStore';
import { saveCredentials, getCredentials, clearCredentials } from '../services/credentialStorage';
import * as authService from '../services/authService';

const isExpoGo = Constants.appOwnership === 'expo';

export function useBiometrics() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');
  const { biometricEnabled, setBiometricEnabled } = useAuthStore();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      return;
    }

    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsAvailable(compatible && enrolled);

    if (compatible) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      }
    }
  };

  const authenticate = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (Platform.OS === 'web' || !isAvailable) return { success: false, error: 'not_available' };

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access BudgetBox',
      cancelLabel: 'Use Password',
      // Expo Go doesn't have NSFaceIDUsageDescription, so must allow device fallback
      disableDeviceFallback: isExpoGo ? false : true,
      fallbackLabel: isExpoGo ? undefined : '',
    });

    return { success: result.success, error: result.error };
  }, [isAvailable]);

  /** Authenticate biometrically, then sign in with stored credentials */
  const authenticateAndSignIn = useCallback(async (): Promise<{ success: boolean; reason?: string }> => {
    const authResult = await authenticate();
    if (!authResult.success) {
      return { success: false, reason: authResult.error === 'user_cancel' ? 'user_cancel' : `biometric_failed:${authResult.error ?? 'unknown'}` };
    }

    const credentials = await getCredentials();
    if (!credentials) {
      setBiometricEnabled(false);
      return { success: false, reason: 'no_credentials' };
    }

    try {
      await authService.signIn(credentials.email, credentials.password);
      return { success: true };
    } catch {
      // Stored credentials are invalid (e.g. password changed)
      await clearCredentials();
      setBiometricEnabled(false);
      return { success: false, reason: 'credentials_invalid' };
    }
  }, [authenticate, setBiometricEnabled]);

  /** Enable biometric login by saving credentials after biometric verification */
  const enableBiometric = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!isAvailable) return false;

    const success = await authenticate();
    if (success) {
      await saveCredentials(email, password);
      setBiometricEnabled(true);
      return true;
    }
    return false;
  }, [isAvailable, authenticate, setBiometricEnabled]);

  const toggleBiometric = useCallback(async () => {
    if (!isAvailable) return false;

    if (!biometricEnabled) {
      // Re-enable only if credentials are already stored
      const success = await authenticate();
      if (success) {
        const credentials = await getCredentials();
        if (credentials) {
          setBiometricEnabled(true);
          return true;
        }
      }
      return false;
    }

    // Disable biometric
    await clearCredentials();
    setBiometricEnabled(false);
    return true;
  }, [isAvailable, biometricEnabled, authenticate, setBiometricEnabled]);

  /** Clear stored credentials on sign out */
  const onSignOut = useCallback(async () => {
    await clearCredentials();
  }, []);

  return {
    isAvailable,
    biometricEnabled,
    biometricType,
    authenticate,
    authenticateAndSignIn,
    enableBiometric,
    toggleBiometric,
    onSignOut,
  };
}
