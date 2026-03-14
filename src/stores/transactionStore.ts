import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Transaction, Account, Category } from '../types/database';
import { createMMKVStorage } from '../lib/storage';

interface TransactionFilters {
  type?: string;
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

interface TransactionState {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  filters: TransactionFilters;
  selectedMonth: string; // YYYY-MM format
  currentUserId: string | null;
  setTransactions: (transactions: Transaction[]) => void;
  setAccounts: (accounts: Account[]) => void;
  setCategories: (categories: Category[]) => void;
  setFilters: (filters: TransactionFilters) => void;
  setSelectedMonth: (month: string) => void;
  setCurrentUserId: (userId: string | null) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  clearUserData: () => void;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const initialState = {
  transactions: [] as Transaction[],
  accounts: [] as Account[],
  categories: [] as Category[],
  filters: {} as TransactionFilters,
  selectedMonth: getCurrentMonth(),
  currentUserId: null as string | null,
};

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      ...initialState,
      setTransactions: (transactions) => set({ transactions }),
      setAccounts: (accounts) => set({ accounts }),
      setCategories: (categories) => set({ categories }),
      setFilters: (filters) => set({ filters }),
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
      setCurrentUserId: (currentUserId) => set({ currentUserId }),
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      addAccount: (account) =>
        set((state) => ({
          accounts: [account, ...state.accounts],
        })),
      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      removeAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),
      clearUserData: () => set({ ...initialState, selectedMonth: getCurrentMonth() }),
    }),
    {
      name: 'transaction-store',
      storage: createJSONStorage(() => createMMKVStorage('transaction-storage')),
      partialize: (state) => ({
        transactions: state.transactions,
        accounts: state.accounts,
        categories: state.categories,
        currentUserId: state.currentUserId,
      }),
    }
  )
);
