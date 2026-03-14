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

// Investment Categories
type InvestmentCategory = 'stocks' | 'mutual_funds' | 'uitf' | 'bonds' | 'crypto' | 'real_estate' | 'business' | 'other';
type InvestmentAction = 'buy' | 'sell' | 'dividend' | 'interest';

const INVESTMENT_CATEGORIES: { label: string; value: InvestmentCategory; icon: string }[] = [
  { label: 'Stocks', value: 'stocks', icon: 'line-chart' },
  { label: 'Mutual Funds', value: 'mutual_funds', icon: 'pie-chart' },
  { label: 'UITF', value: 'uitf', icon: 'bank' },
  { label: 'Bonds', value: 'bonds', icon: 'file-text' },
  { label: 'Cryptocurrency', value: 'crypto', icon: 'bitcoin' },
  { label: 'Real Estate', value: 'real_estate', icon: 'home' },
  { label: 'Business', value: 'business', icon: 'building' },
  { label: 'Other', value: 'other', icon: 'ellipsis-h' },
];

const INVESTMENT_ACTIONS: { label: string; value: InvestmentAction; icon: string }[] = [
  { label: 'Buy', value: 'buy', icon: 'plus-circle' },
  { label: 'Sell', value: 'sell', icon: 'minus-circle' },
  { label: 'Dividend', value: 'dividend', icon: 'money' },
  { label: 'Interest', value: 'interest', icon: 'percent' },
];

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

export default function InvestmentsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [investmentCategory, setInvestmentCategory] = useState<InvestmentCategory | null>(null);
  const [investmentAction, setInvestmentAction] = useState<InvestmentAction | null>(null);
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

  // Filter only investment transactions
  const investmentTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'investment')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Calculate total investments
  const totalInvestments = useMemo(() => {
    return investmentTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [investmentTransactions]);

  // Group by month
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: typeof investmentTransactions; total: number; label: string } } = {};

    investmentTransactions.forEach((transaction) => {
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
  }, [investmentTransactions]);

  const getInvestmentInfo = (): string | null => {
    const parts: string[] = [];

    if (investmentCategory) {
      const categoryLabel = INVESTMENT_CATEGORIES.find(c => c.value === investmentCategory)?.label;
      if (categoryLabel) parts.push(`Type: ${categoryLabel}`);
    }

    if (investmentAction) {
      const actionLabel = INVESTMENT_ACTIONS.find(a => a.value === investmentAction)?.label;
      if (actionLabel) parts.push(`Action: ${actionLabel}`);
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  };

  const resetState = () => {
    setInvestmentCategory(null);
    setInvestmentAction(null);
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
    const investmentInfo = getInvestmentInfo();
    let notesContent: string[] = [];
    if (investmentInfo) notesContent.push(investmentInfo);
    if (data.notes) notesContent.push(data.notes);

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        type: 'investment',
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
        type: 'investment',
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
          <Pressable onPress={() => router.back()} className="mr-3 p-2 -ml-2">
            <FontAwesome name="chevron-left" size={16} color="#64748b" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Investments
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              Track your portfolio
            </Text>
          </View>
          <View className="bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full">
            <Text className="text-sm font-bold text-violet-700 dark:text-violet-300">
              {formatCurrency(totalInvestments)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {groupedTransactions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="line-chart" size={48} color="#7c3aed" />
            <Text className="mt-4 text-base text-surface-400">No investments recorded yet</Text>
            <Text className="mt-1 text-sm text-surface-400">Tap + to add your first investment</Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.key} className="mb-4">
              <View className="flex-row items-center justify-between mb-2 px-3 py-2 rounded-lg bg-violet-600">
                <Text className="text-base font-bold text-white">{group.label}</Text>
                <Text className="text-sm font-bold text-white">
                  {formatCurrency(group.total)}
                </Text>
              </View>

              {group.transactions.map((transaction) => (
                <Card key={transaction.id} variant="elevated" className="mb-2">
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                      <FontAwesome name="line-chart" size={16} color="#7c3aed" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {transaction.description}
                      </Text>
                      <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                    </View>
                    <Text className="text-sm font-bold text-violet-600 mr-3">
                      {formatCurrency(transaction.amount)}
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
          backgroundColor: '#7c3aed',
        }}
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add Investment Modal */}
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
                {editingTransaction ? 'Edit Investment' : 'Add Investment'}
              </Text>
              <View className="w-12" />
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
              {/* Category Selection */}
              <View style={{ zIndex: 100 }}>
                <Select
                  label="Investment Type"
                  placeholder="Select investment type"
                  options={INVESTMENT_CATEGORIES}
                  value={investmentCategory}
                  onValueChange={(value) => setInvestmentCategory(value as InvestmentCategory)}
                  iconColor="#7c3aed"
                />
              </View>

              <View style={{ zIndex: 90 }}>
                <Select
                  label="Action"
                  placeholder="Select action"
                  options={INVESTMENT_ACTIONS}
                  value={investmentAction}
                  onValueChange={(value) => setInvestmentAction(value as InvestmentAction)}
                  iconColor="#7c3aed"
                />
              </View>

              {/* Form Fields */}
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Description"
                    placeholder="e.g., FMETF Shares, BTC Purchase"
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
                  title={editingTransaction ? 'Update Investment' : 'Save Investment'}
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
              <Text className="text-lg font-bold text-surface-900">Delete Investment?</Text>
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
