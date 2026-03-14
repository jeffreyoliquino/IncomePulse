import { Button, Card, Input, Select } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useDashboardData } from '@/src/features/dashboard/hooks/useDashboardData';
import { useReminders } from '@/src/features/reminders/hooks/useReminders';
import { formatCurrency, formatPercent } from '@/src/lib/formatters';
import { supabase } from '@/src/lib/supabase';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useTransactionStore } from '@/src/stores/transactionStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

const EXPENSE_CATEGORIES = [
  { label: 'Food & Groceries', value: 'Food & Groceries', icon: 'shopping-basket' },
  { label: 'Rent', value: 'Rent', icon: 'home' },
  { label: 'Utilities', value: 'Utilities', icon: 'bolt' },
  { label: 'Healthcare', value: 'Healthcare', icon: 'medkit' },
  { label: 'Insurance', value: 'Insurance', icon: 'shield' },
  { label: 'Transportation', value: 'Transportation', icon: 'bus' },
  { label: 'Gas', value: 'Gas', icon: 'car' },
  { label: 'Toll Gate', value: 'Toll Gate', icon: 'road' },
  { label: 'Travel', value: 'Travel', icon: 'plane' },
  { label: 'Vehicle Maintenance', value: 'Vehicle Maintenance', icon: 'wrench' },
  { label: 'House Maintenance', value: 'House Maintenance', icon: 'home' },
  { label: 'Online Shopping', value: 'Online Shopping', icon: 'shopping-cart' },
  { label: 'Vacation', value: 'Vacation', icon: 'sun-o' },
  { label: 'Dining', value: 'Dining', icon: 'cutlery' },
  { label: 'Shopping', value: 'Shopping', icon: 'shopping-bag' },
  { label: 'Entertainment', value: 'Entertainment', icon: 'film' },
  { label: 'CellPhone Load', value: 'CellPhone Load', icon: 'mobile' },
  { label: 'Pet Supplies', value: 'Pet Supplies', icon: 'paw' },
  { label: 'Gardening Needs', value: 'Gardening Needs', icon: 'leaf' },
  { label: 'Credit Cards', value: 'Credit Cards', icon: 'credit-card' },
  { label: 'Loans', value: 'Loans', icon: 'bank' },
  { label: 'Taxes', value: 'Taxes', icon: 'file-text-o' },
  { label: 'Tuition Fee', value: 'Tuition Fee', icon: 'graduation-cap' },
  { label: 'School Service', value: 'School Service', icon: 'bus' },
  { label: 'School Supplies', value: 'School Supplies', icon: 'pencil' },
  { label: 'Allowance', value: 'Allowance', icon: 'money' },
  { label: 'Remittance', value: 'Remittance', icon: 'exchange' },
  { label: 'Personal Care and Leisure', value: 'Personal Care and Leisure', icon: 'smile-o' },
  { label: 'License, Registration and Certification', value: 'License, Registration and Certification', icon: 'id-card-o' },
  { label: 'Others', value: 'Others', icon: 'question-circle' },
];

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
});

type BudgetForm = z.infer<typeof budgetSchema>;

function BudgetProgressBar({ spent, total }: { spent: number; total: number }) {
  const percentage = total > 0 ? Math.min(spent / total, 1) : 0;
  const isOver = spent > total;

  return (
    <View>
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-xs text-surface-500 dark:text-surface-400">
          {formatCurrency(spent)} of {formatCurrency(total)}
        </Text>
        <Text
          className={`text-xs font-semibold ${
            isOver ? 'text-danger-600' : percentage > 0.8 ? 'text-warning-600' : 'text-accent-600'
          }`}
        >
          {formatPercent(percentage)}
        </Text>
      </View>
      <View className="h-2.5 rounded-full bg-surface-100 dark:bg-surface-700">
        <View
          className={`h-2.5 rounded-full ${
            isOver
              ? 'bg-danger-500'
              : percentage > 0.8
              ? 'bg-warning-500'
              : 'bg-accent-500'
          }`}
          style={{ width: `${Math.min(percentage * 100, 100)}%` }}
        />
      </View>
    </View>
  );
}

