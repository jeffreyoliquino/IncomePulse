import { supabase } from '@/src/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const { code, token_hash, type, error, error_description } = params;

      if (error) {
        setErrorMsg(error_description ?? error);
        return;
      }

      try {
        if (code) {
          // PKCE flow — exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (token_hash && type) {
          // Token hash / OTP flow
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) throw error;
        }

        router.replace('/(tabs)/dashboard');
      } catch (err: any) {
        setErrorMsg(err.message ?? 'Email confirmation failed.');
      }
    }

    handleCallback();
  }, []);

  if (errorMsg) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-surface-900 px-6">
        <Text className="mb-2 text-xl font-bold text-danger-600">Confirmation Failed</Text>
        <Text className="text-center text-base text-surface-500">{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-surface-900">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="mt-4 text-base text-surface-500">Confirming your email…</Text>
    </View>
  );
}
