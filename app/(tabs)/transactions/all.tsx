import { Card, DatePicker, Select } from '@/src/components/ui';
import { formatCurrency, formatDate } from '@/src/lib/formatters';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import type { TransactionType } from '@/src/types/database';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type SortField = 'date' | 'amount' | 'description';
type SortOrder = 'asc' | 'desc';

const TYPE_OPTIONS: { label: string; value: TransactionType | ''; icon: string }[] = [
  { label: 'All Types', value: '', icon: 'th-large' },
  { label: 'Income', value: 'income', icon: 'arrow-down' },
  { label: 'Expense', value: 'expense', icon: 'arrow-up' },
  { label: 'Investment', value: 'investment', icon: 'line-chart' },
  { label: 'Transfer', value: 'transfer', icon: 'exchange' },
  { label: 'Savings', value: 'savings_deposit', icon: 'bank' },
];

const MONTH_OPTIONS: { label: string; value: string; icon: string }[] = [
  { label: 'All Months', value: '', icon: 'calendar' },
  { label: 'January', value: '01', icon: 'calendar' },
  { label: 'February', value: '02', icon: 'calendar' },
  { label: 'March', value: '03', icon: 'calendar' },
  { label: 'April', value: '04', icon: 'calendar' },
  { label: 'May', value: '05', icon: 'calendar' },
  { label: 'June', value: '06', icon: 'calendar' },
  { label: 'July', value: '07', icon: 'calendar' },
  { label: 'August', value: '08', icon: 'calendar' },
  { label: 'September', value: '09', icon: 'calendar' },
  { label: 'October', value: '10', icon: 'calendar' },
  { label: 'November', value: '11', icon: 'calendar' },
  { label: 'December', value: '12', icon: 'calendar' },
];

const SORT_BY_OPTIONS: { label: string; value: SortField; icon: string }[] = [
  { label: 'Date', value: 'date', icon: 'calendar' },
  { label: 'Amount', value: 'amount', icon: 'money' },
  { label: 'Description', value: 'description', icon: 'font' },
];

const SORT_ORDER_OPTIONS: { label: string; value: SortOrder; icon: string }[] = [
  { label: 'Newest First', value: 'desc', icon: 'sort-amount-desc' },
  { label: 'Oldest First', value: 'asc', icon: 'sort-amount-asc' },
];

