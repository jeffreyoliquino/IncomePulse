import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, type GestureResponderEvent } from 'react-native';
import { Input, Card } from '../../components/ui';
import { formatCurrency } from '../../lib/formatters';
import { calculateLoan } from './utils/amortization';

const DOWN_PAYMENT_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

export function LoanCalculator() {
  const [principal, setPrincipal] = useState('');
  const [downPaymentAmount, setDownPaymentAmount] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const trackWidth = useRef(0);

  const totalPrice = parseFloat(principal) || 0;
  const dpAmount = parseFloat(downPaymentAmount) || 0;
  const downPaymentPercent = totalPrice > 0 ? Math.min(Math.round((dpAmount / totalPrice) * 100), 100) : 0;
  const loanAmount = Math.max(totalPrice - dpAmount, 0);

  const handlePercentTap = (pct: number) => {
    if (downPaymentPercent === pct) {
      setDownPaymentAmount('');
    } else {
      const amount = totalPrice * (pct / 100);
      setDownPaymentAmount(amount > 0 ? amount.toString() : '');
    }
  };

  const handleTrackTouch = useCallback((e: GestureResponderEvent) => {
    if (totalPrice <= 0 || trackWidth.current <= 0) return;
    const x = e.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(100, Math.round((x / trackWidth.current) * 100)));
    const amount = totalPrice * (pct / 100);
    setDownPaymentAmount(amount > 0 ? Math.round(amount).toString() : '');
  }, [totalPrice]);

  const result = useMemo(() => {
    const r = parseFloat(rate);
    const y = parseFloat(years);
    if (!loanAmount || !r || !y || loanAmount <= 0 || r < 0 || y <= 0) return null;
    return calculateLoan(loanAmount, r, Math.round(y * 12));
  }, [loanAmount, rate, years]);

  return (
    <ScrollView className="flex-1 px-4 pt-4">
      <Input
        label="Total Price / Loan Amount (PHP)"
        placeholder="e.g., 1000000"
        keyboardType="decimal-pad"
        value={principal}
        onChangeText={setPrincipal}
        leftIcon={<Text className="text-base text-surface-400">₱</Text>}
      />

      {/* Down Payment */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          Down Payment
        </Text>

        {/* Down Payment Amount Input */}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="flex-1">
            <Input
              placeholder="e.g., 200000"
              keyboardType="decimal-pad"
              value={downPaymentAmount}
              onChangeText={setDownPaymentAmount}
              leftIcon={<Text className="text-base text-surface-400">₱</Text>}
            />
          </View>
          <View className="bg-primary-500 px-3 py-1.5 rounded-full">
            <Text className="text-sm font-bold text-white">{downPaymentPercent}%</Text>
          </View>
        </View>

        {/* Draggable Slider Track */}
        <View
          className="mb-2 py-2"
          onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTrackTouch}
          onResponderMove={handleTrackTouch}
        >
          <View className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${downPaymentPercent}%`,
                backgroundColor: '#2563eb',
              }}
            />
          </View>
        </View>

        {/* Percentage Step Buttons */}
        <View className="flex-row justify-between">
          {DOWN_PAYMENT_STEPS.map((pct) => (
            <Pressable
              key={pct}
              onPress={() => handlePercentTap(pct)}
              className="items-center"
            >
              <Text
                className={`text-xs font-medium ${
                  downPaymentPercent === pct
                    ? 'text-primary-600'
                    : 'text-surface-400'
                }`}
              >
                {pct}%
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Input
        label="Annual Interest Rate (%)"
        placeholder="e.g., 8.5"
        keyboardType="decimal-pad"
        value={rate}
        onChangeText={setRate}
        leftIcon={<Text className="text-base text-surface-400">%</Text>}
      />

      <Input
        label="Loan Term (Years)"
        placeholder="e.g., 5"
        keyboardType="decimal-pad"
        value={years}
        onChangeText={setYears}
      />

      {result && (
        <View className="mt-2">
          {/* Monthly Payment */}
          <View className="mb-4 rounded-2xl p-5 shadow-md" style={{ backgroundColor: '#2563eb' }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }} className="text-sm">Monthly Payment</Text>
            <Text className="mt-1 text-3xl font-bold text-white">
              {formatCurrency(result.monthlyPayment)}
            </Text>
          </View>

          {/* Summary */}
          <Card variant="elevated" className="mb-4">
            <SummaryRow label="Total Price" amount={totalPrice} />
            {dpAmount > 0 && (
              <>
                <View className="my-2 h-px bg-surface-100" />
                <SummaryRow label={`Down Payment (${downPaymentPercent}%)`} amount={dpAmount} color="text-accent-600" />
                <View className="my-2 h-px bg-surface-100" />
                <SummaryRow label="Financed Amount" amount={loanAmount} />
              </>
            )}
            <View className="my-2 h-px bg-surface-100" />
            <SummaryRow
              label="Total Interest"
              amount={result.totalInterest}
              color="text-danger-600"
            />
            <View className="my-2 h-px bg-surface-100" />
            <SummaryRow
              label="Total Payment"
              amount={result.totalPayment}
              bold
            />
          </Card>

          {/* Amortization Schedule Toggle */}
          <Card
            variant="outlined"
            className="mb-4"
            onPress={() => setShowSchedule(!showSchedule)}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-primary-600">
                {showSchedule ? 'Hide' : 'Show'} Amortization Schedule
              </Text>
              <Text className="text-sm text-surface-400">
                {result.schedule.length} months
              </Text>
            </View>
          </Card>

          {/* Schedule Table */}
          {showSchedule && (
            <Card variant="elevated" className="mb-8">
              <View className="flex-row border-b border-surface-200 pb-2 mb-2">
                <Text className="w-12 text-xs font-semibold text-surface-500">Mo</Text>
                <Text className="flex-1 text-xs font-semibold text-surface-500 text-right">
                  Payment
                </Text>
                <Text className="flex-1 text-xs font-semibold text-surface-500 text-right">
                  Principal
                </Text>
                <Text className="flex-1 text-xs font-semibold text-surface-500 text-right">
                  Interest
                </Text>
                <Text className="flex-1 text-xs font-semibold text-surface-500 text-right">
                  Balance
                </Text>
              </View>
              {result.schedule.map((row) => (
                <View key={row.month} className="flex-row py-1.5">
                  <Text className="w-12 text-xs text-surface-600">{row.month}</Text>
                  <Text className="flex-1 text-xs text-surface-900 text-right">
                    {formatCurrency(row.payment)}
                  </Text>
                  <Text className="flex-1 text-xs text-accent-600 text-right">
                    {formatCurrency(row.principal)}
                  </Text>
                  <Text className="flex-1 text-xs text-danger-500 text-right">
                    {formatCurrency(row.interest)}
                  </Text>
                  <Text className="flex-1 text-xs text-surface-600 text-right">
                    {formatCurrency(row.balance)}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function SummaryRow({
  label,
  amount,
  bold = false,
  color = 'text-surface-900',
}: {
  label: string;
  amount: number;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-surface-700">{label}</Text>
      <Text className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${color}`}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}