export default function BudgetsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deletingBudget, setDeletingBudget] = useState<{id: string, name: string} | null>(null);
  const { budgets, addBudget, removeBudget, updateBudget, setBudgets } = useBudgetStore();
  const { categories, setCategories } = useTransactionStore();
  const { user } = useAuth();
  const { budgetAlerts } = useDashboardData();
  const { upcomingReminders } = useReminders();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category: '', amount: '' },
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('type', 'expense')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        if (data) {
          console.log('✅ Categories loaded on budgets page:', data.length);
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [setCategories]);

  // Fetch budgets from Supabase on mount
  useEffect(() => {
    if (!user) return;

    const fetchBudgets = async () => {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;
        if (data && setBudgets) {
          setBudgets(data);
        }
      } catch (error) {
        console.error('Error fetching budgets:', error);
      }
    };

    fetchBudgets();
  }, [user, setBudgets]);

  // Real-time subscription for budget changes
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time subscription for budgets');

    const channel = supabase
      .channel('budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Budget change detected:', payload.eventType);

          if (payload.eventType === 'INSERT') {
            console.log('➕ Adding budget:', payload.new);
            addBudget(payload.new as any);
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ Updating budget:', payload.new);
            updateBudget((payload.new as any).id, payload.new as any);
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Removing budget:', payload.old);
            removeBudget((payload.old as any).id);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Unsubscribing from budgets changes');
      channel.unsubscribe();
    };
  }, [user, addBudget, updateBudget, removeBudget]);

  // Map UI category names to database category names (1:1 mapping)
  const getCategoryIdFromName = (uiCategoryName: string): string | null => {
    // All UI category names now match database category names exactly
    const categoryNameMap: Record<string, string> = {
      'Food & Groceries': 'Food & Groceries',
      'Rent': 'Rent',
      'Utilities': 'Utilities',
      'Healthcare': 'Healthcare',
      'Insurance': 'Insurance',
      'Transportation': 'Transportation',
      'Gas': 'Gas',
      'Toll Gate': 'Toll Gate',
      'Travel': 'Travel',
      'Vehicle Maintenance': 'Vehicle Maintenance',
      'House Maintenance': 'House Maintenance',
      'Online Shopping': 'Online Shopping',
      'Vacation': 'Vacation',
      'Dining': 'Dining',
      'Shopping': 'Shopping',
      'Entertainment': 'Entertainment',
      'CellPhone Load': 'CellPhone Load',
      'Pet Supplies': 'Pet Supplies',
      'Gardening Needs': 'Gardening Needs',
      'Credit Cards': 'Credit Cards',
      'Loans': 'Loans',
      'Taxes': 'Taxes',
      'Others': 'Others',
    };

    const dbCategoryName = categoryNameMap[uiCategoryName];
    if (!dbCategoryName) {
      console.log('❌ No mapping found for:', uiCategoryName);
      return null;
    }

    const category = categories.find(
      (cat) => cat.name === dbCategoryName && cat.type === 'expense'
    );

    if (!category) {
      console.log('❌ Database category not found:', dbCategoryName);
      console.log('📋 Available categories:', categories.map(c => c.name));
    } else {
      console.log('✅ Found category:', dbCategoryName, '-> ID:', category.id);
    }

    return category?.id || null;
  };

  const onSubmit = async (data: BudgetForm) => {
    console.log('onSubmit called with data:', data);

    if (!user) {
      Alert.alert('Error', 'You must be logged in to manage budgets');
      return;
    }

    const cleanAmount = data.amount.replace(/,/g, '');
    const parsedAmount = parseFloat(cleanAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Get the category ID using the mapping function
    const categoryId = getCategoryIdFromName(data.category);
    console.log('🔍 Category mapping:', data.category, '->', categoryId);

    if (editingBudget) {
      // Only include actual database fields, not computed fields from budgetAlerts
      const updatedBudget = {
        id: editingBudget.id,
        user_id: editingBudget.user_id,
        category_id: categoryId,
        name: data.category,
        amount: parsedAmount,
        period: editingBudget.period || 'monthly',
        alert_threshold: editingBudget.alert_threshold || 0.8,
        is_active: editingBudget.is_active ?? true,
        created_at: editingBudget.created_at,
        updated_at: new Date().toISOString(),
      };

      console.log('Updating budget:', updatedBudget);

      const { error } = await supabase
        .from('budgets')
        .update(updatedBudget)
        .eq('id', editingBudget.id);

      if (error) {
        console.error('Update error:', error);
        Alert.alert('Error', `Failed to update budget: ${error.message}`);
        return;
      }

      console.log('✅ Budget updated successfully');
      updateBudget(editingBudget.id, updatedBudget);
    } else {
      const newBudget = {
        user_id: user.id,
        category_id: categoryId,
        name: data.category,
        amount: parsedAmount,
        period: 'monthly' as const,
        alert_threshold: 0.8,
        is_active: true,
      };

      console.log('Inserting new budget:', newBudget);

      const { data: insertedData, error } = await supabase
        .from('budgets')
        .insert(newBudget)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        Alert.alert('Error', `Failed to create budget: ${error.message}`);
        return;
      }

      console.log('Budget created successfully:', insertedData);
      addBudget(insertedData);
    }
    reset();
    setEditingBudget(null);
    setShowAddModal(false);
  };

  const handleDeleteBudget = (id: string, name: string) => {
    console.log('🗑️ Delete button clicked for:', name, id);
    setDeletingBudget({ id, name });
  };

  const confirmDeleteBudget = async () => {
    if (!deletingBudget) return;

    console.log('🗑️ Deleting budget:', deletingBudget.id);
    const { error } = await supabase.from('budgets').delete().eq('id', deletingBudget.id);

    if (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', `Failed to delete budget: ${error.message}`);
      return;
    }

    console.log('✅ Budget deleted successfully');
    removeBudget(deletingBudget.id);
    setDeletingBudget(null);
  };

  const handleEditBudget = (budget: any) => {
    console.log('✏️ Edit button clicked for:', budget.name);
    console.log('📝 Budget data:', budget);
    setEditingBudget(budget);
    reset({
      category: budget.name,
      amount: budget.amount.toString(),
    });
    setShowAddModal(true);
    console.log('✅ Modal should open for editing');
  };

  // Compute total spent across all budgets
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetAlerts.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = totalBudgeted > 0 ? Math.min(totalSpent / totalBudgeted, 1) : 0;

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Overall Budget Summary */}
      <View className="bg-white dark:bg-surface-800 px-4 py-4">
        <View className="bg-primary-600 rounded-2xl p-5 shadow-md">
          <View className="flex-row items-baseline justify-between">
            <View className="flex-1">
              <Text className="text-sm text-primary-100 font-medium">Monthly Budget</Text>
              <Text className="mt-1 text-3xl font-bold text-white">
                {totalBudgeted > 0 ? formatCurrency(totalBudgeted) : '₱0.00'}
              </Text>
            </View>
          </View>
          <View className="mt-4">
            <View className="h-2.5 rounded-full bg-primary-400">
              <View
                className="h-2.5 rounded-full bg-white"
                style={{ width: `${overallPercentage * 100}%` }}
              />
            </View>
          </View>
          <Text className="mt-3 text-sm font-semibold text-white">
            {formatCurrency(totalSpent)} spent this month
          </Text>
        </View>
      </View>

      {/* Reminders Quick Access */}
      <Pressable
        onPress={() => router.push('/(modals)/reminders')}
        className="mx-4 mt-3 mb-1"
      >
        <Card variant="elevated">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-warning-50">
                <FontAwesome name="bell" size={16} color="#d97706" />
              </View>
              <View>
                <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  Bill Reminders
                </Text>
                <Text className="text-xs text-surface-500 dark:text-surface-400">
                  {upcomingReminders.length} upcoming
                </Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
          </View>
        </Card>
      </Pressable>

      {/* Budget List */}
      <ScrollView className="flex-1 px-4 pt-3">
        <Text className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Budgets
        </Text>

        {budgetAlerts.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="pie-chart" size={48} color="#cbd5e1" />
            <Text className="mt-4 text-base text-surface-400">
              No budgets set
            </Text>
            <Text className="mt-1 text-sm text-surface-400">
              Create budgets to track your spending
            </Text>
          </View>
        ) : (
          budgetAlerts.map((budget) => (
            <Card key={budget.id} variant="elevated" className="mb-3">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  {budget.isOverBudget && (
                    <FontAwesome
                      name="exclamation-triangle"
                      size={14}
                      color="#dc2626"
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                    {budget.name}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="rounded-full bg-surface-100 dark:bg-surface-700 px-3 py-1">
                    <Text className="text-xs text-surface-600 dark:text-surface-200">{budget.period}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleEditBudget(budget)}
                    className="p-1"
                  >
                    <FontAwesome name="pencil" size={14} color="#2563eb" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteBudget(budget.id, budget.name)}
                    className="p-1"
                  >
                    <FontAwesome name="trash-o" size={14} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>
              <BudgetProgressBar spent={budget.spent} total={budget.amount} />
              {budget.isOverBudget && (
                <Text className="mt-2 text-xs text-danger-600">
                  Over budget by {formatCurrency(budget.spent - budget.amount)}
                </Text>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          setEditingBudget(null);
          reset({ category: '', amount: '' });
          setShowAddModal(true);
        }}
        className="absolute bottom-24 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary-600 shadow-lg active:bg-primary-700"
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add Budget Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white dark:bg-surface-900"
        >
          <View className="flex-row items-center justify-between border-b border-surface-200 dark:border-surface-700 px-4 py-4">
            <Pressable onPress={() => {
              setShowAddModal(false);
              setEditingBudget(null);
              reset({ category: '', amount: '' });
            }}>
              <Text className="text-base text-surface-500 dark:text-surface-400">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">{editingBudget ? 'Edit Budget' : 'Add Budget'}</Text>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View style={{ zIndex: 100 }}>
                  <Select
                    label="Category"
                    placeholder="Select category"
                    options={EXPENSE_CATEGORIES}
                    value={value}
                    onValueChange={onChange}
                    error={errors.category?.message}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Monthly Limit (PHP)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={(text) => {
                    // Only allow digits and a single decimal point
                    const filtered = text.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = filtered.split('.');
                    const formatted = parts.length > 2
                      ? parts[0] + '.' + parts.slice(1).join('')
                      : filtered;
                    onChange(formatted);
                  }}
                  onBlur={onBlur}
                  error={errors.amount?.message}
                  leftIcon={<Text className="text-base text-surface-400">₱</Text>}
                />
              )}
            />

            <View className="mb-8 mt-4">
              <Button
                title={editingBudget ? 'Update Budget' : 'Create Budget'}
                onPress={handleSubmit(onSubmit)}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingBudget && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-danger-100 items-center justify-center mb-3">
                <FontAwesome name="trash" size={28} color="#dc2626" />
              </View>
              <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">
                Delete Budget?
              </Text>
              <Text className="text-sm text-surface-500 dark:text-surface-400 text-center mt-2">
                Are you sure you want to delete "{deletingBudget.name}"? This action cannot be undone.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setDeletingBudget(null)}
                className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-700"
              >
                <Text className="text-center font-medium text-surface-700 dark:text-surface-200">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteBudget}
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
