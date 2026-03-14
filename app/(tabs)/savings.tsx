import { Card } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { formatCurrency } from '@/src/lib/formatters';
import { supabase } from '@/src/lib/supabase';
import { useAppStore } from '@/src/stores/appStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function SavingsScreen() {
  const { transactions } = useTransactionSync();
  const { user } = useAuth();
  const { savingsTarget, setSavingsTarget, fetchSavingsTargetFromCloud, syncSavingsTargetToCloud } = useAppStore();
  const [targetInput, setTargetInput] = useState(savingsTarget?.toString() ?? '200000');
  const [isSyncing, setIsSyncing] = useState(false);
  const [accumulatedSavingsInput, setAccumulatedSavingsInput] = useState('0');
  const [isEditingAccumulated, setIsEditingAccumulated] = useState(false);
  const [includePassiveIncome, setIncludePassiveIncome] = useState(false);

  // Fetch savings target from cloud on mount
  useEffect(() => {
    fetchSavingsTargetFromCloud();
  }, []);

  // Fetch accumulated savings from Supabase
  const fetchAccumulatedSavings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('accumulated_savings')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setAccumulatedSavingsInput(data.accumulated_savings?.toString() ?? '0');
      }
    } catch (error) {
      console.error('Error fetching accumulated savings:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAccumulatedSavings();
  }, [fetchAccumulatedSavings]);

  // Update input when savingsTarget changes (e.g., from cloud sync)
  useEffect(() => {
    setTargetInput(savingsTarget?.toString() ?? '200000');
  }, [savingsTarget]);

  const saveAccumulatedSavings = async () => {
    if (!user?.id) return;
    try {
      const val = parseFloat(accumulatedSavingsInput) || 0;
      await supabase.from('profiles').update({ accumulated_savings: val }).eq('id', user.id);
      setIsEditingAccumulated(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save accumulated savings');
    }
  };

  // Manual sync function
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await Promise.all([fetchSavingsTargetFromCloud(), fetchAccumulatedSavings()]);
      const message = 'Synced from cloud!';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Sync Complete', message);
      }
    } catch (error) {
      const message = 'Failed to sync';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Sync Error', message);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [fetchSavingsTargetFromCloud, fetchAccumulatedSavings]);

  // Get current month info
  const now = new Date();
  const currentMonth = now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { activeIncome: number; passiveIncome: number; expenses: number; funds: number } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { activeIncome: 0, passiveIncome: 0, expenses: 0, funds: 0 };
    }

    transactions.forEach((t) => {
      const monthKey = t.date.substring(0, 7);
      if (!months[monthKey]) {
        months[monthKey] = { activeIncome: 0, passiveIncome: 0, expenses: 0, funds: 0 };
      }

      if (t.type === 'income') {
        // Check if passive income based on notes
        if (t.notes?.toLowerCase().includes('passive')) {
          months[monthKey].passiveIncome += t.amount;
        } else {
          months[monthKey].activeIncome += t.amount;
        }
      } else if (t.type === 'expense') {
        months[monthKey].expenses += t.amount;
      } else if (t.type === 'savings_deposit' || t.type === 'fund_deposit') {
        months[monthKey].funds += t.amount;
      } else if (t.type === 'investment') {
        months[monthKey].funds += t.amount;
      }
    });

    return months;
  }, [transactions, now]);

  // Current month calculations
  const currentMonthData = monthlyData[currentMonthKey] ?? { activeIncome: 0, passiveIncome: 0, expenses: 0, funds: 0 };
  const totalIncome = currentMonthData.activeIncome + currentMonthData.passiveIncome;
  const savingsIncome = includePassiveIncome
    ? currentMonthData.activeIncome + currentMonthData.passiveIncome
    : currentMonthData.activeIncome;
  const actualSavings = savingsIncome - currentMonthData.expenses - currentMonthData.funds;
  const target = parseFloat(targetInput) || 0;
  const progress = target > 0 ? Math.min((actualSavings / target) * 100, 100) : 0;
  const accumulatedSavings = parseFloat(accumulatedSavingsInput) || 0;
  const totalSavings = accumulatedSavings + actualSavings;
  const remaining = Math.max(target - actualSavings, 0);
  const dailySavingsNeeded = daysLeft > 0 ? remaining / daysLeft : 0;

  // Monthly savings history
  const savingsHistory = useMemo(() => {
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const label = date.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
        const savings = data.activeIncome - data.expenses - data.funds;
        return {
          key,
          label,
          activeIncome: data.activeIncome,
          expenses: data.expenses,
          funds: data.funds,
          savings,
        };
      });
  }, [monthlyData]);

  // Average savings (last 3 months)
  const averageSavings = useMemo(() => {
    const last3 = savingsHistory.slice(-3);
    if (last3.length === 0) return 0;
    const total = last3.reduce((sum, m) => sum + m.savings, 0);
    return total / last3.length;
  }, [savingsHistory]);

  const handleSetTarget = () => {
    const value = parseFloat(targetInput);
    if (!isNaN(value) && value > 0) {
      setSavingsTarget(value);
    }
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Sync Bar */}
      <View className="bg-white dark:bg-surface-800 px-4 py-2 border-b-4 border-accent-500">
        <View className="flex-row items-center justify-end">
          <Pressable
            onPress={handleSync}
            disabled={isSyncing}
            className="flex-row items-center bg-primary-500 px-3 py-1.5 rounded-lg"
          >
            <FontAwesome
              name={isSyncing ? 'spinner' : 'refresh'}
              size={14}
              color="white"
            />
            <Text className="text-white text-sm font-medium ml-2">
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Total Savings Overview */}
        <View className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 mb-3">
          <Text className="text-base font-bold text-surface-900 dark:text-surface-100 mb-4">
            Overall Savings Status
          </Text>

          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-medium text-surface-500 dark:text-surface-400">
                Accumulated Savings (Total Savings Before {currentMonth})
              </Text>
              {!isEditingAccumulated && (
                <Pressable onPress={() => setIsEditingAccumulated(true)} className="p-1">
                  <FontAwesome name="pencil" size={14} color="#64748b" />
                </Pressable>
              )}
            </View>
            {isEditingAccumulated ? (
              <View className="flex-row items-center gap-2">
                <View className="flex-1 flex-row items-center bg-surface-100 dark:bg-surface-700 rounded-lg px-3 py-2.5">
                  <Text className="text-surface-500 dark:text-surface-400 mr-2">₱</Text>
                  <TextInput
                    value={accumulatedSavingsInput}
                    onChangeText={(text) => {
                      if (/^\d*\.?\d*$/.test(text)) setAccumulatedSavingsInput(text);
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 text-xl text-surface-900 dark:text-surface-100 font-bold"
                    autoFocus
                  />
                </View>
                <Pressable
                  onPress={saveAccumulatedSavings}
                  className="bg-primary-500 h-12 w-12 items-center justify-center rounded-lg"
                >
                  <FontAwesome name="check" size={18} color="white" />
                </Pressable>
              </View>
            ) : (
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                {formatCurrency(accumulatedSavings)}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Total Savings</Text>
            <Text className="text-3xl font-bold text-primary-600">{formatCurrency(totalSavings)}</Text>
          </View>
        </View>

        {/* Target Savings Card */}
        <View className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-danger-600 uppercase">Target Savings</Text>
            <View className="bg-primary-500 px-2 py-1 rounded-full">
              <Text className="text-xs text-white font-medium">{currentMonth}</Text>
            </View>
          </View>
          <Text className="text-2xl font-bold text-primary-600 mb-3">
            {formatCurrency(target)}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center bg-surface-100 dark:bg-surface-700 rounded-lg px-3 py-3">
              <Text className="text-surface-500 dark:text-surface-400 mr-2">₱</Text>
              <TextInput
                value={targetInput}
                onChangeText={setTargetInput}
                keyboardType="numeric"
                placeholder="200000"
                placeholderTextColor="#94a3b8"
                className="flex-1 text-sm text-surface-900 dark:text-surface-100"
              />
            </View>
            <Pressable
              onPress={handleSetTarget}
              className="bg-primary-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-sm font-medium">Set Target</Text>
            </Pressable>
          </View>
        </View>

        {/* Include Passive Income Checkbox */}
        <Pressable
          onPress={() => setIncludePassiveIncome(!includePassiveIncome)}
          className="flex-row items-center bg-white dark:bg-surface-800 rounded-xl px-4 py-3 border border-surface-200 dark:border-surface-700 mb-3"
        >
          <View
            className={`h-5 w-5 rounded border-2 items-center justify-center mr-3 ${
              includePassiveIncome
                ? 'bg-primary-500 border-primary-500'
                : 'border-surface-300 dark:border-surface-600'
            }`}
          >
            {includePassiveIncome && (
              <FontAwesome name="check" size={12} color="white" />
            )}
          </View>
          <Text className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Include passive income in savings computation
          </Text>
        </Pressable>

        {/* Actual Savings Card */}
        <View className="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-surface-500 uppercase">Actual Savings</Text>
            <View className="bg-accent-500 px-2 py-1 rounded-full">
              <Text className="text-xs text-white font-medium">{currentMonth}</Text>
            </View>
          </View>
          <Text className="text-2xl font-bold text-accent-600 mb-3">
            {formatCurrency(actualSavings)}
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">
              <Text className="text-xs text-surface-600 dark:text-surface-400">
                Active Income: {formatCurrency(currentMonthData.activeIncome)}
              </Text>
            </View>
            {includePassiveIncome && currentMonthData.passiveIncome > 0 && (
              <>
                <Text className="text-surface-400">+</Text>
                <View className="bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                  <Text className="text-xs text-green-600">
                    Passive: {formatCurrency(currentMonthData.passiveIncome)}
                  </Text>
                </View>
              </>
            )}
            <Text className="text-surface-400">−</Text>
            <View className="bg-danger-50 dark:bg-danger-900/30 px-2 py-1 rounded">
              <Text className="text-xs text-danger-600">
                Expenses: {formatCurrency(currentMonthData.expenses)}
              </Text>
            </View>
            <Text className="text-surface-400">−</Text>
            <View className="bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
              <Text className="text-xs text-primary-600">
                Funds: {formatCurrency(currentMonthData.funds)}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress to Target */}
        <View className="bg-surface-800 rounded-xl p-4 mb-4">
          <Text className="text-sm font-semibold text-white uppercase mb-3">Progress to Target</Text>

          {/* Progress Bar */}
          <View className="h-3 bg-surface-600 rounded-full overflow-hidden mb-3">
            <View
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${Math.max(progress, 0)}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl font-bold text-white">{progress.toFixed(1)}%</Text>
            <Text className="text-sm text-surface-400">{formatCurrency(remaining)} remaining</Text>
          </View>

          {/* Daily Savings Goal */}
          <View className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border-l-4 border-primary-400">
            <Text className="text-xs text-surface-500 mb-1">To reach your target:</Text>
            <Text className="text-lg font-bold text-primary-600">
              Save {formatCurrency(dailySavingsNeeded)}/day
            </Text>
            <Text className="text-xs text-surface-400">({daysLeft} days left in {now.toLocaleDateString('en-PH', { month: 'long' })})</Text>
          </View>
        </View>

        {/* Income Breakdown */}
        <Card variant="default" className="mb-4">
          <Text className="text-base font-bold text-surface-900 dark:text-surface-100 mb-4">
            Income Breakdown - {currentMonth}
          </Text>
          <View className="flex-row gap-2">
            {/* Active Income */}
            <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
              <Text className="text-xs font-semibold text-amber-700 uppercase text-center mb-1">
                Active Income
              </Text>
              <Text className="text-lg font-bold text-amber-600 text-center">
                {formatCurrency(currentMonthData.activeIncome)}
              </Text>
              <Text className="text-xs text-amber-600/70 text-center mt-1">
                Counts towards savings
              </Text>
            </View>

            {/* Passive Income */}
            <View className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
              <Text className="text-xs font-semibold text-green-700 uppercase text-center mb-1">
                Passive Income
              </Text>
              <Text className="text-lg font-bold text-green-600 text-center">
                {formatCurrency(currentMonthData.passiveIncome)}
              </Text>
              <Text className="text-xs text-green-600/70 text-center mt-1">
                Additional income
              </Text>
            </View>

            {/* Total Income */}
            <View className="flex-1 bg-accent-100 dark:bg-accent-900/30 rounded-xl p-3">
              <Text className="text-xs font-semibold text-accent-700 uppercase text-center mb-1">
                Total Income
              </Text>
              <Text className="text-lg font-bold text-accent-700 text-center">
                {formatCurrency(totalIncome)}
              </Text>
              <Text className="text-xs text-accent-600/70 text-center mt-1">
                All sources combined
              </Text>
            </View>
          </View>
        </Card>

        {/* Monthly Savings History */}
        <Card variant="default" className="mb-4">
          <Text className="text-base font-bold text-surface-900 dark:text-surface-100 mb-4">
            Monthly Savings History
          </Text>

          {/* Table Header */}
          <View className="flex-row bg-surface-100 dark:bg-surface-700 rounded-t-lg py-2 px-2">
            <Text className="flex-1 text-xs font-semibold text-surface-500 uppercase">Month</Text>
            <Text className="flex-1 text-xs font-semibold text-surface-500 uppercase text-right">Active Income</Text>
            <Text className="flex-1 text-xs font-semibold text-surface-500 uppercase text-right">Expenses</Text>
            <Text className="flex-1 text-xs font-semibold text-surface-500 uppercase text-right">Funds</Text>
            <Text className="flex-1 text-xs font-semibold text-surface-500 uppercase text-right">Savings</Text>
          </View>

          {/* Table Rows */}
          {savingsHistory.map((row, index) => (
            <View
              key={row.key}
              className={`flex-row py-3 px-2 border-b border-surface-100 dark:border-surface-700 ${
                index % 2 === 0 ? 'bg-white dark:bg-surface-800' : 'bg-surface-50 dark:bg-surface-900'
              }`}
            >
              <Text className="flex-1 text-sm text-surface-700 dark:text-surface-300">{row.label}</Text>
              <Text className="flex-1 text-sm text-surface-700 dark:text-surface-300 text-right">
                {formatCurrency(row.activeIncome)}
              </Text>
              <Text className="flex-1 text-sm text-surface-700 dark:text-surface-300 text-right">
                {formatCurrency(row.expenses)}
              </Text>
              <Text className="flex-1 text-sm text-surface-700 dark:text-surface-300 text-right">
                {formatCurrency(row.funds)}
              </Text>
              <Text
                className={`flex-1 text-sm font-medium text-right ${
                  row.savings >= 0 ? 'text-accent-600' : 'text-danger-600'
                }`}
              >
                {row.savings < 0 ? '-' : ''}{formatCurrency(Math.abs(row.savings))}
              </Text>
            </View>
          ))}
        </Card>

        {/* Average Monthly Savings */}
        <Card variant="default" className="mb-8">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-surface-700 dark:text-surface-300">
              Average Monthly Savings (Last 3 months):
            </Text>
            <Text
              className={`text-lg font-bold ${
                averageSavings >= 0 ? 'text-accent-600' : 'text-danger-600'
              }`}
            >
              {averageSavings < 0 ? '-' : ''}{formatCurrency(Math.abs(averageSavings))}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
