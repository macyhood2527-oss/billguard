import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import GlassCard from '../../components/common/GlassCard';
import StatCard from '../../components/common/StatCard';
import { colors } from '../../constants/colors';
import { useCurrency } from '../../hooks/CurrencyProvider';
import { getDashboardSummary } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/currency';

export default function DashboardScreen() {
  const { currencyCode } = useCurrency();
  const [summary, setSummary] = useState({
    upcomingCount: 0,
    overdueCount: 0,
    paidCount: 0,
    monthlyObligation: 0,
    paidThisMonthTotal: 0,
    remainingThisMonth: 0,
    overdueAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const result = await getDashboardSummary();
      setSummary(result);
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  return (
    <ScreenContainer>
      <View style={styles.heroWrap}>
        <View style={styles.heroGlowPrimary} />
        <View style={styles.heroGlowSecondary} />
        <GlassCard style={styles.headerCard}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../../app/assets/icon.png')} style={styles.brandLogo} resizeMode="contain" />
              <Text style={styles.brandName}>BillGuard</Text>
            </View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Your monthly bill health at a glance</Text>
          </View>
        </GlassCard>
      </View>

      {loading ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {!loading && !errorMessage ? (
        <>
          <View style={styles.summaryGrid}>
            <View style={styles.gridItem}>
              <StatCard title="Upcoming Bills" value={String(summary.upcomingCount)} tone="warning" cardStyle={styles.compactCard} />
            </View>
            <View style={styles.gridItem}>
              <StatCard title="Overdue Bills" value={String(summary.overdueCount)} tone="danger" cardStyle={styles.compactCard} />
            </View>
            <View style={styles.gridItem}>
              <StatCard title="Paid Bills" value={String(summary.paidCount)} tone="success" cardStyle={styles.compactCard} />
            </View>
            <View style={styles.gridItem}>
              <StatCard
                title="Monthly Summary"
                value={formatCurrency(summary.monthlyObligation, currencyCode)}
                tone="primary"
                cardStyle={styles.compactCard}
                valueStyle={styles.monthlyValue}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Insights</Text>
          <GlassCard style={styles.insightCard}>
            <Text style={styles.insightLabel}>Paid This Month</Text>
            <Text style={[styles.insightValue, { color: colors.success }]}>{formatCurrency(summary.paidThisMonthTotal, currencyCode)}</Text>
          </GlassCard>
          <GlassCard style={styles.insightCard}>
            <Text style={styles.insightLabel}>Remaining This Month</Text>
            <Text style={[styles.insightValue, { color: colors.warning }]}>{formatCurrency(summary.remainingThisMonth, currencyCode)}</Text>
          </GlassCard>
          <GlassCard style={styles.insightCard}>
            <Text style={styles.insightLabel}>Overdue Amount</Text>
            <Text style={[styles.insightValue, { color: colors.danger }]}>{formatCurrency(summary.overdueAmount, currencyCode)}</Text>
          </GlassCard>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  heroGlowPrimary: {
    position: 'absolute',
    top: -36,
    right: 4,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(225,29,72,0.24)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    top: 20,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(251,113,133,0.12)',
  },
  headerCard: {
    padding: 16,
  },
  header: {
    marginBottom: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    borderRadius: 6,
  },
  brandName: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 26,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  loader: {
    marginVertical: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 8,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  compactCard: {
    minHeight: 110,
    paddingVertical: 12,
  },
  monthlyValue: {
    color: colors.primary,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 10,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  insightCard: {
    marginBottom: 10,
  },
  insightLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  insightValue: {
    fontWeight: '800',
    fontSize: 20,
  },
});
