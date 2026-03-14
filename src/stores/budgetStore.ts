import { create } from 'zustand';
import type { Budget, Reminder } from '../types/database';

interface BudgetState {
  budgets: Budget[];
  reminders: Reminder[];
  setBudgets: (budgets: Budget[]) => void;
  setReminders: (reminders: Reminder[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  removeBudget: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  markReminderPaid: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>()((set) => ({
  budgets: [],
  reminders: [],
  setBudgets: (budgets) => set({ budgets }),
  setReminders: (reminders) => set({ reminders }),
  addBudget: (budget) =>
    set((state) => ({ budgets: [budget, ...state.budgets] })),
  updateBudget: (id, updates) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),
  removeBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),
  addReminder: (reminder) =>
    set((state) => ({ reminders: [reminder, ...state.reminders] })),
  updateReminder: (id, updates) =>
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
  removeReminder: (id) =>
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    })),
  markReminderPaid: (id) =>
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id
          ? { ...r, is_paid: true, paid_date: new Date().toISOString() }
          : r
      ),
    })),
}));
