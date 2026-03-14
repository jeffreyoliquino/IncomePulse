import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '../../components/ui';
import { useTransactionStore } from '../../stores/transactionStore';
import { useRecurringStore } from '../../stores/recurringStore';
import { generateForecast } from './utils/forecastEngine';
import { formatCurrency, formatDate } from '../../lib/formatters';

const screenWidth = Dimensions.get('window').width;

type ForecastRange = 30 | 60 | 90;

export function CashflowForecast() {
  const [forecastRange, setForecastRange] = useState<ForecastRange>(30);
  const [showDetails, setShowDetails] = useState(false);

  const { transactions } = useTransactionStore();
  const { recurringTransactions } = useRecurringStore();

  // Compute current balance from transactions
  const currentBalance = useMemo(() => {
    return transactions.reduce((balance, t) => {
      if (t.type === 'income') return balance + t.amount;
      if (t.type === 'expense') return balance - t.amount;
      if (t.type === 'savings_deposit') return balance - t.amount;
      if (t.type === 'savings_withdrawal') return balance + t.amount;
      return balance;
    }, 0);
  }, [transactions]);

  const { days, summary } = useMemo(
    () => generateForecast(currentBalance, recurringTransactions, transactions, forecastRange),
    [currentBalance, recurringTransactions, transactions, forecastRange]
  );

  // Prepare chart data - sample points to avoid crowding
  const chartStep = Math.max(1, Math.floor(days.length / 12));
  const chartPoints = days.filter((_, i) => i % chartStep === 0 || i === days.length - 1);

  const chartData = {
    labels: chartPoints.map((d) => d.label),
    datasets: [
      {
        data: chartPoints.map((d) => d.cumulativeBalance),
        color: () => '#2563eb',
        strokeWidth: 2,
      },
    ],
  };

  // Determine warning level
  const isWarning = summary.daysUntilNegative !== null;
  const isLow = summary.lowestBalance < currentBalance * 0.2 && summary.lowestBalance >= 0;

  return (
    <ScrollView className="flex-1 px-4 pt-4">
      {/* Balance Summary */}
      <Card variant="elevated" className="mb-4 bg-primary-600">
        <Text className="text-sm text-primary-200">Current Balance</Text>
        <Text className="mt-1 text-2xl font-bold text-white">
          {formatCurrency(currentBalance)}
        </Text>
        <View className="mt-3 flex-row justify-between">
          <View>
            <Text className="text-xs text-primary-300">Projected In</Text>
            <Text className="text-sm font-bold text-white">
              +{formatCurrency(summary.totalProjectedIncome)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-xs text-primary-300">Projected Out</Text>
            <Text className="text-sm font-bold text-white">
              -{formatCurrency(summary.totalProjectedExpenses)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Warning Banner */}
      {isWarning && (
        <Card variant="elevated" className="mb-4 bg-danger-50">
          <View className="flex-row items-center">
            <FontAwesome name="exclamation-triangle" size={16} color="#dc2626" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-danger-700">
                Balance may go negative
              </Text>
              <Text className="text-xs text-danger-600">
                In {summary.daysUntilNegative} days (by{' '}
                {summary.lowestBalanceDate ? formatDate(summary.lowestBalanceDate) : ''}
                ). Lowest: {formatCurrency(summary.lowestBalance)}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {isLow && !isWarning && (
        <Card variant="elevated" className="mb-4 bg-warning-50">
          <View className="flex-row items-center">
            <FontAwesome name="exclamation-circle" size={16} color="#d97706" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-warning-700">
                Balance getting low
              </Text>
              <Text className="text-xs text-warning-600">
                May drop to {formatCurrency(summary.lowestBalance)} by{' '}
                {summary.lowestBalanceDate ? formatDate(summary.lowestBalanceDate) : ''}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Range Selector */}
      <View className="flex-row gap-2 mb-4">
        {([30, 60, 90] as ForecastRange[]).map((range) => (
          <Pressable
            key={range}
            onPress={() => setForecastRange(range)}
            className={`flex-1 rounded-full py-2 items-center ${
              forecastRange === range ? 'bg-primary-600' : 'bg-surface-100'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                forecastRange === range ? 'text-white' : 'text-surface-600'
              }`}
            >
              {range} Days
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Balance Projection Chart */}
      <Card variant="elevated" className="mb-4">
        <Text className="mb-3 text-sm font-semibold text-surface-500">
          BALANCE PROJECTION
        </Text>

        {chartPoints.length >= 2 ? (
          <LineChart
            data={chartData}
            width={screenWidth - 80}
            height={200}
            yAxisLabel="₱"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: () => '#94a3b8',
              style: { borderRadius: 12 },
              propsForDots: { r: '3', strokeWidth: '1' },
              formatYLabel: (value) => {
                const num = parseFloat(value);
                if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(0)}k`;
                return value;
              },
            }}
            bezier
            withVerticalLines={false}
            style={{ marginLeft: -16, borderRadius: 12 }}
          />
        ) : (
          <View className="items-center py-8">
            <Text className="text-sm text-surface-400">
              Add transactions or recurring items to see projections
            </Text>
          </View>
        )}
      </Card>

      {/* Key Stats */}
      <View className="flex-row gap-2 mb-4">
        <Card variant="elevated" className="flex-1">
          <Text className="text-xs text-surface-400">Net Cashflow</Text>
          <Text
            className={`mt-1 text-lg font-bold ${
              summary.netCashflow >= 0 ? 'text-accent-600' : 'text-danger-600'
            }`}
          >
            {summary.netCashflow >= 0 ? '+' : ''}
            {formatCurrency(summary.netCashflow)}
          </Text>
        </Card>
        <Card variant="elevated" className="flex-1">
          <Text className="text-xs text-surface-400">Daily Avg Spend</Text>
          <Text className="mt-1 text-lg font-bold text-surface-900">
            {formatCurrency(summary.averageDailySpend)}
          </Text>
        </Card>
      </View>

      <View className="flex-row gap-2 mb-4">
        <Card variant="elevated" className="flex-1">
          <Text className="text-xs text-surface-400">End Balance</Text>
          <Text className="mt-1 text-lg font-bold text-surface-900">
            {days.length > 0 ? formatCurrency(days[days.length - 1].cumulativeBalance) : '₱0'}
          </Text>
        </Card>
        <Card variant="elevated" className="flex-1">
          <Text className="text-xs text-surface-400">Lowest Point</Text>
          <Text
            className={`mt-1 text-lg font-bold ${
              summary.lowestBalance < 0 ? 'text-danger-600' : 'text-warning-600'
            }`}
          >
            {formatCurrency(summary.lowestBalance)}
          </Text>
        </Card>
      </View>

      {/* Daily Breakdown Toggle */}
      <Pressable onPress={() => setShowDetails(!showDetails)} className="mb-3">
        <Card variant="elevated">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-surface-700">
              Daily Breakdown
            </Text>
            <FontAwesome
              name={showDetails ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#94a3b8"
            />
          </View>
        </Card>
      </Pressable>

      {/* Daily Details */}
      {showDetails &&
        days
          .filter((day) => day.items.length > 0)
          .slice(0, 30) // Show max 30 days with items
          .map((day) => (
            <Card key={day.date} variant="outlined" className="mb-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-semibold text-surface-500">
                  {day.label}
                </Text>
                <Text
                  className={`text-xs font-bold ${
                    day.cumulativeBalance >= 0 ? 'text-surface-700' : 'text-danger-600'
                  }`}
                >
                  Bal: {formatCurrency(day.cumulativeBalance)}
                </Text>
              </View>
              {day.items.map((item, idx) => (
                <View key={idx} className="flex-row items-center justify-between py-1">
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`h-1.5 w-1.5 rounded-full mr-2 ${
                        item.type === 'income' ? 'bg-accent-500' : 'bg-danger-500'
                      }`}
                    />
                    <Text className="text-xs text-surface-600" numberOfLines={1}>
                      {item.description}
                    </Text>
                    {item.source === 'historical_average' && (
                      <Text className="ml-1 text-xs text-surface-300">(est.)</Text>
                    )}
                  </View>
                  <Text
                    className={`text-xs font-medium ${
                      item.type === 'income' ? 'text-accent-600' : 'text-danger-600'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </Card>
          ))}

      {/* Disclaimer */}
      <Card variant="outlined" className="mb-8 mt-2">
        <Text className="text-xs text-surface-400 leading-5">
          Projections are based on your recurring transactions and historical spending patterns.
          Actual results may vary.
        </Text>
      </Card>
    </ScrollView>
  );
}
