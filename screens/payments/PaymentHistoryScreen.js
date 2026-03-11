import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../components/common/AppIcon';
import ScreenContainer from '../../components/common/ScreenContainer';
import GlassCard from '../../components/common/GlassCard';
import { colors } from '../../constants/colors';
import { useCurrency } from '../../hooks/CurrencyProvider';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { listPayments } from '../../services/paymentService';
import { shareMonthlyPaymentsReport } from '../../services/reportService';
import { formatCurrency } from '../../utils/currency';

function formatDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString();
}

function getInitials(label) {
  const words = String(label ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function formatMonthLabel(value) {
  if (!value) return 'Unknown month';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Unknown month';
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function PaymentHistoryScreen() {
  const styles = useThemedStyles(createStyles);
  const { currencyCode } = useCurrency();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedPayer, setSelectedPayer] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

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

  const monthOptions = ['all', ...new Set(payments.map((payment) => payment.monthReference).filter(Boolean))];
  const payerOptions = ['all', ...new Set(payments.map((payment) => payment.paidByLabel).filter(Boolean))];

  const filteredPayments = payments.filter((payment) => {
    const matchesMonth = selectedMonth === 'all' || payment.monthReference === selectedMonth;
    const matchesPayer = selectedPayer === 'all' || payment.paidByLabel === selectedPayer;
    return matchesMonth && matchesPayer;
  });
  const monthlyPayments = payments.filter((payment) => payment.monthReference === selectedMonth);

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalCount = filteredPayments.length;
  const latestPayment = filteredPayments[0] ?? null;

  const handleExportReport = useCallback(async () => {
    if (selectedMonth === 'all') {
      Alert.alert('Choose a month', 'Select a month first before exporting a printable report.');
      return;
    }

    if (monthlyPayments.length === 0) {
      Alert.alert('No payments', 'There are no recorded payments for the selected month.');
      return;
    }

    try {
      setIsExporting(true);
      await shareMonthlyPaymentsReport({
        monthReference: selectedMonth,
        payments: monthlyPayments,
        currencyCode,
      });
    } catch (error) {
      Alert.alert('Export failed', error.message ?? 'Could not generate the monthly report.');
    } finally {
      setIsExporting(false);
    }
  }, [currencyCode, monthlyPayments, selectedMonth]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Payment History</Text>
      <Text style={styles.subtitle}>Recent bill payments and household spending</Text>

      {loading ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {!loading && !errorMessage && payments.length === 0 ? (
        <Text style={styles.emptyText}>No payments yet. Mark a bill as paid to see history.</Text>
      ) : null}

      {!loading && !errorMessage && payments.length > 0 ? (
        <>
          <View style={styles.summaryRow}>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <AppIcon name="DollarSign" size={18} color={colors.primary} />
              </View>
              <Text style={styles.summaryValue}>{formatCurrency(totalAmount, currencyCode)}</Text>
            </GlassCard>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>Payments</Text>
                <AppIcon name="CreditCard" size={18} color={colors.primary} />
              </View>
              <Text style={styles.summaryValue}>{totalCount}</Text>
            </GlassCard>
          </View>

          <GlassCard style={styles.filtersCard}>
            <View style={styles.filterHeader}>
              <AppIcon name="Calendar" size={18} color={colors.textSecondary} />
              <Text style={styles.filterLabel}>Month</Text>
            </View>
            <View style={styles.filterWrap}>
              {monthOptions.map((month) => {
                const active = selectedMonth === month;
                return (
                  <Pressable
                    key={month}
                    style={[styles.filterChip, active ? styles.filterChipActive : null]}
                    onPress={() => setSelectedMonth(month)}
                  >
                    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                      {month === 'all' ? 'All' : formatMonthLabel(month)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[
                styles.exportButton,
                selectedMonth === 'all' || isExporting ? styles.exportButtonDisabled : null,
              ]}
              onPress={handleExportReport}
              disabled={selectedMonth === 'all' || isExporting}
            >
              <View style={styles.exportButtonInner}>
                <AppIcon name="Receipt" size={18} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>
                  {isExporting ? 'Generating PDF...' : 'Export Monthly PDF'}
                </Text>
              </View>
            </Pressable>
            <Text style={styles.exportHint}>
              {selectedMonth === 'all'
                ? 'Choose a month to generate a printable report.'
                : `Exports ${formatMonthLabel(selectedMonth)} for the current household.`}
            </Text>

            <View style={styles.filterHeader}>
              <AppIcon name="Users" size={18} color={colors.textSecondary} />
              <Text style={styles.filterLabel}>Paid By</Text>
            </View>
            <View style={styles.filterWrap}>
              {payerOptions.map((payer) => {
                const active = selectedPayer === payer;
                return (
                  <Pressable
                    key={payer}
                    style={[styles.filterChip, active ? styles.filterChipActive : null]}
                    onPress={() => setSelectedPayer(payer)}
                  >
                    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                      {payer === 'all' ? 'All' : payer}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {latestPayment ? (
              <Text style={styles.filterMeta}>
                Latest match: {latestPayment.billName} on {formatDate(latestPayment.paidAt)}
              </Text>
            ) : (
              <Text style={styles.filterMeta}>No payments match the current filters.</Text>
            )}
          </GlassCard>
        </>
      ) : null}

      {!loading && !errorMessage && filteredPayments.length === 0 && payments.length > 0 ? (
        <Text style={styles.emptyText}>No payments match the selected filters.</Text>
      ) : null}

      {!loading && !errorMessage ? (
        <View style={styles.list}>
          {filteredPayments.map((payment) => (
            <GlassCard key={payment.id} style={styles.item}>
              <View style={styles.topRow}>
                <View style={styles.nameWrap}>
                  <View style={styles.nameRow}>
                    <AppIcon name="Receipt" size={20} color={colors.textSecondary} />
                    <Text style={styles.name}>{payment.billName}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <AppIcon name="Calendar" size={18} color={colors.textSecondary} />
                    <Text style={styles.meta}>
                      {formatDate(payment.paidAt)} · {formatMonthLabel(payment.monthReference)}
                    </Text>
                  </View>
                </View>
                <View style={styles.amountRow}>
                  <AppIcon name="DollarSign" size={18} color={colors.success} />
                  <Text style={styles.amount}>{formatCurrency(payment.amount, currencyCode)}</Text>
                </View>
              </View>

              <View style={styles.payerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(payment.paidByLabel)}</Text>
                </View>
                <View style={styles.payerTextWrap}>
                  <Text style={styles.payerLabel}>Paid by</Text>
                  <Text style={styles.payerName}>{payment.paidByLabel}</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const createStyles = () => StyleSheet.create({
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
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 20,
  },
  filtersCard: {
    padding: 12,
    marginBottom: 12,
  },
  filterLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  exportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  exportButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportHint: {
    color: colors.textSecondary,
    fontSize: 12,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  nameWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amount: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 16,
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(225,29,72,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: 12,
  },
  payerTextWrap: {
    flex: 1,
  },
  payerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  payerName: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
