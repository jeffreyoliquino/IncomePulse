import { ExpenseBreakdownChart } from '@/src/components/charts/ExpenseBreakdownChart';
import { IncomeExpenseChart } from '@/src/components/charts/IncomeExpenseChart';
import { SavingsRateChart } from '@/src/components/charts/SavingsRateChart';
import { Button, Card, DatePicker } from '@/src/components/ui';
import { BannerAd } from '@/src/components/ui/BannerAd';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useDashboardData } from '@/src/features/dashboard/hooks/useDashboardData';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { formatCurrency } from '@/src/lib/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';

function SummaryCard({
  title,
  amount,
  icon,
  color,
  bgColor,
  textColor,
}: {
  title: string;
  amount: number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  bgColor: string;
  textColor?: string;
}) {
  return (
    <Card variant="elevated" className="flex-1 min-w-[45%]">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-surface-500 dark:text-surface-400">{title}</Text>
          <Text
            className={`mt-1 text-lg font-bold ${!textColor ? 'text-surface-900 dark:text-surface-100' : ''}`}
            style={textColor ? { color: textColor } : undefined}
          >
            {formatCurrency(amount)}
          </Text>
        </View>
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: bgColor }}
        >
          <FontAwesome name={icon} size={18} color={color} />
        </View>
      </View>
    </Card>
  );
}

