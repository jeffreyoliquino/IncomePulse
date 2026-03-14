import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Input, Card, Button } from '../../components/ui';
import { formatCurrency } from '../../lib/formatters';
import {
  computeIncomeTax,
  computeSSS,
  computePhilHealth,
  computePagIBIG,
} from './utils/phTaxBrackets';

const STORAGE_KEY = 'salary_calculator_data';

// Helper to validate and format decimal input (up to 2 decimal places)
const formatDecimalInput = (value: string): string => {
  // Remove non-numeric characters except decimal point
  let cleaned = value.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + '.' + parts[1].slice(0, 2);
  }

  return cleaned;
};

export function SalaryCalculator() {
  const [grossMonthly, setGrossMonthly] = useState('');

  // Night Differential
  const [nightDiffHours, setNightDiffHours] = useState('');
  const [nightDiffRate, setNightDiffRate] = useState('');

  // Overtime
  const [overtimeHours, setOvertimeHours] = useState('');
  const [overtimeRate, setOvertimeRate] = useState('');

  // Additional income
  const [bonus, setBonus] = useState('');
  const [allowance, setAllowance] = useState('');
  const [riceAllowance, setRiceAllowance] = useState(''); // Non-taxable

  // Tax
  const [taxPercent, setTaxPercent] = useState('');

  // Deduction
  const [loan, setLoan] = useState('');

  // Remember Me
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.rememberMe) {
            setRememberMe(true);
            setGrossMonthly(data.grossMonthly ?? '');
            setNightDiffHours(data.nightDiffHours ?? '');
            setNightDiffRate(data.nightDiffRate ?? '');
            setOvertimeHours(data.overtimeHours ?? '');
            setOvertimeRate(data.overtimeRate ?? '');
            setBonus(data.bonus ?? '');
            setAllowance(data.allowance ?? '');
            setRiceAllowance(data.riceAllowance ?? '');
            setTaxPercent(data.taxPercent ?? '');
            setLoan(data.loan ?? '');
          }
        }
      } catch {
        // Ignore load errors
      }
    };
    loadSavedData();
  }, []);

  // Save data whenever fields change and rememberMe is on
  const saveData = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        rememberMe: true,
        grossMonthly, nightDiffHours, nightDiffRate,
        overtimeHours, overtimeRate, bonus, allowance,
        riceAllowance, taxPercent, loan,
      }));
    } catch {
      // Ignore save errors
    }
  }, [grossMonthly, nightDiffHours, nightDiffRate, overtimeHours, overtimeRate, bonus, allowance, riceAllowance, taxPercent, loan]);

  useEffect(() => {
    if (rememberMe) {
      saveData();
    }
  }, [rememberMe, saveData]);

  const handleToggleRememberMe = async () => {
    const newVal = !rememberMe;
    setRememberMe(newVal);
    if (!newVal) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  const result = useMemo(() => {
    const baseSalary = parseFloat(grossMonthly);
    if (!baseSalary || baseSalary <= 0) return null;

    // Calculate additional earnings
    const nightDiffEarnings =
      (parseFloat(nightDiffHours) || 0) * (parseFloat(nightDiffRate) || 0);
    const overtimeEarnings =
      (parseFloat(overtimeHours) || 0) * (parseFloat(overtimeRate) || 0);
    const bonusAmount = parseFloat(bonus) || 0;
    const allowanceAmount = parseFloat(allowance) || 0;
    const riceAllowanceAmount = parseFloat(riceAllowance) || 0; // Non-taxable
    const loanAmount = parseFloat(loan) || 0;

    // Total taxable income (base + night diff + overtime + bonus + allowance)
    // Rice allowance is non-taxable so excluded from taxable income
    const taxableMonthlyIncome = baseSalary + nightDiffEarnings + overtimeEarnings + bonusAmount + allowanceAmount;

    // Gross monthly including all earnings (for display)
    const totalGrossMonthly = taxableMonthlyIncome + riceAllowanceAmount;

    const sss = computeSSS(baseSalary);
    const philhealth = computePhilHealth(baseSalary);
    const pagibig = computePagIBIG(baseSalary);

    const totalMonthlyContributions =
      sss.employee + philhealth.employee + pagibig.employee;

    const customTaxRate = parseFloat(taxPercent) || 0;
    let monthlyTax: number;

    if (customTaxRate > 0) {
      // Use custom tax percentage on taxable income after contributions
      monthlyTax = (taxableMonthlyIncome - totalMonthlyContributions) * (customTaxRate / 100);
    } else {
      // Use PH TRAIN Law graduated tax brackets
      const annualTaxableGross = taxableMonthlyIncome * 12;
      const annualDeductions = totalMonthlyContributions * 12;
      const annualTaxable = annualTaxableGross - annualDeductions;
      const annualTax = computeIncomeTax(annualTaxable);
      monthlyTax = annualTax / 12;
    }

    // Total deductions including loan
    const totalMonthlyDeductions = totalMonthlyContributions + monthlyTax + loanAmount;

    // Net monthly = total gross - contributions - tax - loan
    const netMonthly = totalGrossMonthly - totalMonthlyContributions - monthlyTax - loanAmount;
    const thirteenthMonth = baseSalary;
    const annualNet = netMonthly * 12 + thirteenthMonth;

    return {
      baseSalary,
      nightDiffEarnings,
      overtimeEarnings,
      bonusAmount,
      allowanceAmount,
      riceAllowanceAmount,
      loanAmount,
      totalGrossMonthly,
      taxableMonthlyIncome,
      sss,
      philhealth,
      pagibig,
      totalContributions: totalMonthlyContributions,
      monthlyTax,
      totalDeductions: totalMonthlyDeductions,
      netMonthly,
      thirteenthMonth,
      annualGross: totalGrossMonthly * 12,
      annualNet,
      totalEmployerContribution: sss.employer + philhealth.employer + pagibig.employer,
    };
  }, [grossMonthly, nightDiffHours, nightDiffRate, overtimeHours, overtimeRate, bonus, allowance, riceAllowance, taxPercent, loan]);

  return (
    <ScrollView className="flex-1 px-4 pt-4">
      {/* Base Salary */}
      <Input
        label="Monthly Base Salary (PHP)"
        placeholder="e.g., 30000"
        keyboardType="decimal-pad"
        value={grossMonthly}
        onChangeText={(val) => setGrossMonthly(formatDecimalInput(val))}
        leftIcon={<Text className="text-base text-surface-400">₱</Text>}
      />

      {/* Night Differential */}
      <Text className="mb-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
        NIGHT DIFFERENTIAL
      </Text>
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Input
            label="Hours"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={nightDiffHours}
            onChangeText={(val) => setNightDiffHours(formatDecimalInput(val))}
          />
        </View>
        <View className="flex-1">
          <Input
            label="Rate/Hour"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={nightDiffRate}
            onChangeText={(val) => setNightDiffRate(formatDecimalInput(val))}
            leftIcon={<Text className="text-base text-surface-400">₱</Text>}
          />
        </View>
      </View>

      {/* Overtime */}
      <Text className="mb-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
        OVERTIME
      </Text>
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Input
            label="Hours"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={overtimeHours}
            onChangeText={(val) => setOvertimeHours(formatDecimalInput(val))}
          />
        </View>
        <View className="flex-1">
          <Input
            label="Rate/Hour"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={overtimeRate}
            onChangeText={(val) => setOvertimeRate(formatDecimalInput(val))}
            leftIcon={<Text className="text-base text-surface-400">₱</Text>}
          />
        </View>
      </View>

      {/* Additional Earnings */}
      <Text className="mb-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
        ADDITIONAL EARNINGS
      </Text>
      <Input
        label="Bonus"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={bonus}
        onChangeText={(val) => setBonus(formatDecimalInput(val))}
        leftIcon={<Text className="text-base text-surface-400">₱</Text>}
      />
      <Input
        label="Allowance"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={allowance}
        onChangeText={(val) => setAllowance(formatDecimalInput(val))}
        leftIcon={<Text className="text-base text-surface-400">₱</Text>}
      />
      <Input
        label="Rice Allowance (Non-Taxable)"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={riceAllowance}
        onChangeText={(val) => setRiceAllowance(formatDecimalInput(val))}
        leftIcon={<Text className="text-base text-surface-400">₱</Text>}
      />

      {/* Tax */}
      <Text className="mb-2 mt-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
        TAX
      </Text>
      <Input
        label="Tax % (leave empty for auto PH TRAIN Law)"
        placeholder="e.g., 15"
        keyboardType="decimal-pad"
        value={taxPercent}
        onChangeText={(val) => setTaxPercent(formatDecimalInput(val))}
        leftIcon={<Text className="text-base text-surface-400">%</Text>}
      />

      {/* Deductions */}
      <Text className="mb-2 mt-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
        DEDUCTIONS FROM PAY
      </Text>
      <Input
        label="Loan"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={loan}
        onChangeText={(val) => setLoan(formatDecimalInput(val))}
        leftIcon={<Text className="text-base text-surface-400">₱</Text>}
      />

      {/* Remember Me */}
      <Pressable
        onPress={handleToggleRememberMe}
        className="flex-row items-center mb-4 mt-2"
      >
        <View
          className={`h-5 w-5 rounded border-2 items-center justify-center mr-3 ${
            rememberMe
              ? 'bg-primary-500 border-primary-500'
              : 'border-surface-300 dark:border-surface-600'
          }`}
        >
          {rememberMe && (
            <FontAwesome name="check" size={12} color="white" />
          )}
        </View>
        <Text className="text-sm font-medium text-surface-700 dark:text-surface-300">
          Remember Me
        </Text>
      </Pressable>

      {result && (
        <View className="mt-2">
          {/* Net Pay */}
          <View className="mb-4 rounded-2xl p-5 shadow-md" style={{ backgroundColor: '#059669' }}>
            <Text className="text-sm text-white/80">Monthly Net Pay</Text>
            <Text className="mt-1 text-3xl font-bold text-white">
              {formatCurrency(result.netMonthly)}
            </Text>
          </View>

          {/* Earnings Breakdown */}
          <Text className="mb-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
            MONTHLY EARNINGS
          </Text>
          <Card variant="elevated" className="mb-4">
            <DeductionRow label="Base Salary" amount={result.baseSalary} />
            {result.nightDiffEarnings > 0 && (
              <DeductionRow label="Night Differential" amount={result.nightDiffEarnings} />
            )}
            {result.overtimeEarnings > 0 && (
              <DeductionRow label="Overtime" amount={result.overtimeEarnings} />
            )}
            {result.bonusAmount > 0 && (
              <DeductionRow label="Bonus" amount={result.bonusAmount} />
            )}
            {result.allowanceAmount > 0 && (
              <DeductionRow label="Allowance" amount={result.allowanceAmount} />
            )}
            {result.riceAllowanceAmount > 0 && (
              <DeductionRow label="Rice Allowance (Non-Taxable)" amount={result.riceAllowanceAmount} />
            )}
            <View className="my-2 h-px bg-surface-100 dark:bg-surface-700" />
            <DeductionRow
              label="Total Gross Monthly"
              amount={result.totalGrossMonthly}
              bold
              color="text-accent-600"
            />
          </Card>

          {/* Deductions Breakdown */}
          <Text className="mb-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
            MONTHLY DEDUCTIONS
          </Text>
          <Card variant="elevated" className="mb-4">
            <DeductionRow label="SSS" amount={result.sss.employee} />
            <DeductionRow label="PhilHealth" amount={result.philhealth.employee} />
            <DeductionRow label="Pag-IBIG" amount={result.pagibig.employee} />
            <View className="my-2 h-px bg-surface-100 dark:bg-surface-700" />
            <DeductionRow
              label="Total Contributions"
              amount={result.totalContributions}
              bold
            />
            <View className="my-2 h-px bg-surface-100 dark:bg-surface-700" />
            <DeductionRow label={`Income Tax${(parseFloat(taxPercent) || 0) > 0 ? ` (${taxPercent}%)` : ' (TRAIN Law)'}`} amount={result.monthlyTax} />
            {result.loanAmount > 0 && (
              <>
                <View className="my-2 h-px bg-surface-100 dark:bg-surface-700" />
                <DeductionRow label="Loan" amount={result.loanAmount} />
              </>
            )}
            <View className="my-2 h-px bg-surface-100 dark:bg-surface-700" />
            <DeductionRow
              label="Total Deductions"
              amount={result.totalDeductions}
              bold
              color="text-danger-600"
            />
          </Card>

          {/* Employer Share */}
          <Text className="mb-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
            EMPLOYER SHARE
          </Text>
          <Card variant="elevated" className="mb-4">
            <DeductionRow label="SSS (Employer)" amount={result.sss.employer} />
            <DeductionRow
              label="PhilHealth (Employer)"
              amount={result.philhealth.employer}
            />
            <DeductionRow label="Pag-IBIG (Employer)" amount={result.pagibig.employer} />
            <View className="my-2 h-px bg-surface-100 dark:bg-surface-700" />
            <DeductionRow
              label="Total Employer"
              amount={result.totalEmployerContribution}
              bold
            />
          </Card>

          {/* Annual Summary */}
          <Text className="mb-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
            ANNUAL SUMMARY
          </Text>
          <Card variant="elevated" className="mb-8">
            <DeductionRow label="Annual Gross" amount={result.annualGross} />
            <DeductionRow
              label="13th Month Pay"
              amount={result.thirteenthMonth}
            />
            <View className="my-2 h-px bg-surface-100 dark:bg-surface-700" />
            <DeductionRow
              label="Annual Net Income"
              amount={result.annualNet}
              bold
              color="text-accent-600"
            />
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

function DeductionRow({
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
      <Text
        className={`text-sm ${bold ? 'font-semibold' : ''} text-surface-700`}
      >
        {label}
      </Text>
      <Text className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${color}`}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}
