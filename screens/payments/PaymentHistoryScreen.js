import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import GlassCard from '../../components/common/GlassCard';
import { colors } from '../../constants/colors';
import { useCurrency } from '../../hooks/CurrencyProvider';
import { listPayments } from '../../services/paymentService';
import { formatCurrency } from '../../utils/currency';

function formatDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString();
}

export default function PaymentHistoryScreen() {
  const { currencyCode } = useCurrency();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const rows = await listPayments(100);
      setPayments(rows);
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to load payment history.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments])
  );

  return (
    <ScreenContainer>
      <Text style={styles.title}>Payment History</Text>
      <Text style={styles.subtitle}>Recent bill payments</Text>

      {loading ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {!loading && !errorMessage && payments.length === 0 ? (
        <Text style={styles.emptyText}>No payments yet. Mark a bill as paid to see history.</Text>
      ) : null}

      {!loading && !errorMessage ? (
        <View style={styles.list}>
          {payments.map((payment) => (
            <GlassCard key={payment.id} style={styles.item}>
              <Text style={styles.name}>{payment.billName}</Text>
              <Text style={styles.meta}>{formatDate(payment.paidAt)}</Text>
              <Text style={styles.amount}>{formatCurrency(payment.amount, currencyCode)}</Text>
            </GlassCard>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 6,
  },
  list: {
    gap: 10,
  },
  item: {
    padding: 12,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  meta: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amount: {
    color: colors.success,
    fontWeight: '700',
  },
});
