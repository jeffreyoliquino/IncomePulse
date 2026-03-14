import { Button, Input, Logo } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { updatePassword } from '@/src/features/auth/services/authService';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { z } from 'zod';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth <= 768;
  const { setIsPasswordRecovery } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setIsLoading(true);
      setError(null);
      await updatePassword(data.password);
      setSuccess(true);
      setIsPasswordRecovery(false);
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message ?? 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-surface-900"
    >
      <Logo />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pb-4" style={{ width: isMobile ? '100%' : '50%', alignSelf: 'center' }}>
          <View className="mb-6 items-center">
            <FontAwesome name="key" size={48} color="#d97706" />
            <Text className="mt-4 text-2xl font-bold text-surface-900 dark:text-white">
              Set New Password
            </Text>
            <Text className="mt-2 text-center text-surface-500 dark:text-surface-400">
              Enter your new password below.
            </Text>
          </View>

          {error && (
            <View className="mb-4 rounded-xl bg-danger-50 p-3">
              <Text className="text-center text-sm text-danger-600">{error}</Text>
            </View>
          )}

          {success ? (
            <View className="mb-4 rounded-xl bg-green-50 p-4">
              <Text className="text-center text-base font-medium text-green-700">
                Password updated successfully! Redirecting to login...
              </Text>
            </View>
          ) : (
            <>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="New Password"
                    placeholder="Enter new password"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    leftIcon={<FontAwesome name="lock" size={20} color="#94a3b8" />}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    leftIcon={<FontAwesome name="lock" size={20} color="#94a3b8" />}
                  />
                )}
              />

              <Button
                title="Update Password"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                size="lg"
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
