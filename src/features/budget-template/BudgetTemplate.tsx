import { Card, Input, Select } from '@/src/components/ui';
import { formatCurrency } from '@/src/lib/formatters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateType = 'employee' | 'ofw' | 'student';
type FieldDef = { key: string; label: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseNum = (v: string) => {
  const n = parseFloat(v.replace(/,/g, ''));
  return isNaN(n) || n < 0 ? 0 : n;
};

const formatInput = (v: string) => {
  const cleaned = v.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
};

const formatSavedAt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useFields(keys: string[]) {
  const init = Object.fromEntries(keys.map((k) => [k, '']));
  const [fields, setFields] = useState<Record<string, string>>(init);
  const set = (key: string) => (v: string) => setFields((f) => ({ ...f, [key]: v }));
  const setAll = (data: Record<string, string>) =>
    setFields((prev) => ({ ...prev, ...data }));
  const total = keys.reduce((s, k) => s + parseNum(fields[k]), 0);
  return { fields, set, setAll, total };
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

const CONTENT_MAX_WIDTH = 640;

function ContentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', alignSelf: 'center' }}>
      {children}
    </View>
  );
}

function SectionHeader({
  label, total, color = 'bg-primary-50 dark:bg-primary-900/30',
  textColor = 'text-primary-700 dark:text-primary-300',
}: {
  label: string; total: number; color?: string; textColor?: string;
}) {
  return (
    <View className={`flex-row items-center justify-between rounded-xl px-4 py-3 mb-2 mt-1 ${color}`}>
      <Text className={`text-sm font-bold uppercase tracking-wide ${textColor}`}>{label}</Text>
      <Text className={`text-sm font-bold ${textColor}`}>{formatCurrency(total)}</Text>
    </View>
  );
}

// Edit mode row
function BudgetField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <View className="flex-row items-center mb-2 px-1" style={{ gap: 8 }}>
      <Text
        className="text-sm text-surface-700 dark:text-surface-300"
        numberOfLines={2}
        style={{ flex: 1, minWidth: 0 }}
      >
        {label}
      </Text>
      <View style={{ width: 140, flexShrink: 0 }}>
        <Input
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={(t) => onChange(formatInput(t))}
          leftIcon={<Text className="text-sm text-surface-400">₱</Text>}
        />
      </View>
    </View>
  );
}

// View mode row — skips zero values
function ViewRow({ label, value }: { label: string; value: string }) {
  const num = parseNum(value);
  if (num === 0) return null;
  return (
    <View className="flex-row items-center justify-between py-2 px-2 border-b border-surface-100 dark:border-surface-800">
      <Text className="text-sm text-surface-600 dark:text-surface-400 flex-1 mr-3" numberOfLines={2}>
        {label}
      </Text>
      <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">
        {formatCurrency(num)}
      </Text>
    </View>
  );
}

// Renders BudgetField rows for edit mode
function EditFields({
  defs, fields, set,
}: {
  defs: FieldDef[];
  fields: Record<string, string>;
  set: (key: string) => (v: string) => void;
}) {
  return (
    <>
      {defs.map(({ key, label }) => (
        <BudgetField key={key} label={label} value={fields[key] ?? ''} onChange={set(key)} />
      ))}
    </>
  );
}

// Renders ViewRow rows for view mode
function ViewFields({ defs, fields }: { defs: FieldDef[]; fields: Record<string, string> }) {
  return (
    <>
      {defs.map(({ key, label }) => (
        <ViewRow key={key} label={label} value={fields[key] ?? ''} />
      ))}
    </>
  );
}

