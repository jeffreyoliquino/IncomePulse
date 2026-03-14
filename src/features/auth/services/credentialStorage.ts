import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const EMAIL_KEY = 'budgetbox_biometric_email';
const PASSWORD_KEY = 'budgetbox_biometric_password';

export async function saveCredentials(email: string, password: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(EMAIL_KEY, email);
  await SecureStore.setItemAsync(PASSWORD_KEY, password);
}

export async function getCredentials(): Promise<{ email: string; password: string } | null> {
  if (Platform.OS === 'web') return null;
  const email = await SecureStore.getItemAsync(EMAIL_KEY);
  const password = await SecureStore.getItemAsync(PASSWORD_KEY);
  if (email && password) {
    return { email, password };
  }
  return null;
}

export async function clearCredentials(): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(PASSWORD_KEY);
}
