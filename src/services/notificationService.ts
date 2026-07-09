/**
 * notificationService.ts
 *
 * Dual-trigger Notifee scheduler engine.
 */

import notifee, { TriggerType, TimestampTrigger, AndroidImportance } from '@notifee/react-native';
import {
  NOTIF_CHANNEL_MAINTENANCE,
  NOTIF_CHANNEL_GENERAL,
  EARLY_REMINDER_MONTHS,
} from '../constants/config';

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // Authorized or Provisional
  } catch (e) {
    console.error('[notificationService] Failed to request permissions:', e);
    return false;
  }
};

export const createNotificationChannels = async (): Promise<void> => {
  // Create Android channels (safe to call on iOS, no-op)
  await notifee.createChannel({
    id: NOTIF_CHANNEL_MAINTENANCE,
    name: 'Vehicle Maintenance Alerts',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });

  await notifee.createChannel({
    id: NOTIF_CHANNEL_GENERAL,
    name: 'General Announcements',
    importance: AndroidImportance.DEFAULT,
  });
};

/**
 * Schedules two trigger notifications:
 *   1. Early reminder (typically 1 month prior)
 *   2. Due-date reminder
 * Returns a comma-concatenated string of trigger IDs (e.g. "early-id,due-id")
 */
export const scheduleMaintenanceReminder = async (
  reminderId: string,
  vehicleInfo: string, // e.g. "Tesla Model 3"
  title: string,       // e.g. "Oil Change Due"
  dueDateIso: string,
): Promise<string> => {
  const dueDate = new Date(dueDateIso);
  const now = new Date();

  const earlyDate = new Date(dueDate);
  earlyDate.setMonth(earlyDate.getMonth() - EARLY_REMINDER_MONTHS);

  const triggerIds: string[] = [];

  // 1. Due Date Reminder
  if (dueDate > now) {
    const dueTriggerId = `due-${reminderId}`;
    const dueTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: dueDate.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id: dueTriggerId,
        title: `Service Due: ${vehicleInfo}`,
        body: `${title} is due today. Schedule a visit at a CareTag center.`,
        android: {
          channelId: NOTIF_CHANNEL_MAINTENANCE,
          pressAction: { id: 'default' },
        },
      },
      dueTrigger,
    );
    triggerIds.push(dueTriggerId);
  }

  // 2. Early Reminder
  if (earlyDate > now) {
    const earlyTriggerId = `early-${reminderId}`;
    const earlyTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: earlyDate.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id: earlyTriggerId,
        title: `Upcoming Service: ${vehicleInfo}`,
        body: `${title} is due in 1 month. Plan ahead and reserve your slot.`,
        android: {
          channelId: NOTIF_CHANNEL_MAINTENANCE,
          pressAction: { id: 'default' },
        },
      },
      earlyTrigger,
    );
    triggerIds.push(earlyTriggerId);
  }

  return triggerIds.join(',');
};

/**
 * Cancels all trigger notifications parsed from a comma-concatenated trigger IDs string
 */
export const cancelMaintenanceReminder = async (notifIdString: string): Promise<void> => {
  if (!notifIdString) return;
  const ids = notifIdString.split(',').filter(Boolean);
  if (ids.length > 0) {
    await notifee.cancelAllNotifications(ids);
  }
};
