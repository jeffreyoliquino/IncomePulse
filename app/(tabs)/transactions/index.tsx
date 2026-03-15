import { Card } from '@/src/components/ui';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { parseLLFNotes } from '@/src/features/financial-obligations/components/LandLotFinancingModal';
import { parseHLNotes } from '@/src/features/financial-obligations/components/HousingLoanModal';
import { formatCurrency } from '@/src/lib/formatters';
import { useAppStore } from '@/src/stores/appStore';
import { useAccountStore } from '@/src/stores/accountStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const TRANSACTION_MENU = [
  {
    title: 'Income',
    subtitle: 'Salary, business, investments',
    icon: 'arrow-down',
    color: '#16a34a',
    bgColor: '#dcfce7',
    route: '/(tabs)/transactions/income',
    type: 'income',
  },
  {
    title: 'Expenses',
    subtitle: 'Bills, shopping, daily expenses',
    icon: 'arrow-up',
    color: '#dc2626',
    bgColor: '#fee2e2',
    route: '/(tabs)/transactions/expenses',
    type: 'expense',
  },
  {
    title: 'Investments',
    subtitle: 'Stocks, funds, crypto',
    icon: 'line-chart',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    route: '/(tabs)/transactions/investments',
    type: 'investment',
  },
  {
    title: 'Funds',
    subtitle: 'Savings, emergency fund, deposits',
    icon: 'bank',
    color: '#0891b2',
    bgColor: '#cffafe',
    route: '/(tabs)/transactions/funds',
    type: 'funds',
  },
  {
    title: 'Accounts',
    subtitle: 'Cash, e-wallets & bank balances',
    icon: 'credit-card',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    route: '/(tabs)/transactions/accounts',
    type: 'accounts',
  },
];

