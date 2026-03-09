import { StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/colors';
import GlassCard from './GlassCard';

export default function StatCard({ title, value, tone = 'primary', cardStyle, valueStyle }) {
  return (
    <GlassCard style={[styles.card, cardStyle]}>
      <Text style={styles.title}>{title}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color: colors[tone] || colors.primary }, valueStyle]}>
        {value}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
});
