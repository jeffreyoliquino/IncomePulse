import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/src/components/ui';

const FEATURES = [
  { icon: 'home' as const, title: 'Smart Dashboard', desc: 'See income, expenses, savings, and investments at a glance', color: '#2563eb', bgColor: '#dbeafe' },
  { icon: 'pie-chart' as const, title: 'Budget Tracking', desc: 'Set budgets per category with alerts when overspending', color: '#16a34a', bgColor: '#dcfce7' },
  { icon: 'commenting' as const, title: 'SMS Scanner', desc: 'Auto-detect transactions from bank SMS messages', color: '#0ea5e9', bgColor: '#e0f2fe' },
  { icon: 'comments' as const, title: 'AI Financial Coach', desc: 'Get personalized PH financial advice and tips', color: '#8b5cf6', bgColor: '#ede9fe' },
];

export default function FeaturesScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-surface-900 justify-between px-6 py-12">
      {/* Skip */}
      <View className="items-end">
        <Pressable onPress={() => router.replace('/(onboarding)/setup')}>
          <Text className="text-sm text-surface-400">Skip</Text>
        </Pressable>
      </View>

      {/* Title */}
      <View>
        <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 text-center">
          Powerful Features
        </Text>
        <Text className="mt-2 text-center text-sm text-surface-500 dark:text-surface-400">
          Everything you need to manage your finances
        </Text>
      </View>

      {/* Feature Cards */}
      <View className="gap-4">
        {FEATURES.map((feature) => (
          <View key={feature.title} className="flex-row items-center rounded-2xl bg-surface-50 dark:bg-surface-800 p-4">
            <View
              className="mr-4 h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: feature.bgColor }}
            >
              <FontAwesome name={feature.icon} size={22} color={feature.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {feature.title}
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400">
                {feature.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View>
        <Button
          title="Next"
          onPress={() => router.push('/(onboarding)/setup')}
          fullWidth
          size="lg"
        />
        {/* Progress dots */}
        <View className="mt-6 flex-row items-center justify-center gap-2">
          <View className="h-2 w-2 rounded-full bg-surface-200 dark:bg-surface-700" />
          <View className="h-2 w-6 rounded-full bg-primary-600" />
          <View className="h-2 w-2 rounded-full bg-surface-200 dark:bg-surface-700" />
        </View>
      </View>
    </View>
  );
}
