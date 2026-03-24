import { Button, Card, DatePicker, Input, Select } from '@/src/components/ui';
import { formatCurrency, formatDate } from '@/src/lib/formatters';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { z } from 'zod';

// Income Categories Structure
type IncomeCategory = 'active' | 'passive';
type ActiveIncomeSource = 'monthly_salary' | 'side_hustle' | 'bonus' | '13th_month' | 'business_income' | 'commission'
  | 'part_time_job' | 'online_tutorial' | 'buy_and_sell' | 'allowance' | 'scholarship_allowance';
type PassiveIncomeSource = 'rent' | 'investment' | 'youtube' | 'dividends' | 'interest' | 'royalties'
  | 'digital_products' | 'affiliate_marketing';
type PropertyType = 'apartment' | 'house' | 'lot' | 'others';

const INCOME_CATEGORIES: { label: string; value: IncomeCategory; icon: string }[] = [
  { label: 'Active Income', value: 'active', icon: 'briefcase' },
  { label: 'Passive Income', value: 'passive', icon: 'money' },
];

const ACTIVE_INCOME_SOURCES: { label: string; value: ActiveIncomeSource; icon: string }[] = [
  { label: 'Monthly Salary', value: 'monthly_salary', icon: 'calendar' },
  { label: 'Side Hustle', value: 'side_hustle', icon: 'rocket' },
  { label: 'Bonus', value: 'bonus', icon: 'gift' },
  { label: '13th Month', value: '13th_month', icon: 'calendar-check-o' },
  { label: 'Business Income', value: 'business_income', icon: 'building' },
  { label: 'Commission', value: 'commission', icon: 'percent' },
  { label: 'Part-Time Job', value: 'part_time_job', icon: 'clock-o' },
  { label: 'Online Tutorial', value: 'online_tutorial', icon: 'laptop' },
  { label: 'Buy and Sell', value: 'buy_and_sell', icon: 'exchange' },
  { label: 'Allowance', value: 'allowance', icon: 'money' },
  { label: 'Scholarship Allowance', value: 'scholarship_allowance', icon: 'graduation-cap' },
];

const PASSIVE_INCOME_SOURCES: { label: string; value: PassiveIncomeSource; icon: string }[] = [
  { label: 'Rent', value: 'rent', icon: 'home' },
  { label: 'Investment', value: 'investment', icon: 'line-chart' },
  { label: 'Youtube / Content Creation', value: 'youtube', icon: 'youtube-play' },
  { label: 'Dividends', value: 'dividends', icon: 'pie-chart' },
  { label: 'Interest', value: 'interest', icon: 'bank' },
  { label: 'Royalties', value: 'royalties', icon: 'star' },
  { label: 'Digital Products', value: 'digital_products', icon: 'file-o' },
  { label: 'Affiliate Marketing (Shopee, Lazada, Tiktok)', value: 'affiliate_marketing', icon: 'share-alt' },
];

const PROPERTY_TYPES: { label: string; value: PropertyType; icon: string }[] = [
  { label: 'Apartment', value: 'apartment', icon: 'building-o' },
  { label: 'House', value: 'house', icon: 'home' },
  { label: 'Lot', value: 'lot', icon: 'map' },
  { label: 'Others', value: 'others', icon: 'ellipsis-h' },
];

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

