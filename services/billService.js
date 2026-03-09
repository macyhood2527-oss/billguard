import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getCurrentMonthReference, getDueTiming } from '../utils/billingCycle';

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
    throw new Error('You must be logged in to access bills.');
  }

  return userId;
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

export async function listBills() {
  const userId = await requireUserId();
  const monthReference = getCurrentMonthReference();

  const { data, error } = await supabase
    .from('bills')
    .select('id, name, amount, due_day, is_recurring, status, created_at, bill_categories(name)')
    .eq('user_id', userId)
    .order('due_day', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;

  const bills = data ?? [];
  const billIds = bills.map((bill) => bill.id);
  const paidBillIds = new Set();

  if (billIds.length > 0) {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('bill_id')
      .eq('user_id', userId)
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
  const userId = await requireUserId();
  const monthReference = getCurrentMonthReference();

  const { data, error } = await supabase
    .from('bills')
    .select('id, name, amount, due_day, is_recurring, status, created_at, bill_categories(name)')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .select('bill_id')
    .eq('user_id', userId)
    .eq('bill_id', id)
    .eq('month_reference', monthReference)
    .maybeSingle();

  if (paymentError) throw paymentError;

  const paidBillIds = new Set(paymentData ? [paymentData.bill_id] : []);
  return normalizeBill(data, paidBillIds);
}

export async function createBill(input) {
  const userId = await requireUserId();
  const categoryId = await findCategoryIdByName(input.category);

  const payload = {
    user_id: userId,
    category_id: categoryId,
    name: input.name.trim(),
    amount: Number(input.amount),
    due_day: Number(input.dueDay),
    is_recurring: Boolean(input.recurring),
    status: 'active',
  };

  const { data, error } = await supabase
    .from('bills')
    .insert(payload)
    .select('id, name, amount, due_day, is_recurring, status, created_at, bill_categories(name)')
    .single();

  if (error) throw error;
  return normalizeBill(data);
}

export async function updateBill(id, input) {
  const userId = await requireUserId();
  const categoryId = await findCategoryIdByName(input.category);

  const updates = {
    category_id: categoryId,
    name: input.name.trim(),
    amount: Number(input.amount),
    due_day: Number(input.dueDay),
    is_recurring: Boolean(input.recurring),
  };

  const { data, error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, name, amount, due_day, is_recurring, status, created_at, bill_categories(name)')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Bill not found or not allowed.');
  return normalizeBill(data);
}

export async function deleteBill(id) {
  const userId = await requireUserId();

  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
