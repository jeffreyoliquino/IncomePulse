import { Button, Card, DatePicker, Input, Select } from '@/src/components/ui';
import LandLotFinancingModal, { LLF_PREFIX } from '@/src/features/financial-obligations/components/LandLotFinancingModal';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { formatCurrency, formatDate } from '@/src/lib/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { z } from 'zod';

// Categories
type ObligationCategory = 'loans' | 'credit_cards' | 'insurance' | 'taxes';
type LoanType = 'land_lot_financing' | 'housing_loan' | 'car_loan' | 'house_lot_loan' | 'property_loan' | 'personal_loan' | 'salary_loan' | 'sss_loan' | 'pagibig_loan' | 'friend_family_loan' | 'suking_tindahan_loan';
type InsuranceType = 'life_insurance' | 'health_insurance' | 'car_insurance' | 'house_insurance';
type TaxType = 'real_estate_tax' | 'property_tax' | 'income_tax';

const OBLIGATION_CATEGORIES: { label: string; value: ObligationCategory; icon: string }[] = [
  { label: 'Loans/Utang', value: 'loans', icon: 'bank' },
  { label: 'Credit Cards', value: 'credit_cards', icon: 'credit-card' },
  { label: 'Insurance', value: 'insurance', icon: 'shield' },
  { label: 'Taxes', value: 'taxes', icon: 'file-text-o' },
];

const LOAN_TYPES: { label: string; value: LoanType; icon: string }[] = [
  { label: 'Land/Lot Financing Loan', value: 'land_lot_financing', icon: 'map' },
  { label: 'Housing Loan', value: 'housing_loan', icon: 'home' },
  { label: 'Car Loan', value: 'car_loan', icon: 'car' },
  { label: 'House and Lot Loan', value: 'house_lot_loan', icon: 'home' },
  { label: 'Property Loan', value: 'property_loan', icon: 'building' },
  { label: 'Personal Loan', value: 'personal_loan', icon: 'user' },
  { label: 'Salary Loan', value: 'salary_loan', icon: 'money' },
  { label: 'SSS Loan', value: 'sss_loan', icon: 'id-card' },
  { label: 'Pag-ibig Loan', value: 'pagibig_loan', icon: 'heart' },
  { label: 'Friend/Family Loan', value: 'friend_family_loan', icon: 'users' },
  { label: 'Utang sa Tindahan', value: 'suking_tindahan_loan', icon: 'shopping-basket' },
];

const INSURANCE_TYPES: { label: string; value: InsuranceType; icon: string }[] = [
  { label: 'Life Insurance', value: 'life_insurance', icon: 'heartbeat' },
  { label: 'Health Insurance', value: 'health_insurance', icon: 'medkit' },
  { label: 'Car Insurance', value: 'car_insurance', icon: 'car' },
  { label: 'House Insurance', value: 'house_insurance', icon: 'home' },
];

const TAX_TYPES: { label: string; value: TaxType; icon: string }[] = [
  { label: 'Real Estate Tax', value: 'real_estate_tax', icon: 'building' },
  { label: 'Property Tax', value: 'property_tax', icon: 'home' },
  { label: 'Income Tax', value: 'income_tax', icon: 'money' },
];

type RecurringOption = 'none' | 'weekly' | 'monthly' | 'yearly';

const RECURRING_OPTIONS: { label: string; value: RecurringOption; icon: string }[] = [
  { label: 'None', value: 'none', icon: 'times' },
  { label: 'Weekly', value: 'weekly', icon: 'calendar' },
  { label: 'Monthly', value: 'monthly', icon: 'calendar-o' },
  { label: 'Yearly', value: 'yearly', icon: 'calendar-check-o' },
];

type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'gcash' | 'paymaya' | 'check' | 'other';

const PAYMENT_METHODS: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'Cash', value: 'cash', icon: 'money' },
  { label: 'Bank Transfer', value: 'bank_transfer', icon: 'exchange' },
  { label: 'Credit Card', value: 'credit_card', icon: 'credit-card' },
  { label: 'Debit Card', value: 'debit_card', icon: 'credit-card-alt' },
  { label: 'GCash', value: 'gcash', icon: 'mobile' },
  { label: 'PayMaya', value: 'paymaya', icon: 'mobile' },
  { label: 'Check', value: 'check', icon: 'file-text' },
  { label: 'Other', value: 'other', icon: 'ellipsis-h' },
];

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

