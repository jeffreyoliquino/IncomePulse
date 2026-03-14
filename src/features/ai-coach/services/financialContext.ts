import type { Transaction, Category } from '@/src/types/database';
import { useTransactionStore } from '@/src/stores/transactionStore';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useRecurringStore } from '@/src/stores/recurringStore';

export interface CategorySpending {
  name: string;
  amount: number;
  percentage: number;
}

export interface BudgetStatus {
  name: string;
  budgeted: number;
  spent: number;
  utilization: number;
  isOverBudget: boolean;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface FinancialContext {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  topCategories: CategorySpending[];
  budgetStatuses: BudgetStatus[];
  overBudgetCount: number;
  recurringObligations: number;
  monthlyTrends: MonthlyTrend[];
  transactionCount: number;
  hasData: boolean;
  allCategorySpending: CategorySpending[];
  transactions: Transaction[];
  categories: Category[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'tip' | 'info';
  icon: string;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonthKey(): string {
  return getMonthKey(new Date());
}

function getLast3MonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(getMonthKey(d));
  }
  return keys;
}

export function buildFinancialContext(): FinancialContext {
  const { transactions, categories } = useTransactionStore.getState();
  const { budgets } = useBudgetStore.getState();
  const { recurringTransactions } = useRecurringStore.getState();

  const currentMonth = getCurrentMonthKey();

  // Current month transactions
  const monthTxns = transactions.filter(
    (t) => t.date && t.date.startsWith(currentMonth)
  );

  const monthlyIncome = monthTxns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthTxns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  // Top expense categories
  const categoryMap = new Map<string, number>();
  monthTxns
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const name = cat?.name ?? 'Uncategorized';
      categoryMap.set(name, (categoryMap.get(name) ?? 0) + t.amount);
    });

  const allCategorySpending: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  const topCategories = allCategorySpending.slice(0, 5);

  // Budget statuses
  const activeBudgets = budgets.filter((b) => b.is_active);
  const budgetStatuses: BudgetStatus[] = activeBudgets.map((budget) => {
    const spent = monthTxns
      .filter((t) => t.type === 'expense' && (!budget.category_id || t.category_id === budget.category_id))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      name: budget.name,
      budgeted: budget.amount,
      spent,
      utilization: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      isOverBudget: spent > budget.amount,
    };
  });

  const overBudgetCount = budgetStatuses.filter((b) => b.isOverBudget).length;

  // Recurring obligations
  const recurringObligations = recurringTransactions
    .filter((r) => r.is_active && r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  // Monthly trends (last 3 months)
  const last3 = getLast3MonthKeys();
  const monthlyTrends: MonthlyTrend[] = last3.map((month) => {
    const mTxns = transactions.filter((t) => t.date && t.date.startsWith(month));
    const income = mTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = mTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { month, income, expenses, savings: income - expenses };
  });

  return {
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    topCategories,
    allCategorySpending,
    budgetStatuses,
    overBudgetCount,
    recurringObligations,
    monthlyTrends,
    transactionCount: transactions.length,
    hasData: transactions.length > 0,
    transactions,
    categories,
  };
}
