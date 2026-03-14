import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import { createMMKVStorage } from '../lib/storage';

interface AuthState {
  session: Session | null;
  user: User | null;
  biometricEnabled: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsPasswordRecovery: (recovery: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      biometricEnabled: false,
      isLoading: true,
      isPasswordRecovery: false,
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsPasswordRecovery: (isPasswordRecovery) => set({ isPasswordRecovery }),
      reset: () =>
        set({
          session: null,
          user: null,
          isLoading: false,
          isPasswordRecovery: false,
        }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => createMMKVStorage('auth-storage')),
      partialize: (state) => ({
        biometricEnabled: state.biometricEnabled,
      }),
    }
  )
);
