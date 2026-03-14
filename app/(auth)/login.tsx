import { Button, Input, Logo } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { z } from 'zod';

// Platform-specific images - require statements must be at module level
const mobileImage = require('@/assets/images/for_mobile_2.png');
const webImage = require('@/assets/images/Envelope_white_bg.png');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { signIn, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const isMobile = screenWidth <= 768;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      await signIn(data.email, data.password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-surface-900"
    >
      <Logo mobileSize={100} webSize={130} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pb-4 pt-8">
          {/* Image */}
          <View style={{
            width: '100%',
            alignItems: 'center',
            marginTop: screenWidth > 768 ? -50 : 120,
            marginBottom: screenWidth > 768 ? -200 : 60
          }}>
            {isMobile ? (
              <Image
                source={mobileImage}
                style={{
                  width: 400,
                  height: 300,
                }}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={webImage}
                style={{
                  width: '70%',
                  height: undefined,
                  aspectRatio: 1
                }}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 rounded-xl bg-danger-50 p-3">
              <Text className="text-center text-sm text-danger-600">{error}</Text>
            </View>
          )}

          {/* Login Form */}
          <View style={{
            width: isMobile ? '100%' : '50%',
            alignSelf: 'center'
          }}>
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
                  placeholder="Enter your password"
                  secureTextEntry
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={<FontAwesome name="lock" size={20} color="#94a3b8" />}
                  onSubmitEditing={() => handleSubmit(onSubmit)()}
                />
              )}
            />

            <Link href="/(auth)/forgot-password" asChild>
              <Text className="mb-3 mt-1 text-right text-sm font-medium text-primary-600">
                Forgot Password?
              </Text>
            </Link>

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          {/* Register Link */}
          <View className="mt-4 flex-row items-center justify-center">
            <Text className="text-surface-500 dark:text-surface-400">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <Text className="font-semibold text-primary-600">Sign Up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
