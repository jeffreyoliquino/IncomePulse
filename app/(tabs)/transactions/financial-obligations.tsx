import { Button, Card, DatePicker, Input, Select } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { formatCurrency, formatDate } from '@/src/lib/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
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
  { label: 'Bank Transfer', value: 'bank_transfer', icon: 'bank' },
  { label: 'Credit Card', value: 'credit_card', icon: 'credit-card' },
  { label: 'Debit Card', value: 'debit_card', icon: 'credit-card-alt' },
  { label: 'GCash', value: 'gcash', icon: 'mobile' },
  { label: 'PayMaya', value: 'paymaya', icon: 'mobile' },
  { label: 'Check', value: 'check', icon: 'file-text-o' },
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
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [obligationToMarkPaid, setObligationToMarkPaid] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

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

  // Debug: Log state changes
  useEffect(() => {
    console.log('State updated - category:', category);
  }, [category]);

  useEffect(() => {
    console.log('State updated - loanType:', loanType);
  }, [loanType]);

  useEffect(() => {
    console.log('State updated - recurringOption:', recurringOption);
  }, [recurringOption]);

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

  // Separate paid and unpaid obligations
  const unpaidObligations = useMemo(() => {
    return obligationTransactions.filter((t) => {
      const notes = t.notes || '';
      return !notes.includes('Status: Paid');
    });
  }, [obligationTransactions]);

  const paidObligations = useMemo(() => {
    return obligationTransactions.filter((t) => {
      const notes = t.notes || '';
      return notes.includes('Status: Paid');
    });
  }, [obligationTransactions]);

  // Calculate total
  const totalObligations = useMemo(() => {
    return unpaidObligations.reduce((sum, t) => sum + t.amount, 0);
  }, [unpaidObligations]);

  // Group unpaid by month
  const groupedUnpaidTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: typeof unpaidObligations; total: number; label: string } } = {};

    unpaidObligations.forEach((transaction) => {
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
  }, [unpaidObligations]);

  // Group paid by month
  const groupedPaidTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: typeof paidObligations; total: number; label: string } } = {};

    paidObligations.forEach((transaction) => {
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
  }, [paidObligations]);

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

  const handleEdit = (transaction: any) => {
    console.log('=== EDIT CLICKED ===');
    console.log('Transaction:', transaction);

    // Parse notes to extract category information
    const notes = transaction.notes || '';
    console.log('Full notes string:', notes);

    let extractedVendor = '';
    let extractedNotes = '';
    let categoryToSet: ObligationCategory | null = null;
    let loanTypeToSet: LoanType | null = null;
    let insuranceTypeToSet: InsuranceType | null = null;
    let taxTypeToSet: TaxType | null = null;
    let recurringToSet: RecurringOption = 'none';

    // Extract category
    const categoryMatch = notes.match(/Category:\s*([^|\n]+)/);
    console.log('Category match:', categoryMatch);
    if (categoryMatch) {
      const categoryLabel = categoryMatch[1].trim();
      console.log('Category label found:', categoryLabel);
      const foundCategory = OBLIGATION_CATEGORIES.find(c => c.label === categoryLabel)
        ?? (categoryLabel === 'Loans' ? OBLIGATION_CATEGORIES.find(c => c.value === 'loans') : undefined)
        ?? undefined;
      console.log('Found category object:', foundCategory);
      if (foundCategory) {
        categoryToSet = foundCategory.value;

        // Extract subcategory based on category type
        const typeMatch = notes.match(/Type:\s*([^|\n]+)/);
        console.log('Type match:', typeMatch);
        if (typeMatch) {
          const typeLabel = typeMatch[1].trim();
          console.log('Type label found:', typeLabel);

          if (foundCategory.value === 'loans') {
            const foundLoanType = LOAN_TYPES.find(t => t.label === typeLabel);
            console.log('Found loan type:', foundLoanType);
            if (foundLoanType) loanTypeToSet = foundLoanType.value;
          } else if (foundCategory.value === 'insurance') {
            const foundInsuranceType = INSURANCE_TYPES.find(t => t.label === typeLabel);
            if (foundInsuranceType) insuranceTypeToSet = foundInsuranceType.value;
          } else if (foundCategory.value === 'taxes') {
            const foundTaxType = TAX_TYPES.find(t => t.label === typeLabel);
            if (foundTaxType) taxTypeToSet = foundTaxType.value;
          }
        }
      }
    }

    // Extract recurring option
    const recurringMatch = notes.match(/Recurring:\s*([^|\n]+)/);
    console.log('Recurring match:', recurringMatch);
    if (recurringMatch) {
      const recurringLabel = recurringMatch[1].trim();
      console.log('Recurring label found:', recurringLabel);
      const foundRecurring = RECURRING_OPTIONS.find(r => r.label === recurringLabel);
      console.log('Found recurring option:', foundRecurring);
      if (foundRecurring) recurringToSet = foundRecurring.value;
    }

    // Extract store name (for Utang sa Tindahan)
    const storeMatch = notes.match(/Store:\s*([^\n|]+)/);
    if (storeMatch) setStoreName(storeMatch[1].trim());
    else setStoreName('');

    // Extract vendor
    const vendorMatch = notes.match(/Vendor:\s*([^\n]+)/);
    console.log('Vendor match:', vendorMatch);
    if (vendorMatch) {
      extractedVendor = vendorMatch[1].trim();
      console.log('Vendor extracted:', extractedVendor);
    }

    // Extract remaining notes (filter out the structured data)
    const notesLines = notes.split('\n').filter((line: string) =>
      !line.startsWith('Category:') &&
      !line.startsWith('Type:') &&
      !line.startsWith('Recurring:') &&
      !line.startsWith('Vendor:') &&
      !line.startsWith('Store:') &&
      !line.startsWith('Status:') &&
      !line.startsWith('Payment Date:') &&
      !line.startsWith('Payment Method:')
    );
    extractedNotes = notesLines.join('\n').trim();
    console.log('Extracted notes for textarea:', extractedNotes);

    console.log('=== SETTING STATES ===');
    console.log('categoryToSet:', categoryToSet);
    console.log('loanTypeToSet:', loanTypeToSet);
    console.log('recurringToSet:', recurringToSet);
    console.log('extractedVendor:', extractedVendor);

    // Set editing transaction
    setEditingTransaction(transaction);

    // Set all states
    setCategory(categoryToSet);
    setLoanType(loanTypeToSet);
    setInsuranceType(insuranceTypeToSet);
    setTaxType(taxTypeToSet);
    setRecurringOption(recurringToSet);

    // Reset form with extracted values
    reset({
      description: transaction.description ?? '',
      amount: transaction.amount.toString(),
      date: transaction.date,
      vendor: extractedVendor,
      notes: extractedNotes,
    });

    console.log('=== OPENING MODAL ===');
    // Open modal after state is set
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setShowDeleteConfirm(null);
  };

  const handleMarkAsPaid = async () => {
    if (!obligationToMarkPaid) return;

    const currentNotes = obligationToMarkPaid.notes || '';
    const paymentMethodLabel = PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label || 'Cash';

    // Add payment information to notes
    const paymentInfo = `Status: Paid\nPayment Date: ${paymentDate}\nPayment Method: ${paymentMethodLabel}`;
    const newNotes = currentNotes ? `${currentNotes}\n${paymentInfo}` : paymentInfo;

    await updateTransaction(obligationToMarkPaid.id, {
      ...obligationToMarkPaid,
      notes: newNotes,
    });

    setShowMarkAsPaidModal(false);
    setObligationToMarkPaid(null);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
  };

  const handleOpenMarkAsPaidModal = (transaction: any) => {
    setObligationToMarkPaid(transaction);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setShowMarkAsPaidModal(true);
  };

  const handleFormSubmit = async (data: TransactionForm) => {
    console.log('=== FORM SUBMIT ===');
    console.log('Form data:', data);
    console.log('Current category state:', category);
    console.log('Current loanType state:', loanType);
    console.log('Current insuranceType state:', insuranceType);
    console.log('Current taxType state:', taxType);
    console.log('Current recurringOption state:', recurringOption);

    if (!category) {
      Alert.alert('Category Required', 'Please select a category for this obligation.');
      return;
    }

    // Build structured notes with category, type, recurring, and vendor info
    const categoryInfo = getCategoryInfo();
    console.log('Category info string:', categoryInfo);

    const structuredNotes: string[] = [];

    if (categoryInfo) structuredNotes.push(categoryInfo);
    if (loanType === 'suking_tindahan_loan' && storeName.trim()) structuredNotes.push(`Store: ${storeName.trim()}`);
    if (data.vendor) structuredNotes.push(`Vendor: ${data.vendor}`);

    // Add user's custom notes if provided
    if (data.notes && data.notes.trim()) {
      structuredNotes.push(data.notes.trim());
    }

    console.log('Final notes to save:', structuredNotes.join('\n'));

    const transactionData = {
      type: 'expense' as const,
      amount: parseFloat(data.amount),
      description: data.description,
      notes: structuredNotes.length > 0 ? structuredNotes.join('\n') : null,
      date: data.date,
      is_recurring: recurringOption !== 'none',
    };

    console.log('Transaction data to save:', transactionData);

    if (editingTransaction) {
      console.log('Updating transaction:', editingTransaction.id);
      await updateTransaction(editingTransaction.id, transactionData);
    } else {
      console.log('Adding new transaction');
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

    console.log('Transaction saved successfully');
    reset();
    resetState();
    setEditingTransaction(null);
    setShowAddModal(false);
  };

  const handleCloseModal = () => {
    // Clear all states
    resetState();
    setEditingTransaction(null);

    // Reset form to default values
    reset({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: '',
    });

    setShowAddModal(false);
  };

  const handleOpenAddModal = () => {
    // Reset all states and form when opening for new entry
    resetState();
    setEditingTransaction(null);
    reset({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="bg-white dark:bg-surface-800 px-4 py-4 border-b border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3 p-2 -ml-2">
            <FontAwesome name="chevron-left" size={16} color="#64748b" />
          </Pressable>
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

      {/* Transaction List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Unpaid Obligations Section */}
        <Text className="text-base font-bold text-surface-900 dark:text-surface-100 mb-3">
          Unpaid Obligations
        </Text>
        {groupedUnpaidTransactions.length === 0 ? (
          <View className="items-center justify-center py-12 mb-6">
            <FontAwesome name="check-circle" size={48} color="#16a34a" />
            <Text className="mt-4 text-base text-surface-400">All caught up!</Text>
            <Text className="mt-1 text-sm text-surface-400">No unpaid obligations</Text>
          </View>
        ) : (
          groupedUnpaidTransactions.map((group) => (
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
                      <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                    </View>
                    <Text className="text-sm font-bold text-orange-600 mr-3">
                      -{formatCurrency(transaction.amount)}
                    </Text>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleOpenMarkAsPaidModal(transaction)}
                        className="p-2 rounded-lg bg-green-50"
                      >
                        <FontAwesome name="check" size={14} color="#16a34a" />
                      </Pressable>
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

        {/* Paid Obligations Section */}
        {paidObligations.length > 0 && (
          <>
            <Text className="text-base font-bold text-surface-900 dark:text-surface-100 mb-3 mt-4">
              Paid Obligations
            </Text>
            {groupedPaidTransactions.map((group) => (
              <View key={group.key} className="mb-4">
                <View className="flex-row items-center justify-between mb-2 px-3 py-2 rounded-lg bg-green-600">
                  <Text className="text-base font-bold text-white">{group.label}</Text>
                  <Text className="text-sm font-bold text-white">
                    -{formatCurrency(group.total)}
                  </Text>
                </View>

                {group.transactions.map((transaction) => (
                  <Card key={transaction.id} variant="elevated" className="mb-2 opacity-60">
                    <View className="flex-row items-center">
                      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                        <FontAwesome name="check-circle" size={16} color="#16a34a" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {transaction.description}
                        </Text>
                        <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                      </View>
                      <Text className="text-sm font-bold text-green-600 mr-3">
                        -{formatCurrency(transaction.amount)}
                      </Text>
                      <View className="flex-row gap-2">
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
            ))}
          </>
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
        <View
          key={editingTransaction?.id || 'new'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#ffffff' }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
              <Pressable onPress={handleCloseModal}>
                <Text className="text-base text-surface-500">Cancel</Text>
              </Pressable>
              <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">
                {editingTransaction ? 'Edit Obligation' : 'Add Obligation'}
              </Text>
              <View className="w-12" />
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
              {/* Category Selection */}
              <View style={{ zIndex: 100 }}>
                <Select
                  label="Category"
                  placeholder="Select category"
                  options={OBLIGATION_CATEGORIES}
                  value={category}
                  onValueChange={(value) => {
                    console.log('Category changed to:', value);
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

              {/* Form Fields */}
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

      {/* Mark as Paid Modal */}
      {showMarkAsPaidModal && (
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
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-3">
                <FontAwesome name="check-circle" size={28} color="#16a34a" />
              </View>
              <Text className="text-lg font-bold text-surface-900 dark:text-surface-100">Mark as Paid</Text>
              <Text className="text-sm text-surface-500 dark:text-surface-400 text-center mt-2">
                {obligationToMarkPaid?.description}
              </Text>
            </View>

            {/* Payment Date */}
            <View className="mb-4" style={{ zIndex: 100 }}>
              <DatePicker
                label="Payment Date"
                value={paymentDate}
                onChange={setPaymentDate}
              />
            </View>

            {/* Payment Method */}
            <View className="mb-6" style={{ zIndex: 90 }}>
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
              <Pressable
                onPress={() => {
                  setShowMarkAsPaidModal(false);
                  setObligationToMarkPaid(null);
                }}
                className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-700"
              >
                <Text className="text-center font-medium text-surface-700 dark:text-surface-300">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleMarkAsPaid}
                className="flex-1 py-3 rounded-xl bg-green-500"
              >
                <Text className="text-center font-medium text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}