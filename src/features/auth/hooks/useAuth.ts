import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import * as authService from '../services/authService';

export function useAuth() {
  const { session, user, isLoading, isPasswordRecovery, setSession, setUser, setIsLoading, setIsPasswordRecovery, reset } =
    useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // No Supabase credentials — run in demo/offline mode
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const data = await authService.signUp(email, password, displayName);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.signIn(email, password);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    reset();
  };

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    isPasswordRecovery,
    setIsPasswordRecovery,
    signUp,
    signIn,
    signOut,
  };
}
