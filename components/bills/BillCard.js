import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../common/AppIcon';
import { colors } from '../../constants/colors';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { formatCurrency } from '../../utils/currency';
import GlassCard from '../common/GlassCard';

export default function BillCard({ bill, onPress, currencyCode }) {
  const styles = useThemedStyles(createStyles);
  const statusMap = {
    upcoming: colors.warning,
    paid: colors.success,
    overdue: colors.danger,
    active: colors.primary,
    paused: colors.warning,
    archived: colors.textSecondary,
  };
  const dueMap = {
    paid: colors.success,
    today: colors.warning,
    upcoming: colors.textSecondary,
    overdue: colors.danger,
  };
  const statusIconMap = {
    paid: 'CheckCircle',
    upcoming: 'Clock',
    today: 'Clock',
    overdue: 'AlertCircle',
    pending: 'Clock',
    active: 'Clock',
  };

  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.titleWrap}>
            <AppIcon name="FileText" size={20} color={colors.textSecondary} />
            <Text style={styles.name}>{bill.name}</Text>
          </View>
          <View style={styles.metaInlineRow}>
            <AppIcon name="DollarSign" size={18} color={colors.textSecondary} />
            <Text style={styles.amount}>{formatCurrency(bill.amount, currencyCode)}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: `${statusMap[bill.status] ?? colors.primary}22` }]}>
          <AppIcon
            name={statusIconMap[bill.status] ?? statusIconMap[bill.dueKind] ?? 'Clock'}
            size={18}
            color={statusMap[bill.status] ?? colors.primary}
          />
          <Text style={[styles.badgeText, { color: statusMap[bill.status] ?? colors.primary }]}>{bill.status}</Text>
        </View>
        <Text style={styles.meta}>Category: {bill.category}</Text>
        <View style={styles.metaInlineRow}>
          <AppIcon name="Calendar" size={18} color={colors.textSecondary} />
          <Text style={styles.meta}>Due day: {bill.dueDay}</Text>
        </View>
        <View style={styles.metaInlineRow}>
          <AppIcon name="RefreshCcw" size={18} color={colors.textSecondary} />
          <Text style={styles.meta}>Recurring bill</Text>
        </View>
        <View style={styles.metaInlineRow}>
          <AppIcon name="Calendar" size={18} color={dueMap[bill.dueKind] ?? colors.textSecondary} />
          <Text style={[styles.meta, styles.dueMeta, { color: dueMap[bill.dueKind] ?? colors.textSecondary }]}>{bill.dueText}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const createStyles = () => StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  amount: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  metaInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontWeight: '700',
    textTransform: 'capitalize',
    fontSize: 12,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  dueMeta: {
    fontWeight: '600',
  },
});
