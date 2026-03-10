import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getCurrentMonthReference, getDueTiming } from '../utils/billingCycle';
import { requireCurrentHousehold } from './householdService';

const BILL_SELECT_BASE = 'id, name, amount, due_day, is_recurring, status, created_at, bill_categories(name)';
const BILL_SELECT_WITH_REMINDERS =
  'id, name, amount, due_day, is_recurring, reminder_enabled, reminder_days_before, status, created_at, bill_categories(name)';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.');
  }
}

function isMissingReminderColumnError(error) {
  if (!error) return false;

  const message = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  return message.includes('reminder_enabled') || message.includes('reminder_days_before');
}

function getReminderSchemaError() {
  return new Error('Reminder settings require the latest Supabase schema. Run the updated SQL in supabase/schema.sql and try again.');
}

function normalizeBill(row, paidBillIds = new Set()) {
  const isPaidThisMonth = paidBillIds.has(row.id);
  const dueTiming = getDueTiming(row.due_day);

  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    category: row.bill_categories?.name ?? 'Uncategorized',
    dueDay: row.due_day,
    recurring: row.is_recurring,
    reminderEnabled: Boolean(row.reminder_enabled),
    reminderDaysBefore: Number(row.reminder_days_before ?? 1),
    status: row.status,
    isPaidThisMonth,
    dueKind: isPaidThisMonth ? 'paid' : dueTiming.kind,
    dueText: isPaidThisMonth ? 'Paid this month' : dueTiming.label,
    dueDate: dueTiming.dueDate.toISOString(),
    createdAt: row.created_at,
  };
}

async function findCategoryIdByName(name) {
  if (!name?.trim()) return null;

  const { data, error } = await supabase
    .from('bill_categories')
    .select('id')
    .ilike('name', name.trim())
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export async function listBillCategories() {
  assertSupabaseReady();

  const { data, error } = await supabase
    .from('bill_categories')
    .select('name')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.name);
}

async function selectBillsQuery(builderFactory) {
  const primaryResult = await builderFactory(BILL_SELECT_WITH_REMINDERS);
  if (!isMissingReminderColumnError(primaryResult.error)) {
    return primaryResult;
  }

  return builderFactory(BILL_SELECT_BASE);
}

export async function listBills() {
  const { householdId } = await requireCurrentHousehold();
  const monthReference = getCurrentMonthReference();

  const { data, error } = await selectBillsQuery((selectClause) =>
    supabase
      .from('bills')
      .select(selectClause)
      .eq('household_id', householdId)
      .order('due_day', { ascending: true })
      .order('created_at', { ascending: false })
  );

  if (error) throw error;

  const bills = data ?? [];
  const billIds = bills.map((bill) => bill.id);
  const paidBillIds = new Set();

  if (billIds.length > 0) {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('bill_id')
      .eq('household_id', householdId)
      .eq('month_reference', monthReference)
      .in('bill_id', billIds);

    if (paymentsError) throw paymentsError;

    for (const row of paymentsData ?? []) {
      paidBillIds.add(row.bill_id);
    }
  }

  return bills.map((row) => normalizeBill(row, paidBillIds));
}

export async function getBillById(id) {
  const { householdId } = await requireCurrentHousehold();
  const monthReference = getCurrentMonthReference();

  const { data, error } = await selectBillsQuery((selectClause) =>
    supabase
      .from('bills')
      .select(selectClause)
      .eq('id', id)
      .eq('household_id', householdId)
      .maybeSingle()
  );

  if (error) throw error;
  if (!data) return null;

  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .select('bill_id')
    .eq('household_id', householdId)
    .eq('bill_id', id)
    .eq('month_reference', monthReference)
    .maybeSingle();

  if (paymentError) throw paymentError;

  const paidBillIds = new Set(paymentData ? [paymentData.bill_id] : []);
  return normalizeBill(data, paidBillIds);
}

export async function createBill(input) {
  const { userId, householdId } = await requireCurrentHousehold();
  const categoryId = await findCategoryIdByName(input.category);

  const payload = {
    user_id: userId,
    household_id: householdId,
    created_by_user_id: userId,
    category_id: categoryId,
    name: input.name.trim(),
    amount: Number(input.amount),
    due_day: Number(input.dueDay),
    is_recurring: Boolean(input.recurring),
    reminder_enabled: Boolean(input.reminderEnabled),
    reminder_days_before: Number(input.reminderDaysBefore ?? 1),
    status: 'active',
  };

  const { data, error } = await supabase
    .from('bills')
    .insert(payload)
    .select(BILL_SELECT_WITH_REMINDERS)
    .single();

  if (error) {
    if (isMissingReminderColumnError(error)) {
      if (input.reminderEnabled) throw getReminderSchemaError();

      const legacyPayload = {
        user_id: userId,
        household_id: householdId,
        created_by_user_id: userId,
        category_id: categoryId,
        name: input.name.trim(),
        amount: Number(input.amount),
        due_day: Number(input.dueDay),
        is_recurring: Boolean(input.recurring),
        status: 'active',
      };

      const { data: legacyData, error: legacyError } = await supabase
        .from('bills')
        .insert(legacyPayload)
        .select(BILL_SELECT_BASE)
        .single();

      if (legacyError) throw legacyError;
      return normalizeBill(legacyData);
    }

    throw error;
  }

  return normalizeBill(data);
}

export async function updateBill(id, input) {
  const { householdId } = await requireCurrentHousehold();
  const categoryId = await findCategoryIdByName(input.category);

  const updates = {
    category_id: categoryId,
    name: input.name.trim(),
    amount: Number(input.amount),
    due_day: Number(input.dueDay),
    is_recurring: Boolean(input.recurring),
    reminder_enabled: Boolean(input.reminderEnabled),
    reminder_days_before: Number(input.reminderDaysBefore ?? 1),
  };

  const { data, error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', id)
    .eq('household_id', householdId)
    .select(BILL_SELECT_WITH_REMINDERS)
    .maybeSingle();

  if (error) {
    if (isMissingReminderColumnError(error)) {
      if (input.reminderEnabled) throw getReminderSchemaError();

      const legacyUpdates = {
        category_id: categoryId,
        name: input.name.trim(),
        amount: Number(input.amount),
        due_day: Number(input.dueDay),
        is_recurring: Boolean(input.recurring),
      };

      const { data: legacyData, error: legacyError } = await supabase
        .from('bills')
        .update(legacyUpdates)
        .eq('id', id)
        .eq('household_id', householdId)
        .select(BILL_SELECT_BASE)
        .maybeSingle();

      if (legacyError) throw legacyError;
      if (!legacyData) throw new Error('Bill not found or not allowed.');
      return normalizeBill(legacyData);
    }

    throw error;
  }

  if (!data) throw new Error('Bill not found or not allowed.');
  return normalizeBill(data);
}

export async function deleteBill(id) {
  const { householdId } = await requireCurrentHousehold();

  const { data: existingBill, error: existingBillError } = await supabase
    .from('bills')
    .select('id')
    .eq('id', id)
    .eq('household_id', householdId)
    .maybeSingle();

  if (existingBillError) throw existingBillError;
  if (!existingBill) {
    throw new Error('Bill not found or not allowed.');
  }

  const { data, error } = await supabase.rpc('delete_household_bill', {
    target_bill_id: id,
  });

  if (error) throw error;
  if (!data) {
    throw new Error('Bill could not be deleted.');
  }
}
