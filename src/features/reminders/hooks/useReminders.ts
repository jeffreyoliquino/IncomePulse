import { useCallback } from 'react';
import { useBudgetStore } from '../../../stores/budgetStore';
import { scheduleLocalReminder, cancelNotification } from '../services/notificationService';
import type { Reminder } from '../../../types/database';

export function useReminders() {
  const { reminders, addReminder, updateReminder, removeReminder, markReminderPaid } =
    useBudgetStore();

  const createReminder = useCallback(
    async (data: {
      title: string;
      description?: string;
      amount?: number;
      due_date: string;
      remind_days_before?: number;
      source?: Reminder['source'];
    }) => {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        user_id: '',
        title: data.title,
        description: data.description ?? null,
        amount: data.amount ?? null,
        due_date: data.due_date,
        remind_days_before: data.remind_days_before ?? 3,
        recurring_id: null,
        is_paid: false,
        paid_date: null,
        notification_sent: false,
        source: data.source ?? 'manual',
        created_at: new Date().toISOString(),
      };

      addReminder(newReminder);

      // Schedule local notification
      const dueDate = new Date(data.due_date);
      const remindDate = new Date(
        dueDate.getTime() -
          (data.remind_days_before ?? 3) * 24 * 60 * 60 * 1000
      );

      if (remindDate > new Date()) {
        const amountStr = data.amount ? ` - ₱${data.amount.toLocaleString()}` : '';
        await scheduleLocalReminder(
          `Bill Reminder: ${data.title}`,
          `Due on ${dueDate.toLocaleDateString('en-PH')}${amountStr}`,
          remindDate,
          { reminderId: newReminder.id }
        );
      }

      return newReminder;
    },
    [addReminder]
  );

  const payReminder = useCallback(
    (id: string) => {
      markReminderPaid(id);
    },
    [markReminderPaid]
  );

  const deleteReminder = useCallback(
    (id: string) => {
      removeReminder(id);
    },
    [removeReminder]
  );

  const upcomingReminders = reminders
    .filter((r) => !r.is_paid)
    .sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

  const paidReminders = reminders
    .filter((r) => r.is_paid)
    .sort(
      (a, b) =>
        new Date(b.paid_date ?? b.created_at).getTime() -
        new Date(a.paid_date ?? a.created_at).getTime()
    );

  const overdueReminders = upcomingReminders.filter(
    (r) => new Date(r.due_date) < new Date()
  );

  return {
    reminders,
    upcomingReminders,
    paidReminders,
    overdueReminders,
    createReminder,
    payReminder,
    deleteReminder,
    updateReminder,
  };
}
