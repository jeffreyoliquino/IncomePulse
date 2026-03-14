import { Button, Card, DatePicker, Input, Select } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { formatCurrency, formatDate } from '@/src/lib/formatters';
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

// Fund Categories
type FundCategory = 'emergency_fund' | 'savings' | 'travel_fund' | 'sinking_fund' | 'education_fund' | 'retirement_fund' | 'gadget_fund' | 'car_fund' | 'house_fund' | 'others';

const FUND_CATEGORIES: { label: string; value: FundCategory; icon: string }[] = [
  { label: 'Emergency Fund', value: 'emergency_fund', icon: 'exclamation-triangle' },
  { label: 'Education Fund', value: 'education_fund', icon: 'graduation-cap' },
  { label: 'Retirement Fund', value: 'retirement_fund', icon: 'hourglass-end' },
  { label: 'Life/Health Insurance Fund', value: 'life_insurance_fund', icon: 'heartbeat' },
  { label: 'Dental Care Fund', value: 'dental_care_fund', icon: 'medkit' },  
  { label: 'House Maintenance', value: 'house_fund', icon: 'home' },
  { label: 'Vehicle Maintenance', value: 'car_fund', icon: 'car' },
  { label: 'Travel Fund', value: 'travel_fund', icon: 'plane' },
  { label: 'Sinking Fund', value: 'sinking_fund', icon: 'anchor' },
  { label: 'Gadget Fund', value: 'gadget_fund', icon: 'mobile' },
  { label: 'Others', value: 'others', icon: 'ellipsis-h' },
];

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

