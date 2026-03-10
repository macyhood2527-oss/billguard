import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { defaultCurrency, supportedCurrencies } from '../constants/currencies';
import { defaultTheme, supportedThemes } from '../constants/themes';
import { getCurrentHouseholdSummary } from './householdService';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.');
  }
}

function safeCurrency(code) {
  const upper = String(code || '').toUpperCase();
  return supportedCurrencies.includes(upper) ? upper : defaultCurrency;
}

function safeFullName(value) {
  return String(value ?? '').trim().slice(0, 80);
}

function safeTheme(themeId) {
  const normalized = String(themeId || '').trim().toLowerCase();
  return supportedThemes.includes(normalized) ? normalized : defaultTheme;
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

export async function getProfileName(userId) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return safeFullName(data?.full_name);
}

export async function getOrCreateProfileTheme(userId) {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('profiles')
    .select('theme_color')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data?.theme_color) {
    return safeTheme(data.theme_color);
  }

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: userId, theme_color: defaultTheme }, { onConflict: 'id' });

  if (upsertError) throw upsertError;

  return defaultTheme;
}

export async function updateProfileName(userId, fullName) {
  assertSupabaseReady();

  const normalized = safeFullName(fullName);

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: normalized }, { onConflict: 'id' });

  if (error) throw error;

  return normalized;
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

export async function updateProfileTheme(userId, themeId) {
  assertSupabaseReady();

  const normalized = safeTheme(themeId);

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, theme_color: normalized }, { onConflict: 'id' });

  if (error) throw error;

  return normalized;
}

export async function getProfileSettingsSummary(userId) {
  assertSupabaseReady();

  const [currencyCode, fullName, themeId, household] = await Promise.all([
    getOrCreateProfileCurrency(userId),
    getProfileName(userId),
    getOrCreateProfileTheme(userId),
    getCurrentHouseholdSummary(),
  ]);

  return {
    currencyCode,
    fullName,
    themeId,
    activeHouseholdId: household.householdId,
    householdName: household.householdName,
    householdRole: household.householdRole,
    memberCount: household.memberCount,
  };
}
