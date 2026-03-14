import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
  resetOnboarding: () => void;
  savingsTarget: number;
  setSavingsTarget: (target: number) => void;
  syncSavingsTargetToCloud: () => Promise<void>;
  fetchSavingsTargetFromCloud: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
      savingsTarget: 200000,
      setSavingsTarget: (target: number) => {
        set({ savingsTarget: target });
        // Also sync to cloud
        get().syncSavingsTargetToCloud();
      },
      syncSavingsTargetToCloud: async () => {
        if (!isSupabaseConfigured) {
          console.log('[AppStore] Supabase not configured, skipping sync');
          return;
        }
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('[AppStore] No user logged in, skipping sync');
            return;
          }

          const { savingsTarget } = get();
          console.log('[AppStore] Syncing savings target to cloud:', savingsTarget);

          // Use upsert to create profile if it doesn't exist
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email || '',
              savings_target: savingsTarget,
            }, {
              onConflict: 'id',
            });

          if (error) {
            console.error('[AppStore] Error syncing to cloud:', error.message);
          } else {
            console.log('[AppStore] Successfully synced savings target to cloud');
          }
        } catch (error) {
          console.error('[AppStore] Failed to sync savings target to cloud:', error);
        }
      },
      fetchSavingsTargetFromCloud: async () => {
        if (!isSupabaseConfigured) {
          console.log('[AppStore] Supabase not configured, skipping fetch');
          return;
        }
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('[AppStore] No user logged in, skipping fetch');
            return;
          }

          console.log('[AppStore] Fetching savings target from cloud...');

          // Use maybeSingle() instead of single() to handle missing profile
          const { data, error } = await supabase
            .from('profiles')
            .select('savings_target')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('[AppStore] Error fetching from cloud:', error.message);
            return;
          }

          console.log('[AppStore] Received savings_target from cloud:', data?.savings_target);

          if (data?.savings_target != null) {
            const newTarget = Number(data.savings_target);
            console.log('[AppStore] Setting savings target to:', newTarget);
            set({ savingsTarget: newTarget });
          } else {
            console.log('[AppStore] No savings_target in cloud, keeping local value');
            // If no profile exists, create one with current local value
            if (!data) {
              console.log('[AppStore] No profile found, creating one...');
              get().syncSavingsTargetToCloud();
            }
          }
        } catch (error) {
          console.error('[AppStore] Failed to fetch savings target from cloud:', error);
        }
      },
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => createMMKVStorage('app-storage')),
    }
  )
);
