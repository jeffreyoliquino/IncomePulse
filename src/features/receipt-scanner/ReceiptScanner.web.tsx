import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export function ReceiptScanner() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-surface-900 p-6">
      <View className="items-center rounded-2xl bg-white dark:bg-surface-800 p-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700">
          <FontAwesome name="camera" size={28} color="#94a3b8" />
        </View>
        <Text className="mb-2 text-center text-lg font-bold text-surface-900 dark:text-surface-100">
          Not Available on Web
        </Text>
        <Text className="text-center text-sm text-surface-500 dark:text-surface-400">
          Receipt scanning requires a camera and is only available on mobile devices.
        </Text>
      </View>
    </View>
  );
}
