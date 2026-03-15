import { Button, DatePicker, Input, Select } from '@/src/components/ui';
import { formatDate } from '@/src/lib/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type Lender = 'bank' | 'developer' | 'pagibig';
type InterestType = 'fixed' | 'variable' | 'repricing';
type ModeOfPayment = 'pdc' | 'auto_debit' | 'otc' | 'online_banking';
type LoanStatus = 'active' | 'paid_off' | 'in_default' | 'foreclosed' | 'restructured';

interface Payment {
  id: string;
  date: string;
  orRefNumber: string;
  amountPaid: number;
  penalty: number;
  interest: number;
  principal: number;
}

export interface LandLotData {
  // Section 1 — Loan Info
  loanName: string;
  lender: Lender | '';
  loanScheme: string;
  propertyReference: string;
  contractReference: string;
  startDate: string;
  maturityDate: string;
  paymentDue: string;
  loanStatus: LoanStatus | '';
  // Section 2 — Loan Details
  totalContractPrice: string;
  equity: string;
  interestRate: string;
  interestType: InterestType | '';
  interestResetPeriod: string;
  loanTerm: string;
  monthlyAmortization: string;
  modeOfPayment: ModeOfPayment | '';
  // Section 3 — Payments
  payments: Payment[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const LLF_PREFIX = '__LLF__';

const LENDER_OPTIONS = [
  { label: 'Bank', value: 'bank', icon: 'bank' },
  { label: 'Developer', value: 'developer', icon: 'building' },
  { label: 'PAG-IBIG', value: 'pagibig', icon: 'heart' },
];

const LOAN_SCHEME_MAP: Record<Lender, string> = {
  bank: 'Bank Loan',
  developer: 'In-House Financing',
  pagibig: 'PAG-IBIG Loan',
};

const INTEREST_TYPE_OPTIONS = [
  { label: 'Fixed', value: 'fixed', icon: 'lock' },
  { label: 'Variable', value: 'variable', icon: 'line-chart' },
  { label: 'Repricing', value: 'repricing', icon: 'refresh' },
];

const PAYMENT_MODE_OPTIONS = [
  { label: 'PDCs (Post-Dated Checks)', value: 'pdc', icon: 'file-text-o' },
  { label: 'Auto-Debit Arrangement', value: 'auto_debit', icon: 'refresh' },
  { label: 'OTC (Over the Counter)', value: 'otc', icon: 'bank' },
  { label: 'Online Banking', value: 'online_banking', icon: 'laptop' },
];

const LOAN_STATUS_OPTIONS = [
  { label: 'Active', value: 'active', icon: 'check-circle-o' },
  { label: 'Paid Off', value: 'paid_off', icon: 'check' },
  { label: 'In Default', value: 'in_default', icon: 'exclamation-triangle' },
  { label: 'Foreclosed', value: 'foreclosed', icon: 'times-circle-o' },
  { label: 'Restructured', value: 'restructured', icon: 'refresh' },
];

const EMPTY_DATA: LandLotData = {
  loanName: '',
  lender: '',
  loanScheme: '',
  propertyReference: '',
  contractReference: '',
  startDate: '',
  maturityDate: '',
  paymentDue: '',
  loanStatus: 'active',
  totalContractPrice: '',
  equity: '',
  interestRate: '',
  interestType: '',
  interestResetPeriod: '',
  loanTerm: '',
  monthlyAmortization: '',
  modeOfPayment: '',
  payments: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "20 years", "240 months", "20", etc. → total months */
function parseLoanTermMonths(loanTerm: string): number {
  const lower = loanTerm.toLowerCase();
  const num = parseFloat(loanTerm);
  if (isNaN(num) || num <= 0) return 0;
  if (lower.includes('month')) return Math.round(num);
  return Math.round(num * 12); // default: years
}

/** Standard reducing-balance monthly amortization formula */
function computeMonthlyAmortization(principal: number, annualRatePct: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRatePct <= 0) return principal / termMonths; // interest-free
  const r = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

export function parseLLFNotes(notes: string | null | undefined): LandLotData | null {
  if (!notes) return null;
  const idx = notes.indexOf(LLF_PREFIX);
  if (idx === -1) return null;
  try {
    return JSON.parse(notes.slice(idx + LLF_PREFIX.length).trim());
  } catch {
    return null;
  }
}

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View className="flex-row items-center mt-6 mb-3">
      <View className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 items-center justify-center mr-3">
        <FontAwesome name={icon as any} size={14} color="#ea580c" />
      </View>
      <Text className="text-sm font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider">
        {title}
      </Text>
    </View>
  );
}

function ReadOnlyField({ label, value, placeholder }: { label: string; value: string; placeholder?: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">{label}</Text>
      <View className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-4 py-3">
        <Text className={value ? 'text-base text-surface-900 dark:text-surface-100' : 'text-base text-surface-400'}>
          {value || (placeholder ?? '—')}
        </Text>
      </View>
    </View>
  );
}

function InsightRow({
  label,
  value,
  color,
  isLast,
}: {
  label: string;
  value: string;
  color?: 'green' | 'orange' | 'red';
  isLast?: boolean;
}) {
  const valueClass =
    color === 'green'
      ? 'text-green-600'
      : color === 'orange'
      ? 'text-orange-600'
      : color === 'red'
      ? 'text-red-600'
      : 'text-surface-900 dark:text-surface-100';
  return (
    <View
      className={`flex-row justify-between items-center py-2.5 ${
        !isLast ? 'border-b border-surface-100 dark:border-surface-700' : ''
      }`}
    >
      <Text className="text-sm text-surface-500 dark:text-surface-400">{label}</Text>
      <Text className={`text-sm font-bold ${valueClass}`}>{value}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (description: string, amount: number, notes: string) => void;
  editingNotes?: string | null;
  isEditing?: boolean;
}

export default function LandLotFinancingModal({ visible, onClose, onSave, editingNotes, isEditing }: Props) {
  const [data, setData] = useState<LandLotData>(EMPTY_DATA);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentOR, setNewPaymentOR] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentPenalty, setNewPaymentPenalty] = useState('');

