import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '../lib/storage';

export type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'lifetime';

interface SubscriptionState {
  isPremium: boolean;
  plan: SubscriptionPlan;
  expiresAt: string | null; // ISO date string
  isLoading: boolean;
  setPremium: (isPremium: boolean, plan?: SubscriptionPlan, expiresAt?: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isPremium: false,
      plan: 'free',
      expiresAt: null,
      isLoading: false,
      setPremium: (isPremium, plan = 'free', expiresAt = null) =>
        set({ isPremium, plan, expiresAt }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ isPremium: false, plan: 'free', expiresAt: null }),
    }),
    {
      name: 'subscription-store',
      storage: createJSONStorage(() => createMMKVStorage('subscription-storage')),
    }
  )
);
