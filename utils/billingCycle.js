const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getCurrentMonthReference(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function getDueDateForCurrentCycle(dueDay, now = new Date()) {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const maxDay = daysInMonth(year, monthIndex);
  const safeDueDay = Math.min(Math.max(Number(dueDay) || 1, 1), maxDay);
  return new Date(year, monthIndex, safeDueDay);
}

export function getDueTiming(dueDay, now = new Date()) {
  const today = startOfDay(now);
  const dueDate = getDueDateForCurrentCycle(dueDay, now);
  const dayDiff = Math.round((dueDate.getTime() - today.getTime()) / DAY_MS);

  if (dayDiff < 0) {
    const overdueDays = Math.abs(dayDiff);
    return {
      kind: 'overdue',
      dayDiff,
      dueDate,
      label: `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`,
    };
  }

  if (dayDiff === 0) {
    return {
      kind: 'today',
      dayDiff,
      dueDate,
      label: 'Due today',
    };
  }

  return {
    kind: 'upcoming',
    dayDiff,
    dueDate,
    label: `Due in ${dayDiff} day${dayDiff === 1 ? '' : 's'}`,
  };
}
