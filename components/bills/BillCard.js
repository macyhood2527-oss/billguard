import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/currency';
import GlassCard from '../common/GlassCard';

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

export default function BillCard({ bill, onPress, currencyCode }) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.name}>{bill.name}</Text>
          <Text style={styles.amount}>{formatCurrency(bill.amount, currencyCode)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${statusMap[bill.status] ?? colors.primary}22` }]}>
          <Text style={[styles.badgeText, { color: statusMap[bill.status] ?? colors.primary }]}>{bill.status}</Text>
        </View>
        <Text style={styles.meta}>Category: {bill.category}</Text>
        <Text style={styles.meta}>Due day: {bill.dueDay}</Text>
        <Text style={[styles.meta, styles.dueMeta, { color: dueMap[bill.dueKind] ?? colors.textSecondary }]}>{bill.dueText}</Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  amount: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontWeight: '700',
    textTransform: 'capitalize',
    fontSize: 12,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  dueMeta: {
    fontWeight: '600',
    marginTop: 2,
  },
});