function RemainingBalance({ income, expenses }: { income: number; expenses: number }) {
  const remaining = income - expenses;
  const isPositive = remaining >= 0;
  return (
    <View
      className="rounded-2xl p-5 mb-6"
      style={{ backgroundColor: isPositive ? '#059669' : '#dc2626' }}
    >
      <Text className="text-sm text-white/80 font-medium">Remaining Balance</Text>
      <Text className="text-3xl font-bold text-white mt-1">
        {formatCurrency(Math.abs(remaining))}
      </Text>
      {!isPositive && (
        <Text className="text-sm text-white/80 mt-1">
          Over budget by {formatCurrency(Math.abs(remaining))}
        </Text>
      )}
      <View className="flex-row mt-3 gap-4">
        <View className="flex-1">
          <Text className="text-xs text-white/70">Total Income</Text>
          <Text className="text-sm font-semibold text-white">{formatCurrency(income)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-white/70">Total Expenses</Text>
          <Text className="text-sm font-semibold text-white">{formatCurrency(expenses)}</Text>
        </View>
      </View>
    </View>
  );
}

// Save / Edit action bar shown at top of form
function ActionBar({
  mode, savedAt, onSave, onEdit,
}: {
  mode: 'edit' | 'view';
  savedAt: string | null;
  onSave: () => void;
  onEdit: () => void;
}) {
  if (mode === 'view') {
    return (
      <View className="flex-row items-center justify-between mb-4 bg-accent-50 dark:bg-accent-900/30 rounded-xl px-4 py-3">
        <View className="flex-row items-center gap-2" style={{ flex: 1 }}>
          <FontAwesome name="check-circle" size={16} color="#16a34a" />
          <Text className="text-xs text-accent-700 dark:text-accent-300" numberOfLines={1}>
            {savedAt ? `Saved ${formatSavedAt(savedAt)}` : 'Saved'}
          </Text>
        </View>
        <Pressable
          onPress={onEdit}
          className="flex-row items-center gap-2 bg-white dark:bg-surface-700 rounded-lg px-3 py-2 ml-2"
          style={{ borderWidth: 1, borderColor: '#e2e8f0' }}
        >
          <FontAwesome name="pencil" size={13} color="#2563eb" />
          <Text className="text-sm font-semibold text-primary-600">Edit</Text>
        </Pressable>
      </View>
    );
  }

  return null; // Save button is at the bottom of the edit form
}

function SaveButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center gap-2 rounded-xl py-4 mb-4"
      style={{ backgroundColor: '#2563eb' }}
    >
      <FontAwesome name="save" size={16} color="#fff" />
      <Text className="text-base font-bold text-white">Save Budget</Text>
    </Pressable>
  );
}

// ─── Template Selection Screen ────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'employee' as const,
    title: 'Employee / Freelancer',
    subtitle: 'For salaried workers and freelancers',
    icon: 'briefcase' as const,
    color: '#2563eb',
    bgColor: '#dbeafe',
  },
  {
    id: 'ofw' as const,
    title: 'OFW',
    subtitle: 'For overseas Filipino workers',
    icon: 'plane' as const,
    color: '#0d9488',
    bgColor: '#ccfbf1',
  },
  {
    id: 'student' as const,
    title: 'Student',
    subtitle: 'For students and allowance earners',
    icon: 'graduation-cap' as const,
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
];

