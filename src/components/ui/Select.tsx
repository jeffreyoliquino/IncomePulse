import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface SelectOption {
  label: string;
  value: string;
  icon?: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  error?: string;
  iconColor?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onValueChange,
  error,
  iconColor = '#64748b',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const borderColor = error
    ? 'border-danger-500'
    : isOpen
    ? 'border-primary-500'
    : 'border-surface-300';

  return (
    <View className="mb-4" style={{ zIndex: isOpen ? 1000 : 1 }}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className={`flex-row items-center justify-between rounded-xl border bg-white dark:bg-surface-800 px-4 py-3 ${borderColor}`}
      >
        <View className="flex-row items-center flex-1">
          {selectedOption?.icon && (
            <FontAwesome
              name={selectedOption.icon as any}
              size={16}
              color={iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className={`text-base ${
              selectedOption
                ? 'text-surface-900 dark:text-surface-100'
                : 'text-surface-400'
            }`}
          >
            {selectedOption?.label ?? placeholder}
          </Text>
        </View>
        <FontAwesome
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#64748b"
        />
      </Pressable>

      {isOpen && (
        <View
          className="absolute left-0 right-0 bg-white dark:bg-surface-800 rounded-xl border border-surface-300 dark:border-surface-600 mt-1 shadow-lg"
          style={{ top: label ? 68 : 48, zIndex: 1001, maxHeight: 200 }}
        >
          <ScrollView nestedScrollEnabled>
            {options.map((option, index) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex-row items-center px-4 py-3 ${
                  index < options.length - 1
                    ? 'border-b border-surface-100 dark:border-surface-700'
                    : ''
                } ${
                  value === option.value
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : ''
                }`}
              >
                {option.icon && (
                  <FontAwesome
                    name={option.icon as any}
                    size={14}
                    color={value === option.value ? '#2563eb' : iconColor}
                    style={{ marginRight: 10 }}
                  />
                )}
                <Text
                  className={`text-base ${
                    value === option.value
                      ? 'text-primary-600 font-medium'
                      : 'text-surface-700 dark:text-surface-300'
                  }`}
                >
                  {option.label}
                </Text>
                {value === option.value && (
                  <FontAwesome
                    name="check"
                    size={14}
                    color="#2563eb"
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {error && (
        <Text className="mt-1 text-sm text-danger-500">{error}</Text>
      )}
    </View>
  );
};
