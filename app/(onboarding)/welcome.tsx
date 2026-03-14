import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/src/components/ui';

const HIGHLIGHTS = [
  { icon: 'bolt' as const, title: 'Offline-First', desc: 'Works without internet, syncs when connected' },
  { icon: 'flag' as const, title: 'PH-Optimized', desc: 'SSS, PhilHealth, Pag-IBIG, BIR tax calculations' },
  { icon: 'magic' as const, title: 'Smart Tools', desc: 'SMS scanner, AI coach, receipt capture' },
];

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-surface-900 justify-between px-6 py-12">
      {/* Skip */}
      <View className="items-end">
        <Pressable onPress={() => router.replace('/(onboarding)/setup')}>
          <Text className="text-sm text-surface-400">Skip</Text>
        </Pressable>
      </View>

      {/* Logo & Welcome */}
      <View className="items-center">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-primary-600">
          <FontAwesome name="line-chart" size={48} color="#ffffff" />
        </View>
        <Text className="text-3xl font-bold text-surface-900 dark:text-surface-100">
          BudgetBox
        </Text>
        <Text className="mt-2 text-center text-base text-surface-500 dark:text-surface-400">
          Track your finances with confidence.{'\n'}Built for Filipinos.
        </Text>
      </View>

      {/* Feature highlights */}
      <View className="gap-4">
        {HIGHLIGHTS.map((item) => (
          <View key={item.title} className="flex-row items-center">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900">
              <FontAwesome name={item.icon} size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {item.title}
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400">
                {item.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View>
        <Button
          title="Get Started"
          onPress={() => router.push('/(onboarding)/features')}
          fullWidth
          size="lg"
        />
        {/* Progress dots */}
        <View className="mt-6 flex-row items-center justify-center gap-2">
          <View className="h-2 w-6 rounded-full bg-primary-600" />
          <View className="h-2 w-2 rounded-full bg-surface-200 dark:bg-surface-700" />
          <View className="h-2 w-2 rounded-full bg-surface-200 dark:bg-surface-700" />
        </View>
      </View>
    </View>
  );
}