function TemplateSelector({ onSelect, savedTemplates }: {
  onSelect: (t: TemplateType) => void;
  savedTemplates: Set<TemplateType>;
}) {
  return (
    <ScrollView className="flex-1 px-4 pt-6">
      <ContentWrapper>
        <Text className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-1">
          Budget Templates
        </Text>
        <Text className="text-sm text-surface-500 dark:text-surface-400 mb-6">
          Choose a template that fits your financial situation
        </Text>

        {TEMPLATES.map((t) => (
          <Pressable key={t.id} onPress={() => onSelect(t.id)}>
            <Card variant="elevated" className="mb-4">
              <View className="flex-row items-center">
                <View
                  className="mr-4 h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: t.bgColor }}
                >
                  <FontAwesome name={t.icon} size={24} color={t.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-surface-900 dark:text-surface-100">
                    {t.title}
                  </Text>
                  <Text className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
                    {t.subtitle}
                  </Text>
                </View>
                {savedTemplates.has(t.id) && (
                  <View className="mr-2 flex-row items-center gap-1 bg-accent-50 rounded-full px-2 py-1">
                    <FontAwesome name="check-circle" size={12} color="#16a34a" />
                    <Text className="text-xs text-accent-700 font-medium">Saved</Text>
                  </View>
                )}
                <FontAwesome name="chevron-right" size={14} color="#94a3b8" />
              </View>
            </Card>
          </Pressable>
        ))}
      </ContentWrapper>
    </ScrollView>
  );
}

// ─── Employee / Freelancer Template ──────────────────────────────────────────

const EMP_INCOME: FieldDef[] = [
  { key: 'salary', label: 'Salary' },
  { key: 'sideHustle', label: 'Side Hustle' },
  { key: 'overtime', label: 'Overtime' },
  { key: 'allowances', label: 'Allowances' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'commissions', label: 'Commissions' },
];
const EMP_FIXED: FieldDef[] = [
  { key: 'rent', label: 'Rent (House / Apartment / Condo)' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'water', label: 'Water' },
  { key: 'internet', label: 'Internet' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'tuition', label: 'Tuition' },
  { key: 'studentAllowance', label: 'Student Allowance' },
  { key: 'schoolProjects', label: 'School Projects' },
  { key: 'gasFuel', label: 'Gas / Fuel' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'hmo', label: 'HMO' },
];
const EMP_VARIABLE: FieldDef[] = [
  { key: 'food', label: 'Food' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'personalCare', label: 'Personal Care' },
  { key: 'sariSari', label: 'Sari-sari Store / Daily Gastos' },
  { key: 'workSupplies', label: 'Work Supplies & Tools' },
  { key: 'clothing', label: 'Clothing / Gear' },
  { key: 'supportFamily', label: 'Support to Family' },
];
const EMP_UTANG: FieldDef[] = [
  { key: 'utangFriends', label: 'Utang (Family & Friends)' },
  { key: 'creditCard', label: 'Credit Card' },
  { key: 'sukingTindahan', label: 'Suking Tindahan' },
  { key: 'paluwagan', label: 'Paluwagan' },
  { key: 'fiveToSix', label: '5-6' },
  { key: 'carLoan', label: 'Car Loan / Motor Loan' },
  { key: 'housingLoan', label: 'Housing Loan' },
];
const EMP_IPON: FieldDef[] = [
  { key: 'emergencyFunds', label: 'Emergency Funds' },
  { key: 'iponChallenge', label: 'Ipon Challenge' },
  { key: 'savings', label: 'Savings' },
  { key: 'tuition', label: 'Tuition' },
];

const STORAGE_KEY_EMPLOYEE = 'budget_template_employee';

function EmployeeTemplate() {
  const [cycle, setCycle] = useState('');
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const income = useFields(EMP_INCOME.map((f) => f.key));
  const fixed = useFields(EMP_FIXED.map((f) => f.key));
  const variable = useFields(EMP_VARIABLE.map((f) => f.key));
  const utang = useFields(EMP_UTANG.map((f) => f.key));
  const ipon = useFields(EMP_IPON.map((f) => f.key));

  const totalExpenses = useMemo(
    () => fixed.total + variable.total + utang.total + ipon.total,
    [fixed.total, variable.total, utang.total, ipon.total]
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_EMPLOYEE).then((val) => {
      if (!val) return;
      const saved = JSON.parse(val);
      setCycle(saved.cycle ?? '');
      income.setAll(saved.income ?? {});
      fixed.setAll(saved.fixed ?? {});
      variable.setAll(saved.variable ?? {});
      utang.setAll(saved.utang ?? {});
      ipon.setAll(saved.ipon ?? {});
      setSavedAt(saved.savedAt ?? null);
      setMode('view');
    });
  }, []);

  const handleSave = async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY_EMPLOYEE, JSON.stringify({
      cycle,
      income: income.fields,
      fixed: fixed.fields,
      variable: variable.fields,
      utang: utang.fields,
      ipon: ipon.fields,
      savedAt: now,
    }));
    setSavedAt(now);
    setMode('view');
  };

  const cycleLabel = cycle === '15th' ? '15th of the Month' : cycle === '30th' ? '30th of the Month' : null;

  return (
    <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
      <ContentWrapper>
        <ActionBar mode={mode} savedAt={savedAt} onSave={handleSave} onEdit={() => setMode('edit')} />

        {/* Budget Cycle */}
        {mode === 'edit' ? (
          <View style={{ zIndex: 100 }}>
            <Select
              label="Budget Cycle"
              placeholder="Select cycle"
              options={[
                { label: '15th of the Month', value: '15th' },
                { label: '30th of the Month', value: '30th' },
              ]}
              value={cycle}
              onValueChange={setCycle}
            />
          </View>
        ) : (
          cycleLabel && (
            <View className="flex-row items-center mb-4 px-1">
              <Text className="text-sm font-medium text-surface-500 dark:text-surface-400 mr-2">Budget Cycle:</Text>
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">{cycleLabel}</Text>
            </View>
          )
        )}

        {/* Income */}
        <SectionHeader label="Income" total={income.total} color="bg-accent-50 dark:bg-accent-900/30" textColor="text-accent-700 dark:text-accent-300" />
        {mode === 'edit'
          ? <EditFields defs={EMP_INCOME} fields={income.fields} set={income.set} />
          : <ViewFields defs={EMP_INCOME} fields={income.fields} />
        }

        <View className="h-4" />

        {/* Fixed Expenses */}
        <SectionHeader label="Fixed Expenses" total={fixed.total} color="bg-warning-50 dark:bg-warning-900/30" textColor="text-warning-700 dark:text-warning-300" />
        {mode === 'edit'
          ? <EditFields defs={EMP_FIXED} fields={fixed.fields} set={fixed.set} />
          : <ViewFields defs={EMP_FIXED} fields={fixed.fields} />
        }

        <View className="h-4" />

        {/* Variable Expenses */}
        <SectionHeader label="Variable Expenses" total={variable.total} color="bg-warning-50 dark:bg-warning-900/30" textColor="text-warning-700 dark:text-warning-300" />
        {mode === 'edit'
          ? <EditFields defs={EMP_VARIABLE} fields={variable.fields} set={variable.set} />
          : <ViewFields defs={EMP_VARIABLE} fields={variable.fields} />
        }

        <View className="h-4" />

        {/* Utang */}
        <SectionHeader label="Utang (Debt & Obligations)" total={utang.total} color="bg-danger-50 dark:bg-danger-900/30" textColor="text-danger-700 dark:text-danger-300" />
        {mode === 'edit'
          ? <EditFields defs={EMP_UTANG} fields={utang.fields} set={utang.set} />
          : <ViewFields defs={EMP_UTANG} fields={utang.fields} />
        }

        <View className="h-4" />

        {/* Ipon */}
        <SectionHeader label="Ipon (Savings Goals)" total={ipon.total} color="bg-accent-50 dark:bg-accent-900/30" textColor="text-accent-700 dark:text-accent-300" />
        {mode === 'edit'
          ? <EditFields defs={EMP_IPON} fields={ipon.fields} set={ipon.set} />
          : <ViewFields defs={EMP_IPON} fields={ipon.fields} />
        }

        <View className="h-6" />

        {mode === 'edit' && <SaveButton onPress={handleSave} />}

        <RemainingBalance income={income.total} expenses={totalExpenses} />
      </ContentWrapper>
    </ScrollView>
  );
}

