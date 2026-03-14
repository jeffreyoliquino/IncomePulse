import { useCallback, useEffect } from 'react';
import { useRecurringStore } from '@/src/stores/recurringStore';
import { useTransactionStore } from '@/src/stores/transactionStore';
import { useBudgetStore } from '@/src/stores/budgetStore';
import {
  getDueRecurringTransactions,
  createTransactionFromRecurring,
  computeNextDueDate,
} from '../utils/recurringEngine';
import type { RecurringFrequency, RecurringTransaction, TransactionType } from '@/src/types/database';

interface CreateRecurringInput {
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  dayOfMonth?: number;
  autoCreate?: boolean;
  createReminder?: boolean;
}

export function useRecurringTransactions() {
  const {
    recurringTransactions,
    addRecurring,
    updateRecurring,
    removeRecurring,
    toggleActive,
  } = useRecurringStore();
  const { addTransaction } = useTransactionStore();
  const { addReminder } = useBudgetStore();

  // Process due recurring transactions on mount
  useEffect(() => {
    processDueTransactions();
  }, []);

  const processDueTransactions = useCallback(() => {
    const dueItems = getDueRecurringTransactions(recurringTransactions);

    for (const recurring of dueItems) {
      if (recurring.auto_create) {
        // Auto-create the transaction
        const transaction = createTransactionFromRecurring(recurring);
        addTransaction(transaction);
      }

      // Always create a reminder for expense types
      if (
        recurring.type === 'expense' &&
        !recurring.auto_create
      ) {
        addReminder({
          id: `rem-${recurring.id}-${Date.now()}`,
          user_id: recurring.user_id,
          title: recurring.description,
          description: `Recurring ${recurring.frequency} payment`,
          amount: recurring.amount,
          due_date: recurring.next_due_date,
          remind_days_before: 3,
          recurring_id: recurring.id,
          is_paid: false,
          paid_date: null,
          notification_sent: false,
          source: 'recurring',
          created_at: new Date().toISOString(),
        });
      }

      // Advance to next due date
      const nextDate = computeNextDueDate(
        recurring.next_due_date,
        recurring.frequency,
        recurring.day_of_month
      );
      updateRecurring(recurring.id, { next_due_date: nextDate });
    }
  }, [recurringTransactions, addTransaction, addReminder, updateRecurring]);

  const createRecurring = useCallback(
    (input: CreateRecurringInput) => {
      const newRecurring: RecurringTransaction = {
        id: Date.now().toString(),
        user_id: '',
        account_id: '',
        category_id: null,
        type: input.type,
        amount: input.amount,
        currency: 'PHP',
        description: input.description,
        frequency: input.frequency,
        start_date: input.startDate,
        end_date: input.endDate ?? null,
        next_due_date: input.startDate,
        day_of_month: input.dayOfMonth ?? null,
        is_active: true,
        auto_create: input.autoCreate ?? false,
        created_at: new Date().toISOString(),
      };

      addRecurring(newRecurring);

      // Create initial reminder if it's an expense
      if (input.createReminder && input.type === 'expense') {
        addReminder({
          id: `rem-${newRecurring.id}-init`,
          user_id: '',
          title: input.description,
          description: `Recurring ${input.frequency} payment`,
          amount: input.amount,
          due_date: input.startDate,
          remind_days_before: 3,
          recurring_id: newRecurring.id,
          is_paid: false,
          paid_date: null,
          notification_sent: false,
          source: 'recurring',
          created_at: new Date().toISOString(),
        });
      }

      return newRecurring;
    },
    [addRecurring, addReminder]
  );

  const deleteRecurring = useCallback(
    (id: string) => {
      removeRecurring(id);
    },
    [removeRecurring]
  );

  const activeRecurring = recurringTransactions.filter((rt) => rt.is_active);
  const inactiveRecurring = recurringTransactions.filter((rt) => !rt.is_active);

  // Calculate monthly projected amounts
  const monthlyProjectedIncome = activeRecurring
    .filter((rt) => rt.type === 'income')
    .reduce((sum, rt) => {
      const multiplier = getMonthlyMultiplier(rt.frequency);
      return sum + rt.amount * multiplier;
    }, 0);

  const monthlyProjectedExpenses = activeRecurring
    .filter((rt) => rt.type === 'expense')
    .reduce((sum, rt) => {
      const multiplier = getMonthlyMultiplier(rt.frequency);
      return sum + rt.amount * multiplier;
    }, 0);

  return {
    recurringTransactions,
    activeRecurring,
    inactiveRecurring,
    monthlyProjectedIncome,
    monthlyProjectedExpenses,
    createRecurring,
    deleteRecurring,
    toggleActive,
    processDueTransactions,
  };
}

function getMonthlyMultiplier(frequency: RecurringFrequency): number {
  switch (frequency) {
    case 'daily':
      return 30;
    case 'weekly':
      return 4.33;
    case 'biweekly':
      return 2.17;
    case 'monthly':
      return 1;
    case 'quarterly':
      return 1 / 3;
    case 'semi_annual':
      return 1 / 6;
    case 'annual':
      return 1 / 12;
  }
}
