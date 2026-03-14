import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ExportScreen } from '@/src/features/export/ExportScreen';

export default function ExportSettingsScreen() {
  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      <View className="flex-row items-center bg-white dark:bg-surface-800 px-4 py-3 border-b border-surface-100 dark:border-surface-700">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <FontAwesome name="arrow-left" size={18} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">Export Data</Text>
      </View>
      <ExportScreen />
    </View>
  );
}