// ─── OFW Template ─────────────────────────────────────────────────────────────

const OFW_INCOME: FieldDef[] = [
  { key: 'salary', label: 'Salary (Local Currency)' },
  { key: 'remittance', label: 'Remittance Amount (PHP)' },
  { key: 'sideJobs', label: 'Side Jobs' },
];
const OFW_HOUSEHOLD: FieldDef[] = [
  { key: 'rent', label: 'Rent / Housing' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'water', label: 'Water' },
  { key: 'internet', label: 'Internet' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'tuitionAllowances', label: 'School Tuition & Allowances' },
  { key: 'phoneLoad', label: 'Phone Load' },
];
const OFW_OBLIGATIONS: FieldDef[] = [
  { key: 'loans', label: 'Loans (Bank / Cooperative / Digital)' },
  { key: 'housingLoan', label: 'Housing Loan' },
  { key: 'insurance', label: 'Insurance / Life Plan' },
  { key: 'sss', label: 'SSS Contribution' },
  { key: 'pagibig', label: 'Pag-IBIG Contribution' },
];
const OFW_SUPPORT: FieldDef[] = [
  { key: 'parents', label: 'Allowance for Parents' },
  { key: 'siblings', label: 'Allowance for Siblings' },
  { key: 'kids', label: 'Allowance for Kids' },
  { key: 'partnerAllowance', label: 'Allowance for Husband / GF / BF' },
  { key: 'specialRemittance', label: 'Special Remittance (Birthdays & Emergencies)' },
];
const OFW_SAVINGS: FieldDef[] = [
  { key: 'emergencyPH', label: 'Emergency Fund (Philippines)' },
  { key: 'emergencyAbroad', label: 'Emergency Fund (Abroad)' },
  { key: 'retirement', label: 'Retirement Fund' },
  { key: 'investment', label: 'Investment Budget' },
  { key: 'vacation', label: 'Vacation Fund' },
];
const OFW_SINKING: FieldDef[] = [
  { key: 'balikbayan', label: 'Balikbayan Box' },
  { key: 'planeTicker', label: 'Plane Ticket Fund' },
  { key: 'visaPassport', label: 'Visa / Passport Renewal' },
];

