import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../constants/colors';
import { useThemedStyles } from '../../hooks/useThemedStyles';

export default function InputField({ label, value, onChangeText, ...props }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.textPrimary,
  },
});
