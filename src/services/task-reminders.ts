import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { MaintenanceTask, TaskRecurrence } from '@/domain/models';

const CHANNEL_ID = 'battlereef-reminders';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensurePermission() {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Aquarium care reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function scheduleTaskReminder(task: MaintenanceTask) {
  if (!task.dueAt || task.completedAt || Platform.OS === 'web') return null;

  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime()) || due.getTime() <= Date.now()) return null;
  if (!(await ensurePermission())) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'BattleReef care reminder',
      body: task.title,
      data: { route: '/tasks', taskId: task.id, aquariumId: task.aquariumId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: due,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}

export async function cancelTaskReminder(notificationId: string | null) {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // The OS may already have delivered or removed the notification.
  }
}

export function nextRecurringDue(dueAt: string | null, recurrence: TaskRecurrence) {
  if (!dueAt || recurrence === 'none') return null;
  const next = new Date(dueAt);
  if (Number.isNaN(next.getTime())) return null;

  if (recurrence === 'daily') next.setDate(next.getDate() + 1);
  if (recurrence === 'weekly') next.setDate(next.getDate() + 7);
  if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1);

  return next.toISOString();
}

export type DueState = 'none' | 'upcoming' | 'due_today' | 'overdue' | 'completed';

export function getTaskDueState(task: MaintenanceTask, now = new Date()): DueState {
  if (task.completedAt) return 'completed';
  if (!task.dueAt) return 'none';

  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime())) return 'none';

  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (dueDay < nowDay) return 'overdue';
  if (dueDay === nowDay) return 'due_today';
  return 'upcoming';
}
