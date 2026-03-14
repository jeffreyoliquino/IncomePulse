import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button, Card } from '@/src/components/ui';
import { useTransactionStore } from '@/src/stores/transactionStore';
import { generateTransactionCSV, getExportFilename } from './services/csvExporter';
import type { Transaction } from '@/src/types/database';

type ExportRange = 'current_month' | 'last_3_months' | 'all';

const RANGES: { id: ExportRange; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { id: 'current_month', label: 'Current Month', icon: 'calendar' },
  { id: 'last_3_months', label: 'Last 3 Months', icon: 'calendar-o' },
  { id: 'all', label: 'All Data', icon: 'database' },
];

function filterByRange(
  transactions: Transaction[],
  range: ExportRange
) {
  const now = new Date();
  if (range === 'all') return transactions;

  if (range === 'current_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions.filter((t) => new Date(t.date) >= startOfMonth);
  }

  // last_3_months
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return transactions.filter((t) => new Date(t.date) >= start);
}

export function ExportScreen() {
  const [selectedRange, setSelectedRange] = useState<ExportRange>('current_month');
  const [isExporting, setIsExporting] = useState(false);
  const { transactions, categories } = useTransactionStore();

  const filteredTransactions = useMemo(
    () => filterByRange(transactions, selectedRange),
    [transactions, selectedRange]
  );

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      Alert.alert('No Data', 'There are no transactions to export for the selected range.');
      return;
    }

    setIsExporting(true);
    try {
      const csv = generateTransactionCSV(filteredTransactions, categories);
      const filename = getExportFilename(selectedRange);

      if (Platform.OS === 'web') {
        // Web: download via Blob
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Exported', `${filename} downloaded successfully.`);
      } else {
        // Native: write to temp file and share
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Transactions',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          Alert.alert('Exported', `File saved to ${fileUri}`);
        }
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err.message ?? 'Could not export data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <View className="px-4 pt-4 pb-8">
        {/* Info */}
        <Card variant="elevated" className="mb-6">
          <View className="flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900">
              <FontAwesome name="file-text-o" size={18} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                Export as CSV
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400">
                Download your transactions as a spreadsheet file
              </Text>
            </View>
          </View>
        </Card>

        {/* Range Selector */}
        <Text className="mb-3 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Date Range
        </Text>
        <View className="gap-2 mb-6">
          {RANGES.map((range) => (
            <Pressable
              key={range.id}
              onPress={() => setSelectedRange(range.id)}
            >
              <Card
                variant={selectedRange === range.id ? 'elevated' : 'outlined'}
                className={selectedRange === range.id ? 'border border-primary-500' : ''}
              >
                <View className="flex-row items-center">
                  <View className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
                    selectedRange === range.id ? 'bg-primary-100 dark:bg-primary-900' : 'bg-surface-100 dark:bg-surface-700'
                  }`}>
                    <FontAwesome
                      name={range.icon}
                      size={18}
                      color={selectedRange === range.id ? '#2563eb' : '#94a3b8'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                      {range.label}
                    </Text>
                  </View>
                  {selectedRange === range.id && (
                    <FontAwesome name="check-circle" size={20} color="#2563eb" />
                  )}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* Preview */}
        <Card variant="elevated" className="mb-6">
          <View className="items-center py-4">
            <Text className="text-4xl font-bold text-primary-600">
              {filteredTransactions.length}
            </Text>
            <Text className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              transactions to export
            </Text>
          </View>
        </Card>

        {/* Export Button */}
        <Button
          title={isExporting ? 'Exporting...' : 'Export CSV'}
          onPress={handleExport}
          loading={isExporting}
          fullWidth
          size="lg"
          icon={<FontAwesome name="download" size={18} color="#ffffff" />}
        />

        {/* Format Note */}
        <Text className="mt-4 text-center text-xs text-surface-400">
          CSV format: Date, Description, Type, Category, Amount, Currency, Source, Notes
        </Text>
      </View>
    </ScrollView>
  );
}