interface ExchangeRates {
  usd: number;
  aud: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Groceries': '#16a34a',
  'Rent': '#dc2626',
  'Utilities': '#2563eb',
  'Healthcare': '#ef4444',
  'Insurance': '#7c3aed',
  'Emergency Fund': '#f59e0b',
  'Transportation': '#0ea5e9',
  'Gas': '#f97316',
  'Toll Gate': '#64748b',
  'Travel': '#06b6d4',
  'Vehicle Maintenance': '#475569',
  'House Maintenance': '#8b5cf6',
  'Online Shopping': '#ec4899',
  'Vacation': '#14b8a6',
  'Dining': '#f59e0b',
  'Shopping': '#db2777',
  'Entertainment': '#8b5cf6',
  'CellPhone Load': '#3b82f6',
  'Pet Supplies': '#a855f7',
  'Gardening Needs': '#22c55e',
  'Uncategorized': '#94a3b8',
  'Credit Cards': '#be123c',
  'Loans': '#4338ca',
  'Taxes': '#0f766e',
};

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const { isConnected } = useNetworkStatus();
  const { transactions, refreshFromCloud, updateTransaction } = useTransactionSync();
  const {
    monthlyTrends,
    savingsRateTrend,
    budgetAlerts,
  } = useDashboardData();

  const { width } = useWindowDimensions();
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [includePassiveIncome, setIncludePassiveIncome] = useState(false);
  const [obligationToPay, setObligationToPay] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Current month info
  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-PH', { month: 'long' });
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const getAmount = useCallback((t: any) => {
    if (t.amount === undefined || t.amount === null) return 0;
    const cleanAmount = String(t.amount).replace(/[^0-9.-]+/g, '');
    const val = parseFloat(cleanAmount);
    return isFinite(val) ? val : 0;
  }, []);

  // Calculate current month's summary from transactions
  const monthlySummary = useMemo(() => {
    const monthTxns = transactions.filter(
      (t) => t.date.startsWith(currentMonthKey)
    );

    const income = monthTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + getAmount(t), 0);

    // Active income only (exclude passive) - matches Savings page formula
    const activeIncome = monthTxns
      .filter((t) => t.type === 'income' && !t.notes?.toLowerCase().includes('passive'))
      .reduce((sum, t) => sum + getAmount(t), 0);

    const expenses = monthTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + getAmount(t), 0);

    const investments = monthTxns
      .filter((t) => t.type === 'investment')
      .reduce((sum, t) => sum + getAmount(t), 0);

    const funds = monthTxns
      .filter((t) => t.type === 'savings_deposit' || t.type === 'fund_deposit' || t.type === 'investment')
      .reduce((sum, t) => sum + getAmount(t), 0);

    // Savings = Active Income - Expenses - Funds (same formula as Savings page)
    const savings = activeIncome - expenses - funds;

    const passiveIncome = income - activeIncome;

    return { income, activeIncome, passiveIncome, expenses, savings, investments };
  }, [transactions, currentMonthKey, getAmount]);

  const displayIncome = includePassiveIncome
    ? monthlySummary.income
    : monthlySummary.activeIncome;

  // Calculate category breakdown locally
  const categoryBreakdown = useMemo(() => {
    const monthTxns = transactions.filter(
      (t) => t.date.startsWith(currentMonthKey) && t.type === 'expense'
    );

    const categoryMap: Record<string, number> = {};

    monthTxns.forEach((t) => {
      const notes = t.notes || '';
      // Extract category from notes (e.g., "Category: Food & Groceries")
      let category = 'Uncategorized';
      const match = notes.match(/Category:\s*([^|\n]+)/);
      if (match) {
        category = match[1].trim();
        if (category.includes('Vendor:')) {
          category = category.split('Vendor:')[0].trim();
        }
        if (!category) category = 'Uncategorized';
      }
      
      const amount = getAmount(t);
      if (amount > 0) {
        categoryMap[category] = (categoryMap[category] || 0) + amount;
      }
    });

    return Object.entries(categoryMap)
      .map(([name, val]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        value: val,
        amount: val,
        population: val,
        color: CATEGORY_COLORS[name] || '#94a3b8',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, currentMonthKey, getAmount]);

  // Helper to parse date string (YYYY-MM-DD) to local Date object
  const parseDateLocal = useCallback((dateStr: string) => {
    if (!dateStr) return new Date();
    const cleanDateStr = dateStr.split('T')[0];
    const [year, month, day] = cleanDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, []);

  // Get upcoming obligations
  const upcomingObligations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const notes = t.notes || '';
        if (notes.includes('Status: Paid')) return false;
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
        const tDate = parseDateLocal(t.date);
        return tDate >= today;
      })
      .sort((a, b) => parseDateLocal(a.date).getTime() - parseDateLocal(b.date).getTime())
      .slice(0, 5);
  }, [transactions, parseDateLocal]);

  const isDueSoon = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tDate = parseDateLocal(dateStr);
    const diffTime = tDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  };

  const getVendor = (notes: string | null) => {
    if (!notes) return null;
    const vendorLine = notes.split('\n').find((line) => line.startsWith('Vendor: '));
    return vendorLine ? vendorLine.replace('Vendor: ', '').trim() : null;
  };

  const handleMarkAsPaid = async () => {
    if (obligationToPay && paymentDate) {
      const currentNotes = obligationToPay.notes || '';
      const newNotes = currentNotes.includes('Status: Paid')
        ? currentNotes
        : `${currentNotes}\nStatus: Paid`.trim();

      await updateTransaction(obligationToPay.id, {
        ...obligationToPay,
        date: paymentDate,
        notes: newNotes,
      });
      setObligationToPay(null);
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  };

  const fetchRates = useCallback(async () => {
    try {
      // Race fetch against a 5-second timeout to prevent hanging
      const res = await Promise.race([
        fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/php.json'),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      if (res.ok) {
        const data = await res.json();
        setRates({ usd: 1 / data.php.usd, aud: 1 / data.php.aud });
      }
    } catch {
      // Use fallback cached rates
      setRates({ usd: 56.5, aud: 36.5 });
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchRates(), refreshFromCloud()]);
    setRefreshing(false);
  }, [fetchRates, refreshFromCloud]);

  const displayName =
    user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'User';

  const netBalance =
    monthlySummary.income - monthlySummary.expenses;

  const hasTransactions = monthlyTrends.some((m) => m.income > 0 || m.expenses > 0);
  const overBudgetAlerts = budgetAlerts.filter((b) => b.isOverThreshold);

  return (
    <ScrollView
      className="flex-1 bg-surface-50 dark:bg-surface-900"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Offline Banner */}
      {!isConnected && (
        <View className="bg-warning-500 px-4 py-2">
          <Text className="text-center text-xs font-medium text-white">
            You're offline. Changes will sync when connected.
          </Text>
        </View>
      )}

      <View className="px-4 pt-4 pb-8">
        {/* Greeting */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-surface-500 dark:text-surface-400">Welcome back,</Text>
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {displayName}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push('/settings')}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700"
            >
              <FontAwesome name="cog" size={18} color="#64748b" />
            </Pressable>
            <Pressable
              onPress={signOut}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700"
            >
              <FontAwesome name="sign-out" size={18} color="#64748b" />
            </Pressable>
          </View>
        </View>

        {/* Budget Alert Banner */}
        {overBudgetAlerts.length > 0 && (
          <Pressable onPress={() => router.push('/(tabs)/budgets')}>
            <Card variant="elevated" className="mb-4 bg-danger-50 border border-danger-200">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-danger-100">
                  <FontAwesome name="exclamation-triangle" size={18} color="#dc2626" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-danger-700">
                    Budget Alert
                  </Text>
                  <Text className="text-xs text-danger-600">
                    {overBudgetAlerts.length} budget{overBudgetAlerts.length > 1 ? 's' : ''} exceeded threshold:{' '}
                    {overBudgetAlerts.map((b) => b.name).join(', ')}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color="#dc2626" />
              </View>
            </Card>
          </Pressable>
        )}

        {/* Low Balance Alert */}
        {netBalance <= 10000 && (
          <Card variant="elevated" className="mb-4 bg-warning-50 border border-warning-200">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-warning-100">
                <FontAwesome name="exclamation-circle" size={18} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-warning-700">
                  Low Balance Warning
                </Text>
                <Text className="text-xs text-warning-600">
                  Net balance is {formatCurrency(netBalance)}. Monitor your spending.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Net Balance */}
        <Card variant="elevated" className="mb-4">
          <Text className="text-sm text-surface-500 dark:text-surface-400">Net Balance - {currentMonthName}</Text>
          <Text className={`mt-1 text-3xl font-bold ${netBalance <= 10000 ? 'text-danger-600 dark:text-danger-400' : 'text-primary-600 dark:text-primary-400'}`}>
            {formatCurrency(netBalance)}
          </Text>
          <Text className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            {currentMonthName}'s overview
          </Text>
        </Card>

        {/* Summary Cards */}
        <View className="mb-6 flex-row flex-wrap gap-3">
          <Card variant="elevated" className="flex-1 min-w-[45%]">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs text-surface-500 dark:text-surface-400">
                  Total Income - {currentMonthName}
                </Text>
                <Text className="mt-1 text-lg font-bold text-surface-900 dark:text-surface-100">
                  {formatCurrency(displayIncome)}
                </Text>
                <Pressable
                  onPress={() => setIncludePassiveIncome(!includePassiveIncome)}
                  className="flex-row items-center mt-2"
                >
                  <View
                    className={`h-4 w-4 rounded border items-center justify-center mr-1.5 ${
                      includePassiveIncome
                        ? 'bg-green-500 border-green-500'
                        : 'border-surface-300 dark:border-surface-600'
                    }`}
                  >
                    {includePassiveIncome && (
                      <FontAwesome name="check" size={9} color="white" />
                    )}
                  </View>
                  <Text className="text-xs text-surface-500 dark:text-surface-400">
                    Include Passive Income
                  </Text>
                </Pressable>
              </View>
              <View
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <FontAwesome name="arrow-down" size={18} color="#16a34a" />
              </View>
            </View>
          </Card>
          <SummaryCard
            title={`Expenses - ${currentMonthName}`}
            amount={monthlySummary.expenses}
            icon="arrow-up"
            color="#dc2626"
            bgColor="#fee2e2"
            textColor="#dc2626"
          />
          <SummaryCard
            title={`Savings - ${currentMonthName}`}
            amount={monthlySummary.savings}
            icon="bank"
            color="#2563eb"
            bgColor="#dbeafe"
          />
          <SummaryCard
            title={`Investments - ${currentMonthName}`}
            amount={monthlySummary.investments}
            icon="line-chart"
            color="#7c3aed"
            bgColor="#ede9fe"
          />
        </View>

        {/* Quick Actions */}
        <Text className="mb-3 text-base font-semibold text-surface-900 dark:text-surface-100">
          Quick Actions
        </Text>
        <View className="flex-row gap-3 mb-6">
          <Pressable
            onPress={() => router.push('/(tabs)/transactions?addNew=true')}
            className="flex-1 items-center rounded-xl bg-white dark:bg-surface-800 p-4 active:bg-surface-50 dark:active:bg-surface-700"
          >
            <FontAwesome name="plus-circle" size={24} color="#2563eb" />
            <Text className="mt-2 text-xs font-medium text-surface-700 dark:text-surface-300">
              Add Transaction
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/budgets')}
            className="flex-1 items-center rounded-xl bg-white dark:bg-surface-800 p-4 active:bg-surface-50 dark:active:bg-surface-700"
          >
            <FontAwesome name="pie-chart" size={24} color="#16a34a" />
            <Text className="mt-2 text-xs font-medium text-surface-700 dark:text-surface-300">
              Budgets
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/tools')}
            className="flex-1 items-center rounded-xl bg-white dark:bg-surface-800 p-4 active:bg-surface-50 dark:active:bg-surface-700"
          >
            <FontAwesome name="calculator" size={24} color="#f59e0b" />
            <Text className="mt-2 text-xs font-medium text-surface-700 dark:text-surface-300">
              Calculator
            </Text>
          </Pressable>
        </View>

        {/* Income vs Expense Trend */}
        <Text className="mb-3 text-base font-semibold text-surface-900 dark:text-surface-100">
          Income vs Expenses (6 months)
        </Text>
        <Card variant="elevated" className="mb-6">
          {hasTransactions ? (
            <IncomeExpenseChart data={monthlyTrends} />
          ) : (
            <View className="items-center justify-center py-10">
              <FontAwesome name="bar-chart" size={40} color="#cbd5e1" />
              <Text className="mt-3 text-sm text-surface-400">
                Add transactions to see trends
              </Text>
            </View>
          )}
        </Card>

        {/* Expense Breakdown */}
        <Text className="mb-3 text-base font-semibold text-surface-900 dark:text-surface-100">
          Expense Breakdown
        </Text>
        <Card variant="elevated" className="mb-6">
          {categoryBreakdown.length > 0 ? (
            <View className="items-center">
              <ExpenseBreakdownChart data={categoryBreakdown} width={Math.min(width - 64, 360)} height={220} />
            </View>
          ) : (
            <View className="items-center justify-center py-10">
              <FontAwesome name="pie-chart" size={40} color="#cbd5e1" />
              <Text className="mt-3 text-sm text-surface-400">
                No expenses this month
              </Text>
            </View>
          )}
        </Card>

        {/* Savings Rate */}
        <Text className="mb-3 text-base font-semibold text-surface-900 dark:text-surface-100">
          Savings Rate
        </Text>
        <Card variant="elevated" className="mb-6">
          <SavingsRateChart data={savingsRateTrend} />
        </Card>

        {/* Upcoming Reminders */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
            Upcoming Bills
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/transactions/financial-obligations')}>
            <Text className="text-sm font-medium text-primary-600">View All</Text>
          </Pressable>
        </View>
        {upcomingObligations.length > 0 ? (
          upcomingObligations.map((transaction) => {
            const dueSoon = isDueSoon(transaction.date);
            const dateObj = parseDateLocal(transaction.date);
            const vendor = getVendor(transaction.notes);
            return (
              <Card key={transaction.id} variant="elevated" className="mb-2">
                <View className="flex-row items-center">
                  <View
                    className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${dueSoon ? 'bg-danger-100' : 'bg-orange-100'}`}
                  >
                    <FontAwesome name="file-text-o" size={16} color={dueSoon ? '#dc2626' : '#ea580c'} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                      {transaction.description}
                    </Text>
                    {vendor && (
                      <Text className="text-xs text-surface-500 dark:text-surface-400">
                        {vendor}
                      </Text>
                    )}
                    <Text className={`text-xs ${dueSoon ? 'text-danger-600 font-bold' : 'text-surface-500 dark:text-surface-400'}`}>
                      {dateObj.toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {dueSoon && ' • Due Soon'}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className={`text-sm font-bold ${dueSoon ? 'text-danger-600' : 'text-surface-900 dark:text-surface-100'}`}>
                      -{formatCurrency(transaction.amount)}
                    </Text>
                    <Pressable onPress={() => {
                      setObligationToPay(transaction);
                      setPaymentDate(new Date().toISOString().split('T')[0]);
                    }}>
                      <Text className="text-xs font-medium text-primary-600 mt-1">Mark Paid</Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <Card variant="outlined" className="items-center justify-center py-8 mb-6">
            <FontAwesome name="calendar-check-o" size={32} color="#cbd5e1" />
            <Text className="mt-3 text-sm text-surface-400">
              No upcoming bills
            </Text>
          </Card>
        )}

        {/* Exchange Rates */}
        <Text className="mb-3 mt-4 text-base font-semibold text-surface-900 dark:text-surface-100">
          Exchange Rates
        </Text>
        <Card variant="elevated">
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Text className="text-xl">🇺🇸</Text>
              <Text className="ml-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                USD / PHP
              </Text>
            </View>
            <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {rates ? `₱${rates.usd.toFixed(2)}` : 'Loading...'}
            </Text>
          </View>
          <View className="my-2 h-px bg-surface-100 dark:bg-surface-700" />
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Text className="text-xl">🇦🇺</Text>
              <Text className="ml-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                AUD / PHP
              </Text>
            </View>
            <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {rates ? `₱${rates.aud.toFixed(2)}` : 'Loading...'}
            </Text>
          </View>
        </Card>
      </View>

      {/* Mark as Paid Modal */}
      <Modal
        visible={!!obligationToPay}
        transparent
        animationType="fade"
        onRequestClose={() => setObligationToPay(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="bg-white dark:bg-surface-800 w-full max-w-sm rounded-2xl p-6">
            <Text className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">
              Mark as Paid
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              Confirm payment for {obligationToPay?.description}
            </Text>

            <View className="mb-6">
              <DatePicker
                label="Date Paid"
                value={paymentDate}
                onChange={setPaymentDate}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setObligationToPay(null)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Confirm"
                  onPress={handleMarkAsPaid}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Banner ad — only shown to free users */}
      <BannerAd />
    </ScrollView>
  );
}
