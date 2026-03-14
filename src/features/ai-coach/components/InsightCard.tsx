import React from 'react';
import { View, Text, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { Insight } from '../services/financialContext';

const TYPE_STYLES: Record<Insight['type'], { bg: string; border: string; text: string; icon: string }> = {
  positive: { bg: 'bg-accent-50', border: 'border-accent-200', text: 'text-accent-800', icon: '#16a34a' },
  warning: { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-800', icon: '#f59e0b' },
  tip: { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-800', icon: '#2563eb' },
  info: { bg: 'bg-surface-50', border: 'border-surface-200', text: 'text-surface-800', icon: '#64748b' },
};

interface InsightCardProps {
  insight: Insight;
  onPress?: () => void;
}

export function InsightCard({ insight, onPress }: InsightCardProps) {
  const style = TYPE_STYLES[insight.type];

  return (
    <Pressable onPress={onPress}>
      <View
        className={`mr-3 w-64 rounded-xl border p-4 ${style.bg} ${style.border}`}
      >
        <View className="mb-2 flex-row items-center">
          <FontAwesome name={insight.icon as any} size={16} color={style.icon} />
          <Text className={`ml-2 text-sm font-semibold ${style.text}`}>
            {insight.title}
          </Text>
        </View>
        <Text className="text-xs text-surface-600" numberOfLines={3}>
          {insight.description}
        </Text>
      </View>
    </Pressable>
  );
}
