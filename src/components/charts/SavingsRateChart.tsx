import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

interface MonthlyData {
  month: string;
  savingsRate: number; // percentage 0-100
}

interface Props {
  data: MonthlyData[];
}

const screenWidth = Dimensions.get('window').width;

export function SavingsRateChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-sm text-surface-400">
          No savings data to display
        </Text>
      </View>
    );
  }

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        data: data.map((d) => Math.max(d.savingsRate, 0)),
      },
    ],
  };

  const avgRate =
    data.reduce((sum, d) => sum + d.savingsRate, 0) / data.length;

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm text-surface-500">Monthly Savings Rate</Text>
        <View className="flex-row items-center">
          <Text className="text-lg font-bold text-primary-600">
            {avgRate.toFixed(1)}%
          </Text>
          <Text className="ml-1 text-xs text-surface-400">avg</Text>
        </View>
      </View>

      <BarChart
        data={chartData}
        width={screenWidth - 48}
        height={160}
        yAxisLabel=""
        yAxisSuffix="%"
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          labelColor: () => '#94a3b8',
          barPercentage: 0.6,
          style: { borderRadius: 16 },
        }}
        style={{ marginLeft: -16, borderRadius: 16 }}
        showValuesOnTopOfBars
      />
    </View>
  );
}
