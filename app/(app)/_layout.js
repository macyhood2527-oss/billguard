import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/AuthProvider';
import { colors } from '../../constants/colors';

export default function AppLayout() {
  const { session, isSupabaseConfigured } = useAuth();

  if (isSupabaseConfigured && !session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="bills/[id]"
        options={{
          title: 'Bill Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
        }}
      />
    </Stack>
  );
}
