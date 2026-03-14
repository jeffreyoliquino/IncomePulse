import * as Linking from 'expo-linking';
import { supabase } from '../../../lib/supabase';

export async function signUp(email: string, password: string, displayName: string) {
  // Deep link back into the app's confirm screen so the PKCE code_verifier
  // stored on this device is available to exchange for a session.
  const emailRedirectTo = Linking.createURL('/confirm');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo,
    },
  });

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      display_name: displayName,
      default_currency: 'PHP',
      biometric_enabled: false,
      notification_preferences: {
        bill_reminders: true,
        budget_alerts: true,
        weekly_summary: true,
        ai_tips: true,
      },
    });
    if (profileError) console.error('Profile creation error:', profileError);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function resetPassword(email: string) {
  const redirectTo =
    typeof window !== 'undefined'
      ? window.location.origin
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
