import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ScreenContainer from '../../components/common/ScreenContainer';
import GlassCard from '../../components/common/GlassCard';
import InputField from '../../components/common/InputField';
import { billCategories } from '../../constants/categories';
import { colors } from '../../constants/colors';
import { defaultReminderDaysBefore, formatReminderOffset, reminderOffsetOptions } from '../../constants/reminders';
import { useCurrency } from '../../hooks/CurrencyProvider';
import { deleteBill, getBillById, listBillCategories, updateBill } from '../../services/billService';
import { recordPaymentForBill, undoPaymentForBillCurrentMonth } from '../../services/paymentService';
import { syncBillReminders } from '../../services/reminderService';
import { formatCurrency } from '../../utils/currency';

function toEditForm(bill, categories) {
  const safeCategory = categories.includes(bill.category) ? bill.category : categories[0];

  return {
    name: bill.name,
    amount: String(bill.amount),
    category: safeCategory,
    dueDay: String(bill.dueDay),
    recurring: bill.recurring,
    reminderEnabled: bill.reminderEnabled,
    reminderDaysBefore: bill.reminderDaysBefore ?? defaultReminderDaysBefore,
  };
}

export default function BillDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { currencyCode } = useCurrency();
  const [categories, setCategories] = useState(billCategories);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [undoingPaid, setUndoingPaid] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: billCategories[0],
    dueDay: '',
    recurring: true,
    reminderEnabled: false,
    reminderDaysBefore: defaultReminderDaysBefore,
  });

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const rows = await listBillCategories();
        if (!active || rows.length === 0) return;

        setCategories(rows);
      } catch {
        // Keep local fallback categories when remote load fails.
      }
    }

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const loadBill = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setErrorMessage('');
      const row = await getBillById(String(id));
      setBill(row);
      if (row) {
        setForm(toEditForm(row, categories));
      } else {
        setErrorMessage('Bill not found.');
      }
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to load bill.');
    } finally {
      setLoading(false);
    }
  }, [id, categories]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSavePress() {
    setErrorMessage('');
    setSuccessMessage('');

    if (!bill?.id) return;
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
      setSaving(true);
      const updated = await updateBill(bill.id, form);
      const syncResult = await syncBillReminders({ requestPermissions: form.reminderEnabled });
      setBill(updated);
      setForm(toEditForm(updated, categories));
      setIsEditing(false);
      setSuccessMessage(
        syncResult.permissionGranted || !form.reminderEnabled
          ? 'Bill updated successfully.'
          : 'Bill updated. Enable notifications to receive reminders.'
      );
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to update bill.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePress() {
    if (!bill?.id) return;
    setShowDeleteConfirm(true);
  }

  async function handleConfirmDelete() {
    if (!bill?.id) return;

    try {
      setErrorMessage('');
      setSuccessMessage('');
      setDeleting(true);
      await deleteBill(bill.id);
      await syncBillReminders();
      setShowDeleteConfirm(false);
      router.replace({ pathname: '/bills', params: { notice: 'Bill deleted successfully.' } });
    } catch (error) {
      const nextMessage = error.message ?? 'Failed to delete bill.';
      setErrorMessage(nextMessage);
      Alert.alert('Delete failed', nextMessage);
    } finally {
      setDeleting(false);
    }
  }

  async function handleMarkPaidPress() {
    if (!bill?.id) return;

    try {
      setErrorMessage('');
      setSuccessMessage('');
      setMarkingPaid(true);
      await recordPaymentForBill({ billId: bill.id, amountPaid: bill.amount });
      await syncBillReminders();
      await loadBill();
      setSuccessMessage('Payment recorded for this month.');
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to record payment.');
    } finally {
      setMarkingPaid(false);
    }
  }

  function handleUndoPaidPress() {
    if (!bill?.id) return;
    setShowUndoConfirm(true);
  }

  async function handleConfirmUndoPaid() {
    if (!bill?.id) return;

    try {
      setErrorMessage('');
      setSuccessMessage('');
      setUndoingPaid(true);
      await undoPaymentForBillCurrentMonth(bill.id);
      await syncBillReminders();
      await loadBill();
      setShowUndoConfirm(false);
      setSuccessMessage('Payment mark removed for this month.');
    } catch (error) {
      const nextMessage = error.message ?? 'Failed to undo payment.';
      setErrorMessage(nextMessage);
      Alert.alert('Undo failed', nextMessage);
    } finally {
      setUndoingPaid(false);
    }
  }

  if (loading) {
    return (
      <ScreenContainer>
        <Text style={styles.subtitle}>Loading bill...</Text>
      </ScreenContainer>
    );
  }

  if (!bill) {
    return (
      <ScreenContainer>
        <Text style={styles.errorText}>{errorMessage || 'Bill not found.'}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{bill.name}</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      {isEditing ? (
        <GlassCard style={styles.card}>
          <InputField label="Bill name" value={form.name} onChangeText={(value) => updateField('name', value)} />
          <InputField
            label="Amount"
            value={form.amount}
            onChangeText={(value) => updateField('amount', value)}
            keyboardType="decimal-pad"
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
          </View>
          <InputField
            label="Due day"
            value={form.dueDay}
            onChangeText={(value) => updateField('dueDay', value)}
            keyboardType="number-pad"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Recurring bill</Text>
            <Switch value={form.recurring} onValueChange={(value) => updateField('recurring', value)} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Bill reminder</Text>
            <Switch value={form.reminderEnabled} onValueChange={(value) => updateField('reminderEnabled', value)} />
          </View>

          {form.reminderEnabled ? (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Reminder timing</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.reminderDaysBefore}
                  onValueChange={(value) => updateField('reminderDaysBefore', Number(value))}
                  style={styles.picker}
                >
                  {reminderOffsetOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.secondaryButton, styles.flexButton]}
              onPress={() => {
                setIsEditing(false);
                setForm(toEditForm(bill, categories));
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, styles.flexButton]} onPress={handleSavePress} disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </View>
        </GlassCard>
      ) : (
        <>
          <GlassCard style={styles.card}>
            <Text style={styles.row}>Amount: {formatCurrency(bill.amount, currencyCode)}</Text>
            <Text style={styles.row}>Category: {bill.category}</Text>
            <Text style={styles.row}>Due day: {bill.dueDay}</Text>
            <Text style={styles.row}>Current cycle: {bill.dueText}</Text>
            <Text style={styles.row}>Recurring: {bill.recurring ? 'Yes' : 'No'}</Text>
            <Text style={styles.row}>
              Reminder: {bill.reminderEnabled ? formatReminderOffset(bill.reminderDaysBefore) : 'Off'}
            </Text>
            <Text style={styles.row}>Status: {bill.status}</Text>
          </GlassCard>

          <Pressable style={styles.primaryButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.primaryButtonText}>Edit Bill</Text>
          </Pressable>

          {bill.isPaidThisMonth ? (
            <Pressable style={styles.secondaryButton} onPress={handleUndoPaidPress} disabled={undoingPaid}>
              <Text style={styles.secondaryButtonText}>{undoingPaid ? 'Undoing...' : 'Undo Mark as Paid'}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.secondaryButton} onPress={handleMarkPaidPress} disabled={markingPaid}>
              <Text style={styles.secondaryButtonText}>{markingPaid ? 'Recording...' : 'Mark as Paid This Month'}</Text>
            </Pressable>
          )}

          {showUndoConfirm ? (
            <GlassCard style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Undo payment mark?</Text>
              <Text style={styles.confirmText}>
                This removes the current month payment record and makes the bill unpaid again.
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.secondaryButton, styles.flexButton, styles.noTopMargin]}
                  onPress={() => setShowUndoConfirm(false)}
                  disabled={undoingPaid}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, styles.flexButton, styles.noTopMargin]}
                  onPress={handleConfirmUndoPaid}
                  disabled={undoingPaid}
                >
                  <Text style={styles.primaryButtonText}>{undoingPaid ? 'Undoing...' : 'Yes, Undo'}</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : null}

          <Pressable style={styles.deleteButton} onPress={handleDeletePress} disabled={deleting}>
            <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete Bill'}</Text>
          </Pressable>

          {showDeleteConfirm ? (
            <GlassCard style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Delete this bill?</Text>
              <Text style={styles.confirmText}>
                This will remove the bill and any payment history linked to it for this household.
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.secondaryButton, styles.flexButton, styles.noTopMargin]}
                  onPress={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.deleteButton, styles.flexButton, styles.noTopMargin]}
                  onPress={handleConfirmDelete}
                  disabled={deleting}
                >
                  <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Yes, Delete'}</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 24,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
    marginBottom: 10,
  },
  successText: {
    color: colors.success,
    fontWeight: '600',
    marginBottom: 10,
  },
  card: {
    marginBottom: 4,
  },
  row: {
    color: colors.textPrimary,
    marginBottom: 8,
    fontSize: 15,
  },
  switchRow: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confirmCard: {
    marginTop: 12,
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(127,29,29,0.18)',
  },
  confirmTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  confirmText: {
    color: colors.textSecondary,
    marginBottom: 14,
  },
  noTopMargin: {
    marginTop: 0,
  },
});