export default function IncomeScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory | null>(null);
  const [activeSource, setActiveSource] = useState<ActiveIncomeSource | null>(null);
  const [passiveSource, setPassiveSource] = useState<PassiveIncomeSource | null>(null);
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionSync();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Filter only income transactions
  const incomeTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Separate active and passive income
  const activeIncomeTransactions = useMemo(() => {
    return incomeTransactions.filter((t) => !t.notes?.toLowerCase().includes('passive'));
  }, [incomeTransactions]);

  const passiveIncomeTransactions = useMemo(() => {
    return incomeTransactions.filter((t) => t.notes?.toLowerCase().includes('passive'));
  }, [incomeTransactions]);

  // Calculate totals
  const totalIncome = useMemo(() => {
    return incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [incomeTransactions]);

  const totalActiveIncome = useMemo(() => {
    return activeIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [activeIncomeTransactions]);

  const totalPassiveIncome = useMemo(() => {
    return passiveIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [passiveIncomeTransactions]);

  // Group by month helper
  const groupByMonth = (txns: typeof incomeTransactions) => {
    const groups: { [key: string]: { transactions: typeof incomeTransactions; total: number; label: string } } = {};

    txns.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

      if (!groups[monthKey]) {
        groups[monthKey] = { transactions: [], total: 0, label: monthLabel };
      }
      groups[monthKey].transactions.push(transaction);
      groups[monthKey].total += transaction.amount;
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => ({ key, ...value }));
  };

  const groupedActiveTransactions = useMemo(() => groupByMonth(activeIncomeTransactions), [activeIncomeTransactions]);
  const groupedPassiveTransactions = useMemo(() => groupByMonth(passiveIncomeTransactions), [passiveIncomeTransactions]);

  const getIncomeCategoryInfo = (): string | null => {
    if (!incomeCategory) return null;

    const parts: string[] = [];
    const categoryLabel = INCOME_CATEGORIES.find(c => c.value === incomeCategory)?.label;
    if (categoryLabel) parts.push(categoryLabel);

    if (incomeCategory === 'active' && activeSource) {
      const sourceLabel = ACTIVE_INCOME_SOURCES.find(s => s.value === activeSource)?.label;
      if (sourceLabel) parts.push(sourceLabel);
    } else if (incomeCategory === 'passive' && passiveSource) {
      const sourceLabel = PASSIVE_INCOME_SOURCES.find(s => s.value === passiveSource)?.label;
      if (sourceLabel) parts.push(sourceLabel);

      if (passiveSource === 'rent' && propertyType) {
        const propLabel = PROPERTY_TYPES.find(p => p.value === propertyType)?.label;
        if (propLabel) parts.push(propLabel);
      }
    }

    return parts.length > 0 ? parts.join(' > ') : null;
  };

  const resetState = () => {
    setIncomeCategory(null);
    setActiveSource(null);
    setPassiveSource(null);
    setPropertyType(null);
  };

  const parseNotesForEdit = (notes: string | null) => {
    if (!notes) return { customNotes: '' };

    const lines = notes.split('\n');
    let incomeCategory: IncomeCategory | null = null;
    let activeSource: ActiveIncomeSource | null = null;
    let passiveSource: PassiveIncomeSource | null = null;
    let propertyType: PropertyType | null = null;
    let customNotes: string[] = [];

    for (const line of lines) {
      // Check if this line is a category info line (e.g. "Active Income > Monthly Salary")
      const categoryMatch = INCOME_CATEGORIES.find(c => line.startsWith(c.label));
      if (categoryMatch) {
        incomeCategory = categoryMatch.value;
        const parts = line.split(' > ');

        if (parts.length >= 2) {
          const sourceStr = parts[1].trim();
          if (incomeCategory === 'active') {
            const match = ACTIVE_INCOME_SOURCES.find(s => s.label === sourceStr);
            if (match) activeSource = match.value;
          } else if (incomeCategory === 'passive') {
            const match = PASSIVE_INCOME_SOURCES.find(s => s.label === sourceStr);
            if (match) passiveSource = match.value;

            if (parts.length >= 3) {
              const propStr = parts[2].trim();
              const propMatch = PROPERTY_TYPES.find(p => p.label === propStr);
              if (propMatch) propertyType = propMatch.value;
            }
          }
        }
      } else {
        customNotes.push(line);
      }
    }

    return {
      customNotes: customNotes.join('\n').trim(),
      incomeCategory,
      activeSource,
      passiveSource,
      propertyType,
    };
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);

    const parsed = parseNotesForEdit(transaction.notes);

    setIncomeCategory(parsed.incomeCategory || null);
    setActiveSource(parsed.activeSource || null);
    setPassiveSource(parsed.passiveSource || null);
    setPropertyType(parsed.propertyType || null);

    reset({
      description: transaction.description ?? '',
      amount: transaction.amount.toString(),
      date: transaction.date,
      notes: parsed.customNotes,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setShowDeleteConfirm(null);
  };

  const handleFormSubmit = async (data: TransactionForm) => {
    const categoryInfo = getIncomeCategoryInfo();
    let notesContent: string[] = [];
    if (categoryInfo) notesContent.push(categoryInfo);
    if (data.notes) notesContent.push(data.notes);

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        type: 'income',
        amount: parseFloat(data.amount),
        description: data.description,
        notes: notesContent.length > 0 ? notesContent.join('\n') : null,
        date: data.date,
      });
    } else {
      await addTransaction({
        user_id: user?.id ?? '',
        account_id: '',
        category_id: null,
        type: 'income',
        amount: parseFloat(data.amount),
        currency: 'PHP',
        description: data.description,
        notes: notesContent.length > 0 ? notesContent.join('\n') : null,
        date: data.date,
        is_recurring: false,
        recurring_id: null,
        receipt_url: null,
        source: 'manual' as const,
        transfer_to_account_id: null,
      });
    }

    reset();
    resetState();
    setEditingTransaction(null);
    setShowAddModal(false);
  };

  const handleOpenAddModal = () => {
    reset({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    resetState();
    setEditingTransaction(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    resetState();
    setEditingTransaction(null);
    setShowAddModal(false);
    reset();
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="bg-white dark:bg-surface-800 px-4 py-4 border-b border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.replace('/(tabs)/transactions')} className="mr-3 p-2 -ml-2">
            <FontAwesome name="chevron-left" size={16} color="#64748b" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Income
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              Track your earnings
            </Text>
          </View>
          <View className="bg-accent-100 dark:bg-accent-900/30 px-3 py-1 rounded-full">
            <Text className="text-sm font-bold text-accent-700 dark:text-accent-300">
              {formatCurrency(totalIncome)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {incomeTransactions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="arrow-down" size={48} color="#16a34a" />
            <Text className="mt-4 text-base text-surface-400">No income recorded yet</Text>
            <Text className="mt-1 text-sm text-surface-400">Tap + to add your first income</Text>
          </View>
        ) : (
          <>
            {/* Active Income Section */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-3 px-3 py-2.5 rounded-xl bg-amber-500">
                <View className="flex-row items-center">
                  <FontAwesome name="briefcase" size={14} color="white" />
                  <Text className="text-base font-bold text-white ml-2">Active Income</Text>
                </View>
                <Text className="text-sm font-bold text-white">
                  {formatCurrency(totalActiveIncome)}
                </Text>
              </View>

              {groupedActiveTransactions.length === 0 ? (
                <View className="items-center py-6 mb-4">
                  <Text className="text-sm text-surface-400">No active income recorded</Text>
                </View>
              ) : (
                groupedActiveTransactions.map((group) => (
                  <View key={group.key} className="mb-4">
                    <View className="flex-row items-center justify-between mb-2 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Text className="text-sm font-semibold text-amber-700 dark:text-amber-300">{group.label}</Text>
                      <Text className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        +{formatCurrency(group.total)}
                      </Text>
                    </View>

                    {group.transactions.map((transaction) => (
                      <Card key={transaction.id} variant="elevated" className="mb-2">
                        <View className="flex-row items-center">
                          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                            <FontAwesome name="briefcase" size={16} color="#d97706" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                              {transaction.description}
                            </Text>
                            <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                          </View>
                          <Text className="text-sm font-bold text-accent-600 mr-3">
                            +{formatCurrency(transaction.amount)}
                          </Text>
                          <View className="flex-row gap-2">
                            <Pressable
                              onPress={() => handleEdit(transaction)}
                              className="p-2 rounded-lg bg-primary-50"
                            >
                              <FontAwesome name="pencil" size={14} color="#2563eb" />
                            </Pressable>
                            <Pressable
                              onPress={() => setShowDeleteConfirm(transaction.id)}
                              className="p-2 rounded-lg bg-danger-50"
                            >
                              <FontAwesome name="trash" size={14} color="#dc2626" />
                            </Pressable>
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                ))
              )}
            </View>

            {/* Passive Income Section */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-3 px-3 py-2.5 rounded-xl bg-green-600">
                <View className="flex-row items-center">
                  <FontAwesome name="money" size={14} color="white" />
                  <Text className="text-base font-bold text-white ml-2">Passive Income</Text>
                </View>
                <Text className="text-sm font-bold text-white">
                  {formatCurrency(totalPassiveIncome)}
                </Text>
              </View>

              {groupedPassiveTransactions.length === 0 ? (
                <View className="items-center py-6 mb-4">
                  <Text className="text-sm text-surface-400">No passive income recorded</Text>
                </View>
              ) : (
                groupedPassiveTransactions.map((group) => (
                  <View key={group.key} className="mb-4">
                    <View className="flex-row items-center justify-between mb-2 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Text className="text-sm font-semibold text-green-700 dark:text-green-300">{group.label}</Text>
                      <Text className="text-sm font-semibold text-green-700 dark:text-green-300">
                        +{formatCurrency(group.total)}
                      </Text>
                    </View>

                    {group.transactions.map((transaction) => (
                      <Card key={transaction.id} variant="elevated" className="mb-2">
                        <View className="flex-row items-center">
                          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                            <FontAwesome name="money" size={16} color="#16a34a" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                              {transaction.description}
                            </Text>
                            <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                          </View>
                          <Text className="text-sm font-bold text-accent-600 mr-3">
                            +{formatCurrency(transaction.amount)}
                          </Text>
                          <View className="flex-row gap-2">
                            <Pressable
                              onPress={() => handleEdit(transaction)}
                              className="p-2 rounded-lg bg-primary-50"
                            >
                              <FontAwesome name="pencil" size={14} color="#2563eb" />
                            </Pressable>
                            <Pressable
                              onPress={() => setShowDeleteConfirm(transaction.id)}
                              className="p-2 rounded-lg bg-danger-50"
                            >
                              <FontAwesome name="trash" size={14} color="#dc2626" />
                            </Pressable>
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={handleOpenAddModal}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          zIndex: 50,
          height: 56,
          width: 56,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 28,
          backgroundColor: '#16a34a',
        }}
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add Income Modal */}
      {showAddModal && (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#ffffff' }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
              <Pressable onPress={handleCloseModal}>
                <Text className="text-base text-surface-500">Cancel</Text>
              </Pressable>
              <Text className="text-lg font-bold text-surface-900">
                {editingTransaction ? 'Edit Income' : 'Add Income'}
              </Text>
              <View className="w-12" />
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
              {/* Category Selection */}
              <View style={{ zIndex: 100 }}>
                <Select
                  label="Category"
                  placeholder="Select income category"
                  options={INCOME_CATEGORIES}
                  value={incomeCategory}
                  onValueChange={(value) => {
                    setIncomeCategory(value as IncomeCategory);
                    setActiveSource(null);
                    setPassiveSource(null);
                    setPropertyType(null);
                  }}
                  iconColor="#16a34a"
                />

                {incomeCategory === 'active' && (
                  <View style={{ zIndex: 90 }}>
                    <Select
                      label="Source"
                      placeholder="Select income source"
                      options={ACTIVE_INCOME_SOURCES}
                      value={activeSource}
                      onValueChange={(value) => setActiveSource(value as ActiveIncomeSource)}
                      iconColor="#16a34a"
                    />
                  </View>
                )}

                {incomeCategory === 'passive' && (
                  <View style={{ zIndex: 90 }}>
                    <Select
                      label="Source"
                      placeholder="Select income source"
                      options={PASSIVE_INCOME_SOURCES}
                      value={passiveSource}
                      onValueChange={(value) => {
                        setPassiveSource(value as PassiveIncomeSource);
                        if (value !== 'rent') setPropertyType(null);
                      }}
                      iconColor="#16a34a"
                    />

                    {passiveSource === 'rent' && (
                      <View style={{ zIndex: 80 }}>
                        <Select
                          label="Property Type"
                          placeholder="Select property type"
                          options={PROPERTY_TYPES}
                          value={propertyType}
                          onValueChange={(value) => setPropertyType(value as PropertyType)}
                          iconColor="#16a34a"
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Form Fields */}
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Description"
                    placeholder="e.g., Monthly Salary"
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
                name="date"
                render={({ field: { onChange, value } }) => (
                  <View style={{ zIndex: 70 }}>
                    <DatePicker
                      label="Date"
                      value={value}
                      onChange={onChange}
                      error={errors.date?.message}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Notes (optional)"
                    placeholder="Add any notes..."
                    multiline
                    numberOfLines={3}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <View className="mb-8 mt-4">
                <Button
                  title={editingTransaction ? 'Update Income' : 'Save Income'}
                  onPress={handleSubmit(handleFormSubmit)}
                  fullWidth
                  size="lg"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-danger-100 items-center justify-center mb-3">
                <FontAwesome name="trash" size={28} color="#dc2626" />
              </View>
              <Text className="text-lg font-bold text-surface-900">Delete Income?</Text>
              <Text className="text-sm text-surface-500 text-center mt-2">
                This action cannot be undone.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-surface-100"
              >
                <Text className="text-center font-medium text-surface-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-danger-500"
              >
                <Text className="text-center font-medium text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