export default function AllTransactionsScreen() {
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { transactions, deleteTransaction } = useTransactionSync();
  const { user } = useAuth();

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by type
    if (filterType) {
      result = result.filter((t) => t.type === filterType);
    }

    // Filter by month
    if (filterMonth) {
      result = result.filter((t) => t.date.split('-')[1] === filterMonth);
    }

    // Filter by date range
    if (filterFrom) {
      result = result.filter((t) => t.date >= filterFrom);
    }
    if (filterTo) {
      result = result.filter((t) => t.date <= filterTo);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'description':
          comparison = (a.description ?? '').localeCompare(b.description ?? '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, filterType, filterMonth, filterFrom, filterTo, sortBy, sortOrder]);

  // Group by month
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: typeof filteredTransactions; total: number; label: string } } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

      if (!groups[monthKey]) {
        groups[monthKey] = { transactions: [], total: 0, label: monthLabel };
      }
      groups[monthKey].transactions.push(transaction);
      if (transaction.type === 'income') {
        groups[monthKey].total += transaction.amount;
      } else if (transaction.type === 'expense') {
        groups[monthKey].total -= transaction.amount;
      }
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => ({ key, ...value }));
  }, [filteredTransactions]);

  const hasActiveFilters = filterType || filterMonth || filterFrom || filterTo;

  const resetFilters = () => {
    setFilterType('');
    setFilterMonth('');
    setFilterFrom('');
    setFilterTo('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const getTypeInfo = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return { icon: 'arrow-down', color: '#16a34a', bgColor: '#dcfce7' };
      case 'expense':
        return { icon: 'arrow-up', color: '#dc2626', bgColor: '#fee2e2' };
      case 'investment':
        return { icon: 'line-chart', color: '#7c3aed', bgColor: '#ede9fe' };
      case 'transfer':
        return { icon: 'exchange', color: '#2563eb', bgColor: '#dbeafe' };
      case 'savings_deposit':
        return { icon: 'bank', color: '#0891b2', bgColor: '#cffafe' };
      default:
        return { icon: 'circle', color: '#64748b', bgColor: '#f1f5f9' };
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setShowDeleteConfirm(null);
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
              All Transactions
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              {filteredTransactions.length} transactions
            </Text>
          </View>
          <Pressable
            onPress={() => setShowFilterModal(true)}
            className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700"
          >
            <FontAwesome name="filter" size={16} color="#64748b" />
            {hasActiveFilters && (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#dc2626',
                }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {groupedTransactions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="list-alt" size={48} color="#cbd5e1" />
            <Text className="mt-4 text-base text-surface-400">
              {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
            </Text>
            {hasActiveFilters && (
              <Pressable
                onPress={resetFilters}
                className="mt-4 px-4 py-2 bg-primary-100 rounded-lg"
              >
                <Text className="text-primary-600 font-medium">Clear Filters</Text>
              </Pressable>
            )}
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.key} className="mb-4">
              <View className="flex-row items-center justify-between mb-2 px-3 py-2 rounded-lg bg-surface-800">
                <Text className="text-base font-bold text-white">{group.label}</Text>
                <Text
                  className="text-sm font-bold"
                  style={{ color: group.total >= 0 ? '#4ade80' : '#f87171' }}
                >
                  {group.total >= 0 ? '+' : ''}{formatCurrency(Math.abs(group.total))}
                </Text>
              </View>

              {group.transactions.map((transaction) => {
                const typeInfo = getTypeInfo(transaction.type);
                return (
                  <Card key={transaction.id} variant="elevated" className="mb-2">
                    <View className="flex-row items-center">
                      <View
                        className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: typeInfo.bgColor }}
                      >
                        <FontAwesome name={typeInfo.icon as any} size={16} color={typeInfo.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {transaction.description}
                        </Text>
                        <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                      </View>
                      <Text
                        className="text-sm font-bold mr-3"
                        style={{ color: typeInfo.color }}
                      >
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Pressable
                        onPress={() => setShowDeleteConfirm(transaction.id)}
                        className="p-2 rounded-lg bg-danger-50"
                      >
                        <FontAwesome name="trash" size={14} color="#dc2626" />
                      </Pressable>
                    </View>
                  </Card>
                );
              })}
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Filter Modal */}
      {showFilterModal && (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#ffffff' }}
        >
          <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
            <Pressable onPress={() => setShowFilterModal(false)}>
              <Text className="text-base text-surface-500">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-surface-900">Filter & Sort</Text>
            <Pressable onPress={resetFilters}>
              <Text className="text-base text-primary-600">Reset</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            <View style={{ zIndex: 100 }}>
              <Select
                label="Transaction Type"
                placeholder="All Types"
                options={TYPE_OPTIONS}
                value={filterType}
                onValueChange={(value) => setFilterType(value as TransactionType | '')}
                iconColor="#2563eb"
              />
            </View>

            <View style={{ zIndex: 90 }}>
              <Select
                label="Month"
                placeholder="All Months"
                options={MONTH_OPTIONS}
                value={filterMonth}
                onValueChange={(value) => setFilterMonth(value)}
                iconColor="#2563eb"
              />
            </View>

            <View style={{ zIndex: 80 }}>
              <DatePicker
                label="From Date"
                value={filterFrom}
                onChange={setFilterFrom}
                placeholder="Start date"
              />
            </View>

            <View style={{ zIndex: 70 }}>
              <DatePicker
                label="To Date"
                value={filterTo}
                onChange={setFilterTo}
                placeholder="End date"
              />
            </View>

            <View style={{ zIndex: 60 }}>
              <Select
                label="Sort By"
                placeholder="Select field"
                options={SORT_BY_OPTIONS}
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortField)}
                iconColor="#7c3aed"
              />
            </View>

            <View style={{ zIndex: 50 }}>
              <Select
                label="Order"
                placeholder="Select order"
                options={SORT_ORDER_OPTIONS}
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as SortOrder)}
                iconColor="#7c3aed"
              />
            </View>

            <Pressable
              onPress={() => setShowFilterModal(false)}
              className="mt-4 mb-8 bg-primary-600 py-4 rounded-xl"
            >
              <Text className="text-center font-semibold text-white">Apply Filters</Text>
            </Pressable>
          </ScrollView>
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
              <Text className="text-lg font-bold text-surface-900">Delete Transaction?</Text>
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
