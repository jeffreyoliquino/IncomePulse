import { Button, Card, Input, Select } from '@/src/components/ui';
import { Account, useAccountStore } from '@/src/stores/accountStore';
import { formatCurrency } from '@/src/lib/formatters';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

// ─── Wallet options ───────────────────────────────────────────────────────────
const EWALLET_TYPES: { label: string; value: string; icon: string }[] = [
  { label: 'GCash',      value: 'gcash',      icon: 'mobile' },
  { label: 'Maya',       value: 'maya',       icon: 'mobile' },
  { label: 'ShopeePay', value: 'shopeepay',  icon: 'shopping-bag' },
  { label: 'GrabPay',   value: 'grabpay',    icon: 'car' },
];

const BANK_TYPES: { label: string; value: string; icon: string }[] = [
  { label: 'BPI',           value: 'bpi',           icon: 'bank' },
  { label: 'BDO',           value: 'bdo',           icon: 'bank' },
  { label: 'UnionBank',     value: 'unionbank',     icon: 'bank' },
  { label: 'Metrobank',     value: 'metrobank',     icon: 'bank' },
  { label: 'Security Bank', value: 'security_bank', icon: 'bank' },
  { label: 'EastWest Bank', value: 'eastwest',      icon: 'bank' },
  { label: 'RCBC',          value: 'rcbc',          icon: 'bank' },
  { label: 'PNB',           value: 'pnb',           icon: 'bank' },
  { label: 'Landbank',      value: 'landbank',      icon: 'bank' },
  { label: 'DBP',           value: 'dbp',           icon: 'bank' },
  { label: 'Others',        value: 'others',        icon: 'bank' },
];

