import { Button, Card, DatePicker, Input, Select } from '@/src/components/ui';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useTransactionSync } from '@/src/features/transactions/hooks/useTransactionSync';
import { formatCurrency, formatDate } from '@/src/lib/formatters';
import { supabase } from '@/src/lib/supabase';
import { useTransactionStore } from '@/src/stores/transactionStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { z } from 'zod';

// Expense Categories
type ExpenseCategory =
  | 'food_groceries' | 'pet_supplies' | 'dining' | 'shopping' | 'transportation'
  | 'gas' | 'toll_gate' | 'travel' | 'vehicle_maintenance' | 'house_maintenance'
  | 'gardening' | 'utilities' | 'healthcare' | 'entertainment' | 'cellphone_load'
  | 'online_shopping' | 'insurance' | 'emergency_fund' | 'vacation' | 'rent'
  | 'taxes' | 'tuition_fee' | 'school_service' | 'school_supplies' | 'allowance'
  | 'remittance' | 'personal_care_leisure' | 'license_registration_certification';

type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'e_wallet';
type RecurringOption = 'none' | 'weekly' | 'monthly' | 'yearly';
type RentSubCategory = 'lot' | 'house' | 'apartment' | 'condo' | 'store_rent' | 'warehouse_rent' | 'office_space' | 'commercial_space' | 'car' | 'parking_space';
type UtilitySubCategory = 'electricity' | 'water' | 'internet';
type TransportationSubCategory =
  | 'tricycle' | 'jeepney' | 'bus' | 'rail_transport' | 'uv_express'
  | 'multicab' | 'pedicab_sikad' | 'kalesa' | 'pnr' | 'taxi' | 'grab'
  | 'angkas' | 'joyride' | 'move_it' | 'habal_habal' | 'private_motorcycle'
  | 'ferry' | 'passenger_boats' | 'bangka_pump_boat' | 'roro' | 'fast_craft';
type BusSubType = 'city_bus' | 'provincial_bus' | 'p2p_bus';
type RailSubType = 'lrt1' | 'lrt2' | 'mrt3';
type UVExpressSubType = 'fx' | 'van';
type GasFuelStation =
  | 'petron' | 'shell' | 'caltex' | 'total_energies' | 'seaoil'
  | 'phoenix' | 'mobil' | 'unioil' | 'flying_v' | 'ptt'
  | 'cleanfuel' | 'jetti' | 'rephil' | 'city_oil' | 'power_fill'
  | 'petro_gazz' | 'uno_fuel' | 'stronghold' | 'petro_asia' | 'top_oil'
  | 'enoc' | 'others';
type EWalletProvider =
  | 'gcash' | 'gcash_crypto' | 'maya' | 'maya_crypto' | 'grabpay'
  | 'shopee_pay' | 'coins_ph' | 'bpi_ewallet' | 'unionbank_wallet'
  | 'bdo_pay' | 'landbank_mobile' | 'rcbc_diskartech' | 'tonik'
  | 'gotyme' | 'smart_padala' | 'paypal' | 'bayad_pay'
  | 'truemoney' | 'dragonpay' | 'pdax' | 'others';

const EXPENSE_CATEGORIES: { label: string; value: ExpenseCategory; icon: string }[] = [
  { label: 'Food & Groceries', value: 'food_groceries', icon: 'shopping-cart' },
  { label: 'Rent', value: 'rent', icon: 'home' },
  { label: 'Utilities', value: 'utilities', icon: 'bolt' },
  { label: 'Healthcare', value: 'healthcare', icon: 'medkit' },
  { label: 'Insurance', value: 'insurance', icon: 'shield' },
  { label: 'Emergency Fund', value: 'emergency_fund', icon: 'exclamation-triangle' },
  { label: 'Transportation', value: 'transportation', icon: 'bus' },
  { label: 'Gas/Fuel', value: 'gas', icon: 'tint' },
  { label: 'Toll Gate', value: 'toll_gate', icon: 'road' },
  { label: 'Travel', value: 'travel', icon: 'plane' },
  { label: 'Vehicle Maintenance', value: 'vehicle_maintenance', icon: 'car' },
  { label: 'House Maintenance', value: 'house_maintenance', icon: 'wrench' },
  { label: 'Online Shopping', value: 'online_shopping', icon: 'globe' },
  { label: 'Vacation', value: 'vacation', icon: 'umbrella' },
  { label: 'Dining', value: 'dining', icon: 'cutlery' },
  { label: 'Shopping', value: 'shopping', icon: 'shopping-bag' },
  { label: 'Entertainment', value: 'entertainment', icon: 'film' },
  { label: 'CellPhone Load', value: 'cellphone_load', icon: 'mobile' },
  { label: 'Pet Supplies', value: 'pet_supplies', icon: 'paw' },
  { label: 'Gardening Needs', value: 'gardening', icon: 'leaf' },
  { label: 'Taxes', value: 'taxes', icon: 'file-text-o' },
  { label: 'Tuition Fee', value: 'tuition_fee', icon: 'graduation-cap' },
  { label: 'School Service', value: 'school_service', icon: 'bus' },
  { label: 'School Supplies', value: 'school_supplies', icon: 'pencil' },
  { label: 'Allowance', value: 'allowance', icon: 'money' },
  { label: 'Remittance', value: 'remittance', icon: 'exchange' },
  { label: 'Personal Care and Leisure', value: 'personal_care_leisure', icon: 'smile-o' },
  { label: 'License, Registration and Certification', value: 'license_registration_certification', icon: 'id-card-o' },
];

