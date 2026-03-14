import { useAuthStore } from '../../../stores/authStore';

export function useBiometrics() {
  const { biometricEnabled } = useAuthStore();

  return {
    isAvailable: false,
    biometricEnabled,
    biometricType: 'Biometrics' as string,
    authenticate: async (): Promise<boolean> => false,
    authenticateAndSignIn: async (): Promise<boolean> => false,
    enableBiometric: async (_email: string, _password: string): Promise<boolean> => false,
    toggleBiometric: async (): Promise<boolean> => false,
    onSignOut: async (): Promise<void> => {},
  };
}
