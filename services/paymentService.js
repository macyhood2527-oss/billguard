import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getCurrentMonthReference } from '../utils/billingCycle';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.');
  }
}

async function requireUserId() {
  assertSupabaseReady();

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const userId = data?.user?.id;
  if (!userId) {
    throw new Error('You must be logged in to access payments.');
  }

  return userId;
}

export async function listPayments(limit = 50) {
  const userId = await requireUserId();

  const { data: paymentRows, error } = await supabase
    .from('payments')
    .select('id, bill_id, amount_paid, paid_at, month_reference, created_at')
    .eq('user_id', userId)
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
      .eq('user_id', userId)
      .in('id', billIds);

    if (billsError) throw billsError;

    billNameById = Object.fromEntries((billRows ?? []).map((b) => [b.id, b.name]));
  }

  return payments.map((payment) => ({
    id: payment.id,
    billId: payment.bill_id,
    billName: billNameById[payment.bill_id] ?? 'Unknown bill',
    amount: Number(payment.amount_paid),
    paidAt: payment.paid_at,
    monthReference: payment.month_reference,
  }));
}

export async function recordPaymentForBill({ billId, amountPaid }) {
  const userId = await requireUserId();
  const monthReference = getCurrentMonthReference();

  const parsedAmount = Number(amountPaid);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('payments')
    .select('id')
    .eq('user_id', userId)
    .eq('bill_id', billId)
    .eq('month_reference', monthReference)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    throw new Error('This bill is already marked as paid for the current month.');
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      bill_id: billId,
      amount_paid: parsedAmount,
      month_reference: monthReference,
    })
    .select('id, bill_id, amount_paid, paid_at, month_reference')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    billId: data.bill_id,
    amount: Number(data.amount_paid),
    paidAt: data.paid_at,
    monthReference: data.month_reference,
  };
}

export async function undoPaymentForBillCurrentMonth(billId) {
  const userId = await requireUserId();
  const monthReference = getCurrentMonthReference();

  const { data: existing, error: existingError } = await supabase
    .from('payments')
    .select('id')
    .eq('user_id', userId)
    .eq('bill_id', billId)
    .eq('month_reference', monthReference)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing) {
    throw new Error('No payment found for this bill in the current month.');
  }

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', existing.id)
    .eq('user_id', userId);

  if (error) throw error;
}
