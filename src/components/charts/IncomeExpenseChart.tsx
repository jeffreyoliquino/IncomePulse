import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface MonthlyData {
  month: string; // "Jan", "Feb", etc.
  income: number;
  expenses: number;
}

interface Props {
  data: MonthlyData[];
}

const screenWidth = Dimensions.get('window').width;

export function IncomeExpenseChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-sm text-surface-400">
          Add transactions to see trends
        </Text>
      </View>
    );
  }

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        data: data.map((d) => d.income || 0),
        color: () => '#22c55e',
        strokeWidth: 2,
      },
      {
        data: data.map((d) => d.expenses || 0),
        color: () => '#ef4444',
        strokeWidth: 2,
      },
    ],
    legend: ['Income', 'Expenses'],
  };

  return (
    <View>
      <LineChart
        data={chartData}
        width={screenWidth - 48}
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
          style: { borderRadius: 16 },
          propsForDots: { r: '4', strokeWidth: '2' },
          formatYLabel: (value) => {
            const num = parseFloat(value);
            if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
            return value;
          },
        }}
        bezier
        style={{ marginLeft: -16, borderRadius: 16 }}
      />
    </View>
  );
}
