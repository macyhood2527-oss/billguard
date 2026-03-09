import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ScreenContainer from '../../components/common/ScreenContainer';
import GlassCard from '../../components/common/GlassCard';
import { useAuth } from '../../hooks/AuthProvider';
import { useCurrency } from '../../hooks/CurrencyProvider';
import { supportedCurrencies } from '../../constants/currencies';
import { colors } from '../../constants/colors';

export default function ProfileScreen() {
  const { session, logout, isSupabaseConfigured } = useAuth();
  const { currencyCode, changeCurrency, isLoadingCurrency } = useCurrency();
  const [errorMessage, setErrorMessage] = useState('');
  const [currencyMessage, setCurrencyMessage] = useState('');

  async function handleLogout() {
    setErrorMessage('');

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase not configured. Add your Supabase URL and anon key in .env first.');
      return;
    }

    try {
      await logout();
    } catch (error) {
      setErrorMessage(error.message ?? 'Logout failed.');
    }
  }

  async function handleCurrencyChange(nextCode) {
    setErrorMessage('');
    setCurrencyMessage('');

    try {
      await changeCurrency(nextCode);
      setCurrencyMessage(`Currency updated to ${nextCode}.`);
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to update currency.');
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile & Settings</Text>
      <GlassCard style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{session?.user?.email ?? 'Not signed in'}</Text>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Preferred Currency</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={currencyCode}
            enabled={!isLoadingCurrency}
            onValueChange={handleCurrencyChange}
            style={styles.picker}
          >
            {supportedCurrencies.map((code) => (
              <Picker.Item key={code} label={code} value={code} />
            ))}
          </Picker>
        </View>
      </GlassCard>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {currencyMessage ? <Text style={styles.successText}>{currencyMessage}</Text> : null}

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 24,
    marginBottom: 12,
  },
  card: {
    padding: 14,
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    marginBottom: 10,
    fontWeight: '600',
  },
  successText: {
    color: colors.success,
    marginBottom: 10,
    fontWeight: '600',
  },
  pickerWrapper: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: colors.textPrimary,
  },
});
