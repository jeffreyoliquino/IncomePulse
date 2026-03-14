import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui';
import { SalaryCalculator } from '@/src/features/salary-calculator/SalaryCalculator';
import { LoanCalculator } from '@/src/features/loan-calculator/LoanCalculator';
import { CurrencyConverter } from '@/src/features/currency/CurrencyConverter';
import { CashflowForecast } from '@/src/features/cashflow/CashflowForecast';
import { ReceiptScanner } from '@/src/features/receipt-scanner/ReceiptScanner';
import { SmsDetector } from '@/src/features/sms-detector/SmsDetector';
import { AICoach } from '@/src/features/ai-coach/AICoach';
import { PriceMonitor } from '@/src/features/price-monitor/PriceMonitor';

type ActiveTool = 'menu' | 'salary' | 'loan' | 'currency' | 'cashflow' | 'receipt' | 'sms' | 'coach' | 'price';

const TOOLS = [
  {
    id: 'salary' as const,
    title: 'Salary Calculator',
    description: 'Compute net pay with PH deductions',
    icon: 'money' as const,
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  {
    id: 'loan' as const,
    title: 'Loan Calculator',
    description: 'Amortization and interest breakdown',
    icon: 'bank' as const,
    color: '#2563eb',
    bgColor: '#dbeafe',
  },
  {
    id: 'currency' as const,
    title: 'Currency Converter',
    description: 'USD, AUD to PHP with rate history',
    icon: 'usd' as const,
    color: '#f59e0b',
    bgColor: '#fef3c7',
  },
  {
    id: 'cashflow' as const,
    title: 'Cashflow Forecast',
    description: '30/60/90 day balance projections',
    icon: 'area-chart' as const,
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
  {
    id: 'receipt' as const,
    title: 'Receipt Scanner',
    description: 'Scan bills and receipts',
    icon: 'camera' as const,
    color: '#ec4899',
    bgColor: '#fce7f3',
  },
  {
    id: 'sms' as const,
    title: 'SMS Detector',
    description: 'Detect transactions from bank SMS',
    icon: 'commenting' as const,
    color: '#0ea5e9',
    bgColor: '#e0f2fe',
  },
  {
    id: 'coach' as const,
    title: 'AI Coach',
    description: 'PH financial advisor',
    icon: 'comments' as const,
    color: '#8b5cf6',
    bgColor: '#ede9fe',
  },
  {
    id: 'price' as const,
    title: 'Price Monitor',
    description: 'Track prices and cost of living',
    icon: 'tags' as const,
    color: '#0d9488',
    bgColor: '#ccfbf1',
  },
];

const TOOL_LABELS: Record<string, string> = {
  salary: 'Salary Calculator',
  loan: 'Loan Calculator',
  currency: 'Currency Converter',
  cashflow: 'Cashflow Forecast',
  receipt: 'Receipt Scanner',
  sms: 'SMS Detector',
  coach: 'AI Coach',
  price: 'Price Monitor',
};

export default function ToolsScreen() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('menu');

  if (activeTool !== 'menu') {
    const ToolComponent = {
      salary: SalaryCalculator,
      loan: LoanCalculator,
      currency: CurrencyConverter,
      cashflow: CashflowForecast,
      receipt: ReceiptScanner,
      sms: SmsDetector,
      coach: AICoach,
      price: PriceMonitor,
    }[activeTool];

    return (
      <View className="flex-1 bg-surface-50 dark:bg-surface-900">
        <View className="flex-row items-center bg-white dark:bg-surface-800 px-4 py-3 border-b border-surface-100 dark:border-surface-700">
          <Pressable onPress={() => setActiveTool('menu')} className="mr-3 p-1">
            <FontAwesome name="arrow-left" size={18} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">
            {TOOL_LABELS[activeTool]}
          </Text>
        </View>
        <ToolComponent />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface-50 dark:bg-surface-900 px-4 pt-4">
      <Text className="mb-4 text-base text-surface-500 dark:text-surface-400">
        Financial tools and calculators
      </Text>

      {TOOLS.map((tool) => (
        <Card
          key={tool.id}
          variant="elevated"
          className="mb-3"
          onPress={() => setActiveTool(tool.id)}
        >
          <View className="flex-row items-center">
            <View
              className="mr-4 h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: tool.bgColor }}
            >
              <FontAwesome name={tool.icon} size={22} color={tool.color} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                {tool.title}
              </Text>
              <Text className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
                {tool.description}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#94a3b8" />
          </View>
        </Card>
      ))}

    </ScrollView>
  );
}
