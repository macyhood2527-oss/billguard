import { StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';
import { colors } from '../../constants/colors';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import GlassCard from './GlassCard';

export default function StatCard({ title, value, tone = 'primary', cardStyle, valueStyle, icon }) {
  const styles = useThemedStyles(createStyles);
  const toneColor = colors[tone] || colors.primary;

  return (
    <GlassCard style={[styles.card, cardStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon ? <AppIcon name={icon} size={18} color={toneColor} /> : null}
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color: toneColor }, valueStyle]}>
        {value}
      </Text>
    </GlassCard>
  );
}

const createStyles = () => StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
});
