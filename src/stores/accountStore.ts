import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type AccountCategory = 'cash' | 'ewallet' | 'bank';

export interface Account {
  id: string;
  category: AccountCategory;
  subType?: string; // e.g. 'gcash', 'maya', 'bpi'
  name: string;     // user-defined label
  balance: number;
  createdAt: string;
}

interface AccountState {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt'>>) => void;
  deleteAccount: (id: string) => void;
  syncToCloud: () => Promise<void>;
  fetchFromCloud: () => Promise<void>;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      addAccount: (account) =>
        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              ...account,
              id: `account_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        }));
        // Fire-and-forget cloud delete
        if (isSupabaseConfigured) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('user_accounts').delete().eq('id', id).eq('user_id', user.id);
            }
          });
        }
      },

      syncToCloud: async () => {
        if (!isSupabaseConfigured) return;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { accounts } = get();
          if (accounts.length === 0) return;

          const rows = accounts.map((a) => ({
            id: a.id,
            user_id: user.id,
            category: a.category,
            sub_type: a.subType ?? null,
            name: a.name,
            balance: a.balance,
            updated_at: new Date().toISOString(),
          }));

          const { error } = await supabase
            .from('user_accounts')
            .upsert(rows, { onConflict: 'id' });

          if (error) {
            console.error('[AccountStore] syncToCloud error:', error.message);
          }
        } catch (err) {
          console.error('[AccountStore] syncToCloud failed:', err);
        }
      },

      fetchFromCloud: async () => {
        if (!isSupabaseConfigured) return;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('user_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('[AccountStore] fetchFromCloud error:', error.message);
            return;
          }

          if (data && data.length > 0) {
            const accounts: Account[] = data.map((row: any) => ({
              id: row.id,
              category: row.category as AccountCategory,
              subType: row.sub_type ?? undefined,
              name: row.name,
              balance: Number(row.balance),
              createdAt: row.created_at,
            }));
            set({ accounts });
          }
        } catch (err) {
          console.error('[AccountStore] fetchFromCloud failed:', err);
        }
      },
    }),
    {
      name: 'account-store',
      storage: createJSONStorage(() => createMMKVStorage('account-storage')),
    }
  )
);
