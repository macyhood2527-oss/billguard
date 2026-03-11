import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function hasPlaceholderValue(value) {
  if (!value) return true;

  return value.includes('YOUR_PROJECT_ID') || value.includes('YOUR_SUPABASE');
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !hasPlaceholderValue(supabaseUrl) &&
    !hasPlaceholderValue(supabaseAnonKey)
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase env vars missing or still using placeholder values. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