const STORAGE_KEY_OFW = 'budget_template_ofw';

function OFWTemplate() {
  const [cycle, setCycle] = useState('');
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const income = useFields(OFW_INCOME.map((f) => f.key));
  const household = useFields(OFW_HOUSEHOLD.map((f) => f.key));
  const obligations = useFields(OFW_OBLIGATIONS.map((f) => f.key));
  const support = useFields(OFW_SUPPORT.map((f) => f.key));
  const savings = useFields(OFW_SAVINGS.map((f) => f.key));
  const sinking = useFields(OFW_SINKING.map((f) => f.key));

  const totalExpenses = useMemo(
    () => household.total + obligations.total + support.total + savings.total + sinking.total,
    [household.total, obligations.total, support.total, savings.total, sinking.total]
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_OFW).then((val) => {
      if (!val) return;
      const saved = JSON.parse(val);
      setCycle(saved.cycle ?? '');
      income.setAll(saved.income ?? {});
      household.setAll(saved.household ?? {});
      obligations.setAll(saved.obligations ?? {});
      support.setAll(saved.support ?? {});
      savings.setAll(saved.savings ?? {});
      sinking.setAll(saved.sinking ?? {});
      setSavedAt(saved.savedAt ?? null);
      setMode('view');
    });
  }, []);

  const handleSave = async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY_OFW, JSON.stringify({
      cycle,
      income: income.fields,
      household: household.fields,
      obligations: obligations.fields,
      support: support.fields,
      savings: savings.fields,
      sinking: sinking.fields,
      savedAt: now,
    }));
    setSavedAt(now);
    setMode('view');
  };

  const cycleLabel = cycle === 'twice' ? 'Twice a Month' : cycle === 'monthly' ? 'Monthly' : null;

  return (
    <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
      <ContentWrapper>
        <ActionBar mode={mode} savedAt={savedAt} onSave={handleSave} onEdit={() => setMode('edit')} />

        {mode === 'edit' ? (
          <View style={{ zIndex: 100 }}>
            <Select
              label="Budget Cycle"
              placeholder="Select cycle"
              options={[
                { label: 'Twice a Month', value: 'twice' },
                { label: 'Monthly', value: 'monthly' },
              ]}
              value={cycle}
              onValueChange={setCycle}
            />
          </View>
        ) : (
          cycleLabel && (
            <View className="flex-row items-center mb-4 px-1">
              <Text className="text-sm font-medium text-surface-500 dark:text-surface-400 mr-2">Budget Cycle:</Text>
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">{cycleLabel}</Text>
            </View>
          )
        )}

        <SectionHeader label="Income" total={income.total} color="bg-accent-50 dark:bg-accent-900/30" textColor="text-accent-700 dark:text-accent-300" />
        {mode === 'edit' ? <EditFields defs={OFW_INCOME} fields={income.fields} set={income.set} /> : <ViewFields defs={OFW_INCOME} fields={income.fields} />}

        <View className="h-4" />

        <SectionHeader label="Household Expenses (Philippines)" total={household.total} color="bg-warning-50 dark:bg-warning-900/30" textColor="text-warning-700 dark:text-warning-300" />
        {mode === 'edit' ? <EditFields defs={OFW_HOUSEHOLD} fields={household.fields} set={household.set} /> : <ViewFields defs={OFW_HOUSEHOLD} fields={household.fields} />}

        <View className="h-4" />

        <SectionHeader label="Obligations" total={obligations.total} color="bg-danger-50 dark:bg-danger-900/30" textColor="text-danger-700 dark:text-danger-300" />
        {mode === 'edit' ? <EditFields defs={OFW_OBLIGATIONS} fields={obligations.fields} set={obligations.set} /> : <ViewFields defs={OFW_OBLIGATIONS} fields={obligations.fields} />}

        <View className="h-4" />

        <SectionHeader label="Support & Remittance" total={support.total} color="bg-warning-50 dark:bg-warning-900/30" textColor="text-warning-700 dark:text-warning-300" />
        {mode === 'edit' ? <EditFields defs={OFW_SUPPORT} fields={support.fields} set={support.set} /> : <ViewFields defs={OFW_SUPPORT} fields={support.fields} />}

        <View className="h-4" />

        <SectionHeader label="Personal Savings" total={savings.total} color="bg-accent-50 dark:bg-accent-900/30" textColor="text-accent-700 dark:text-accent-300" />
        {mode === 'edit' ? <EditFields defs={OFW_SAVINGS} fields={savings.fields} set={savings.set} /> : <ViewFields defs={OFW_SAVINGS} fields={savings.fields} />}

        <View className="h-4" />

        <SectionHeader label="Sinking Funds" total={sinking.total} color="bg-primary-50 dark:bg-primary-900/30" textColor="text-primary-700 dark:text-primary-300" />
        {mode === 'edit' ? <EditFields defs={OFW_SINKING} fields={sinking.fields} set={sinking.set} /> : <ViewFields defs={OFW_SINKING} fields={sinking.fields} />}

        <View className="h-6" />

        {mode === 'edit' && <SaveButton onPress={handleSave} />}

        <RemainingBalance income={income.total} expenses={totalExpenses} />
      </ContentWrapper>
    </ScrollView>
  );
}

