import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/AuthProvider';
import { CurrencyProvider } from '../hooks/CurrencyProvider';
import { ThemeProvider } from '../hooks/ThemeProvider';
import { colors } from '../constants/colors';
import { cancelBillReminderNotifications, syncBillReminders } from '../services/reminderService';

function RootNavigator() {
  const { isLoading, session, isSupabaseConfigured } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    if (!session) {
      cancelBillReminderNotifications().catch(() => {});
      return undefined;
    }

    syncBillReminders().catch(() => {});
    return undefined;
  }, [isSupabaseConfigured, session]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <StatusBar style="light" backgroundColor={colors.background} />
          <RootNavigator />
        </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
