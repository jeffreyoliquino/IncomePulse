import React from 'react';
import { View, Pressable } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({
  children,
  className = '',
  onPress,
  variant = 'default',
}: CardProps) {
  const variantClasses = {
    default: 'bg-white dark:bg-surface-800 rounded-2xl p-4',
    outlined: 'bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-200 dark:border-surface-700',
    elevated: 'bg-white dark:bg-surface-800 rounded-2xl p-4 shadow-sm shadow-surface-300 dark:shadow-none',
  };

  const content = (
    <View className={`${variantClasses[variant]} ${className}`}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {content}
      </Pressable>
    );
  }

  return content;
}
