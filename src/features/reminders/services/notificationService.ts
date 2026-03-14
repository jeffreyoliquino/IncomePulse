import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

// expo-notifications removed Android remote-push support from Expo Go in SDK 53.
// The native module error escapes JS try/catch boundaries, so we skip the require
// entirely in Expo Go by checking Constants.appOwnership.
const isExpoGo = (Constants.appOwnership as string) === 'expo';

let N: NotificationsModule | null = null;
if (!isExpoGo) {
  try {
    N = require('expo-notifications') as NotificationsModule;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Notifications unavailable in this environment
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  const mod = N;
  if (!mod || Platform.OS === 'web') return null;

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await mod.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await mod.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await mod.getExpoPushTokenAsync({ projectId });

    if (Platform.OS === 'android') {
      await mod.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: mod.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563eb',
      });
      await mod.setNotificationChannelAsync('bills', {
        name: 'Bill Reminders',
        description: 'Reminders for upcoming bill payments',
        importance: mod.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f59e0b',
      });
      await mod.setNotificationChannelAsync('budget', {
        name: 'Budget Alerts',
        description: 'Alerts when you exceed budget thresholds',
        importance: mod.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        lightColor: '#dc2626',
      });
    }

    return tokenData.data;
  } catch {
    return null;
  }
}

export async function scheduleLocalReminder(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, unknown>
): Promise<string> {
  const mod = N;
  if (!mod) return '';

  const now = new Date();
  const secondsUntilTrigger = Math.max(
    (triggerDate.getTime() - now.getTime()) / 1000,
    1
  );

  try {
    return await mod.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'bills' }),
      },
      trigger: {
        type: mod.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.round(secondsUntilTrigger),
      },
    });
  } catch {
    return '';
  }
}

export async function scheduleBudgetAlert(
  budgetName: string,
  percentage: number
): Promise<string> {
  const mod = N;
  if (!mod) return '';

  try {
    return await mod.scheduleNotificationAsync({
      content: {
        title: 'Budget Alert',
        body: `Your "${budgetName}" budget has reached ${Math.round(percentage * 100)}%. Consider reducing spending.`,
        data: { type: 'budget_alert', budgetName },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'budget' }),
      },
      trigger: null,
    });
  } catch {
    return '';
  }
}

export async function cancelNotification(id: string): Promise<void> {
  try { await N?.cancelScheduledNotificationAsync(id); } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  try { await N?.cancelAllScheduledNotificationsAsync(); } catch {}
}
