import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { defaultCurrency, supportedCurrencies } from '../constants/currencies';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.');
  }
}

function safeCurrency(code) {
  const upper = String(code || '').toUpperCase();
  return supportedCurrencies.includes(upper) ? upper : defaultCurrency;
}

export async function getOrCreateProfileCurrency(userId) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('profiles')
    .select('currency_code')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data?.currency_code) {
    return safeCurrency(data.currency_code);
  }

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: userId, currency_code: defaultCurrency }, { onConflict: 'id' });

  if (upsertError) throw upsertError;

  return defaultCurrency;
}

export async function updateProfileCurrency(userId, currencyCode) {
  assertSupabaseReady();

  const normalized = safeCurrency(currencyCode);

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, currency_code: normalized }, { onConflict: 'id' });

  if (error) throw error;

  return normalized;
}
