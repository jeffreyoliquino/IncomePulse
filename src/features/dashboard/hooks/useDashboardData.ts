import { useMemo } from 'react';
import { useTransactionStore } from '../../../stores/transactionStore';
import { useBudgetStore } from '../../../stores/budgetStore';
import type { Transaction } from '../../../types/database';

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

interface CategoryBreakdown {
  name: string;
  amount: number;
  color: string;
}

interface SavingsRate {
  month: string;
  savingsRate: number;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + '-01');
  return d.toLocaleDateString('en-PH', { month: 'short' });
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  }
  return months;
}

export function useDashboardData() {
  const { transactions, categories, selectedMonth } = useTransactionStore();
  const { budgets, reminders } = useBudgetStore();

  const currentMonthKey = getCurrentMonthKey();

  // Current month summary
  const monthlySummary = useMemo(() => {
    const monthTxns = transactions.filter(
      (t) => getMonthKey(t.date) === currentMonthKey
    );

    const income = monthTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = monthTxns
      .filter((t) => t.type === 'savings_deposit')
      .reduce((sum, t) => sum + t.amount, 0) -
      monthTxns
        .filter((t) => t.type === 'savings_withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);

    const investments = monthTxns
      .filter((t) => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, savings, investments };
  }, [transactions, currentMonthKey]);

  // 6-month income vs expense trend
  const monthlyTrends = useMemo((): MonthlyTrend[] => {
    const months = getLast6Months();
    return months.map((monthKey) => {
      const monthTxns = transactions.filter(
        (t) => getMonthKey(t.date) === monthKey
      );
      return {
        month: getMonthLabel(monthKey),
        income: monthTxns
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        expenses: monthTxns
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [transactions]);

  // Expense breakdown by category
  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const monthTxns = transactions.filter(
      (t) => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey
    );

    const categoryMap = new Map<string, number>();
    for (const txn of monthTxns) {
      const catId = txn.category_id ?? 'uncategorized';
      categoryMap.set(catId, (categoryMap.get(catId) ?? 0) + txn.amount);
    }

    const result: CategoryBreakdown[] = [];
    for (const [catId, amount] of categoryMap) {
      const cat = categories.find((c) => c.id === catId);
      result.push({
        name: cat?.name ?? 'Other',
        amount,
        color: cat?.color ?? '#64748b',
      });
    }

    return result.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, currentMonthKey]);

  // Savings rate trend (6 months)
  const savingsRateTrend = useMemo((): SavingsRate[] => {
    const months = getLast6Months();
    return months.map((monthKey) => {
      const monthTxns = transactions.filter(
        (t) => getMonthKey(t.date) === monthKey
      );
      const income = monthTxns
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTxns
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

      return {
        month: getMonthLabel(monthKey),
        savingsRate: Math.round(savingsRate),
      };
    });
  }, [transactions]);

  // Budget alerts - check which budgets are over threshold
  const budgetAlerts = useMemo(() => {
    const monthTxns = transactions.filter(
      (t) => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey
    );

    console.log('🔍 BUDGET TRACKING DEBUG:');
    console.log('📅 Current month expenses:', monthTxns.length);
    console.log('💰 Total expenses this month:', monthTxns.reduce((sum, t) => sum + t.amount, 0));

    return budgets
      .filter((b) => b.is_active)
      .map((budget) => {
        console.log('\n💳 Budget:', budget.name);
        console.log('   Category ID:', budget.category_id);

        let spent: number;
        let matchingTxns: typeof monthTxns = [];

        if (budget.category_id) {
          matchingTxns = monthTxns.filter((t) => t.category_id === budget.category_id);
          spent = matchingTxns.reduce((sum, t) => sum + t.amount, 0);
          console.log('   ✅ Has category_id - filtering by category');
          console.log('   📊 Matching transactions:', matchingTxns.length);
          console.log('   💵 Spent in this category:', spent);
        } else {
          matchingTxns = monthTxns;
          spent = monthTxns.reduce((sum, t) => sum + t.amount, 0);
          console.log('   ❌ NO category_id - using ALL expenses');
          console.log('   💵 Total spent (all categories):', spent);
        }

        const percentage = budget.amount > 0 ? spent / budget.amount : 0;
        const isOverThreshold = percentage >= budget.alert_threshold;
        const isOverBudget = spent > budget.amount;

        return {
          ...budget,
          spent,
          percentage,
          isOverThreshold,
          isOverBudget,
        };
      });
  }, [budgets, transactions, currentMonthKey]);

  // Upcoming reminders (next 7 days)
  const upcomingReminders = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return reminders
      .filter((r) => {
        if (r.is_paid) return false;
        const dueDate = new Date(r.due_date);
        return dueDate >= now && dueDate <= weekFromNow;
      })
      .sort(
        (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
  }, [reminders]);

  return {
    monthlySummary,
    monthlyTrends,
    categoryBreakdown,
    savingsRateTrend,
    budgetAlerts,
    upcomingReminders,
  };
}
