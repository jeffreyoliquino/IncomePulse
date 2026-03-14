import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const baseClasses = 'flex-row items-center justify-center rounded-xl';

  const variantClasses = {
    primary: 'bg-primary-600 active:bg-primary-700',
    secondary: 'bg-surface-200 dark:bg-surface-700 active:bg-surface-300',
    outline: 'border-2 border-primary-600 bg-transparent active:bg-primary-50 dark:active:bg-primary-900',
    danger: 'bg-danger-500 active:bg-danger-600',
    ghost: 'bg-transparent active:bg-surface-100 dark:active:bg-surface-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-5 py-3',
    lg: 'px-6 py-4',
  };

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-surface-800 dark:text-surface-100',
    outline: 'text-primary-600 dark:text-primary-400',
    danger: 'text-white',
    ghost: 'text-primary-600 dark:text-primary-400',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const disabledClasses = disabled || loading ? 'opacity-50' : '';
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#ffffff' : '#2563eb'}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            className={`font-semibold ${textVariantClasses[variant]} ${textSizeClasses[size]} ${icon ? 'ml-2' : ''}`}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