const PAYMENT_METHODS: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'Cash', value: 'cash', icon: 'money' },
  { label: 'Credit Card', value: 'credit_card', icon: 'credit-card' },
  { label: 'Debit Card', value: 'debit_card', icon: 'credit-card-alt' },
  { label: 'Bank Transfer', value: 'bank_transfer', icon: 'bank' },
  { label: 'E-Money/E-Wallet', value: 'e_wallet', icon: 'mobile' },
];

const E_WALLET_PROVIDERS: { label: string; value: EWalletProvider; icon: string }[] = [
  { label: 'GCash', value: 'gcash', icon: 'mobile' },
  { label: 'GCash (GCrypto)', value: 'gcash_crypto', icon: 'mobile' },
  { label: 'Maya (PayMaya)', value: 'maya', icon: 'mobile' },
  { label: 'Maya Crypto', value: 'maya_crypto', icon: 'mobile' },
  { label: 'GrabPay', value: 'grabpay', icon: 'mobile' },
  { label: 'ShopeePay', value: 'shopee_pay', icon: 'mobile' },
  { label: 'Coins.ph', value: 'coins_ph', icon: 'mobile' },
  { label: 'BPI eWallet / BPI Mobile Wallet', value: 'bpi_ewallet', icon: 'mobile' },
  { label: 'UnionBank Online / UnionBank Wallet', value: 'unionbank_wallet', icon: 'mobile' },
  { label: 'BDO Pay', value: 'bdo_pay', icon: 'mobile' },
  { label: 'Landbank Mobile Banking', value: 'landbank_mobile', icon: 'mobile' },
  { label: 'RCBC DiskarTech', value: 'rcbc_diskartech', icon: 'mobile' },
  { label: 'Tonik Wallet', value: 'tonik', icon: 'mobile' },
  { label: 'GoTyme', value: 'gotyme', icon: 'mobile' },
  { label: 'Smart Padala Wallet', value: 'smart_padala', icon: 'mobile' },
  { label: 'PayPal', value: 'paypal', icon: 'paypal' },
  { label: 'BayadPay', value: 'bayad_pay', icon: 'mobile' },
  { label: 'TrueMoney Philippines', value: 'truemoney', icon: 'mobile' },
  { label: 'Dragonpay', value: 'dragonpay', icon: 'mobile' },
  { label: 'PDAX Wallet', value: 'pdax', icon: 'mobile' },
  { label: 'Others', value: 'others', icon: 'question-circle' },
];

const RENT_SUB_CATEGORIES: { label: string; value: RentSubCategory; icon: string }[] = [
  { label: 'Lot', value: 'lot', icon: 'map' },
  { label: 'House', value: 'house', icon: 'home' },
  { label: 'Apartment', value: 'apartment', icon: 'building-o' },
  { label: 'Condo', value: 'condo', icon: 'building' },
  { label: 'Store Rent', value: 'store_rent', icon: 'shopping-bag' },
  { label: 'Warehouse Rent', value: 'warehouse_rent', icon: 'industry' },
  { label: 'Office Space', value: 'office_space', icon: 'briefcase' },
  { label: 'Commercial Space', value: 'commercial_space', icon: 'building' },
  { label: 'Car', value: 'car', icon: 'car' },
  { label: 'Parking Space', value: 'parking_space', icon: 'product-hunt' },
];

const UTILITY_SUB_CATEGORIES: { label: string; value: UtilitySubCategory; icon: string }[] = [
  { label: 'Electricity', value: 'electricity', icon: 'bolt' },
  { label: 'Water', value: 'water', icon: 'tint' },
  { label: 'Internet', value: 'internet', icon: 'wifi' },
];

const ELECTRICITY_PROVIDERS: { label: string; value: string; icon: string }[] = [
  { label: 'Meralco', value: 'meralco', icon: 'bolt' },
  { label: 'Others', value: 'others', icon: 'question-circle' },
];

const WATER_PROVIDERS: { label: string; value: string; icon: string }[] = [
  { label: 'Manila Water Company, Inc.', value: 'manila_water', icon: 'tint' },
  { label: 'Maynilad Water Services, Inc.', value: 'maynilad', icon: 'tint' },
  { label: 'Tubig Pilipinas Group, Inc.', value: 'tubig_pilipinas', icon: 'tint' },
  { label: 'Metro Pacific Water', value: 'metro_pacific', icon: 'tint' },
  { label: 'Plaridel Water District', value: 'plaridel', icon: 'tint' },
  { label: 'Others', value: 'others', icon: 'question-circle' },
];

const INTERNET_PROVIDERS: { label: string; value: string; icon: string }[] = [
  { label: 'PLDT Home', value: 'pldt', icon: 'wifi' },
  { label: 'Smart Communications', value: 'smart', icon: 'signal' },
  { label: 'Globe Telecom', value: 'globe', icon: 'globe' },
  { label: 'Converge ICT', value: 'converge', icon: 'cloud' },
  { label: 'Sky TruFiber', value: 'sky', icon: 'cloud' },
  { label: 'Cable Link', value: 'cable_link', icon: 'television' },
  { label: 'Asian Vision', value: 'asian_vision', icon: 'television' },
  { label: 'DITO Telecommunity', value: 'dito', icon: 'mobile' },
  { label: 'Starlink', value: 'starlink', icon: 'rocket' },
  { label: 'Others', value: 'others', icon: 'question-circle' },
];

