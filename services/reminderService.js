import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getDueDateForCurrentCycle } from '../utils/billingCycle';
import { listBills } from './billService';

const BILL_REMINDER_CHANNEL_ID = 'bill-reminders';
const BILL_REMINDER_TYPE = 'bill-reminder';
const DEFAULT_REMINDER_HOUR = 9;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function getDueDateForMonth(dueDay, year, monthIndex) {
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDueDay = Math.min(Math.max(Number(dueDay) || 1, 1), maxDay);
  return new Date(year, monthIndex, safeDueDay, DEFAULT_REMINDER_HOUR, 0, 0, 0);
}

function getNextCycleDueDate(bill, now) {
  const currentDueDate = getDueDateForCurrentCycle(bill.dueDay, now);
  currentDueDate.setHours(DEFAULT_REMINDER_HOUR, 0, 0, 0);

  if (!bill.recurring) {
    if (bill.isPaidThisMonth || currentDueDate < now) {
      return null;
    }

    return currentDueDate;
  }

  if (!bill.isPaidThisMonth && currentDueDate >= now) {
    return currentDueDate;
  }

  const nextMonthIndex = now.getMonth() + 1;
  const nextMonthYear = now.getFullYear() + Math.floor(nextMonthIndex / 12);
  const normalizedMonthIndex = nextMonthIndex % 12;
  return getDueDateForMonth(bill.dueDay, nextMonthYear, normalizedMonthIndex);
}

function getReminderTriggerDate(bill, now = new Date()) {
  if (!bill.reminderEnabled) return null;

  const dueDate = getNextCycleDueDate(bill, now);
  if (!dueDate) return null;

  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - Number(bill.reminderDaysBefore || 0));

  if (reminderDate > now) {
    return reminderDate;
  }

  const isSameDueDate =
    dueDate.getFullYear() === now.getFullYear() &&
    dueDate.getMonth() === now.getMonth() &&
    dueDate.getDate() === now.getDate();

  if (isSameDueDate && Number(bill.reminderDaysBefore || 0) === 0) {
    return new Date(now.getTime() + 5000);
  }

  if (!bill.recurring) {
    return null;
  }

  const fallbackDueDate = getDueDateForMonth(bill.dueDay, dueDate.getFullYear(), dueDate.getMonth() + 1);
  fallbackDueDate.setHours(DEFAULT_REMINDER_HOUR, 0, 0, 0);
  fallbackDueDate.setDate(fallbackDueDate.getDate() - Number(bill.reminderDaysBefore || 0));
  return fallbackDueDate > now ? fallbackDueDate : null;
}

export async function initializeReminderNotifications() {
  if (Platform.OS === 'web') {
    return { supported: false };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(BILL_REMINDER_CHANNEL_ID, {
      name: 'Bill reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return { supported: true };
}

export async function cancelBillReminderNotifications() {
  if (Platform.OS === 'web') return;

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const reminderNotifications = scheduledNotifications.filter(
    (item) => item.content?.data?.type === BILL_REMINDER_TYPE
  );

  await Promise.all(reminderNotifications.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

export async function syncBillReminders({ requestPermissions = false } = {}) {
  const initResult = await initializeReminderNotifications();
  if (!initResult.supported) {
    return { supported: false, permissionGranted: false, scheduledCount: 0 };
  }

  await cancelBillReminderNotifications();

  const existingPermissions = await Notifications.getPermissionsAsync();
  let permissionGranted = existingPermissions.granted || existingPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!permissionGranted && requestPermissions) {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    permissionGranted =
      requestedPermissions.granted ||
      requestedPermissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  if (!permissionGranted) {
    return { supported: true, permissionGranted: false, scheduledCount: 0 };
  }

  const bills = await listBills();
  let scheduledCount = 0;

  for (const bill of bills) {
    if (bill.status !== 'active') continue;

    const triggerDate = getReminderTriggerDate(bill);
    if (!triggerDate) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: bill.name,
        body: `Due on day ${bill.dueDay}. Open BillGuard to mark it paid.`,
        sound: false,
        data: {
          type: BILL_REMINDER_TYPE,
          billId: bill.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === 'android' ? BILL_REMINDER_CHANNEL_ID : undefined,
      },
    });

    scheduledCount += 1;
  }

  return { supported: true, permissionGranted: true, scheduledCount };
}
