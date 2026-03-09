import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import InputField from '../../components/common/InputField';
import { useAuth } from '../../hooks/AuthProvider';
import { colors } from '../../constants/colors';

export default function LoginScreen() {
  const { loginWithEmail, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin() {
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase not configured. Add your Supabase URL and anon key in .env first.');
      return;
    }

    try {
      setLoading(true);
      await loginWithEmail(email.trim(), password);
    } catch (error) {
      setErrorMessage(error.message ?? 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>BillGuard</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <InputField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </Pressable>

      <Link href="/signup" asChild>
        <Pressable>
          <Text style={styles.link}>No account yet? Sign up</Text>
        </Pressable>
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  link: {
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    marginBottom: 10,
    fontWeight: '600',
  },
});