// ─── Student Template ─────────────────────────────────────────────────────────

const STU_INCOME: FieldDef[] = [
  { key: 'weeklyAllowance', label: 'Weekly Allowance' },
  { key: 'parentalSupport', label: 'Parental Support' },
  { key: 'scholarship', label: 'Scholarship Allowance' },
  { key: 'partTime', label: 'Part-time Income' },
];
const STU_SCHOOL: FieldDef[] = [
  { key: 'fare', label: 'Fare / Transportation' },
  { key: 'lunchSnacks', label: 'Lunch & Snacks' },
  { key: 'supplies', label: 'School Supplies' },
  { key: 'projectsContrib', label: 'Projects & Group Contributions' },
];
const STU_PERSONAL: FieldDef[] = [
  { key: 'phoneLoad', label: 'Phone Load / Data' },
  { key: 'hygiene', label: 'Hygiene' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'miscellaneous', label: 'Miscellaneous & Small Gastos' },
];
const STU_DORM: FieldDef[] = [
  { key: 'rent', label: 'Rent' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'food', label: 'Food' },
  { key: 'groceries', label: 'Groceries' },
];
const STU_GOALS: FieldDef[] = [
  { key: 'emergency', label: 'Emergency Fund (kahit maliit)' },
  { key: 'gadget', label: 'Savings for Gadget' },
  { key: 'graduation', label: 'Graduation Fund' },
  { key: 'fieldTrip', label: 'Field Trip / Org Fees' },
  { key: 'hobbies', label: 'Hobbies / Leisure' },
  { key: 'barkada', label: 'Barkada Fund' },
];

const STORAGE_KEY_STUDENT = 'budget_template_student';

