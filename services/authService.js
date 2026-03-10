import { isSupabaseConfigured, supabase } from '../lib/supabase';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.');
  }
}

export async function loginWithEmail(email, password) {
  assertSupabaseReady();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signupWithEmail(email, password) {
  assertSupabaseReady();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  assertSupabaseReady();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function changePassword({ email, currentPassword, newPassword }) {
  assertSupabaseReady();

  if (!email) {
    throw new Error('No account email found for this session.');
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (reauthError) throw new Error('Current password is incorrect.');

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) throw updateError;

  return true;
}
