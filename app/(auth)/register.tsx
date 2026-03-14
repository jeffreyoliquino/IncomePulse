import { Button, Input, Logo } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      await signUp(data.email, data.password, data.displayName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Registration failed. Please try again.');
    }
  };

  if (success) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-surface-900 px-6">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-accent-100">
          <FontAwesome name="check" size={40} color="#16a34a" />
        </View>
        <Text className="mb-2 text-2xl font-bold text-surface-900 dark:text-surface-100">
          Account Created!
        </Text>
        <Text className="mb-8 text-center text-base text-surface-500 dark:text-surface-400">
          Please check your email to verify your account, then sign in.
        </Text>
        <Button
          title="Go to Login"
          onPress={() => router.replace('/(auth)/login')}
          fullWidth
          size="lg"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-surface-900"
    >
      <Logo />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100">
              Create Account
            </Text>
            <Text className="mt-2 text-base text-surface-500 dark:text-surface-400">
              Start tracking your finances today
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View className="mb-4 rounded-xl bg-danger-50 p-3">
              <Text className="text-center text-sm text-danger-600">{error}</Text>
            </View>
          )}

          {/* Form */}
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Juan dela Cruz"
                autoCapitalize="words"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.displayName?.message}
                leftIcon={<FontAwesome name="user-o" size={18} color="#94a3b8" />}
              />
            )}
          />

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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="At least 6 characters"
                secureTextEntry
                autoComplete="new-password"
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
                placeholder="Re-enter your password"
                secureTextEntry
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                leftIcon={<FontAwesome name="lock" size={20} color="#94a3b8" />}
              />
            )}
          />

          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            fullWidth
            size="lg"
          />

          {/* Login Link */}
          <View className="mt-8 flex-row items-center justify-center">
            <Text className="text-surface-500 dark:text-surface-400">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text className="font-semibold text-primary-600">Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
