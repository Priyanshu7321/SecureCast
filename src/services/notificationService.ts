import notifee, { AndroidImportance, AndroidStyle, AuthorizationStatus, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomNotification, NotificationType } from '../types/notification';

class NotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request notification permissions
      const settings = await notifee.requestPermission();
      console.log('Notification permission status:', settings.authorizationStatus);

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Set up notification event handlers
      notifee.onForegroundEvent(({ type, detail }) => {
        console.log('Foreground notification event:', type, detail);

        if (type === EventType.PRESS) {
          this.handleNotificationTap(detail.notification);
        }
      });

      notifee.onBackgroundEvent(async ({ type, detail }) => {
        console.log('Background notification event:', type, detail);

        if (type === EventType.PRESS) {
          this.handleNotificationTap(detail.notification);
        }
      });

      // Get initial notification if app was opened from notification
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification) {
        console.log('App opened from notification:', initialNotification);
        this.handleNotificationTap(initialNotification.notification);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      throw error;
    }
  }

  async createNotificationChannels(): Promise<void> {
    const channels = [
      {
        id: 'default',
        name: 'Default',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      },
      {
        id: 'success',
        name: 'Success Notifications',
        importance: AndroidImportance.DEFAULT,
        sound: 'success_sound',
      },
      {
        id: 'error',
        name: 'Error Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'error_sound',
      },
      {
        id: 'warning',
        name: 'Warning Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'warning_sound',
      },
      {
        id: 'info',
        name: 'Info Notifications',
        importance: AndroidImportance.DEFAULT,
        sound: 'info_sound',
      },
    ];

    for (const channel of channels) {
      await notifee.createChannel(channel);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();

      if (Platform.OS === 'android') {
        // For Android 13+, also request POST_NOTIFICATIONS permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED &&
            settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
        }
        return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      } else {
        return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    if (this.fcmToken) return this.fcmToken;

    try {
      // For FCM integration, you would typically use @react-native-firebase/messaging
      // For now, we'll return a mock token for demonstration
      const mockToken = `mock_token_${Date.now()}`;
      this.fcmToken = mockToken;
      await this.saveFCMToken(mockToken);
      return mockToken;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
    }

    return null;
  }

  private async saveFCMToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('fcm_token', token);
    } catch (error) {
      console.error('Failed to save FCM token:', error);
    }
  }

  async scheduleLocalNotification(notification: Omit<CustomNotification, 'id' | 'timestamp'>): Promise<string> {
    try {
      const notificationId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use Notifee for both platforms
      await notifee.displayNotification({
        id: notificationId,
        title: notification.title,
        body: notification.message,
        data: notification.data,
        android: {
          channelId: this.getChannelId(notification.type),
          importance: this.getAndroidImportance(notification.priority),
          smallIcon: 'ic_launcher',
          ...(notification.imageUrl && {
            largeIcon: notification.imageUrl,
            style: {
              type: AndroidStyle.BIGPICTURE,
              picture: notification.imageUrl,
            },
          }),
          actions: notification.actions?.map(action => ({
            title: action.title,
            pressAction: { id: action.id },
          })),
        },
        ios: {
          sound: notification.sound || 'default',
          badgeCount: 1,
          categoryId: this.getChannelId(notification.type),
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await notifee.cancelNotification(notificationId);
      } else {
        PushNotification.cancelLocalNotifications({ id: notificationId });
      }
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await notifee.setBadgeCount(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  private getChannelId(type: NotificationType): string {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  }

  private getAndroidImportance(priority: string): AndroidImportance {
    switch (priority) {
      case 'urgent': return AndroidImportance.HIGH;
      case 'high': return AndroidImportance.HIGH;
      case 'normal': return AndroidImportance.DEFAULT;
      case 'low': return AndroidImportance.LOW;
      default: return AndroidImportance.DEFAULT;
    }
  }

  private handleNotificationTap(notification: any): void {
    console.log('Notification tapped:', notification);
    // Handle navigation or other actions when notification is tapped
  }
}

export const notificationService = new NotificationService();