function StudentTemplate() {
  const [cycle, setCycle] = useState('');
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const income = useFields(STU_INCOME.map((f) => f.key));
  const school = useFields(STU_SCHOOL.map((f) => f.key));
  const personal = useFields(STU_PERSONAL.map((f) => f.key));
  const dorm = useFields(STU_DORM.map((f) => f.key));
  const goals = useFields(STU_GOALS.map((f) => f.key));

  const totalExpenses = useMemo(
    () => school.total + personal.total + dorm.total + goals.total,
    [school.total, personal.total, dorm.total, goals.total]
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_STUDENT).then((val) => {
      if (!val) return;
      const saved = JSON.parse(val);
      setCycle(saved.cycle ?? '');
      income.setAll(saved.income ?? {});
      school.setAll(saved.school ?? {});
      personal.setAll(saved.personal ?? {});
      dorm.setAll(saved.dorm ?? {});
      goals.setAll(saved.goals ?? {});
      setSavedAt(saved.savedAt ?? null);
      setMode('view');
    });
  }, []);

  const handleSave = async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify({
      cycle,
      income: income.fields,
      school: school.fields,
      personal: personal.fields,
      dorm: dorm.fields,
      goals: goals.fields,
      savedAt: now,
    }));
    setSavedAt(now);
    setMode('view');
  };

  const cycleLabel = cycle === 'weekly' ? 'Weekly' : cycle === 'monthly' ? 'Monthly' : null;

  return (
    <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
      <ContentWrapper>
        <ActionBar mode={mode} savedAt={savedAt} onSave={handleSave} onEdit={() => setMode('edit')} />

        {mode === 'edit' ? (
          <View style={{ zIndex: 100 }}>
            <Select
              label="Budget Cycle"
              placeholder="Select cycle"
              options={[
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
              ]}
              value={cycle}
              onValueChange={setCycle}
            />
          </View>
        ) : (
          cycleLabel && (
            <View className="flex-row items-center mb-4 px-1">
              <Text className="text-sm font-medium text-surface-500 dark:text-surface-400 mr-2">Budget Cycle:</Text>
              <Text className="text-sm font-semibold text-surface-900 dark:text-surface-100">{cycleLabel}</Text>
            </View>
          )
        )}

        <SectionHeader label="Income / Allowance" total={income.total} color="bg-accent-50 dark:bg-accent-900/30" textColor="text-accent-700 dark:text-accent-300" />
        {mode === 'edit' ? <EditFields defs={STU_INCOME} fields={income.fields} set={income.set} /> : <ViewFields defs={STU_INCOME} fields={income.fields} />}

        <View className="h-4" />

        <SectionHeader label="School Related Expenses" total={school.total} color="bg-warning-50 dark:bg-warning-900/30" textColor="text-warning-700 dark:text-warning-300" />
        {mode === 'edit' ? <EditFields defs={STU_SCHOOL} fields={school.fields} set={school.set} /> : <ViewFields defs={STU_SCHOOL} fields={school.fields} />}

        <View className="h-4" />

        <SectionHeader label="Personal Expenses" total={personal.total} color="bg-warning-50 dark:bg-warning-900/30" textColor="text-warning-700 dark:text-warning-300" />
        {mode === 'edit' ? <EditFields defs={STU_PERSONAL} fields={personal.fields} set={personal.set} /> : <ViewFields defs={STU_PERSONAL} fields={personal.fields} />}

        <View className="h-4" />

        <SectionHeader label="Dorm & Boarding" total={dorm.total} color="bg-danger-50 dark:bg-danger-900/30" textColor="text-danger-700 dark:text-danger-300" />
        {mode === 'edit' ? <EditFields defs={STU_DORM} fields={dorm.fields} set={dorm.set} /> : <ViewFields defs={STU_DORM} fields={dorm.fields} />}

        <View className="h-4" />

        <SectionHeader label="Savings & Goals" total={goals.total} color="bg-accent-50 dark:bg-accent-900/30" textColor="text-accent-700 dark:text-accent-300" />
        {mode === 'edit' ? <EditFields defs={STU_GOALS} fields={goals.fields} set={goals.set} /> : <ViewFields defs={STU_GOALS} fields={goals.fields} />}

        <View className="h-6" />

        {mode === 'edit' && <SaveButton onPress={handleSave} />}

        <RemainingBalance income={income.total} expenses={totalExpenses} />
      </ContentWrapper>
    </ScrollView>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  employee: 'Employee / Freelancer',
  ofw: 'OFW',
  student: 'Student',
};

const ALL_STORAGE_KEYS: Record<TemplateType, string> = {
  employee: STORAGE_KEY_EMPLOYEE,
  ofw: STORAGE_KEY_OFW,
  student: STORAGE_KEY_STUDENT,
};

export function BudgetTemplate() {
  const [selected, setSelected] = useState<TemplateType | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<Set<TemplateType>>(new Set());

  // Check which templates have saved data for the selector badges
  useEffect(() => {
    const check = async () => {
      const results = await Promise.all(
        (Object.entries(ALL_STORAGE_KEYS) as [TemplateType, string][]).map(
          async ([type, key]) => ({ type, has: !!(await AsyncStorage.getItem(key)) })
        )
      );
      setSavedTemplates(new Set(results.filter((r) => r.has).map((r) => r.type)));
    };
    check();
  }, [selected]); // re-check when returning to selector

  if (!selected) {
    return <TemplateSelector onSelect={setSelected} savedTemplates={savedTemplates} />;
  }

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      <View className="flex-row items-center bg-white dark:bg-surface-800 px-4 py-3 border-b border-surface-100 dark:border-surface-700">
        <Pressable onPress={() => setSelected(null)} className="mr-3 p-1">
          <FontAwesome name="arrow-left" size={18} color="#64748b" />
        </Pressable>
        <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
          {TEMPLATE_LABELS[selected]}
        </Text>
      </View>

      {selected === 'employee' && <EmployeeTemplate />}
      {selected === 'ofw' && <OFWTemplate />}
      {selected === 'student' && <StudentTemplate />}
    </View>
  );
}
