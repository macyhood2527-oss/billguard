import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/AuthProvider';

export default function AuthLayout() {
  const { session, isSupabaseConfigured } = useAuth();

  if (!isSupabaseConfigured || session) {
    return <Redirect href="/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
