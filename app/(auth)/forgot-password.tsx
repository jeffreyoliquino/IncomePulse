import { Button, Input, Logo } from '@/src/components/ui';
import { resetPassword } from '@/src/features/auth/services/authService';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth <= 768;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      setError(null);
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Failed to send reset email. Please try again.');
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
            <FontAwesome name="lock" size={48} color="#d97706" />
            <Text className="mt-4 text-2xl font-bold text-surface-900 dark:text-white">
              Forgot Password?
            </Text>
            <Text className="mt-2 text-center text-surface-500 dark:text-surface-400">
              Enter your email address and we'll send you a link to reset your password.
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
                Password reset email sent! Check your inbox and follow the link to reset your password.
              </Text>
            </View>
          ) : (
            <>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    leftIcon={<FontAwesome name="envelope-o" size={18} color="#94a3b8" />}
                  />
                )}
              />

              <Button
                title="Send Reset Link"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                size="lg"
              />
            </>
          )}

          <View className="mt-6 flex-row items-center justify-center">
            <FontAwesome name="arrow-left" size={14} color="#2563eb" />
            <Link href="/(auth)/login" asChild>
              <Text className="ml-2 font-semibold text-primary-600">Back to Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
