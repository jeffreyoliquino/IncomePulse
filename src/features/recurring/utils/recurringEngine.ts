import type { RecurringFrequency, RecurringTransaction, Transaction } from '@/src/types/database';

/**
 * Compute the next due date given a current date and frequency.
 */
export function computeNextDueDate(
  currentDate: string,
  frequency: RecurringFrequency,
  dayOfMonth?: number | null
): string {
  const date = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      if (dayOfMonth) {
        const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(dayOfMonth, maxDay));
      }
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      if (dayOfMonth) {
        const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(dayOfMonth, maxDay));
      }
      break;
    case 'semi_annual':
      date.setMonth(date.getMonth() + 6);
      if (dayOfMonth) {
        const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(dayOfMonth, maxDay));
      }
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
}

/**
 * Get all recurring transactions that are due (next_due_date <= today) and active.
 */
export function getDueRecurringTransactions(
  recurringList: RecurringTransaction[]
): RecurringTransaction[] {
  const today = new Date().toISOString().split('T')[0];
  return recurringList.filter(
    (rt) =>
      rt.is_active &&
      rt.next_due_date <= today &&
      (!rt.end_date || rt.end_date >= today)
  );
}

/**
 * Create a Transaction from a RecurringTransaction template.
 */
export function createTransactionFromRecurring(
  recurring: RecurringTransaction
): Transaction {
  return {
    id: `${recurring.id}-${Date.now()}`,
    user_id: recurring.user_id,
    account_id: recurring.account_id,
    category_id: recurring.category_id,
    type: recurring.type,
    amount: recurring.amount,
    currency: recurring.currency,
    description: recurring.description,
    notes: `Auto-created from recurring: ${recurring.description}`,
    date: recurring.next_due_date,
    is_recurring: true,
    recurring_id: recurring.id,
    receipt_url: null,
    source: 'manual',
    transfer_to_account_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get a human-readable frequency label.
 */
export function getFrequencyLabel(frequency: RecurringFrequency): string {
  const labels: Record<RecurringFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Every 2 Weeks',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Every 6 Months',
    annual: 'Yearly',
  };
  return labels[frequency];
}

/**
 * Get upcoming occurrences for a recurring transaction (next N occurrences).
 */
export function getUpcomingOccurrences(
  recurring: RecurringTransaction,
  count: number = 6
): string[] {
  const dates: string[] = [];
  let currentDate = recurring.next_due_date;

  for (let i = 0; i < count; i++) {
    if (recurring.end_date && currentDate > recurring.end_date) break;
    dates.push(currentDate);
    currentDate = computeNextDueDate(currentDate, recurring.frequency, recurring.day_of_month);
  }

  return dates;
}