export default function FundsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [fundCategory, setFundCategory] = useState<FundCategory | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

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

  // Filter only fund transactions
  const fundTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'savings_deposit' || t.type === 'fund_deposit')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Calculate total funds
  const totalFunds = useMemo(() => {
    return fundTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [fundTransactions]);

  // Calculate accumulated funds by category
  const accumulatedFunds = useMemo(() => {
    const categoryTotals: { [key: string]: { total: number; icon: string; label: string } } = {};

    fundTransactions.forEach((transaction) => {
      const notes = transaction.notes || '';
      const categoryMatch = notes.match(/Category:\s*([^|\n]+)/);
      if (categoryMatch) {
        const categoryLabel = categoryMatch[1].trim();
        const category = FUND_CATEGORIES.find(c => c.label === categoryLabel);

        if (category) {
          if (!categoryTotals[category.value]) {
            categoryTotals[category.value] = {
              total: 0,
              icon: category.icon,
              label: category.label,
            };
          }
          categoryTotals[category.value].total += transaction.amount;
        }
      }
    });

    return Object.entries(categoryTotals)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [fundTransactions]);

  // Generate last 6 months for month selector
  const monthsList = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel });
    }

    return months;
  }, []);

  // Get selected month data
  const selectedMonth = monthsList[selectedMonthIndex];

  // Filter transactions for selected month
  const monthlyFundTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    return fundTransactions.filter((t) => t.date.startsWith(selectedMonth.key));
  }, [fundTransactions, selectedMonth]);

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    return monthlyFundTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyFundTransactions]);

  const getFundCategoryInfo = (): string | null => {
    if (!fundCategory) return null;
    const categoryLabel = FUND_CATEGORIES.find(c => c.value === fundCategory)?.label;
    return categoryLabel ? `Category: ${categoryLabel}` : null;
  };

  const resetState = () => {
    setFundCategory(null);
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    reset({
      description: transaction.description ?? '',
      amount: transaction.amount.toString(),
      date: transaction.date,
      notes: transaction.notes ?? '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setShowDeleteConfirm(null);
  };

  const handleFormSubmit = async (data: TransactionForm) => {
    const categoryInfo = getFundCategoryInfo();
    let notesContent: string[] = [];
    if (categoryInfo) notesContent.push(categoryInfo);
    if (data.notes) notesContent.push(data.notes);

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        type: 'savings_deposit',
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
        type: 'savings_deposit',
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
              Funds
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              Track your savings & deposits
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Total Saved Card */}
        <Card variant="elevated" className="mb-4">
          <Text className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase mb-2">
            Total Saved Card
          </Text>
          <Text className="text-xs text-surface-600 dark:text-surface-400 mb-1">
            Total Savings:
          </Text>
          <Text className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(totalFunds)}
          </Text>
        </Card>

        {/* Accumulated Funds */}
        <Card variant="elevated" className="mb-4">
          <Text className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase mb-3">
            Accumulated Funds
          </Text>
          {accumulatedFunds.length === 0 ? (
            <Text className="text-sm text-surface-400 text-center py-4">
              No funds accumulated yet
            </Text>
          ) : (
            accumulatedFunds.map((fund) => (
              <View key={fund.key} className="flex-row items-center justify-between py-2 border-b border-surface-100 dark:border-surface-700 last:border-b-0">
                <View className="flex-row items-center flex-1">
                  <FontAwesome name={fund.icon as any} size={16} color="#0891b2" className="mr-2" />
                  <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 ml-2">
                    {fund.label}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-sm font-bold text-surface-900 dark:text-surface-100 mr-2">
                    {formatCurrency(fund.total)}
                  </Text>
                  <FontAwesome name="arrow-right" size={12} color="#94a3b8" />
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Month Selector */}
        <Card variant="elevated" className="mb-4">
          <Text className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase mb-3">
            Month Selector
          </Text>

          {selectedMonth && (
            <>
              <Text className="text-base font-bold text-surface-900 dark:text-surface-100 mb-1">
                {selectedMonth.label}
              </Text>
              <Text className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                Total For Month: {formatCurrency(monthlyTotal)}
              </Text>

              {/* Month Navigation */}
              <View className="flex-row items-center justify-center gap-4">
                <Pressable
                  onPress={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
                  disabled={selectedMonthIndex === 0}
                  className={`px-3 py-2 rounded-lg ${selectedMonthIndex === 0 ? 'opacity-30' : ''}`}
                >
                  <Text className="text-sm font-medium text-primary-600">
                    &lt; {monthsList[selectedMonthIndex - 1]?.label.split(' ')[0] || 'Previous'}
                  </Text>
                </Pressable>

                <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  {selectedMonth.label.split(' ')[0]}
                </Text>

                <Pressable
                  onPress={() => setSelectedMonthIndex(Math.min(monthsList.length - 1, selectedMonthIndex + 1))}
                  disabled={selectedMonthIndex === monthsList.length - 1}
                  className={`px-3 py-2 rounded-lg ${selectedMonthIndex === monthsList.length - 1 ? 'opacity-30' : ''}`}
                >
                  <Text className="text-sm font-medium text-primary-600">
                    {monthsList[selectedMonthIndex + 1]?.label.split(' ')[0] || 'Next'} &gt;
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Card>

        {/* Monthly Funds List */}
        <Card variant="elevated" className="mb-4">
          <Text className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase mb-3">
            Monthly Funds List
          </Text>

          {monthlyFundTransactions.length === 0 ? (
            <View className="items-center justify-center py-8">
              <FontAwesome name="bank" size={32} color="#cbd5e1" />
              <Text className="mt-3 text-sm text-surface-400">
                No funds for {selectedMonth?.label}
              </Text>
            </View>
          ) : (
            monthlyFundTransactions.map((transaction) => (
              <View key={transaction.id} className="flex-row items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700 last:border-b-0">
                <View className="flex-row items-center flex-1">
                  <FontAwesome name="bank" size={14} color="#0891b2" className="mr-2" />
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                      {transaction.description}
                    </Text>
                    <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3">
                  <Text className="text-sm font-bold text-cyan-600">
                    {formatCurrency(transaction.amount)}
                  </Text>
                  <Pressable
                    onPress={() => handleEdit(transaction)}
                    className="p-2 rounded-lg bg-primary-50"
                  >
                    <FontAwesome name="pencil" size={12} color="#2563eb" />
                  </Pressable>
                  <Pressable
                    onPress={() => setShowDeleteConfirm(transaction.id)}
                    className="p-2 rounded-lg bg-danger-50"
                  >
                    <FontAwesome name="trash" size={12} color="#dc2626" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setShowAddModal(true)}
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
          backgroundColor: '#0891b2',
        }}
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add Fund Modal */}
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
                {editingTransaction ? 'Edit Fund' : 'Add Fund'}
              </Text>
              <View className="w-12" />
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
              {/* Category Selection */}
              <View style={{ zIndex: 100 }}>
                <Select
                  label="Fund Category"
                  placeholder="Select fund category"
                  options={FUND_CATEGORIES}
                  value={fundCategory}
                  onValueChange={(value) => setFundCategory(value as FundCategory)}
                  iconColor="#0891b2"
                />
              </View>

              {/* Form Fields */}
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Description"
                    placeholder="e.g., Monthly Savings Deposit"
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
                  title={editingTransaction ? 'Update Fund' : 'Save Fund'}
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
              <Text className="text-lg font-bold text-surface-900">Delete Fund?</Text>
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