export default function FinancialObligationsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<ObligationCategory | null>(null);
  const [loanType, setLoanType] = useState<LoanType | null>(null);
  const [insuranceType, setInsuranceType] = useState<InsuranceType | null>(null);
  const [taxType, setTaxType] = useState<TaxType | null>(null);
  const [storeName, setStoreName] = useState('');
  const [recurringOption, setRecurringOption] = useState<RecurringOption>('none');
  const [showLandLotModal, setShowLandLotModal] = useState(false);
  const [editingLandLotTransaction, setEditingLandLotTransaction] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [obligationToPay, setObligationToPay] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionSync();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: '',
    },
  });

  // Filter transactions that are financial obligations
  const obligationTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const notes = t.notes || '';
        return (
          notes.includes('Category: Loans') ||
          notes.includes('Category: Credit Cards') ||
          notes.includes('Category: Insurance') ||
          notes.includes('Category: Taxes')
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Filter based on tab
  const today = new Date().toISOString().split('T')[0];

  const filteredTransactions = useMemo(() => {
    return obligationTransactions.filter((t) => {
      const isMarkedPaid = t.notes?.includes('Status: Paid');
      const isPast = t.date < today;
      const isPaid = isMarkedPaid || isPast;
      return activeTab === 'history' ? !!isPaid : !isPaid;
    });
  }, [obligationTransactions, activeTab, today]);

  // Calculate total
  const totalObligations = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Group by month
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: typeof filteredTransactions; total: number; label: string } } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

      if (!groups[monthKey]) {
        groups[monthKey] = { transactions: [], total: 0, label: monthLabel };
      }
      groups[monthKey].transactions.push(transaction);
      groups[monthKey].total += transaction.amount;
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => ({ key, ...value }));
  }, [filteredTransactions]);

  const getVendor = (notes: string | null) => {
    if (!notes) return null;
    const vendorLine = notes.split('\n').find((line) => line.startsWith('Vendor: '));
    return vendorLine ? vendorLine.replace('Vendor: ', '').trim() : null;
  };

  const getCategoryInfo = (): string | null => {
    const parts: string[] = [];

    if (category) {
      const categoryLabel = OBLIGATION_CATEGORIES.find(c => c.value === category)?.label;
      if (categoryLabel) parts.push(`Category: ${categoryLabel}`);

      if (category === 'loans' && loanType) {
        const subLabel = LOAN_TYPES.find(s => s.value === loanType)?.label;
        if (subLabel) parts.push(`Type: ${subLabel}`);
      }

      if (category === 'insurance' && insuranceType) {
        const subLabel = INSURANCE_TYPES.find(s => s.value === insuranceType)?.label;
        if (subLabel) parts.push(`Type: ${subLabel}`);
      }

      if (category === 'taxes' && taxType) {
        const subLabel = TAX_TYPES.find(s => s.value === taxType)?.label;
        if (subLabel) parts.push(`Type: ${subLabel}`);
      }
    }

    if (recurringOption && recurringOption !== 'none') {
      const recurringLabel = RECURRING_OPTIONS.find(r => r.value === recurringOption)?.label;
      if (recurringLabel) parts.push(`Recurring: ${recurringLabel}`);
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  };

  const resetState = () => {
    setCategory(null);
    setLoanType(null);
    setInsuranceType(null);
    setTaxType(null);
    setStoreName('');
    setRecurringOption('none');
  };

  const parseNotesForEdit = (notes: string | null) => {
    if (!notes) return { vendor: '', customNotes: '' };

    const lines = notes.split('\n');
    let vendor = '';
    let customNotes: string[] = [];
    let category: ObligationCategory | null = null;
    let loanType: LoanType | null = null;
    let insuranceType: InsuranceType | null = null;
    let taxType: TaxType | null = null;
    let recurringOption: RecurringOption = 'none';

    for (const line of lines) {
      // Check if this line contains the category info (formatted as "Category: X | Type: Y | Recurring: Z")
      if (line.includes('Category:') || line.includes('Type:') || line.includes('Recurring:')) {
        // Split by ' | ' to get individual parts
        const parts = line.split(' | ');

        for (const part of parts) {
          const trimmedPart = part.trim();

          if (trimmedPart.startsWith('Category: ')) {
            const categoryLabel = trimmedPart.replace('Category: ', '').trim();
            const categoryMatch = OBLIGATION_CATEGORIES.find(c => c.label === categoryLabel);
            if (categoryMatch) category = categoryMatch.value;
          } else if (trimmedPart.startsWith('Type: ')) {
            const typeLabel = trimmedPart.replace('Type: ', '').trim();
            const loanMatch = LOAN_TYPES.find(t => t.label === typeLabel);
            const insuranceMatch = INSURANCE_TYPES.find(t => t.label === typeLabel);
            const taxMatch = TAX_TYPES.find(t => t.label === typeLabel);
            if (loanMatch) loanType = loanMatch.value;
            if (insuranceMatch) insuranceType = insuranceMatch.value;
            if (taxMatch) taxType = taxMatch.value;
          } else if (trimmedPart.startsWith('Recurring: ')) {
            const recurringLabel = trimmedPart.replace('Recurring: ', '').trim();
            const recurringMatch = RECURRING_OPTIONS.find(r => r.label === recurringLabel);
            if (recurringMatch) recurringOption = recurringMatch.value;
          }
        }
      } else if (line.startsWith('Store: ')) {
        setStoreName(line.replace('Store: ', '').trim());
      } else if (line.startsWith('Vendor: ')) {
        vendor = line.replace('Vendor: ', '').trim();
      } else if (!line.includes('Status:') && line.trim() !== '') {
        customNotes.push(line);
      }
    }

    return {
      vendor,
      customNotes: customNotes.join('\n').trim(),
      category,
      loanType,
      insuranceType,
      taxType,
      recurringOption,
    };
  };

  const handleLandLotSave = async (description: string, amount: number, notes: string) => {
    const transactionData = {
      type: 'expense' as const,
      amount,
      description,
      notes,
      date: new Date().toISOString().split('T')[0],
      is_recurring: false,
    };
    if (editingLandLotTransaction) {
      await updateTransaction(editingLandLotTransaction.id, transactionData);
    } else {
      await addTransaction({
        user_id: user?.id ?? '',
        account_id: '',
        category_id: null,
        ...transactionData,
        currency: 'PHP',
        recurring_id: null,
        receipt_url: null,
        source: 'manual' as const,
        transfer_to_account_id: null,
      });
    }
    setShowLandLotModal(false);
    setEditingLandLotTransaction(null);
  };

  const handleEdit = (transaction: any) => {
    // Land/Lot Financing has its own dedicated modal
    if (transaction.notes?.includes(LLF_PREFIX)) {
      setEditingLandLotTransaction(transaction);
      setShowLandLotModal(true);
      return;
    }

    setEditingTransaction(transaction);

    setStoreName('');
    const parsed = parseNotesForEdit(transaction.notes);

    // Set state variables
    setCategory(parsed.category || null);
    setLoanType(parsed.loanType || null);
    setInsuranceType(parsed.insuranceType || null);
    setTaxType(parsed.taxType || null);
    setRecurringOption(parsed.recurringOption || 'none');

    reset({
      description: transaction.description ?? '',
      amount: transaction.amount.toString(),
      date: transaction.date,
      vendor: parsed.vendor,
      notes: parsed.customNotes,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setShowDeleteConfirm(null);
  };

  const handleMarkAsPaid = async () => {
    if (obligationToPay && paymentDate) {
      const currentNotes = obligationToPay.notes || '';
      const paymentMethodLabel = PAYMENT_METHODS.find(pm => pm.value === paymentMethod)?.label || paymentMethod;

      let newNotes = currentNotes;
      if (!currentNotes.includes('Status: Paid')) {
        newNotes = `${currentNotes}\nPayment Method: ${paymentMethodLabel}\nStatus: Paid`.trim();
      }

      await updateTransaction(obligationToPay.id, {
        ...obligationToPay,
        date: paymentDate,
        notes: newNotes,
      });
      setObligationToPay(null);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('cash');
    }
  };

  const handleFormSubmit = async (data: TransactionForm) => {
    const categoryInfo = getCategoryInfo();
    let notesContent: string[] = [];
    if (categoryInfo) notesContent.push(categoryInfo);
    if (loanType === 'suking_tindahan_loan' && storeName.trim()) notesContent.push(`Store: ${storeName.trim()}`);
    if (data.vendor) notesContent.push(`Vendor: ${data.vendor}`);
    if (data.notes) notesContent.push(data.notes);

    const transactionData = {
      type: 'expense' as const,
      amount: parseFloat(data.amount),
      description: data.description,
      notes: notesContent.length > 0 ? notesContent.join('\n') : null,
      date: data.date,
      is_recurring: recurringOption !== 'none',
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, transactionData);
    } else {
      await addTransaction({
        user_id: user?.id ?? '',
        account_id: '',
        category_id: null,
        ...transactionData,
        currency: 'PHP',
        recurring_id: null,
        receipt_url: null,
        source: 'manual' as const,
        transfer_to_account_id: null,
      });
    }

    reset();
    resetState();
    setEditingTransaction(null);
    setShowAddModal(false);
  };

  const handleOpenAddModal = () => {
    reset({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: '',
    });
    resetState();
    setEditingTransaction(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    resetState();
    setEditingTransaction(null);
    setShowAddModal(false);
    reset();
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="bg-white dark:bg-surface-800 px-4 py-4 border-b border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Financial Obligations
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              Loans, Insurance, Taxes
            </Text>
          </View>
          <View className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
            <Text className="text-sm font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(totalObligations)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 py-2 gap-2 bg-surface-50 dark:bg-surface-900">
        <Pressable
          onPress={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'upcoming' ? 'bg-orange-600' : 'bg-surface-200 dark:bg-surface-700'}`}
        >
          <Text className={`font-bold ${activeTab === 'upcoming' ? 'text-white' : 'text-surface-600 dark:text-surface-300'}`}>Upcoming Obligations</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'history' ? 'bg-orange-600' : 'bg-surface-200 dark:bg-surface-700'}`}
        >
          <Text className={`font-bold ${activeTab === 'history' ? 'text-white' : 'text-surface-600 dark:text-surface-300'}`}>Paid Obligations</Text>
        </Pressable>
      </View>

      {/* Transaction List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {groupedTransactions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="file-text-o" size={48} color="#ea580c" />
            <Text className="mt-4 text-base text-surface-400">No {activeTab} obligations</Text>
            <Text className="mt-1 text-sm text-surface-400">Tap + to add a record</Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.key} className="mb-4">
              <View className="flex-row items-center justify-between mb-2 px-3 py-2 rounded-lg bg-orange-600">
                <Text className="text-base font-bold text-white">{group.label}</Text>
                <Text className="text-sm font-bold text-white">
                  -{formatCurrency(group.total)}
                </Text>
              </View>

              {group.transactions.map((transaction) => (
                <Card key={transaction.id} variant="elevated" className="mb-2">
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                      <FontAwesome name="file-text-o" size={16} color="#ea580c" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {transaction.description}
                      </Text>
                      {getVendor(transaction.notes) && (
                        <Text className="text-xs text-surface-500 dark:text-surface-400">
                          {getVendor(transaction.notes)}
                        </Text>
                      )}
                      <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                    </View>
                    <Text className="text-sm font-bold text-orange-600 mr-3">
                      -{formatCurrency(transaction.amount)}
                    </Text>
                    <View className="flex-row gap-2">
                      {activeTab === 'upcoming' && (
                        <Pressable
                          onPress={() => {
                            setObligationToPay(transaction);
                            setPaymentDate(new Date().toISOString().split('T')[0]);
                            setPaymentMethod('cash');
                          }}
                          className="p-2 rounded-lg bg-green-50"
                        >
                          <FontAwesome name="check" size={14} color="#16a34a" />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => handleEdit(transaction)}
                        className="p-2 rounded-lg bg-primary-50"
                      >
                        <FontAwesome name="pencil" size={14} color="#2563eb" />
                      </Pressable>
                      <Pressable
                        onPress={() => setShowDeleteConfirm(transaction.id)}
                        className="p-2 rounded-lg bg-danger-50"
                      >
                        <FontAwesome name="trash" size={14} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={handleOpenAddModal}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          zIndex: 50,
          height: 56,
          width: 56,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 28,
          backgroundColor: '#ea580c',
        }}
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add Modal */}
      {showAddModal && (
        // ... (Modal content remains the same as previous file)
        // For brevity in this diff, I'm assuming the rest of the file is copied exactly
        // but I will include the full file content in the actual file creation above
        // to ensure it works correctly.
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#ffffff' }}
        >
          {/* ... existing modal code ... */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
             {/* ... */}
             <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
              <Pressable onPress={handleCloseModal}>
                <Text className="text-base text-surface-500">Cancel</Text>
              </Pressable>
              <Text className="text-lg font-bold text-surface-900">
                {editingTransaction ? 'Edit Obligation' : 'Add Obligation'}
              </Text>
              <View className="w-12" />
            </View>
            {/* ... rest of the modal ... */}
            <ScrollView className="flex-1 px-4 pt-4">
              {/* ... form fields ... */}
              <View style={{ zIndex: 100 }}>
                <Select
                  label="Category"
                  placeholder="Select category"
                  options={OBLIGATION_CATEGORIES}
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value as ObligationCategory);
                    setLoanType(null);
                    setInsuranceType(null);
                    setTaxType(null);
                  }}
                  iconColor="#ea580c"
                />
              </View>

              {category === 'loans' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Loan Type"
                    placeholder="Select loan type"
                    options={LOAN_TYPES}
                    value={loanType}
                    onValueChange={(value) => {
                      if (value === 'land_lot_financing') {
                        setShowAddModal(false);
                        setEditingLandLotTransaction(null);
                        setShowLandLotModal(true);
                        return;
                      }
                      setLoanType(value as LoanType);
                      if (value !== 'suking_tindahan_loan') setStoreName('');
                    }}
                    iconColor="#ea580c"
                  />
                </View>
              )}

              {loanType === 'suking_tindahan_loan' && (
                <Input
                  label="Store Name"
                  placeholder="e.g., Aling Nena's Store"
                  value={storeName}
                  onChangeText={setStoreName}
                />
              )}

              {category === 'insurance' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Insurance Type"
                    placeholder="Select insurance type"
                    options={INSURANCE_TYPES}
                    value={insuranceType}
                    onValueChange={(value) => setInsuranceType(value as InsuranceType)}
                    iconColor="#ea580c"
                  />
                </View>
              )}

              {category === 'taxes' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Tax Type"
                    placeholder="Select tax type"
                    options={TAX_TYPES}
                    value={taxType}
                    onValueChange={(value) => setTaxType(value as TaxType)}
                    iconColor="#ea580c"
                  />
                </View>
              )}

              <View style={{ zIndex: 85 }}>
                <Select
                  label="Recurring"
                  placeholder="Select recurring option"
                  options={RECURRING_OPTIONS}
                  value={recurringOption}
                  onValueChange={(value) => setRecurringOption(value as RecurringOption)}
                  iconColor="#0891b2"
                />
              </View>

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Description"
                    placeholder="e.g., Monthly Amortization"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.description?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="vendor"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Vendor/Merchant"
                    placeholder="e.g., BDO, SSS, City Hall"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Amount (PHP)"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.amount?.message}
                    leftIcon={<Text className="text-base text-surface-400">₱</Text>}
                  />
                )}
              />

              <Controller
                control={control}
                name="date"
                render={({ field: { onChange, value } }) => (
                  <View style={{ zIndex: 70 }}>
                    <DatePicker
                      label="Date"
                      value={value}
                      onChange={onChange}
                      error={errors.date?.message}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Notes (optional)"
                    placeholder="Add any notes..."
                    multiline
                    numberOfLines={3}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <View className="mb-8 mt-4">
                <Button
                  title={editingTransaction ? 'Update Obligation' : 'Save Obligation'}
                  onPress={handleSubmit(handleFormSubmit)}
                  fullWidth
                  size="lg"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-danger-100 items-center justify-center mb-3">
                <FontAwesome name="trash" size={28} color="#dc2626" />
              </View>
              <Text className="text-lg font-bold text-surface-900">Delete Record?</Text>
              <Text className="text-sm text-surface-500 text-center mt-2">
                This action cannot be undone.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-surface-100"
              >
                <Text className="text-center font-medium text-surface-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-danger-500"
              >
                <Text className="text-center font-medium text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Land/Lot Financing Dedicated Modal */}
      <LandLotFinancingModal
        visible={showLandLotModal}
        onClose={() => {
          setShowLandLotModal(false);
          setEditingLandLotTransaction(null);
        }}
        onSave={handleLandLotSave}
        editingNotes={editingLandLotTransaction?.notes}
        isEditing={!!editingLandLotTransaction}
      />

      {/* Mark as Paid Modal */}
      <Modal
        visible={!!obligationToPay}
        transparent
        animationType="fade"
        onRequestClose={() => setObligationToPay(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="bg-white dark:bg-surface-800 w-full max-w-sm rounded-2xl p-6">
            <Text className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">
              Mark as Paid
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              Confirm payment for {obligationToPay?.description}
            </Text>

            <View className="mb-4" style={{ zIndex: 20 }}>
              <DatePicker
                label="Date Paid"
                value={paymentDate}
                onChange={setPaymentDate}
              />
            </View>

            <View className="mb-6" style={{ zIndex: 10 }}>
              <Select
                label="Payment Method"
                placeholder="Select payment method"
                options={PAYMENT_METHODS}
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                iconColor="#16a34a"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Cancel" variant="outline" onPress={() => setObligationToPay(null)} />
              </View>
              <View className="flex-1">
                <Button title="Confirm" onPress={handleMarkAsPaid} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}