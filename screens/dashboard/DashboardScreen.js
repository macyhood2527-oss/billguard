import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../components/common/AppIcon';
import ScreenContainer from '../../components/common/ScreenContainer';
import GlassCard from '../../components/common/GlassCard';
import StatCard from '../../components/common/StatCard';
import { colors } from '../../constants/colors';
import { useCurrency } from '../../hooks/CurrencyProvider';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getDashboardSummary } from '../../services/dashboardService';
import { formatCurrency } from '../../utils/currency';

export default function DashboardScreen() {
  const styles = useThemedStyles(createStyles);
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

      {loading ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {!loading && !errorMessage ? (
        <>
          <View style={styles.summaryGrid}>
            <View style={styles.gridItem}>
              <StatCard title="Upcoming Bills" value={String(summary.upcomingCount)} tone="warning" icon="Clock" cardStyle={styles.compactCard} />
            </View>
            <View style={styles.gridItem}>
              <StatCard title="Overdue Bills" value={String(summary.overdueCount)} tone="danger" icon="AlertCircle" cardStyle={styles.compactCard} />
            </View>
            <View style={styles.gridItem}>
              <StatCard title="Paid Bills" value={String(summary.paidCount)} tone="success" icon="CheckCircle" cardStyle={styles.compactCard} />
            </View>
            <View style={styles.gridItem}>
              <StatCard
                title="Monthly Summary"
                value={formatCurrency(summary.monthlyObligation, currencyCode)}
                tone="primary"
                icon="DollarSign"
                cardStyle={styles.compactCard}
                valueStyle={{ color: colors.primary }}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Insights</Text>
          <GlassCard style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightLabel}>Paid This Month</Text>
              <AppIcon name="CheckCircle" size={20} color={colors.success} />
            </View>
            <Text style={[styles.insightValue, { color: colors.success }]}>{formatCurrency(summary.paidThisMonthTotal, currencyCode)}</Text>
          </GlassCard>
          <GlassCard style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightLabel}>Remaining This Month</Text>
              <AppIcon name="Clock" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.insightValue, { color: colors.warning }]}>{formatCurrency(summary.remainingThisMonth, currencyCode)}</Text>
          </GlassCard>
          <GlassCard style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightLabel}>Overdue Amount</Text>
              <AppIcon name="AlertCircle" size={20} color={colors.danger} />
            </View>
            <Text style={[styles.insightValue, { color: colors.danger }]}>{formatCurrency(summary.overdueAmount, currencyCode)}</Text>
          </GlassCard>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const createStyles = () => StyleSheet.create({
  headerCard: {
    padding: 16,
    marginBottom: 10,
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
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  insightLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  insightValue: {
    fontWeight: '800',
    fontSize: 20,
  },
});
