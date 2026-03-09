import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/AuthProvider';

export default function IndexRoute() {
  const { session, isSupabaseConfigured } = useAuth();

  if (!isSupabaseConfigured) {
    return <Redirect href="/dashboard" />;
  }

  return session ? <Redirect href="/dashboard" /> : <Redirect href="/login" />;
}
