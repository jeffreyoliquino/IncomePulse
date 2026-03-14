import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card, Button, Input } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useBiometrics } from '@/src/features/auth/hooks/useBiometrics';
import { signIn as verifyPassword } from '@/src/features/auth/services/authService';
import { updatePassword } from '@/src/features/auth/services/authService';
import { registerForPushNotifications } from '@/src/features/reminders/services/notificationService';
import { useTheme } from '@/src/lib/ThemeProvider';
import type { ThemeMode } from '@/src/lib/ThemeProvider';
import { useTransactionStore } from '@/src/stores/transactionStore';
import { useRecurringStore } from '@/src/stores/recurringStore';
import { useAppStore } from '@/src/stores/appStore';

function SettingRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !rightElement}
      className="flex-row items-center py-3 active:opacity-80"
    >
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconColor + '20' }}
      >
        <FontAwesome name={icon} size={16} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">{title}</Text>
        {subtitle && (
          <Text className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{subtitle}</Text>
        )}
      </View>
      {rightElement ?? (
        onPress && <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
      )}
    </Pressable>
  );
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { mode: 'system', label: 'System', icon: 'mobile' },
  { mode: 'light', label: 'Light', icon: 'sun-o' },
  { mode: 'dark', label: 'Dark', icon: 'moon-o' },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { isAvailable, biometricEnabled, biometricType, toggleBiometric, onSignOut: clearBiometricCredentials } =
    useBiometrics();
  const { themeMode, setTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const clearTransactionData = useTransactionStore((state) => state.clearUserData);
  const clearRecurringData = useRecurringStore((state) => state.clearUserData);
  const resetOnboarding = useAppStore((state) => state.resetOnboarding);

  const handleToggleBiometric = async () => {
    const success = await toggleBiometric();
    if (!success) {
      Alert.alert(
        'Biometrics Unavailable',
        'Could not enable biometric authentication. Make sure your device supports it.'
      );
    }
  };

  const handleTogglePush = async () => {
    if (!pushEnabled) {
      const token = await registerForPushNotifications();
      if (token) {
        setPushEnabled(true);
        // In production, save token to Supabase profile
      } else {
        Alert.alert(
          'Notifications',
          'Could not enable push notifications. Please check your device settings.'
        );
      }
    } else {
      setPushEnabled(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordLoading(false);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);
    try {
      // Verify current password by re-authenticating
      await verifyPassword(user?.email ?? '', currentPassword);

      // Update to new password
      await updatePassword(newPassword);

      setShowChangePassword(false);
      resetPasswordForm();
      Alert.alert('Success', 'Your password has been updated.');
    } catch (err: any) {
      if (err.message?.includes('Invalid login')) {
        setPasswordError('Current password is incorrect.');
      } else {
        setPasswordError(err.message ?? 'Failed to update password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          // Clear all user data from stores
          clearTransactionData();
          clearRecurringData();
          resetOnboarding();
          // Clear biometric credentials
          await clearBiometricCredentials();
          // Sign out from Supabase
          await signOut();
          // Navigate to login
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="flex-row items-center bg-white dark:bg-surface-800 px-4 py-3 border-b border-surface-100 dark:border-surface-700">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <FontAwesome name="arrow-left" size={18} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">Settings</Text>
      </View>

      <View className="px-4 pt-4 pb-8">
        {/* Profile Section */}
        <Card variant="elevated" className="mb-4">
          <View className="flex-row items-center mb-3">
            <View className="mr-3 h-14 w-14 items-center justify-center rounded-full bg-primary-100">
              <FontAwesome name="user" size={24} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                {user?.user_metadata?.display_name ?? 'User'}
              </Text>
              <Text className="text-sm text-surface-500 dark:text-surface-400">
                {user?.email ?? ''}
              </Text>
            </View>
          </View>
        </Card>

        {/* Security */}
        <Text className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Security
        </Text>
        <Card variant="elevated" className="mb-4">
          {isAvailable && (
            <SettingRow
              icon="hand-pointer-o"
              iconColor="#2563eb"
              title={`${biometricType} Login`}
              subtitle={`Use ${biometricType} to sign in`}
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleToggleBiometric}
                  trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                  thumbColor={biometricEnabled ? '#2563eb' : '#ffffff'}
                />
              }
            />
          )}
          <SettingRow
            icon="lock"
            iconColor="#7c3aed"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => { resetPasswordForm(); setShowChangePassword(true); }}
          />
        </Card>

        {/* Appearance */}
        <Text className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Appearance
        </Text>
        <Card variant="elevated" className="mb-4">
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((option) => (
              <Pressable
                key={option.mode}
                onPress={() => setTheme(option.mode)}
                className={`flex-1 items-center rounded-xl py-3 ${
                  themeMode === option.mode
                    ? 'bg-primary-600'
                    : 'bg-surface-100 dark:bg-surface-700'
                }`}
              >
                <FontAwesome
                  name={option.icon}
                  size={18}
                  color={themeMode === option.mode ? '#ffffff' : '#94a3b8'}
                />
                <Text
                  className={`mt-1 text-xs font-medium ${
                    themeMode === option.mode
                      ? 'text-white'
                      : 'text-surface-600 dark:text-surface-300'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Notifications */}
        <Text className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Notifications
        </Text>
        <Card variant="elevated" className="mb-4">
          <SettingRow
            icon="bell"
            iconColor="#f59e0b"
            title="Push Notifications"
            subtitle="Bill reminders and budget alerts"
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ false: '#e2e8f0', true: '#fde68a' }}
                thumbColor={pushEnabled ? '#f59e0b' : '#ffffff'}
              />
            }
          />
          <SettingRow
            icon="exclamation-triangle"
            iconColor="#dc2626"
            title="Budget Alerts"
            subtitle="Alert when spending exceeds 80%"
            rightElement={
              <Switch
                value={true}
                trackColor={{ false: '#e2e8f0', true: '#fca5a5' }}
                thumbColor="#dc2626"
              />
            }
          />
          <SettingRow
            icon="calendar"
            iconColor="#16a34a"
            title="Bill Reminders"
            subtitle="3 days before due date"
            rightElement={
              <Switch
                value={true}
                trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
                thumbColor="#16a34a"
              />
            }
          />
        </Card>

        {/* Household */}
        <Text className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Household
        </Text>
        <Card variant="elevated" className="mb-4">
          <SettingRow
            icon="home"
            iconColor="#8b5cf6"
            title="Household"
            subtitle="Manage family or shared budgeting"
            onPress={() => router.push('/settings/household' as any)}
          />
        </Card>

        {/* Data */}
        <Text className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Data
        </Text>
        <Card variant="elevated" className="mb-4">
          <SettingRow
            icon="download"
            iconColor="#0891b2"
            title="Export Data"
            subtitle="Export transactions as CSV"
            onPress={() => router.push('/settings/export' as any)}
          />
          <SettingRow
            icon="cloud"
            iconColor="#22c55e"
            title="Sync Status"
            subtitle="All data synced"
            onPress={() => {}}
          />
        </Card>

        {/* About */}
        <Text className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          About
        </Text>
        <Card variant="elevated" className="mb-6">
          <SettingRow
            icon="info-circle"
            iconColor="#64748b"
            title="Version"
            subtitle="1.0.0"
          />
        </Card>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
          size="lg"
        />
      </View>
      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowChangePassword(false); resetPasswordForm(); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center items-center bg-black/50 px-4"
        >
          <View className="bg-white dark:bg-surface-800 w-full max-w-sm rounded-2xl p-6">
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-purple-100 items-center justify-center mb-3">
                <FontAwesome name="lock" size={24} color="#7c3aed" />
              </View>
              <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">
                Change Password
              </Text>
            </View>

            {passwordError && (
              <View className="mb-3 rounded-xl bg-danger-50 p-3">
                <Text className="text-center text-sm text-danger-600">{passwordError}</Text>
              </View>
            )}

            <Input
              label="Current Password"
              placeholder="Enter current password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              leftIcon={<FontAwesome name="lock" size={16} color="#94a3b8" />}
            />

            <Input
              label="New Password"
              placeholder="Enter new password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              leftIcon={<FontAwesome name="key" size={16} color="#94a3b8" />}
            />

            <Input
              label="Confirm New Password"
              placeholder="Confirm new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon={<FontAwesome name="key" size={16} color="#94a3b8" />}
            />

            <View className="flex-row gap-3 mt-4">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => { setShowChangePassword(false); resetPasswordForm(); }}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Update"
                  onPress={handleChangePassword}
                  loading={passwordLoading}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
