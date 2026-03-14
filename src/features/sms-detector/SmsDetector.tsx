import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button, Card, Input } from '@/src/components/ui';
import { formatCurrency } from '@/src/lib/formatters';
import { useSmsParser } from './hooks/useSmsParser';
import type { TransactionType } from '@/src/types/database';

const EXAMPLE_SMS = [
  'GCash: You paid PHP 250.00 to GRABFOOD. Ref No. 1234567890',
  'BDO: Your acct 1234 was debited PHP 1,500.00 for purchase at SM SUPERMARKET',
  'BPI: PHP 25,000.00 was credited to acct 9876. Ref: TXN20240115',
  'Maya: You sent PHP 500.00 to Juan Dela Cruz. Ref No. 9876543210',
];

const TYPE_OPTIONS: { label: string; value: TransactionType; color: string }[] = [
  { label: 'Expense', value: 'expense', color: '#dc2626' },
  { label: 'Income', value: 'income', color: '#16a34a' },
  { label: 'Transfer', value: 'transfer', color: '#2563eb' },
];

export function SmsDetector() {
  const {
    rawText,
    setRawText,
    parsedResult,
    parseError,
    parse,
    updateParsed,
    saveTransaction,
    clear,
  } = useSmsParser();

  const [editingAmount, setEditingAmount] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleParse = () => {
    parse();
    if (parsedResult) {
      setEditingAmount(parsedResult.amount.toString());
      setEditingDesc(parsedResult.description);
    }
  };

  const handleSave = () => {
    if (isEditing && parsedResult) {
      updateParsed({
        amount: parseFloat(editingAmount) || parsedResult.amount,
        description: editingDesc || parsedResult.description,
      });
    }

    const saved = saveTransaction();
    if (saved) {
      Alert.alert('Saved', 'Transaction from SMS has been recorded.');
      clear();
      setIsEditing(false);
    }
  };

  const handleExample = (sms: string) => {
    setRawText(sms);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface-50"
    >
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Instructions */}
        <Card variant="elevated" className="mb-4">
          <View className="flex-row items-start">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <FontAwesome name="commenting" size={18} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-surface-900">
                Paste SMS Notification
              </Text>
              <Text className="mt-1 text-xs text-surface-500">
                Paste a bank or e-wallet SMS and we'll extract the transaction
                details. Supports GCash, Maya, BDO, BPI, UnionBank, Metrobank,
                RCBC, and Landbank.
              </Text>
            </View>
          </View>
        </Card>

        {/* SMS Input */}
        <Text className="mb-2 text-sm font-medium text-surface-700">
          SMS Message
        </Text>
        <View className="mb-4 rounded-xl border border-surface-200 bg-white p-3">
          <TextInput
            value={rawText}
            onChangeText={setRawText}
            placeholder="Paste your bank SMS here..."
            multiline
            numberOfLines={4}
            className="min-h-[100px] text-sm text-surface-900"
            textAlignVertical="top"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Action buttons */}
        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <Button
              title="Scan SMS"
              onPress={handleParse}
              disabled={!rawText.trim()}
              fullWidth
              icon={<FontAwesome name="search" size={14} color="#ffffff" />}
            />
          </View>
          {rawText.trim() ? (
            <Button
              title="Clear"
              onPress={clear}
              variant="outline"
            />
          ) : null}
        </View>

        {/* Parse Error */}
        {parseError && (
          <Card variant="outlined" className="mb-4">
            <View className="flex-row items-center">
              <FontAwesome name="exclamation-circle" size={16} color="#dc2626" />
              <Text className="ml-2 flex-1 text-sm text-danger-600">
                {parseError}
              </Text>
            </View>
          </Card>
        )}

        {/* Parsed Result */}
        {parsedResult && (
          <Card variant="elevated" className="mb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-surface-900">
                Detected Transaction
              </Text>
              <Pressable onPress={() => setIsEditing(!isEditing)}>
                <Text className="text-sm font-medium text-primary-600">
                  {isEditing ? 'Done' : 'Edit'}
                </Text>
              </Pressable>
            </View>

            {/* Bank badge */}
            {parsedResult.bank && (
              <View className="mb-3 flex-row items-center">
                <View className="rounded-full bg-primary-50 px-3 py-1">
                  <Text className="text-xs font-medium text-primary-700">
                    {parsedResult.bank}
                  </Text>
                </View>
              </View>
            )}

            {/* Result fields */}
            <View className="gap-3">
              <ResultRow
                label="Amount"
                value={formatCurrency(parsedResult.amount)}
                icon="money"
                color={parsedResult.type === 'income' ? '#16a34a' : '#dc2626'}
              />

              {isEditing ? (
                <Input
                  label="Amount"
                  keyboardType="decimal-pad"
                  value={editingAmount || parsedResult.amount.toString()}
                  onChangeText={setEditingAmount}
                  leftIcon={<Text className="text-base text-surface-400">₱</Text>}
                />
              ) : null}

              <ResultRow
                label="Description"
                value={parsedResult.description}
                icon="file-text-o"
              />

              {isEditing ? (
                <Input
                  label="Description"
                  value={editingDesc || parsedResult.description}
                  onChangeText={setEditingDesc}
                />
              ) : null}

              <ResultRow
                label="Type"
                value={parsedResult.type === 'income' ? 'Credit (Income)' : 'Debit (Expense)'}
                icon={parsedResult.type === 'income' ? 'arrow-down' : 'arrow-up'}
                color={parsedResult.type === 'income' ? '#16a34a' : '#dc2626'}
              />

              {isEditing && (
                <View className="flex-row gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => updateParsed({ type: opt.value })}
                      className={`flex-1 items-center rounded-lg py-2 ${
                        parsedResult.type === opt.value
                          ? 'bg-primary-600'
                          : 'bg-surface-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          parsedResult.type === opt.value
                            ? 'text-white'
                            : 'text-surface-600'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {parsedResult.merchant && (
                <ResultRow
                  label="Merchant"
                  value={parsedResult.merchant}
                  icon="building-o"
                />
              )}

              {parsedResult.referenceNo && (
                <ResultRow
                  label="Reference"
                  value={parsedResult.referenceNo}
                  icon="hashtag"
                />
              )}

              <ResultRow
                label="Date"
                value={parsedResult.date}
                icon="calendar"
              />
            </View>

            <View className="mt-4">
              <Button
                title="Save Transaction"
                onPress={handleSave}
                fullWidth
                size="lg"
                icon={<FontAwesome name="check" size={16} color="#ffffff" />}
              />
            </View>
          </Card>
        )}

        {/* Example SMS */}
        {!parsedResult && !parseError && (
          <>
            <Text className="mb-2 mt-2 text-sm font-semibold text-surface-500">
              EXAMPLES
            </Text>
            {EXAMPLE_SMS.map((sms, i) => (
              <Pressable key={i} onPress={() => handleExample(sms)}>
                <Card variant="outlined" className="mb-2">
                  <Text className="text-xs text-surface-600" numberOfLines={2}>
                    {sms}
                  </Text>
                </Card>
              </Pressable>
            ))}
            <Text className="mb-8 mt-1 text-xs text-surface-400">
              Tap an example to try it out
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ResultRow({
  label,
  value,
  icon,
  color = '#334155',
}: {
  label: string;
  value: string;
  icon: string;
  color?: string;
}) {
  return (
    <View className="flex-row items-center">
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-surface-50">
        <FontAwesome name={icon as any} size={14} color="#64748b" />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-surface-400">{label}</Text>
        <Text className="text-sm font-medium" style={{ color }}>
          {value}
        </Text>
      </View>
    </View>
  );
}
