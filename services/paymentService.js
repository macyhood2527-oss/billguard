import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getCurrentMonthReference } from '../utils/billingCycle';
import { requireCurrentHousehold } from './householdService';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.');
  }
}

export async function listPayments(limit = 50) {
  const { householdId } = await requireCurrentHousehold();

  const { data: paymentRows, error } = await supabase
    .from('payments')
    .select('id, user_id, bill_id, amount_paid, paid_at, month_reference, created_at, paid_by_user_id, bill_name_snapshot, bill_category_snapshot')
    .eq('household_id', householdId)
    .order('paid_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const payments = paymentRows ?? [];
  const billIds = [...new Set(payments.map((p) => p.bill_id).filter(Boolean))];

  let billNameById = {};
  if (billIds.length > 0) {
    const { data: billRows, error: billsError } = await supabase
      .from('bills')
      .select('id, name')
      .eq('household_id', householdId)
      .in('id', billIds);

    if (billsError) throw billsError;

    billNameById = Object.fromEntries((billRows ?? []).map((b) => [b.id, b.name]));
  }

  const payerIds = [
    ...new Set(payments.map((payment) => payment.paid_by_user_id || payment.user_id).filter(Boolean)),
  ];
  let payerNameById = {};

  if (payerIds.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', payerIds);

    if (profilesError) throw profilesError;

    payerNameById = Object.fromEntries(
      (profileRows ?? []).map((profile) => [
        profile.id,
        profile.full_name?.trim() || 'Unnamed member',
      ])
    );
  }

  return payments.map((payment) => {
    const payerId = payment.paid_by_user_id || payment.user_id;

    return {
      id: payment.id,
      billId: payment.bill_id,
      billName: payment.bill_name_snapshot?.trim() || billNameById[payment.bill_id] || 'Unknown bill',
      billCategory: payment.bill_category_snapshot?.trim() || 'Uncategorized',
      amount: Number(payment.amount_paid),
      paidAt: payment.paid_at,
      monthReference: payment.month_reference,
      paidByLabel: payerNameById[payerId] ?? 'Unnamed member',
    };
  });
}

export async function recordPaymentForBill({ billId, amountPaid }) {
  const { userId, householdId, userEmail } = await requireCurrentHousehold();
  const monthReference = getCurrentMonthReference();

  const parsedAmount = Number(amountPaid);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('payments')
    .select('id')
    .eq('household_id', householdId)
    .eq('bill_id', billId)
    .eq('month_reference', monthReference)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    throw new Error('This bill is already marked as paid for the current month.');
  }

  const { data: billRow, error: billError } = await supabase
    .from('bills')
    .select('id, name, bill_categories(name)')
    .eq('household_id', householdId)
    .eq('id', billId)
    .maybeSingle();

  if (billError) throw billError;
  if (!billRow?.id) {
    throw new Error('Bill not found.');
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      household_id: householdId,
      paid_by_user_id: userId,
      bill_id: billId,
      bill_name_snapshot: billRow.name,
      bill_category_snapshot: billRow.bill_categories?.name ?? 'Uncategorized',
      amount_paid: parsedAmount,
      month_reference: monthReference,
    })
    .select('id, bill_id, amount_paid, paid_at, month_reference, bill_name_snapshot, bill_category_snapshot')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    billId: data.bill_id,
    billName: data.bill_name_snapshot?.trim() || billRow.name,
    billCategory: data.bill_category_snapshot?.trim() || 'Uncategorized',
    amount: Number(data.amount_paid),
    paidAt: data.paid_at,
    monthReference: data.month_reference,
    paidByLabel: userEmail || 'Unnamed member',
  };
}

export async function undoPaymentForBillCurrentMonth(billId) {
  const { householdId } = await requireCurrentHousehold();
  const monthReference = getCurrentMonthReference();

  const { data: existing, error: existingError } = await supabase
    .from('payments')
    .select('id')
    .eq('household_id', householdId)
    .eq('bill_id', billId)
    .eq('month_reference', monthReference)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing) {
    throw new Error('No payment found for this bill in the current month.');
  }

  const { data, error } = await supabase.rpc('undo_household_bill_payment', {
    target_bill_id: billId,
    target_month_reference: monthReference,
  });

  if (error) throw error;
  if (!data) {
    throw new Error('Payment could not be undone.');
  }
}
