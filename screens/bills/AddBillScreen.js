import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ScreenContainer from '../../components/common/ScreenContainer';
import InputField from '../../components/common/InputField';
import GlassCard from '../../components/common/GlassCard';
import { billCategories } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { createBill, listBillCategories } from '../../services/billService';

export default function AddBillScreen() {
  const [categories, setCategories] = useState(billCategories);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: categories[0],
    dueDay: '',
    recurring: true,
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categoryHint = useMemo(() => categories.join(', '), [categories]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const rows = await listBillCategories();
        if (!active || rows.length === 0) return;

        setCategories(rows);
        setForm((prev) => ({
          ...prev,
          category: rows.includes(prev.category) ? prev.category : rows[0],
        }));
      } catch {
        // Keep local fallback categories when remote load fails.
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setErrorMessage('');

    if (!form.name.trim()) {
      setErrorMessage('Bill name is required.');
      return;
    }

    const parsedAmount = Number(form.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Amount must be a valid number greater than 0.');
      return;
    }

    const parsedDueDay = Number(form.dueDay);
    if (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      setErrorMessage('Due day must be an integer from 1 to 31.');
      return;
    }

    try {
      setLoading(true);
      await createBill(form);
      setForm({
        name: '',
        amount: '',
        category: categories[0],
        dueDay: '',
        recurring: true,
      });
      router.replace({ pathname: '/bills', params: { notice: 'Bill created successfully.' } });
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to create bill.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Add Bill</Text>
        <Text style={styles.subtitle}>Capture a new recurring or one-time bill</Text>
      </View>

      <InputField label="Bill name" value={form.name} onChangeText={(value) => updateField('name', value)} placeholder="e.g. Electricity" />
      <InputField
        label="Amount"
        value={form.amount}
        onChangeText={(value) => updateField('amount', value)}
        keyboardType="decimal-pad"
        placeholder="e.g. 49.99"
      />
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={form.category} onValueChange={(value) => updateField('category', value)} style={styles.picker}>
            {categories.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>
        <Text style={styles.fieldHint}>{categoryHint}</Text>
      </View>
      <InputField
        label="Due day"
        value={form.dueDay}
        onChangeText={(value) => updateField('dueDay', value)}
        keyboardType="number-pad"
        placeholder="1-31"
      />

      <GlassCard style={styles.switchRow}>
        <Text style={styles.switchLabel}>Recurring bill</Text>
        <Switch value={form.recurring} onValueChange={(value) => updateField('recurring', value)} />
      </GlassCard>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable style={styles.button} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Bill'}</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 14,
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
  switchRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  pickerWrapper: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: colors.textPrimary,
  },
  fieldHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  errorText: {
    color: colors.danger,
    marginBottom: 10,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
