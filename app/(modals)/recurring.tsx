import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card } from '@/src/components/ui';
import { useRecurringTransactions } from '@/src/features/recurring/hooks/useRecurringTransactions';
import { getFrequencyLabel, getUpcomingOccurrences } from '@/src/features/recurring/utils/recurringEngine';
import { formatCurrency, formatDate } from '@/src/lib/formatters';
import type { RecurringFrequency, TransactionType } from '@/src/types/database';

const recurringSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  day_of_month: z.string().optional(),
});

type RecurringForm = z.infer<typeof recurringSchema>;

const FREQUENCIES: { label: string; value: RecurringFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Biweekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: '6 Months', value: 'semi_annual' },
  { label: 'Yearly', value: 'annual' },
];

const TYPE_OPTIONS: { label: string; value: TransactionType; icon: string; color: string }[] = [
  { label: 'Income', value: 'income', icon: 'arrow-down', color: '#16a34a' },
  { label: 'Expense', value: 'expense', icon: 'arrow-up', color: '#dc2626' },
  { label: 'Savings', value: 'savings_deposit', icon: 'bank', color: '#0891b2' },
  { label: 'Investment', value: 'investment', icon: 'line-chart', color: '#7c3aed' },
];

export default function RecurringScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [selectedFrequency, setSelectedFrequency] = useState<RecurringFrequency>('monthly');
  const [autoCreate, setAutoCreate] = useState(false);
  const [createReminder, setCreateReminder] = useState(true);

  const {
    activeRecurring,
    inactiveRecurring,
    monthlyProjectedIncome,
    monthlyProjectedExpenses,
    createRecurring,
    deleteRecurring,
    toggleActive,
  } = useRecurringTransactions();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      description: '',
      amount: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      day_of_month: '',
    },
  });

  const onSubmit = (data: RecurringForm) => {
    createRecurring({
      description: data.description,
      amount: parseFloat(data.amount),
      type: selectedType,
      frequency: selectedFrequency,
      startDate: data.start_date,
      endDate: data.end_date || undefined,
      dayOfMonth: data.day_of_month ? parseInt(data.day_of_month) : undefined,
      autoCreate,
      createReminder: createReminder && selectedType === 'expense',
    });
    reset();
    setShowAddModal(false);
    setSelectedType('expense');
    setSelectedFrequency('monthly');
    setAutoCreate(false);
    setCreateReminder(true);
  };

  const handleDelete = (id: string, description: string) => {
    Alert.alert('Delete Recurring', `Delete "${description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteRecurring(id),
      },
    ]);
  };

  const getTypeInfo = (type: TransactionType) =>
    TYPE_OPTIONS.find((t) => t.value === type) ?? TYPE_OPTIONS[1];

  return (
    <View className="flex-1 bg-surface-50">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-surface-100">
        <Pressable onPress={() => router.back()} className="p-1">
          <FontAwesome name="arrow-left" size={18} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-bold text-surface-900">Recurring</Text>
        <Pressable onPress={() => setShowAddModal(true)} className="p-1">
          <FontAwesome name="plus" size={18} color="#2563eb" />
        </Pressable>
      </View>

      {/* Monthly Projection */}
      <View className="bg-white px-4 py-3 border-b border-surface-100">
        <Card variant="elevated" className="bg-primary-600">
          <Text className="text-sm text-primary-200">Monthly Projection</Text>
          <View className="mt-2 flex-row justify-between">
            <View>
              <Text className="text-xs text-primary-300">Income</Text>
              <Text className="text-lg font-bold text-white">
                {formatCurrency(monthlyProjectedIncome)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-primary-300">Expenses</Text>
              <Text className="text-lg font-bold text-white">
                {formatCurrency(monthlyProjectedExpenses)}
              </Text>
            </View>
          </View>
          <View className="mt-2 border-t border-primary-400 pt-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-primary-200">Net</Text>
              <Text className="text-sm font-bold text-white">
                {formatCurrency(monthlyProjectedIncome - monthlyProjectedExpenses)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Active Recurring */}
        <Text className="mb-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
          Active ({activeRecurring.length})
        </Text>

        {activeRecurring.length === 0 && inactiveRecurring.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="refresh" size={48} color="#cbd5e1" />
            <Text className="mt-4 text-base text-surface-400">
              No recurring transactions
            </Text>
            <Text className="mt-1 text-sm text-surface-400">
              Set up salary, bills, and subscriptions
            </Text>
          </View>
        ) : (
          <>
            {activeRecurring.map((rt) => {
              const typeInfo = getTypeInfo(rt.type);
              const upcoming = getUpcomingOccurrences(rt, 3);
              return (
                <Card key={rt.id} variant="elevated" className="mb-3">
                  <View className="flex-row items-start">
                    <View
                      className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: typeInfo.color + '20' }}
                    >
                      <FontAwesome
                        name={typeInfo.icon as any}
                        size={16}
                        color={typeInfo.color}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-surface-900">
                        {rt.description}
                      </Text>
                      <View className="mt-1 flex-row items-center gap-2">
                        <View className="rounded-full bg-surface-100 px-2 py-0.5">
                          <Text className="text-xs text-surface-600">
                            {getFrequencyLabel(rt.frequency)}
                          </Text>
                        </View>
                        {rt.auto_create && (
                          <View className="rounded-full bg-accent-50 px-2 py-0.5">
                            <Text className="text-xs text-accent-600">Auto</Text>
                          </View>
                        )}
                      </View>
                      <Text className="mt-1 text-xs text-surface-400">
                        Next: {formatDate(rt.next_due_date)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text
                        className="text-sm font-bold"
                        style={{ color: typeInfo.color }}
                      >
                        {rt.type === 'income' ? '+' : '-'}
                        {formatCurrency(rt.amount)}
                      </Text>
                      <View className="mt-2 flex-row gap-2">
                        <Pressable
                          onPress={() => toggleActive(rt.id)}
                          className="rounded-lg bg-warning-50 px-2 py-1.5"
                        >
                          <FontAwesome name="pause" size={10} color="#d97706" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(rt.id, rt.description)}
                          className="rounded-lg bg-surface-100 px-2 py-1.5"
                        >
                          <FontAwesome name="trash-o" size={12} color="#94a3b8" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}

            {/* Inactive */}
            {inactiveRecurring.length > 0 && (
              <>
                <Text className="mb-2 mt-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Paused ({inactiveRecurring.length})
                </Text>
                {inactiveRecurring.map((rt) => {
                  const typeInfo = getTypeInfo(rt.type);
                  return (
                    <Card key={rt.id} variant="elevated" className="mb-3 opacity-60">
                      <View className="flex-row items-center">
                        <View
                          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: typeInfo.color + '20' }}
                        >
                          <FontAwesome
                            name={typeInfo.icon as any}
                            size={16}
                            color={typeInfo.color}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-surface-900">
                            {rt.description}
                          </Text>
                          <Text className="text-xs text-surface-400">
                            {getFrequencyLabel(rt.frequency)} - Paused
                          </Text>
                        </View>
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => toggleActive(rt.id)}
                            className="rounded-lg bg-accent-50 px-3 py-1.5"
                          >
                            <Text className="text-xs font-medium text-accent-700">Resume</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDelete(rt.id, rt.description)}
                            className="rounded-lg bg-surface-100 px-2 py-1.5"
                          >
                            <FontAwesome name="trash-o" size={12} color="#94a3b8" />
                          </Pressable>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Recurring Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white"
        >
          <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text className="text-base text-surface-500">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-surface-900">
              Add Recurring
            </Text>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            {/* Type Selector */}
            <Text className="mb-2 text-sm font-medium text-surface-700">Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {TYPE_OPTIONS.map((type) => (
                  <Pressable
                    key={type.value}
                    onPress={() => setSelectedType(type.value)}
                    className={`flex-row items-center rounded-full px-4 py-2 ${
                      selectedType === type.value ? 'bg-primary-600' : 'bg-surface-100'
                    }`}
                  >
                    <FontAwesome
                      name={type.icon as any}
                      size={14}
                      color={selectedType === type.value ? '#ffffff' : type.color}
                    />
                    <Text
                      className={`ml-2 text-sm font-medium ${
                        selectedType === type.value ? 'text-white' : 'text-surface-700'
                      }`}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Frequency Selector */}
            <Text className="mb-2 text-sm font-medium text-surface-700">Frequency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {FREQUENCIES.map((freq) => (
                  <Pressable
                    key={freq.value}
                    onPress={() => setSelectedFrequency(freq.value)}
                    className={`rounded-full px-4 py-2 ${
                      selectedFrequency === freq.value ? 'bg-primary-600' : 'bg-surface-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedFrequency === freq.value ? 'text-white' : 'text-surface-600'
                      }`}
                    >
                      {freq.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description"
                  placeholder="e.g., Monthly Salary, Netflix, Meralco"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Amount (PHP)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.amount?.message}
                  leftIcon={<Text className="text-base text-surface-400">₱</Text>}
                />
              )}
            />

            <Controller
              control={control}
              name="start_date"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Start Date"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  error={errors.start_date?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="end_date"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="End Date (optional)"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            {(selectedFrequency === 'monthly' ||
              selectedFrequency === 'quarterly' ||
              selectedFrequency === 'semi_annual') && (
              <Controller
                control={control}
                name="day_of_month"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Day of Month (optional)"
                    placeholder="e.g., 15"
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            )}

            {/* Options */}
            <View className="mt-2 mb-2">
              <View className="flex-row items-center justify-between py-3">
                <View>
                  <Text className="text-sm font-medium text-surface-700">
                    Auto-create transactions
                  </Text>
                  <Text className="text-xs text-surface-400">
                    Automatically log when due
                  </Text>
                </View>
                <Switch
                  value={autoCreate}
                  onValueChange={setAutoCreate}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>

              {selectedType === 'expense' && (
                <View className="flex-row items-center justify-between py-3 border-t border-surface-100">
                  <View>
                    <Text className="text-sm font-medium text-surface-700">
                      Create payment reminder
                    </Text>
                    <Text className="text-xs text-surface-400">
                      Get notified before due date
                    </Text>
                  </View>
                  <Switch
                    value={createReminder}
                    onValueChange={setCreateReminder}
                    trackColor={{ true: '#2563eb' }}
                  />
                </View>
              )}
            </View>

            <View className="mb-8 mt-4">
              <Button
                title="Create Recurring"
                onPress={handleSubmit(onSubmit)}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