  useEffect(() => {
    if (visible) {
      const parsed = parseLLFNotes(editingNotes);
      setData(parsed ?? EMPTY_DATA);
      setShowAddPayment(false);
    }
  }, [visible, editingNotes]);

  const set = <K extends keyof LandLotData>(field: K, value: LandLotData[K]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  // ── Computed ──────────────────────────────────────────────────────────────

  const netLoanAmount = useMemo(() => {
    const tcp = parseFloat(data.totalContractPrice) || 0;
    const eq = parseFloat(data.equity) || 0;
    return Math.max(0, tcp - eq);
  }, [data.totalContractPrice, data.equity]);

  const principalPaidToDate = useMemo(
    () => data.payments.reduce((sum, p) => sum + p.principal, 0),
    [data.payments]
  );

  // Auto-calculate monthly amortization whenever loan details change
  useEffect(() => {
    const termMonths = parseLoanTermMonths(data.loanTerm);
    const annualRate = parseFloat(data.interestRate) || 0;
    const computed = computeMonthlyAmortization(netLoanAmount, annualRate, termMonths);
    if (computed > 0) {
      setData((prev) => ({
        ...prev,
        monthlyAmortization: (Math.round(computed * 100) / 100).toString(),
      }));
    }
  }, [netLoanAmount, data.interestRate, data.loanTerm]);

  const allocationPreview = useMemo(() => {
    const amountPaid = parseFloat(newPaymentAmount) || 0;
    const penalty = parseFloat(newPaymentPenalty) || 0;
    const annualRate = parseFloat(data.interestRate) || 0;
    const monthlyRate = annualRate / 100 / 12;
    const outstanding = Math.max(0, netLoanAmount - principalPaidToDate);
    const interest = Math.round(outstanding * monthlyRate * 100) / 100;
    const principal = Math.max(0, Math.round((amountPaid - penalty - interest) * 100) / 100);
    return { interest, principal, penalty };
  }, [newPaymentAmount, newPaymentPenalty, data.interestRate, netLoanAmount, principalPaidToDate]);

  const insights = useMemo(() => {
    const totalPaid = data.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalInterestPaid = data.payments.reduce((sum, p) => sum + p.interest, 0);
    const totalPenaltyPaid = data.payments.reduce((sum, p) => sum + p.penalty, 0);
    const outstandingBalance = Math.max(0, netLoanAmount - principalPaidToDate);

    // Remaining term = loan term − number of paid months
    const loanTermMonths = parseLoanTermMonths(data.loanTerm);
    const paidMonths = data.payments.length;
    const remainingMonths = loanTermMonths > 0 ? Math.max(0, loanTermMonths - paidMonths) : 0;
    const ry = Math.floor(remainingMonths / 12);
    const rm = remainingMonths % 12;
    const remainingTerm =
      loanTermMonths === 0
        ? 'N/A'
        : remainingMonths === 0
        ? 'Fully Paid'
        : `${ry > 0 ? `${ry}y ` : ''}${rm > 0 ? `${rm}m` : ''}`.trim();

    // Progress: principal paid vs net loan amount
    const percentPaid = netLoanAmount > 0
      ? Math.min(100, (principalPaidToDate / netLoanAmount) * 100)
      : 0;

    return { totalPaid, totalInterestPaid, totalPenaltyPaid, outstandingBalance, remainingTerm, percentPaid };
  }, [data.payments, data.loanTerm, netLoanAmount, principalPaidToDate]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddPayment = () => {
    const amountPaid = parseFloat(newPaymentAmount) || 0;
    if (amountPaid <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }
    const payment: Payment = {
      id: `p_${Date.now()}`,
      date: newPaymentDate,
      orRefNumber: newPaymentOR,
      amountPaid,
      penalty: allocationPreview.penalty,
      interest: allocationPreview.interest,
      principal: allocationPreview.principal,
    };
    set('payments', [...data.payments, payment]);
    setNewPaymentDate(new Date().toISOString().split('T')[0]);
    setNewPaymentOR('');
    setNewPaymentAmount('');
    setNewPaymentPenalty('');
    setShowAddPayment(false);
  };

  const handleSave = () => {
    if (!data.loanName.trim()) {
      Alert.alert('Loan Name Required', 'Please enter a loan name.');
      return;
    }
    const categoryPrefix = 'Category: Loans/Utang | Type: Land/Lot Financing Loan';
    const notes = `${categoryPrefix}\n${LLF_PREFIX}${JSON.stringify(data)}`;
    const amount = parseFloat(data.monthlyAmortization) || 0;
    onSave(data.loanName, amount, notes);
  };

  if (!visible) return null;

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110, backgroundColor: '#fff' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
          <Pressable onPress={onClose}>
            <Text className="text-base text-surface-500">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">
            {isEditing ? 'Edit' : 'Add'} Land/Lot Financing
          </Text>
          <View className="w-14" />
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 1 — Loan Info                                         */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <SectionHeader icon="info-circle" title="Loan Info" />

          <Input
            label="Loan Name"
            placeholder="e.g., BDO Housing Loan"
            value={data.loanName}
            onChangeText={(v) => set('loanName', v)}
          />

          <View style={{ zIndex: 100 }}>
            <Select
              label="Lender / Financing Entity"
              placeholder="Select lender"
              options={LENDER_OPTIONS}
              value={data.lender || null}
              onValueChange={(v) => {
                const lender = v as Lender;
                setData((prev) => ({ ...prev, lender, loanScheme: LOAN_SCHEME_MAP[lender] || '' }));
              }}
              iconColor="#ea580c"
            />
          </View>

          <ReadOnlyField
            label="Loan Scheme"
            value={data.loanScheme}
            placeholder="Auto-populated from lender"
          />

          <Input
            label="Property Reference"
            placeholder="e.g., Lot 12, Block 3, Subdivision Name"
            value={data.propertyReference}
            onChangeText={(v) => set('propertyReference', v)}
          />

          <Input
            label="Contract Reference"
            placeholder="e.g., Contract No. 2024-001"
            value={data.contractReference}
            onChangeText={(v) => set('contractReference', v)}
          />

          <View style={{ zIndex: 90 }}>
            <DatePicker
              label="Start Date"
              value={data.startDate}
              onChange={(v) => set('startDate', v)}
            />
          </View>

          <View style={{ zIndex: 85 }}>
            <DatePicker
              label="Maturity Date"
              value={data.maturityDate}
              onChange={(v) => set('maturityDate', v)}
            />
          </View>

          <Input
            label="Payment Due"
            placeholder="e.g., Every 15th of the month"
            value={data.paymentDue}
            onChangeText={(v) => set('paymentDue', v)}
          />

          <View style={{ zIndex: 80 }}>
            <Select
              label="Loan Status"
              placeholder="Select status"
              options={LOAN_STATUS_OPTIONS}
              value={data.loanStatus || null}
              onValueChange={(v) => set('loanStatus', v as LoanStatus)}
              iconColor="#ea580c"
            />
          </View>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 2 — Loan Details                                      */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <SectionHeader icon="calculator" title="Loan Details" />

          <Input
            label="Total Contract Price (TCP)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={data.totalContractPrice}
            onChangeText={(v) => set('totalContractPrice', v)}
            leftIcon={<Text className="text-base text-surface-400">₱</Text>}
          />

          <Input
            label="Equity / Down Payment"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={data.equity}
            onChangeText={(v) => set('equity', v)}
            leftIcon={<Text className="text-base text-surface-400">₱</Text>}
          />

          {/* Net Loan Amount — computed, read-only */}
          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">
              Net Loan Amount (TCP – Equity)
            </Text>
            <View className="flex-row items-center rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 px-4 py-3">
              <Text className="text-base text-surface-400 mr-1">₱</Text>
              <Text className="text-base font-bold text-surface-900 dark:text-surface-100">
                {fmt(netLoanAmount)}
              </Text>
            </View>
          </View>

          <View style={{ zIndex: 75 }}>
            <Select
              label="Interest Rate & Type"
              placeholder="Select interest type"
              options={INTEREST_TYPE_OPTIONS}
              value={data.interestType || null}
              onValueChange={(v) => set('interestType', v as InterestType)}
              iconColor="#ea580c"
            />
          </View>

          <Input
            label="Interest Rate (%)"
            placeholder="e.g., 6.5"
            keyboardType="decimal-pad"
            value={data.interestRate}
            onChangeText={(v) => set('interestRate', v)}
          />

          {(data.interestType === 'variable' || data.interestType === 'repricing') && (
            <Input
              label="Interest Reset Period"
              placeholder="e.g., Every 3 or 5 years"
              value={data.interestResetPeriod}
              onChangeText={(v) => set('interestResetPeriod', v)}
            />
          )}

          <Input
            label="Loan Term"
            placeholder="e.g., 20 years"
            value={data.loanTerm}
            onChangeText={(v) => set('loanTerm', v)}
          />

          <Input
            label="Monthly Amortization"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={data.monthlyAmortization}
            onChangeText={(v) => set('monthlyAmortization', v)}
            leftIcon={<Text className="text-base text-surface-400">₱</Text>}
          />

          <View style={{ zIndex: 70 }}>
            <Select
              label="Mode of Payment"
              placeholder="Select payment mode"
              options={PAYMENT_MODE_OPTIONS}
              value={data.modeOfPayment || null}
              onValueChange={(v) => set('modeOfPayment', v as ModeOfPayment)}
              iconColor="#ea580c"
            />
          </View>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 3 — Payment History                                   */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <SectionHeader icon="history" title="Payment History" />

          {data.payments.length === 0 ? (
            <View className="items-center py-8">
              <FontAwesome name="file-text-o" size={32} color="#94a3b8" />
              <Text className="mt-2 text-sm text-surface-400">No payments recorded yet</Text>
            </View>
          ) : (
            <View className="mb-2 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
              {/* Table header */}
              <View className="flex-row bg-surface-100 dark:bg-surface-800 px-3 py-2">
                <Text className="flex-1 text-xs font-bold text-surface-600 dark:text-surface-400">Date</Text>
                <Text className="w-16 text-xs font-bold text-surface-600 dark:text-surface-400">OR/Ref</Text>
                <Text className="w-20 text-xs font-bold text-surface-600 dark:text-surface-400 text-right">
                  Amount
                </Text>
                <Text className="w-20 text-xs font-bold text-surface-600 dark:text-surface-400 text-right">
                  Principal
                </Text>
                <Text className="w-7" />
              </View>
              {/* Table rows */}
              {data.payments.map((p, idx) => (
                <View
                  key={p.id}
                  className={`flex-row px-3 py-2 items-center ${
                    idx % 2 === 0 ? 'bg-white dark:bg-surface-900' : 'bg-surface-50 dark:bg-surface-800'
                  }`}
                >
                  <Text className="flex-1 text-xs text-surface-700 dark:text-surface-300">
                    {formatDate(p.date)}
                  </Text>
                  <Text className="w-16 text-xs text-surface-500">{p.orRefNumber || '—'}</Text>
                  <Text className="w-20 text-xs font-medium text-surface-900 dark:text-surface-100 text-right">
                    ₱{fmt(p.amountPaid)}
                  </Text>
                  <Text className="w-20 text-xs text-green-600 text-right">₱{fmt(p.principal)}</Text>
                  <Pressable
                    onPress={() => set('payments', data.payments.filter((x) => x.id !== p.id))}
                    className="w-7 items-center"
                  >
                    <FontAwesome name="trash" size={11} color="#dc2626" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Add Payment Button */}
          {!showAddPayment && (
            <Pressable
              onPress={() => setShowAddPayment(true)}
              className="flex-row items-center justify-center border border-dashed border-orange-400 rounded-xl py-3 mb-4 mt-2"
            >
              <FontAwesome name="plus" size={14} color="#ea580c" />
              <Text className="ml-2 text-sm font-medium text-orange-600">Add Payment</Text>
            </Pressable>
          )}

          {/* Add Payment Form */}
          {showAddPayment && (
            <View className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 mb-4 mt-2 border border-surface-200 dark:border-surface-700">
              <Text className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-3">
                New Payment
              </Text>

              <View style={{ zIndex: 60 }}>
                <DatePicker label="Payment Date" value={newPaymentDate} onChange={setNewPaymentDate} />
              </View>

              <Input
                label="OR / Reference Number"
                placeholder="e.g., OR-2024-001"
                value={newPaymentOR}
                onChangeText={setNewPaymentOR}
              />

              <Input
                label="Amount Paid"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={newPaymentAmount}
                onChangeText={setNewPaymentAmount}
                leftIcon={<Text className="text-base text-surface-400">₱</Text>}
              />

              <Input
                label="Penalty (if any)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={newPaymentPenalty}
                onChangeText={setNewPaymentPenalty}
                leftIcon={<Text className="text-base text-surface-400">₱</Text>}
              />

              {/* Auto-allocation preview */}
              {parseFloat(newPaymentAmount) > 0 && (
                <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                  <Text className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">
                    Auto-Allocation Preview
                  </Text>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-blue-600 dark:text-blue-400">Interest</Text>
                    <Text className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      ₱{fmt(allocationPreview.interest)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-blue-600 dark:text-blue-400">Principal</Text>
                    <Text className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      ₱{fmt(allocationPreview.principal)}
                    </Text>
                  </View>
                  {allocationPreview.penalty > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-red-600">Penalty</Text>
                      <Text className="text-xs font-medium text-red-700">
                        ₱{fmt(allocationPreview.penalty)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowAddPayment(false);
                    setNewPaymentDate(new Date().toISOString().split('T')[0]);
                    setNewPaymentOR('');
                    setNewPaymentAmount('');
                    setNewPaymentPenalty('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-surface-200 dark:bg-surface-700"
                >
                  <Text className="text-center font-medium text-surface-700 dark:text-surface-300">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable onPress={handleAddPayment} className="flex-1 py-3 rounded-xl bg-orange-500">
                  <Text className="text-center font-medium text-white">Add</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 4 — Insights                                          */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <SectionHeader icon="bar-chart" title="Insights" />

          <View className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-4 mb-4">
            {/* Progress bar */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-xs text-surface-500 dark:text-surface-400">Loan Progress</Text>
                <Text className="text-xs font-bold text-orange-600">
                  {insights.percentPaid.toFixed(1)}% Paid
                </Text>
              </View>
              <View className="h-3.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                <View
                  className="h-3.5 bg-orange-500 rounded-full"
                  style={{ width: `${insights.percentPaid}%` }}
                />
              </View>
            </View>

            <InsightRow label="Net Loan Amount" value={`₱${fmt(netLoanAmount)}`} />
            <InsightRow
              label="Total Paid to Date"
              value={`₱${fmt(insights.totalPaid)}`}
              color="green"
            />
            <InsightRow
              label="Outstanding Balance"
              value={`₱${fmt(insights.outstandingBalance)}`}
              color="orange"
            />
            <InsightRow
              label="Interest Paid to Date"
              value={`₱${fmt(insights.totalInterestPaid)}`}
            />
            <InsightRow
              label="Penalties Paid"
              value={`₱${fmt(insights.totalPenaltyPaid)}`}
              color={insights.totalPenaltyPaid > 0 ? 'red' : undefined}
            />
            <InsightRow label="Remaining Term" value={insights.remainingTerm} isLast />
          </View>

          {/* Save */}
          <View className="mb-8 mt-2">
            <Button
              title={isEditing ? 'Update Loan' : 'Save Loan'}
              onPress={handleSave}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
