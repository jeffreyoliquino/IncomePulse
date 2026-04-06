import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  const insets = useSafeAreaInsets();

  const selectedOption = options.find((opt) => opt.value === value);
  const borderColor = error
    ? 'border-danger-500'
    : isOpen
    ? 'border-primary-500'
    : 'border-surface-300';

  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setIsOpen(true)}
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

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setIsOpen(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 16 }}>
              {/* Handle bar */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' }} />
              </View>
              {/* Title */}
              {label && (
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', paddingHorizontal: 20, paddingBottom: 12 }}>
                  {label}
                </Text>
              )}
              <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.5 }} showsVerticalScrollIndicator={true}>
                {options.map((option, index) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onValueChange(option.value);
                      setIsOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderBottomWidth: index < options.length - 1 ? 1 : 0,
                      borderBottomColor: '#f1f5f9',
                      backgroundColor: value === option.value ? '#eff6ff' : 'transparent',
                    }}
                  >
                    {option.icon && (
                      <FontAwesome
                        name={option.icon as any}
                        size={16}
                        color={value === option.value ? '#2563eb' : iconColor}
                        style={{ marginRight: 12, width: 20 }}
                      />
                    )}
                    <Text style={{
                      flex: 1,
                      fontSize: 16,
                      color: value === option.value ? '#2563eb' : '#374151',
                      fontWeight: value === option.value ? '600' : '400',
                    }}>
                      {option.label}
                    </Text>
                    {value === option.value && (
                      <FontAwesome name="check" size={14} color="#2563eb" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {error && (
        <Text className="mt-1 text-sm text-danger-500">{error}</Text>
      )}
    </View>
  );
};
