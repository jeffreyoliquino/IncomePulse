import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/src/components/ui';
import { useAppStore } from '@/src/stores/appStore';

const CURRENCIES = ['PHP', 'USD', 'AUD'];

export default function SetupScreen() {
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState('PHP');

  const handleComplete = () => {
    setOnboardingComplete();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View className="flex-1 bg-white dark:bg-surface-900 justify-between px-6 py-12">
      {/* Skip */}
      <View className="items-end">
        <Pressable onPress={handleComplete}>
          <Text className="text-sm text-surface-400">Skip</Text>
        </Pressable>
      </View>

      {/* Title */}
      <View>
        <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
          Quick Setup
        </Text>
        <Text className="mt-2 text-center text-sm text-surface-500 dark:text-surface-400">
          Help us personalize your experience
        </Text>
      </View>

      {/* Form */}
      <View className="gap-6">
        {/* Monthly Income */}
        <View>
          <Text className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
            Monthly Income (optional)
          </Text>
          <View className="flex-row items-center rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-3">
            <Text className="mr-2 text-base text-surface-400">&#8369;</Text>
            <TextInput
              value={income}
              onChangeText={setIncome}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              className="flex-1 text-base text-surface-900 dark:text-surface-100"
            />
          </View>
          <Text className="mt-1 text-xs text-surface-400">
            This helps calculate your savings rate
          </Text>
        </View>

        {/* Default Currency */}
        <View>
          <Text className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
            Default Currency
          </Text>
          <View className="flex-row gap-3">
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCurrency(c)}
                className={`flex-1 items-center rounded-xl py-3 ${
                  currency === c
                    ? 'bg-primary-600'
                    : 'bg-surface-100 dark:bg-surface-700'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    currency === c
                      ? 'text-white'
                      : 'text-surface-700 dark:text-surface-300'
                  }`}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* CTA */}
      <View>
        <Button
          title="Start Using BudgetBox"
          onPress={handleComplete}
          fullWidth
          size="lg"
        />
        {/* Progress dots */}
        <View className="mt-6 flex-row items-center justify-center gap-2">
          <View className="h-2 w-2 rounded-full bg-surface-200 dark:bg-surface-700" />
          <View className="h-2 w-2 rounded-full bg-surface-200 dark:bg-surface-700" />
          <View className="h-2 w-6 rounded-full bg-primary-600" />
        </View>
      </View>
    </View>
  );
}
