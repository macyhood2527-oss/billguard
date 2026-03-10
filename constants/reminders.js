export const reminderOffsetOptions = [
  { label: 'On due date', value: 0 },
  { label: '1 day before', value: 1 },
  { label: '3 days before', value: 3 },
];

export const defaultReminderDaysBefore = 1;

export function formatReminderOffset(daysBefore) {
  const option = reminderOffsetOptions.find((item) => item.value === Number(daysBefore));
  return option?.label ?? `${daysBefore} day${Number(daysBefore) === 1 ? '' : 's'} before`;
}