export default function TransactionsHubScreen() {
  const { transactions, syncLocalToCloud, refreshFromCloud, isSyncing, isLoading } = useTransactionSync();
  const { syncSavingsTargetToCloud, fetchSavingsTargetFromCloud } = useAppStore();
  const { accounts } = useAccountStore();

  // Current month info
  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-PH', { month: 'long' });
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Sync all data (transactions + settings)
  const handleSyncToCloud = useCallback(async () => {
    await Promise.all([
      syncLocalToCloud(),
      syncSavingsTargetToCloud(),
    ]);
  }, [syncLocalToCloud, syncSavingsTargetToCloud]);

  // Refresh all data from cloud
  const handleRefreshFromCloud = useCallback(async () => {
    await Promise.all([
      refreshFromCloud(),
      fetchSavingsTargetFromCloud(),
    ]);
  }, [refreshFromCloud, fetchSavingsTargetFromCloud]);

  // Calculate totals for each type
  const totals = useMemo(() => {
    const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey));

    const income = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const investment = currentMonthTransactions
      .filter((t) => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);
    const funds = currentMonthTransactions
      .filter((t) => t.type === 'savings_deposit' || t.type === 'fund_deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const accountsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);

    return { income, expense, investment, funds, accounts: accountsTotal };
  }, [transactions, currentMonthKey, accounts]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Helper to parse date string (YYYY-MM-DD) to local Date object
  const parseDateLocal = useCallback((dateStr: string) => {
    if (!dateStr) return new Date();
    const cleanDateStr = dateStr.split('T')[0]; // Handle ISO strings if present
    const [year, month, day] = cleanDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, []);

  // For LLF/HL transactions, use nextPaymentDate from JSON notes if available
  const getEffectiveDate = useCallback((t: { date: string; notes?: string | null }): string => {
    const notes = t.notes ?? '';
    const llf = parseLLFNotes(notes);
    if (llf?.nextPaymentDate) return llf.nextPaymentDate;
    const hl = parseHLNotes(notes);
    if (hl?.nextPaymentDate) return hl.nextPaymentDate;
    return t.date;
  }, []);

  // Get upcoming obligations
  const upcomingObligations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const notes = t.notes || '';
        const notesLower = notes.toLowerCase();
        return (
          notesLower.includes('category: loans') ||
          notesLower.includes('category: credit cards') ||
          notesLower.includes('category: insurance') ||
          notesLower.includes('category: taxes') ||
          notesLower.includes('category: rent') ||
          notesLower.includes('category: utilities')
        );
      })
      .filter((t) => {
        const tDate = parseDateLocal(getEffectiveDate(t));
        return tDate >= today;
      })
      .sort((a, b) => parseDateLocal(getEffectiveDate(a)).getTime() - parseDateLocal(getEffectiveDate(b)).getTime())
      .slice(0, 5);
  }, [transactions, parseDateLocal, getEffectiveDate]);

  const isDueSoon = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tDate = parseDateLocal(dateStr);
    const diffTime = tDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'income':
        return { icon: 'arrow-down', color: '#16a34a' };
      case 'expense':
        return { icon: 'arrow-up', color: '#dc2626' };
      case 'investment':
        return { icon: 'line-chart', color: '#7c3aed' };
      case 'savings_deposit':
      case 'fund_deposit':
        return { icon: 'bank', color: '#0891b2' };
      default:
        return { icon: 'exchange', color: '#64748b' };
    }
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View className="px-4 pt-4">
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 rounded-xl bg-accent-50 dark:bg-accent-900/30 p-3">
              <Text className="text-xs text-accent-700 dark:text-accent-300">Total Income - {currentMonthName}</Text>
              <Text className="text-base font-bold text-accent-800 dark:text-accent-200">
                {formatCurrency(totals.income)}
              </Text>
            </View>
            <View className="flex-1 rounded-xl bg-danger-50 dark:bg-danger-900/30 p-3">
              <Text className="text-xs text-danger-600 dark:text-danger-300">Total Expenses - {currentMonthName}</Text>
              <Text className="text-base font-bold text-danger-700 dark:text-danger-200">
                {formatCurrency(totals.expense)}
              </Text>
            </View>
          </View>
          <View className="rounded-xl bg-violet-50 dark:bg-violet-900/30 p-3 mb-4">
            <Text className="text-xs text-violet-700 dark:text-violet-300">Total Investments - {currentMonthName}</Text>
            <Text className="text-base font-bold text-violet-800 dark:text-violet-200">
              {formatCurrency(totals.investment)}
            </Text>
          </View>
        </View>

        {/* Transaction Type Menu */}
        <View className="px-4">
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
            Categories
          </Text>
          {TRANSACTION_MENU.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => router.push(item.route as any)}
              className="mb-3"
            >
              <Card variant="elevated">
                <View className="flex-row items-center">
                  <View
                    className="mr-4 h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: item.bgColor }}
                  >
                    <FontAwesome name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-surface-500 dark:text-surface-400">
                      {item.subtitle}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-base font-bold"
                      style={{ color: item.color }}
                    >
                      {formatCurrency(totals[item.type as keyof typeof totals] || 0)}
                    </Text>
                    <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* Sync Actions */}
        <View className="px-4 mt-2">
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
            Sync
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleSyncToCloud}
              disabled={isSyncing}
              className="flex-1"
            >
              <Card variant="elevated">
                <View className="flex-row items-center">
                  <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                    <FontAwesome
                      name={isSyncing ? 'spinner' : 'cloud-upload'}
                      size={16}
                      color="#16a34a"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                      {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
            <Pressable
              onPress={handleRefreshFromCloud}
              disabled={isLoading}
              className="flex-1"
            >
              <Card variant="elevated">
                <View className="flex-row items-center">
                  <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-cyan-50">
                    <FontAwesome
                      name={isLoading ? 'spinner' : 'cloud-download'}
                      size={16}
                      color="#0891b2"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                      {isLoading ? 'Loading...' : 'Refresh'}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          </View>
        </View>

        {/* Upcoming Bills */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-surface-700 dark:text-surface-300">
              Upcoming Bills
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions/financial-obligations')}>
              <Text className="text-sm text-primary-600">View All</Text>
            </Pressable>
          </View>
          {upcomingObligations.length === 0 ? (
            <Card variant="elevated">
              <View className="items-center py-6">
                <FontAwesome name="calendar-check-o" size={32} color="#cbd5e1" />
                <Text className="mt-2 text-sm text-surface-400">No upcoming bills</Text>
              </View>
            </Card>
          ) : (
            upcomingObligations.map((transaction) => {
              const effectiveDate = getEffectiveDate(transaction);
              const dueSoon = isDueSoon(effectiveDate);
              return (
                <Card key={transaction.id} variant="elevated" className="mb-2">
                  <View className="flex-row items-center">
                    <View
                      className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${dueSoon ? 'bg-danger-100' : 'bg-orange-100'}`}
                    >
                      <FontAwesome
                        name="file-text-o"
                        size={16}
                        color={dueSoon ? '#dc2626' : '#ea580c'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {transaction.description}
                      </Text>
                      <Text className={`text-xs ${dueSoon ? 'text-danger-600 font-bold' : 'text-surface-400'}`}>
                        {parseDateLocal(effectiveDate).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {dueSoon && ' • Due Soon'}
                      </Text>
                    </View>
                    <Text
                      className={`text-sm font-bold ${dueSoon ? 'text-danger-600' : 'text-orange-600'}`}
                    >
                      -{formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        {/* Recent Transactions */}
        <View className="px-4 mt-6 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-surface-700 dark:text-surface-300">
              Recent Transactions
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions/all')}>
              <Text className="text-sm text-primary-600">View All</Text>
            </Pressable>
          </View>
          {recentTransactions.length === 0 ? (
            <Card variant="elevated">
              <View className="items-center py-6">
                <FontAwesome name="inbox" size={32} color="#cbd5e1" />
                <Text className="mt-2 text-sm text-surface-400">No transactions yet</Text>
              </View>
            </Card>
          ) : (
            recentTransactions.map((transaction) => {
              const typeInfo = getTypeInfo(transaction.type);
              return (
                <Card key={transaction.id} variant="elevated" className="mb-2">
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
                      <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {transaction.description}
                      </Text>
                      <Text className="text-xs text-surface-400">
                        {new Date(transaction.date).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text
                      className="text-sm font-bold"
                      style={{ color: typeInfo.color }}
                    >
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
