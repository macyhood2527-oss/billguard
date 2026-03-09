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
    throw new Error('You must be logged in to view dashboard.');
  }

  return userId;
}

export async function getDashboardSummary() {
  const userId = await requireUserId();
  const monthReference = getCurrentMonthReference();

  const { data: billsData, error: billsError } = await supabase
    .from('bills')
    .select('id, amount, due_day, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (billsError) throw billsError;

  const bills = billsData ?? [];

  const { data: paymentsData, error: paymentsError } = await supabase
    .from('payments')
    .select('bill_id, amount_paid')
    .eq('user_id', userId)
    .eq('month_reference', monthReference);

  if (paymentsError) throw paymentsError;

  const paidBillIds = new Set((paymentsData ?? []).map((payment) => payment.bill_id));

  let upcomingCount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  for (const bill of bills) {
    if (paidBillIds.has(bill.id)) continue;

    const dueTiming = getDueTiming(bill.due_day);
    if (dueTiming.kind === 'overdue') {
      overdueCount += 1;
      overdueAmount += Number(bill.amount || 0);
    } else {
      upcomingCount += 1;
    }
  }

  const paidCount = bills.reduce((count, bill) => (paidBillIds.has(bill.id) ? count + 1 : count), 0);
  const monthlyObligation = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);

  const activeBillIds = new Set(bills.map((bill) => bill.id));
  const paidThisMonthTotal = (paymentsData ?? []).reduce((sum, payment) => {
    if (!activeBillIds.has(payment.bill_id)) return sum;
    return sum + Number(payment.amount_paid || 0);
  }, 0);

  const remainingThisMonth = Math.max(monthlyObligation - paidThisMonthTotal, 0);

  return {
    upcomingCount,
    overdueCount,
    paidCount,
    monthlyObligation,
    paidThisMonthTotal,
    remainingThisMonth,
    overdueAmount,
  };
}
