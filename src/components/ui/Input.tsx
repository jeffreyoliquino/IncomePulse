import React, { forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, ...props }, ref) => {
    const borderColor = error
      ? 'border-danger-500'
      : 'border-surface-300 focus:border-primary-500';

    return (
      <View className="mb-4">
        {label && (
          <Text className="mb-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
            {label}
          </Text>
        )}
        <View
          className={`flex-row items-center rounded-xl border bg-white dark:bg-surface-800 px-4 py-3 ${borderColor}`}
        >
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className="flex-1 text-base text-surface-900 dark:text-surface-100"
            placeholderTextColor="#94a3b8"
            {...props}
          />
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        {error && (
          <Text className="mt-1 text-sm text-danger-500">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
