import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { useThemedStyles } from '../../hooks/useThemedStyles';

export default function GlassCard({ children, style }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.primary,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});
