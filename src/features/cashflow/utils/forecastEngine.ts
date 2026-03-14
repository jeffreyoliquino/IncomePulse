import type { Transaction, RecurringTransaction } from '@/src/types/database';
import { computeNextDueDate } from '@/src/features/recurring/utils/recurringEngine';

export interface ForecastDay {
  date: string;
  label: string;
  projectedIncome: number;
  projectedExpenses: number;
  netCashflow: number;
  cumulativeBalance: number;
  items: ForecastItem[];
}

export interface ForecastItem {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  source: 'recurring' | 'historical_average';
}

export interface ForecastSummary {
  totalProjectedIncome: number;
  totalProjectedExpenses: number;
  netCashflow: number;
  averageDailySpend: number;
  daysUntilNegative: number | null; // null means won't go negative
  lowestBalance: number;
  lowestBalanceDate: string | null;
}

/**
 * Generate a cashflow forecast for the given number of days.
 */
export function generateForecast(
  currentBalance: number,
  recurringTransactions: RecurringTransaction[],
  recentTransactions: Transaction[],
  forecastDays: number
): { days: ForecastDay[]; summary: ForecastSummary } {
  const today = new Date();
  const days: ForecastDay[] = [];

  // Compute historical daily averages from recent transactions (last 90 days)
  const { avgDailyIncome, avgDailyExpense } = computeHistoricalAverages(recentTransactions);

  // Build recurring schedule for the forecast period
  const recurringSchedule = buildRecurringSchedule(recurringTransactions, forecastDays);

  let cumulativeBalance = currentBalance;
  let lowestBalance = currentBalance;
  let lowestBalanceDate: string | null = null;
  let daysUntilNegative: number | null = null;

  let totalIncome = 0;
  let totalExpenses = 0;

  for (let i = 1; i <= forecastDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

    const items: ForecastItem[] = [];

    // Add recurring items for this date
    const recurringForDay = recurringSchedule.filter((r) => r.date === dateStr);
    for (const item of recurringForDay) {
      items.push(item);
    }

    // Add historical average for days without recurring entries
    const hasRecurringIncome = items.some((item) => item.type === 'income');
    const hasRecurringExpense = items.some((item) => item.type === 'expense');

    if (!hasRecurringExpense && avgDailyExpense > 0) {
      items.push({
        description: 'Estimated daily expenses',
        amount: avgDailyExpense,
        type: 'expense',
        source: 'historical_average',
      });
    }

    // Only add average daily income on business days (Mon-Fri) if no recurring income
    const dayOfWeek = date.getDay();
    if (!hasRecurringIncome && avgDailyIncome > 0 && dayOfWeek > 0 && dayOfWeek < 6) {
      // Spread monthly income across weekdays
    }

    const dayIncome = items
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const dayExpenses = items
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    const netCashflow = dayIncome - dayExpenses;

    cumulativeBalance += netCashflow;
    totalIncome += dayIncome;
    totalExpenses += dayExpenses;

    if (cumulativeBalance < lowestBalance) {
      lowestBalance = cumulativeBalance;
      lowestBalanceDate = dateStr;
    }

    if (cumulativeBalance < 0 && daysUntilNegative === null) {
      daysUntilNegative = i;
    }

    days.push({
      date: dateStr,
      label,
      projectedIncome: dayIncome,
      projectedExpenses: dayExpenses,
      netCashflow,
      cumulativeBalance,
      items,
    });
  }

  const summary: ForecastSummary = {
    totalProjectedIncome: totalIncome,
    totalProjectedExpenses: totalExpenses,
    netCashflow: totalIncome - totalExpenses,
    averageDailySpend: totalExpenses / forecastDays,
    daysUntilNegative,
    lowestBalance,
    lowestBalanceDate,
  };

  return { days, summary };
}

/**
 * Compute historical daily averages from recent transactions.
 */
function computeHistoricalAverages(transactions: Transaction[]): {
  avgDailyIncome: number;
  avgDailyExpense: number;
} {
  if (transactions.length === 0) {
    return { avgDailyIncome: 0, avgDailyExpense: 0 };
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

  const recentTx = transactions.filter((t) => t.date >= ninetyDaysAgoStr);

  if (recentTx.length === 0) {
    return { avgDailyIncome: 0, avgDailyExpense: 0 };
  }

  const totalIncome = recentTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = recentTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Count actual days in the data range
  const dates = recentTx.map((t) => t.date);
  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));
  const daySpan = Math.max(
    1,
    Math.ceil(
      (new Date(maxDate).getTime() - new Date(minDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );

  return {
    avgDailyIncome: totalIncome / daySpan,
    avgDailyExpense: totalExpense / daySpan,
  };
}

/**
 * Build a schedule of recurring transactions for the forecast period.
 */
function buildRecurringSchedule(
  recurringTransactions: RecurringTransaction[],
  forecastDays: number
): (ForecastItem & { date: string })[] {
  const schedule: (ForecastItem & { date: string })[] = [];
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + forecastDays);
  const endStr = endDate.toISOString().split('T')[0];

  for (const rt of recurringTransactions) {
    if (!rt.is_active) continue;

    let currentDate = rt.next_due_date;

    // Advance past dates to catch up to the forecast window
    const todayStr = today.toISOString().split('T')[0];
    while (currentDate < todayStr) {
      currentDate = computeNextDueDate(currentDate, rt.frequency, rt.day_of_month);
    }

    // Generate occurrences within the forecast period
    while (currentDate <= endStr) {
      if (rt.end_date && currentDate > rt.end_date) break;

      const isExpense = rt.type === 'expense';

      schedule.push({
        date: currentDate,
        description: rt.description,
        amount: rt.amount,
        type: isExpense ? 'expense' : 'income',
        source: 'recurring',
      });

      currentDate = computeNextDueDate(currentDate, rt.frequency, rt.day_of_month);
    }
  }

  return schedule;
}
