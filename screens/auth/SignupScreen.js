import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import InputField from '../../components/common/InputField';
import { useAuth } from '../../hooks/AuthProvider';
import { colors } from '../../constants/colors';

export default function SignupScreen() {
  const { signupWithEmail, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSignup() {
    setMessage('');
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Use at least 6 characters for password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase not configured. Add your Supabase URL and anon key in .env first.');
      return;
    }

    try {
      setLoading(true);
      const data = await signupWithEmail(email.trim(), password);

      if (data?.session) {
        router.replace('/dashboard');
        return;
      }

      setMessage('Account created. Check your email to confirm, then log in.');
      router.replace('/login');
    } catch (error) {
      setErrorMessage(error.message ?? 'Signup failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start with a simple BillGuard account</Text>
      </View>

      <InputField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {message ? <Text style={styles.infoText}>{message}</Text> : null}

      <Pressable style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign up'}</Text>
      </Pressable>

      <Link href="/login" asChild>
        <Pressable>
          <Text style={styles.link}>Already have an account? Login</Text>
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
  infoText: {
    color: colors.success,
    marginBottom: 10,
    fontWeight: '600',
  },
});
