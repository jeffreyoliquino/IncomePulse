import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../lib/formatters';

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

interface Props {
  data: CategoryData[];
}

const screenWidth = Dimensions.get('window').width;

export function ExpenseBreakdownChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-sm text-surface-400">
          No expense data to display
        </Text>
      </View>
    );
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  const chartData = data.slice(0, 6).map((d) => ({
    name: d.name,
    amount: d.amount,
    color: d.color,
    legendFontColor: '#64748b',
    legendFontSize: 11,
  }));

  return (
    <View className="w-full">
      {/* Pie Chart with legend */}
      <View className="items-center mb-6">
        <PieChart
          data={chartData}
          width={screenWidth - 64}
          height={220}
          chartConfig={{
            color: () => '#000',
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute={false}
          hasLegend={true}
        />
      </View>

      {/* Detailed breakdown list */}
      <View className="w-full">
        {data.map((item) => (
          <View
            key={item.name}
            className="mb-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-4">
              <View
                className="mr-2 h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <Text
                className="text-sm text-surface-700 dark:text-surface-300 flex-shrink"
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>
            <View className="flex-row items-center flex-shrink-0">
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100 mr-3">
                {formatCurrency(item.amount)}
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400 w-12 text-right">
                {total > 0 ? `${((item.amount / total) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