const TRANSPORTATION_SUB_CATEGORIES: { label: string; value: TransportationSubCategory; icon: string }[] = [
  { label: 'Tricycle', value: 'tricycle', icon: 'motorcycle' },
  { label: 'Jeepney', value: 'jeepney', icon: 'bus' },
  { label: 'Bus', value: 'bus', icon: 'bus' },
  { label: 'Rail Transport', value: 'rail_transport', icon: 'train' },
  { label: 'UV Express', value: 'uv_express', icon: 'car' },
  { label: 'Multicab', value: 'multicab', icon: 'car' },
  { label: 'Pedicab / Sikad', value: 'pedicab_sikad', icon: 'bicycle' },
  { label: 'Kalesa', value: 'kalesa', icon: 'flag' },
  { label: 'PNR (Philippine National Railways)', value: 'pnr', icon: 'train' },
  { label: 'Taxi', value: 'taxi', icon: 'taxi' },
  { label: 'Grab', value: 'grab', icon: 'car' },
  { label: 'Angkas', value: 'angkas', icon: 'motorcycle' },
  { label: 'JoyRide', value: 'joyride', icon: 'motorcycle' },
  { label: 'Move It', value: 'move_it', icon: 'motorcycle' },
  { label: 'Habal-habal', value: 'habal_habal', icon: 'motorcycle' },
  { label: 'Private Motorcycle', value: 'private_motorcycle', icon: 'motorcycle' },
  { label: 'Ferry', value: 'ferry', icon: 'ship' },
  { label: 'Passenger Boats', value: 'passenger_boats', icon: 'ship' },
  { label: 'Bangkas / Pump Boats', value: 'bangka_pump_boat', icon: 'ship' },
  { label: 'RORO (Roll-on Roll-off)', value: 'roro', icon: 'ship' },
  { label: 'Fast Craft', value: 'fast_craft', icon: 'ship' },
];

const BUS_SUB_TYPES: { label: string; value: BusSubType; icon: string }[] = [
  { label: 'City Bus', value: 'city_bus', icon: 'bus' },
  { label: 'Provincial Bus', value: 'provincial_bus', icon: 'bus' },
  { label: 'P2P (Point-to-Point) Bus', value: 'p2p_bus', icon: 'bus' },
];

const RAIL_SUB_TYPES: { label: string; value: RailSubType; icon: string }[] = [
  { label: 'LRT-1', value: 'lrt1', icon: 'train' },
  { label: 'LRT-2', value: 'lrt2', icon: 'train' },
  { label: 'MRT-3', value: 'mrt3', icon: 'train' },
];

const UV_EXPRESS_SUB_TYPES: { label: string; value: UVExpressSubType; icon: string }[] = [
  { label: 'FX', value: 'fx', icon: 'car' },
  { label: 'Van', value: 'van', icon: 'car' },
];

const GAS_FUEL_STATIONS: { label: string; value: GasFuelStation; icon: string }[] = [
  { label: 'Petron', value: 'petron', icon: 'tint' },
  { label: 'Shell', value: 'shell', icon: 'tint' },
  { label: 'Caltex', value: 'caltex', icon: 'tint' },
  { label: 'TotalEnergies', value: 'total_energies', icon: 'tint' },
  { label: 'Seaoil', value: 'seaoil', icon: 'tint' },
  { label: 'Phoenix Petroleum', value: 'phoenix', icon: 'tint' },
  { label: 'Mobil', value: 'mobil', icon: 'tint' },
  { label: 'Unioil', value: 'unioil', icon: 'tint' },
  { label: 'Flying V', value: 'flying_v', icon: 'tint' },
  { label: 'PTT Philippines', value: 'ptt', icon: 'tint' },
  { label: 'Cleanfuel', value: 'cleanfuel', icon: 'tint' },
  { label: 'Jetti Petroleum', value: 'jetti', icon: 'tint' },
  { label: 'Rephil', value: 'rephil', icon: 'tint' },
  { label: 'City Oil', value: 'city_oil', icon: 'tint' },
  { label: 'Power Fill', value: 'power_fill', icon: 'tint' },
  { label: 'Petro Gazz', value: 'petro_gazz', icon: 'tint' },
  { label: 'Uno Fuel', value: 'uno_fuel', icon: 'tint' },
  { label: 'Stronghold Gasoline', value: 'stronghold', icon: 'tint' },
  { label: 'PetroAsia', value: 'petro_asia', icon: 'tint' },
  { label: 'Top Oil', value: 'top_oil', icon: 'tint' },
  { label: 'ENOC', value: 'enoc', icon: 'tint' },
  { label: 'Others', value: 'others', icon: 'question-circle' },
];

const RECURRING_OPTIONS: { label: string; value: RecurringOption; icon: string }[] = [
  { label: 'None', value: 'none', icon: 'times' },
  { label: 'Weekly', value: 'weekly', icon: 'calendar' },
  { label: 'Monthly', value: 'monthly', icon: 'calendar-o' },
  { label: 'Yearly', value: 'yearly', icon: 'calendar-check-o' },
];

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

