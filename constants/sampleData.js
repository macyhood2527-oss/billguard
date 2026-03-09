export const sampleBills = [
  {
    id: '1',
    name: 'Electricity Bill',
    amount: 72.5,
    category: 'Utilities',
    dueDay: 12,
    recurring: true,
    status: 'upcoming',
  },
  {
    id: '2',
    name: 'Internet Plan',
    amount: 49.99,
    category: 'Internet',
    dueDay: 15,
    recurring: true,
    status: 'paid',
  },
  {
    id: '3',
    name: 'Credit Card',
    amount: 180.0,
    category: 'Credit Card',
    dueDay: 8,
    recurring: true,
    status: 'overdue',
  },
];

export const dashboardSummary = {
  upcomingCount: 3,
  overdueCount: 1,
  paidCount: 6,
  monthlyObligation: 842.49,
};

export const paymentHistory = [
  { id: 'p1', name: 'Internet Plan', paidAt: '2026-03-01', amount: 49.99 },
  { id: 'p2', name: 'Water Bill', paidAt: '2026-02-28', amount: 32.15 },
  { id: 'p3', name: 'Rent', paidAt: '2026-02-27', amount: 450.0 },
];