const ACCOUNT_CATEGORIES: { label: string; value: string; icon: string }[] = [
  { label: 'Cash',     value: 'cash',    icon: 'money' },
  { label: 'E-Wallet', value: 'ewallet', icon: 'mobile' },
  { label: 'Bank',     value: 'bank',    icon: 'bank' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getSubTypeLabel = (account: Account): string => {
  if (account.category === 'ewallet') {
    return EWALLET_TYPES.find(w => w.value === account.subType)?.label ?? account.subType ?? '';
  }
  if (account.category === 'bank') {
    return BANK_TYPES.find(b => b.value === account.subType)?.label ?? account.subType ?? '';
  }
  return '';
};

export default function AccountsScreen() {
  const { accounts, addAccount, updateAccount, deleteAccount, syncToCloud, fetchFromCloud } = useAccountStore();

  // On mount: push any existing local accounts to cloud, then pull latest from cloud.
  // This ensures web-created accounts appear on mobile and vice versa.
  useEffect(() => {
    (async () => {
      await syncToCloud();    // push local → cloud (no-op if local is empty)
      await fetchFromCloud(); // pull cloud → local (replaces local with cloud state)
    })();
  }, []);

  const [showModal, setShowModal]             = useState(false);
  const [editingAccount, setEditingAccount]   = useState<Account | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [category, setCategory]     = useState<string | null>(null);
  const [subType, setSubType]       = useState<string | null>(null);
  const [name, setName]             = useState('');
  const [balance, setBalance]       = useState('');
  const [nameError, setNameError]   = useState('');
  const [balanceError, setBalanceError] = useState('');

  // ─── Grouped data ────────────────────────────────────────────────────────
  const cash    = useMemo(() => accounts.filter(a => a.category === 'cash'),    [accounts]);
  const ewallets = useMemo(() => accounts.filter(a => a.category === 'ewallet'), [accounts]);
  const banks   = useMemo(() => accounts.filter(a => a.category === 'bank'),    [accounts]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.balance, 0),
    [accounts]
  );

  // ─── Modal helpers ────────────────────────────────────────────────────────
  const resetForm = () => {
    setCategory(null);
    setSubType(null);
    setName('');
    setBalance('');
    setNameError('');
    setBalanceError('');
    setEditingAccount(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setCategory(account.category);
    setSubType(account.subType ?? null);
    setName(account.name);
    setBalance(account.balance.toString());
    setNameError('');
    setBalanceError('');
    setShowModal(true);
  };

  const handleSave = () => {
    let valid = true;
    if (!name.trim()) { setNameError('Name is required'); valid = false; }
    else setNameError('');
    if (!balance || isNaN(parseFloat(balance))) { setBalanceError('Enter a valid amount'); valid = false; }
    else setBalanceError('');
    if (!category) return; // category selector already shown
    if (!valid) return;

    const data = {
      category: category as Account['category'],
      subType: subType ?? undefined,
      name: name.trim(),
      balance: parseFloat(balance),
    };

    if (editingAccount) {
      updateAccount(editingAccount.id, data);
    } else {
      addAccount(data);
    }

    resetForm();
    setShowModal(false);
    // Sync after state update settles
    setTimeout(() => syncToCloud(), 0);
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    setShowDeleteConfirm(null);
  };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const AccountRow = ({ account }: { account: Account }) => (
    <View className="flex-row items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700 last:border-b-0">
      <View className="flex-1">
        <Text className="text-sm font-medium text-surface-900 dark:text-surface-100">
          {account.name}
        </Text>
        {account.category !== 'cash' && (
          <Text className="text-xs text-surface-400">{getSubTypeLabel(account)}</Text>
        )}
      </View>
      <Text className="text-sm font-bold text-surface-900 dark:text-surface-100 mr-4">
        {formatCurrency(account.balance)}
      </Text>
      <View className="flex-row gap-2">
        <Pressable onPress={() => openEdit(account)} className="p-2 rounded-lg bg-primary-50">
          <FontAwesome name="pencil" size={12} color="#2563eb" />
        </Pressable>
        <Pressable onPress={() => setShowDeleteConfirm(account.id)} className="p-2 rounded-lg bg-danger-50">
          <FontAwesome name="trash" size={12} color="#dc2626" />
        </Pressable>
      </View>
    </View>
  );

  const SectionHeader = ({
    icon,
    label,
    total,
  }: {
    icon: string;
    label: string;
    total: number;
  }) => (
    <View className="flex-row items-center justify-between mb-1 mt-4 px-1">
      <View className="flex-row items-center gap-2">
        <FontAwesome name={icon as any} size={14} color="#64748b" />
        <Text className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide ml-1">
          {label}
        </Text>
      </View>
      <Text className="text-xs font-semibold text-surface-500 dark:text-surface-400">
        {formatCurrency(total)}
      </Text>
    </View>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
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
              Accounts
            </Text>
            <Text className="text-sm text-surface-500 dark:text-surface-400">
              Cash, e-wallets & bank balances
            </Text>
          </View>
          <View className="bg-sky-100 dark:bg-sky-900/30 px-3 py-1 rounded-full">
            <Text className="text-sm font-bold text-sky-700 dark:text-sky-300">
              {formatCurrency(totalBalance)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-2">
        {accounts.length === 0 ? (
          <View className="items-center justify-center py-24">
            <FontAwesome name="credit-card" size={48} color="#cbd5e1" />
            <Text className="mt-4 text-base text-surface-400">No accounts yet</Text>
            <Text className="mt-1 text-sm text-surface-400">Tap + to add your first account</Text>
          </View>
        ) : (
          <Card variant="elevated" className="mt-2">
            {/* ── Cash ── */}
            {cash.length > 0 && (
              <>
                <SectionHeader
                  icon="money"
                  label="Cash"
                  total={cash.reduce((s, a) => s + a.balance, 0)}
                />
                {cash.map(a => <AccountRow key={a.id} account={a} />)}
              </>
            )}

            {/* ── E-Wallets ── */}
            {ewallets.length > 0 && (
              <>
                <SectionHeader
                  icon="mobile"
                  label="E-Wallets"
                  total={ewallets.reduce((s, a) => s + a.balance, 0)}
                />
                {ewallets.map(a => <AccountRow key={a.id} account={a} />)}
              </>
            )}

            {/* ── Banks ── */}
            {banks.length > 0 && (
              <>
                <SectionHeader
                  icon="bank"
                  label="Banks"
                  total={banks.reduce((s, a) => s + a.balance, 0)}
                />
                {banks.map(a => <AccountRow key={a.id} account={a} />)}
              </>
            )}
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={openAdd}
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
          backgroundColor: '#0284c7',
        }}
      >
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      {/* Add / Edit Modal */}
      {showModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#ffffff' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            {/* Modal header */}
            <View className="flex-row items-center justify-between border-b border-surface-200 px-4 py-4">
              <Pressable onPress={() => { resetForm(); setShowModal(false); }}>
                <Text className="text-base text-surface-500">Cancel</Text>
              </Pressable>
              <Text className="text-lg font-bold text-surface-900">
                {editingAccount ? 'Edit Account' : 'Add Account'}
              </Text>
              <View className="w-12" />
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
              {/* Category */}
              <View style={{ zIndex: 100 }}>
                <Select
                  label="Account Type"
                  placeholder="Select account type"
                  options={ACCOUNT_CATEGORIES}
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val as string);
                    setSubType(null);
                  }}
                  iconColor="#0284c7"
                />
              </View>

              {/* E-Wallet sub-type */}
              {category === 'ewallet' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Wallet"
                    placeholder="Select wallet"
                    options={EWALLET_TYPES}
                    value={subType}
                    onValueChange={(val) => setSubType(val as string)}
                    iconColor="#0284c7"
                  />
                </View>
              )}

              {/* Bank sub-type */}
              {category === 'bank' && (
                <View style={{ zIndex: 95 }}>
                  <Select
                    label="Bank"
                    placeholder="Select bank"
                    options={BANK_TYPES}
                    value={subType}
                    onValueChange={(val) => setSubType(val as string)}
                    iconColor="#0284c7"
                  />
                </View>
              )}

              {/* Name */}
              <Input
                label={
                  category === 'cash'    ? 'Label (e.g., Wallet Cash)' :
                  category === 'ewallet' ? 'Label (e.g., My GCash)' :
                  category === 'bank'    ? 'Label (e.g., BPI Savings)' :
                  'Account Name'
                }
                placeholder="Enter a name for this account"
                value={name}
                onChangeText={(val) => { setName(val); if (val.trim()) setNameError(''); }}
                error={nameError || undefined}
              />

              {/* Balance */}
              <Input
                label="Current Balance (PHP)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={balance}
                onChangeText={(val) => { setBalance(val); if (val) setBalanceError(''); }}
                error={balanceError || undefined}
                leftIcon={<Text className="text-base text-surface-400">₱</Text>}
              />

              <View className="mb-8 mt-4">
                <Button
                  title={editingAccount ? 'Update Account' : 'Save Account'}
                  onPress={handleSave}
                  fullWidth
                  size="lg"
                  disabled={!category}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 200, backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center', alignItems: 'center', padding: 20,
          }}
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-danger-100 items-center justify-center mb-3">
                <FontAwesome name="trash" size={28} color="#dc2626" />
              </View>
              <Text className="text-lg font-bold text-surface-900">Delete Account?</Text>
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