export default function ExpensesScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory | null>(null);
  const [rentSubCategory, setRentSubCategory] = useState<RentSubCategory | null>(null);
  const [utilitySubCategory, setUtilitySubCategory] = useState<UtilitySubCategory | null>(null);
  const [utilityProvider, setUtilityProvider] = useState<string | null>(null);
  const [transportationSubCategory, setTransportationSubCategory] = useState<TransportationSubCategory | null>(null);
  const [busSubType, setBusSubType] = useState<BusSubType | null>(null);
  const [railSubType, setRailSubType] = useState<RailSubType | null>(null);
  const [uvExpressSubType, setUVExpressSubType] = useState<UVExpressSubType | null>(null);
  const [gasFuelStation, setGasFuelStation] = useState<GasFuelStation | null>(null);
  const [eWalletProvider, setEWalletProvider] = useState<EWalletProvider | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [recurringOption, setRecurringOption] = useState<RecurringOption>('none');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionSync();
  const { categories, setCategories } = useTransactionStore();
  const { user } = useAuth();

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('type', 'expense')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        if (data) {
          console.log('✅ Categories loaded:', data.length, data.map(c => c.name));
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [setCategories]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
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

  // Filter only expense transactions
  const expenseTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [expenseTransactions]);

  // Group by month
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { transactions: typeof expenseTransactions; total: number; label: string } } = {};

    expenseTransactions.forEach((transaction) => {
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
  }, [expenseTransactions]);

  const getExpenseCategoryInfo = (): string | null => {
    const parts: string[] = [];

    if (expenseCategory) {
      const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === expenseCategory)?.label;
      if (categoryLabel) parts.push(`Category: ${categoryLabel}`);

      if (expenseCategory === 'rent' && rentSubCategory) {
        const subLabel = RENT_SUB_CATEGORIES.find(s => s.value === rentSubCategory)?.label;
        if (subLabel) parts.push(`Type: ${subLabel}`);
      }

      if (expenseCategory === 'utilities' && utilitySubCategory) {
        const subLabel = UTILITY_SUB_CATEGORIES.find(s => s.value === utilitySubCategory)?.label;
        if (subLabel) parts.push(`Type: ${subLabel}`);
      }

      if (expenseCategory === 'gas' && gasFuelStation) {
        const stationLabel = GAS_FUEL_STATIONS.find(s => s.value === gasFuelStation)?.label;
        if (stationLabel) parts.push(`Station: ${stationLabel}`);
      }

      if (expenseCategory === 'transportation' && transportationSubCategory) {
        const subLabel = TRANSPORTATION_SUB_CATEGORIES.find(s => s.value === transportationSubCategory)?.label;
        if (subLabel) parts.push(`Type: ${subLabel}`);
        if (transportationSubCategory === 'bus' && busSubType) {
          const busLabel = BUS_SUB_TYPES.find(s => s.value === busSubType)?.label;
          if (busLabel) parts.push(`SubType: ${busLabel}`);
        }
        if (transportationSubCategory === 'rail_transport' && railSubType) {
          const railLabel = RAIL_SUB_TYPES.find(s => s.value === railSubType)?.label;
          if (railLabel) parts.push(`SubType: ${railLabel}`);
        }
        if (transportationSubCategory === 'uv_express' && uvExpressSubType) {
          const uvLabel = UV_EXPRESS_SUB_TYPES.find(s => s.value === uvExpressSubType)?.label;
          if (uvLabel) parts.push(`SubType: ${uvLabel}`);
        }
      }
    }

    if (paymentMethod) {
      const methodLabel = PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label;
      if (methodLabel) parts.push(`Payment: ${methodLabel}`);
      if (paymentMethod === 'e_wallet' && eWalletProvider) {
        const providerLabel = E_WALLET_PROVIDERS.find(p => p.value === eWalletProvider)?.label;
        if (providerLabel) parts.push(`EWallet: ${providerLabel}`);
      }
    }

    if (recurringOption && recurringOption !== 'none') {
      const recurringLabel = RECURRING_OPTIONS.find(r => r.value === recurringOption)?.label;
      if (recurringLabel) parts.push(`Recurring: ${recurringLabel}`);
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  };

  const resetState = () => {
    setExpenseCategory(null);
    setRentSubCategory(null);
    setUtilitySubCategory(null);
    setUtilityProvider(null);
    setTransportationSubCategory(null);
    setBusSubType(null);
    setRailSubType(null);
    setUVExpressSubType(null);
    setGasFuelStation(null);
    setEWalletProvider(null);
    setPaymentMethod(null);
    setRecurringOption('none');
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

  const getCategoryId = (categoryName: ExpenseCategory): string | null => {
    // Map expense category enum to database category names (matching UI labels exactly)
    const categoryMap: Record<ExpenseCategory, string> = {
      'food_groceries': 'Food & Groceries',
      'pet_supplies': 'Pet Supplies',
      'dining': 'Dining',
      'shopping': 'Shopping',
      'transportation': 'Transportation',
      'gas': 'Gas/Fuel',
      'toll_gate': 'Toll Gate',
      'travel': 'Travel',
      'vehicle_maintenance': 'Vehicle Maintenance',
      'house_maintenance': 'House Maintenance',
      'gardening': 'Gardening Needs',
      'utilities': 'Utilities',
      'healthcare': 'Healthcare',
      'entertainment': 'Entertainment',
      'cellphone_load': 'CellPhone Load',
      'online_shopping': 'Online Shopping',
      'insurance': 'Insurance',
      'emergency_fund': 'Emergency Fund',
      'vacation': 'Vacation',
      'rent': 'Rent',
      'taxes': 'Taxes',
      'tuition_fee': 'Tuition Fee',
      'school_service': 'School Service',
      'school_supplies': 'School Supplies',
      'allowance': 'Allowance',
      'remittance': 'Remittance',
      'personal_care_leisure': 'Personal Care and Leisure',
      'license_registration_certification': 'License, Registration and Certification',
    };

    const mappedName = categoryMap[categoryName];
    console.log('🔍 getCategoryId - Input:', categoryName, '→ Mapped name:', mappedName);
    console.log('📚 Available categories:', categories.length, categories.map(c => `${c.name} (${c.type})`));

    if (!mappedName) {
      console.log('❌ No mapped name found');
      return null;
    }

    let category = categories.find(
      (cat) => cat.name === mappedName && cat.type === 'expense'
    );

    // Fallback: if "Vehicle Maintenance" not found, try old name "Car Maintenance"
    if (!category && mappedName === 'Vehicle Maintenance') {
      category = categories.find(
        (cat) => cat.name === 'Car Maintenance' && cat.type === 'expense'
      );
    }

    console.log(category ? '✅ Found category:' : '❌ Category not found:', category?.id);

    return category?.id || null;
  };

  const getCategoryName = (categoryId: string | null): string | null => {
    if (!categoryId) return null;
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || null;
  };

  const getCategoryDisplayLabel = (categoryId: string | null): string | null => {
    if (!categoryId) return null;

    // Map category_id to expense category enum
    const expenseCat = getExpenseCategoryFromId(categoryId);
    if (!expenseCat) return null;

    // Get the user-friendly label from EXPENSE_CATEGORIES
    const categoryInfo = EXPENSE_CATEGORIES.find((c) => c.value === expenseCat);
    return categoryInfo?.label || null;
  };

  const getExpenseCategoryFromId = (categoryId: string | null): ExpenseCategory | null => {
    if (!categoryId) return null;

    const categoryName = getCategoryName(categoryId);
    if (!categoryName) return null;

    // Reverse map from DATABASE category names to expense category enum
    const reverseMap: Record<string, ExpenseCategory> = {
      'Food & Groceries': 'food_groceries',
      'Pet Supplies': 'pet_supplies',
      'Dining': 'dining',
      'Shopping': 'shopping',
      'Transportation': 'transportation',
      'Gas': 'gas',
      'Gas/Fuel': 'gas',
      'Toll Gate': 'toll_gate',
      'Travel': 'travel',
      'Vehicle Maintenance': 'vehicle_maintenance',
      'Car Maintenance': 'vehicle_maintenance',
      'House Maintenance': 'house_maintenance',
      'Gardening Needs': 'gardening',
      'Utilities': 'utilities',
      'Healthcare': 'healthcare',
      'Entertainment': 'entertainment',
      'CellPhone Load': 'cellphone_load',
      'Online Shopping': 'online_shopping',
      'Insurance': 'insurance',
      'Emergency Fund': 'emergency_fund',
      'Vacation': 'vacation',
      'Rent': 'rent',
      'Taxes': 'taxes',
      'Tuition Fee': 'tuition_fee',
      'School Service': 'school_service',
      'School Supplies': 'school_supplies',
      'Allowance': 'allowance',
      'Remittance': 'remittance',
      'Personal Care and Leisure': 'personal_care_leisure',
      'License, Registration and Certification': 'license_registration_certification',
    };

    return reverseMap[categoryName] || null;
  };

  const parseNotesForPaymentMethod = (notes: string | null): PaymentMethod | null => {
    if (!notes) return null;

    // Extract payment method from notes
    if (notes.includes('Payment: Cash')) return 'cash';
    if (notes.includes('Payment: Credit Card')) return 'credit_card';
    if (notes.includes('Payment: Debit Card')) return 'debit_card';
    if (notes.includes('Payment: Bank Transfer')) return 'bank_transfer';
    if (notes.includes('Payment: E-Wallet')) return 'e_wallet';

    return null;
  };

  const parseNotesForRecurring = (notes: string | null): RecurringOption => {
    if (!notes) return 'none';

    if (notes.includes('Recurring: Weekly')) return 'weekly';
    if (notes.includes('Recurring: Monthly')) return 'monthly';
    if (notes.includes('Recurring: Yearly')) return 'yearly';

    return 'none';
  };

  const parseNotesForRentSubCategory = (notes: string | null): RentSubCategory | null => {
    if (!notes) return null;

    if (notes.includes('Type: Lot')) return 'lot';
    if (notes.includes('Type: House')) return 'house';
    if (notes.includes('Type: Apartment')) return 'apartment';
    if (notes.includes('Type: Condo')) return 'condo';
    if (notes.includes('Type: Store Rent')) return 'store_rent';
    if (notes.includes('Type: Warehouse Rent')) return 'warehouse_rent';
    if (notes.includes('Type: Office Space')) return 'office_space';
    if (notes.includes('Type: Commercial Space')) return 'commercial_space';
    if (notes.includes('Type: Car')) return 'car';
    if (notes.includes('Type: Parking Space')) return 'parking_space';

    return null;
  };

  const parseNotesForUtilitySubCategory = (notes: string | null): UtilitySubCategory | null => {
    if (!notes) return null;

    if (notes.includes('Type: Electricity')) return 'electricity';
    if (notes.includes('Type: Water')) return 'water';
    if (notes.includes('Type: Internet')) return 'internet';

    return null;
  };

  const parseNotesForGasFuelStation = (notes: string | null): GasFuelStation | null => {
    if (!notes) return null;
    const match = notes.match(/Station:\s*([^|]+)/);
    if (!match) return null;
    const label = match[1].trim();
    const found = GAS_FUEL_STATIONS.find(s => s.label === label);
    return found ? found.value : null;
  };

  const parseNotesForEWalletProvider = (notes: string | null): EWalletProvider | null => {
    if (!notes) return null;
    const match = notes.match(/EWallet:\s*([^|]+)/);
    if (!match) return null;
    const label = match[1].trim();
    const found = E_WALLET_PROVIDERS.find(p => p.label === label);
    return found ? found.value : null;
  };

  const parseNotesForTransportationSubCategory = (notes: string | null): TransportationSubCategory | null => {
    if (!notes) return null;
    const match = notes.match(/Type:\s*([^|]+)/);
    if (!match) return null;
    const label = match[1].trim();
    const found = TRANSPORTATION_SUB_CATEGORIES.find(s => s.label === label);
    return found ? found.value : null;
  };

  const parseNotesForBusSubType = (notes: string | null): BusSubType | null => {
    if (!notes) return null;
    const match = notes.match(/SubType:\s*([^|]+)/);
    if (!match) return null;
    const label = match[1].trim();
    const found = BUS_SUB_TYPES.find(s => s.label === label);
    return found ? found.value : null;
  };

  const parseNotesForRailSubType = (notes: string | null): RailSubType | null => {
    if (!notes) return null;
    const match = notes.match(/SubType:\s*([^|]+)/);
    if (!match) return null;
    const label = match[1].trim();
    const found = RAIL_SUB_TYPES.find(s => s.label === label);
    return found ? found.value : null;
  };

  const parseNotesForUVExpressSubType = (notes: string | null): UVExpressSubType | null => {
    if (!notes) return null;
    const match = notes.match(/SubType:\s*([^|]+)/);
    if (!match) return null;
    const label = match[1].trim();
    const found = UV_EXPRESS_SUB_TYPES.find(s => s.label === label);
    return found ? found.value : null;
  };

  const parseCategoryFromNotes = (notes: string | null): ExpenseCategory | null => {
    if (!notes) return null;

    const lines = notes.split('\n');
    for (const line of lines) {
      if (line.includes('Category:')) {
        // Handle format: "Category: Vehicle Maintenance | Payment: Cash | ..."
        const parts = line.split(' | ');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith('Category: ')) {
            const categoryLabel = trimmed.replace('Category: ', '').trim();
            const match = EXPENSE_CATEGORIES.find(c => c.label === categoryLabel);
            if (match) return match.value;
          }
        }
      }
    }
    return null;
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);

    // Restore category selections - try category_id first, then fallback to notes
    let expenseCat = getExpenseCategoryFromId(transaction.category_id);
    if (!expenseCat) {
      expenseCat = parseCategoryFromNotes(transaction.notes);
    }

    if (expenseCat) {
      setExpenseCategory(expenseCat);

      // Restore subcategories if applicable
      if (expenseCat === 'rent') {
        const rentSub = parseNotesForRentSubCategory(transaction.notes);
        if (rentSub) {
          setRentSubCategory(rentSub);
        }
      } else if (expenseCat === 'utilities') {
        const utilitySub = parseNotesForUtilitySubCategory(transaction.notes);
        if (utilitySub) {
          setUtilitySubCategory(utilitySub);

          // Restore provider — find the vendor label saved in notes and map it back to its value
          const vendorLine = (transaction.notes ?? '').split('\n').find((l: string) => l.startsWith('Vendor: '));
          const vendorLabel = vendorLine?.replace('Vendor: ', '').trim();
          if (vendorLabel) {
            const providers =
              utilitySub === 'electricity' ? ELECTRICITY_PROVIDERS :
              utilitySub === 'water' ? WATER_PROVIDERS :
              INTERNET_PROVIDERS;
            const match = providers.find(p => p.label === vendorLabel);
            setUtilityProvider(match ? match.value : 'others');
          }
        }
      } else if (expenseCat === 'gas') {
        const station = parseNotesForGasFuelStation(transaction.notes);
        if (station) setGasFuelStation(station);
      } else if (expenseCat === 'transportation') {
        const transportSub = parseNotesForTransportationSubCategory(transaction.notes);
        if (transportSub) {
          setTransportationSubCategory(transportSub);
          if (transportSub === 'bus') setBusSubType(parseNotesForBusSubType(transaction.notes));
          if (transportSub === 'rail_transport') setRailSubType(parseNotesForRailSubType(transaction.notes));
          if (transportSub === 'uv_express') setUVExpressSubType(parseNotesForUVExpressSubType(transaction.notes));
        }
      }
    } else {
      setExpenseCategory(null);
    }

    // Restore payment method and recurring from notes
    const paymentMeth = parseNotesForPaymentMethod(transaction.notes);
    if (paymentMeth) {
      setPaymentMethod(paymentMeth);
      if (paymentMeth === 'e_wallet') {
        const eWallet = parseNotesForEWalletProvider(transaction.notes);
        if (eWallet) setEWalletProvider(eWallet);
      }
    } else {
      setPaymentMethod(null);
    }

    const recurring = parseNotesForRecurring(transaction.notes);
    setRecurringOption(recurring);

    // Extract vendor and clean notes
    let cleanNotes = transaction.notes ?? '';
    let vendor = '';

    if (cleanNotes) {
      const lines = cleanNotes.split('\n');
      const filteredLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('Vendor: ')) {
          vendor = line.replace('Vendor: ', '');
        } else if (
          line.includes('Category:') ||
          line.includes('Payment:') ||
          line.includes('Recurring:') ||
          line.includes('Type:') ||
          line.includes('SubType:') ||
          line.includes('Station:') ||
          line.includes('EWallet:')
        ) {
          // Filter out metadata lines (handles both standalone and pipe-separated format)
        } else {
          filteredLines.push(line);
        }
      }

      cleanNotes = filteredLines.join('\n').trim();
    }

    reset({
      description: transaction.description ?? '',
      amount: transaction.amount.toString(),
      date: transaction.date,
      vendor: vendor,
      notes: cleanNotes,
    });

    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setShowDeleteConfirm(null);
  };

  const handleFormSubmit = async (data: TransactionForm) => {
    // Get the category ID from the selected expense category
    console.log('📝 ========== FORM SUBMIT ==========');
    console.log('📝 Expense Category State:', expenseCategory);
    console.log('📝 Rent SubCategory State:', rentSubCategory);
    console.log('📝 Utility SubCategory State:', utilitySubCategory);
    console.log('📝 Payment Method State:', paymentMethod);
    console.log('📝 Recurring Option State:', recurringOption);

    const categoryInfo = getExpenseCategoryInfo();
    console.log('📝 Category Info String:', categoryInfo);

    let notesContent: string[] = [];
    if (categoryInfo) notesContent.push(categoryInfo);
    if (data.vendor) notesContent.push(`Vendor: ${data.vendor}`);
    if (data.notes) notesContent.push(data.notes);

    const categoryId = expenseCategory ? getCategoryId(expenseCategory) : null;

    console.log('📝 Final Category ID to save:', categoryId);
    console.log('📝 Category Info for notes:', categoryInfo);

    if (editingTransaction) {
      const updateData = {
        type: 'expense' as const,
        amount: parseFloat(data.amount),
        description: data.description,
        category_id: categoryId,
        notes: notesContent.length > 0 ? notesContent.join('\n') : null,
        date: data.date,
        is_recurring: recurringOption !== 'none',
      };
      console.log('📝 Updating transaction with:', updateData);
      await updateTransaction(editingTransaction.id, updateData);
    } else {
      const newTransaction = {
        user_id: user?.id ?? '',
        account_id: '',
        category_id: categoryId,
        type: 'expense' as const,
        amount: parseFloat(data.amount),
        currency: 'PHP',
        description: data.description,
        notes: notesContent.length > 0 ? notesContent.join('\n') : null,
        date: data.date,
        is_recurring: recurringOption !== 'none',
        recurring_id: null,
        receipt_url: null,
        source: 'manual' as const,
        transfer_to_account_id: null,
      };
      console.log('📝 Creating new transaction with:', newTransaction);
      await addTransaction(newTransaction);
    }

    reset();
    resetState();
    setEditingTransaction(null);
    setShowAddModal(false);
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
          <Pressable onPress={() => router.replace('/(tabs)/transactions')} className="mr-3 p-2 -ml-2">
            <FontAwesome name="chevron-left" size={16} color="#64748b" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Expenses
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              Track your spending
            </Text>
          </View>
          <View className="bg-danger-100 dark:bg-danger-900/30 px-3 py-1 rounded-full">
            <Text className="text-sm font-bold text-danger-700 dark:text-danger-300">
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {groupedTransactions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="arrow-up" size={48} color="#dc2626" />
            <Text className="mt-4 text-base text-surface-400">No expenses recorded yet</Text>
            <Text className="mt-1 text-sm text-surface-400">Tap + to add your first expense</Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.key} className="mb-4">
              <View className="flex-row items-center justify-between mb-2 px-3 py-2 rounded-lg bg-danger-600">
                <Text className="text-base font-bold text-white">{group.label}</Text>
                <Text className="text-sm font-bold text-white">
                  -{formatCurrency(group.total)}
                </Text>
              </View>

              {group.transactions.map((transaction) => {
                const categoryName = getCategoryDisplayLabel(transaction.category_id)
                  ?? EXPENSE_CATEGORIES.find(c => c.value === parseCategoryFromNotes(transaction.notes))?.label
                  ?? null;
                return (
                  <Card key={transaction.id} variant="elevated" className="mb-2">
                    <View className="flex-row items-center">
                      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-danger-100">
                        <FontAwesome name="arrow-up" size={16} color="#dc2626" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {transaction.description}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          {categoryName && (
                            <>
                              <View className="bg-danger-50 dark:bg-danger-900/30 px-2 py-0.5 rounded">
                                <Text className="text-xs text-danger-700 dark:text-danger-300">
                                  {categoryName}
                                </Text>
                              </View>
                              <Text className="text-xs text-surface-300">•</Text>
                            </>
                          )}
                          <Text className="text-xs text-surface-400">{formatDate(transaction.date)}</Text>
                        </View>
                      </View>
                      <Text className="text-sm font-bold text-danger-600 mr-3">
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
                );
              })}
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
          backgroundColor: '#dc2626',
        }}
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add Expense Modal */}
      {showAddModal && (
        <View
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
              <Text className="text-lg font-bold text-surface-900">
                {editingTransaction ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <View className="w-12" />
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
              {/* Category Selection */}
              <View style={{ zIndex: 100 }}>
                <Select
                  label="Category"
                  placeholder="Select expense category"
                  options={EXPENSE_CATEGORIES}
                  value={expenseCategory}
                  onValueChange={(value) => {
                    setExpenseCategory(value as ExpenseCategory);
                    setRentSubCategory(null);
                    setUtilitySubCategory(null);
                    setUtilityProvider(null);
                    setTransportationSubCategory(null);
                    setBusSubType(null);
                    setRailSubType(null);
                    setUVExpressSubType(null);
                    setGasFuelStation(null);
                  }}
                  iconColor="#dc2626"
                />
              </View>

              {expenseCategory === 'rent' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Rent Type"
                    placeholder="Select rent type"
                    options={RENT_SUB_CATEGORIES}
                    value={rentSubCategory}
                    onValueChange={(value) => setRentSubCategory(value as RentSubCategory)}
                    iconColor="#dc2626"
                  />
                </View>
              )}

              {expenseCategory === 'utilities' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Utility Type"
                    placeholder="Select utility type"
                    options={UTILITY_SUB_CATEGORIES}
                    value={utilitySubCategory}
                    onValueChange={(value) => {
                      setUtilitySubCategory(value as UtilitySubCategory);
                      setUtilityProvider(null);
                      setValue('vendor', '');
                    }}
                    iconColor="#dc2626"
                  />
                </View>
              )}

              {expenseCategory === 'utilities' && utilitySubCategory && (
                <View style={{ zIndex: 90 }}>
                  <Select
                    label="Provider"
                    placeholder="Select provider"
                    options={
                      utilitySubCategory === 'electricity' ? ELECTRICITY_PROVIDERS :
                      utilitySubCategory === 'water' ? WATER_PROVIDERS :
                      INTERNET_PROVIDERS
                    }
                    value={utilityProvider}
                    onValueChange={(value) => {
                      setUtilityProvider(value as string);
                      if (value !== 'others') {
                        const options = utilitySubCategory === 'electricity' ? ELECTRICITY_PROVIDERS :
                                        utilitySubCategory === 'water' ? WATER_PROVIDERS :
                                        INTERNET_PROVIDERS;
                        const label = options.find(o => o.value === value)?.label;
                        setValue('vendor', label || '');
                      } else {
                        setValue('vendor', '');
                      }
                    }}
                    iconColor="#dc2626"
                  />
                </View>
              )}

              {expenseCategory === 'gas' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Gas Station"
                    placeholder="Select gas station"
                    options={GAS_FUEL_STATIONS}
                    value={gasFuelStation}
                    onValueChange={(value) => {
                      setGasFuelStation(value as GasFuelStation);
                      if (value !== 'others') {
                        const label = GAS_FUEL_STATIONS.find(s => s.value === value)?.label;
                        setValue('vendor', label || '');
                      } else {
                        setValue('vendor', '');
                      }
                    }}
                    iconColor="#dc2626"
                  />
                </View>
              )}

              {expenseCategory === 'transportation' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Transport Type"
                    placeholder="Select transport type"
                    options={TRANSPORTATION_SUB_CATEGORIES}
                    value={transportationSubCategory}
                    onValueChange={(value) => {
                      setTransportationSubCategory(value as TransportationSubCategory);
                      setBusSubType(null);
                      setRailSubType(null);
                      setUVExpressSubType(null);
                      // Auto-fill vendor for types that have no sub-type
                      const noSubType = !['bus', 'rail_transport', 'uv_express'].includes(value as string);
                      if (noSubType) {
                        const label = TRANSPORTATION_SUB_CATEGORIES.find(s => s.value === value)?.label;
                        setValue('vendor', label || '');
                      } else {
                        setValue('vendor', '');
                      }
                    }}
                    iconColor="#dc2626"
                  />
                </View>
              )}

              {expenseCategory === 'transportation' && transportationSubCategory === 'bus' && (
                <View style={{ zIndex: 90 }}>
                  <Select
                    label="Bus Type"
                    placeholder="Select bus type"
                    options={BUS_SUB_TYPES}
                    value={busSubType}
                    onValueChange={(value) => {
                      setBusSubType(value as BusSubType);
                      const label = BUS_SUB_TYPES.find(s => s.value === value)?.label;
                      setValue('vendor', label || '');
                    }}
                    iconColor="#dc2626"
                  />
                </View>
              )}

              {expenseCategory === 'transportation' && transportationSubCategory === 'rail_transport' && (
                <View style={{ zIndex: 90 }}>
                  <Select
                    label="Rail Line"
                    placeholder="Select rail line"
                    options={RAIL_SUB_TYPES}
                    value={railSubType}
                    onValueChange={(value) => {
                      setRailSubType(value as RailSubType);
                      const label = RAIL_SUB_TYPES.find(s => s.value === value)?.label;
                      setValue('vendor', label || '');
                    }}
                    iconColor="#dc2626"
                  />
                </View>
              )}

              {expenseCategory === 'transportation' && transportationSubCategory === 'uv_express' && (
                <View style={{ zIndex: 90 }}>
                  <Select
                    label="UV Express Type"
                    placeholder="Select type"
                    options={UV_EXPRESS_SUB_TYPES}
                    value={uvExpressSubType}
                    onValueChange={(value) => {
                      setUVExpressSubType(value as UVExpressSubType);
                      const label = UV_EXPRESS_SUB_TYPES.find(s => s.value === value)?.label;
                      setValue('vendor', label || '');
                    }}
                    iconColor="#dc2626"
                  />
                </View>
              )}

              <View style={{ zIndex: 85 }}>
                <Select
                  label="Payment Method"
                  placeholder="Select payment method"
                  options={PAYMENT_METHODS}
                  value={paymentMethod}
                  onValueChange={(value) => {
                    setPaymentMethod(value as PaymentMethod);
                    setEWalletProvider(null);
                  }}
                  iconColor="#2563eb"
                />
              </View>

              {paymentMethod === 'e_wallet' && (
                <View style={{ zIndex: 80 }}>
                  <Select
                    label="E-Wallet Provider"
                    placeholder="Select e-wallet provider"
                    options={E_WALLET_PROVIDERS}
                    value={eWalletProvider}
                    onValueChange={(value) => setEWalletProvider(value as EWalletProvider)}
                    iconColor="#2563eb"
                  />
                </View>
              )}

              <View style={{ zIndex: 75 }}>
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
                    placeholder="Add description ..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.description?.message}
                  />
                )}
              />

              {(expenseCategory !== 'utilities' || utilityProvider === 'others') && (
                <Controller
                  control={control}
                  name="vendor"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={expenseCategory === 'utilities' && utilityProvider === 'others' ? "Specify Provider" : "Vendor/Merchant"}
                      placeholder={expenseCategory === 'utilities' ? "Enter provider name" : "e.g., SM Supermarket, Jollibee"}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              )}

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
                  title={editingTransaction ? 'Update Expense' : 'Save Expense'}
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
              <Text className="text-lg font-bold text-surface-900">Delete Expense?</Text>
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
    </View>
  );
}
