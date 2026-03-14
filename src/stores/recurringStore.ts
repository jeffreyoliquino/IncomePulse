import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RecurringTransaction } from '../types/database';
import { createMMKVStorage } from '../lib/storage';

interface RecurringState {
  recurringTransactions: RecurringTransaction[];
  setRecurringTransactions: (items: RecurringTransaction[]) => void;
  addRecurring: (item: RecurringTransaction) => void;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  removeRecurring: (id: string) => void;
  toggleActive: (id: string) => void;
  clearUserData: () => void;
}

const initialState = {
  recurringTransactions: [] as RecurringTransaction[],
};

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set) => ({
      ...initialState,
      setRecurringTransactions: (recurringTransactions) => set({ recurringTransactions }),
      addRecurring: (item) =>
        set((state) => ({
          recurringTransactions: [item, ...state.recurringTransactions],
        })),
      updateRecurring: (id, updates) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((rt) =>
            rt.id === id ? { ...rt, ...updates } : rt
          ),
        })),
      removeRecurring: (id) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.filter((rt) => rt.id !== id),
        })),
      toggleActive: (id) =>
        set((state) => ({
          recurringTransactions: state.recurringTransactions.map((rt) =>
            rt.id === id ? { ...rt, is_active: !rt.is_active } : rt
          ),
        })),
      clearUserData: () => set({ ...initialState }),
    }),
    {
      name: 'recurring-store',
      storage: createJSONStorage(() => createMMKVStorage('recurring-storage')),
    }
  )
);
