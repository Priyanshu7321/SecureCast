import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  initializeNotifications,
  requestPermissions,
  scheduleLocalNotification,
  addNotification,
  addInAppNotification,
  updateConfig,
} from '../store/slices/notificationSlice';
import { CustomNotification, NotificationType, NotificationPriority } from '../types/notification';

export const useNotificationViewModel = () => {
  const dispatch = useAppDispatch();
  const {
    notifications,
    inAppNotifications,
    config,
    isLoading,
    error,
    unreadCount,
    fcmToken,
  } = useAppSelector(state => state.notification);

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotificationSystem();
    
    // Add some demo notifications for testing
    setTimeout(() => {
      const demoNotifications = [
        {
          id: 'demo_1',
          title: 'Welcome to SecureCast!',
          message: 'Your notification system is now active and ready to use.',
          type: 'success' as NotificationType,
          timestamp: Date.now() - 300000, // 5 minutes ago
          isRead: false,
          priority: 'normal' as NotificationPriority,
          category: 'welcome',
        },
        {
          id: 'demo_2',
          title: 'Profile Updated',
          message: 'Your profile information has been successfully updated.',
          type: 'info' as NotificationType,
          timestamp: Date.now() - 600000, // 10 minutes ago
          isRead: true,
          priority: 'normal' as NotificationPriority,
          category: 'profile',
        },
        {
          id: 'demo_3',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2-4 AM.',
          type: 'warning' as NotificationType,
          timestamp: Date.now() - 1800000, // 30 minutes ago
          isRead: false,
          priority: 'high' as NotificationPriority,
          category: 'system',
        },
      ];

      demoNotifications.forEach(notification => {
        dispatch(addNotification(notification));
      });
    }, 1000);
  }, []);

  const initializeNotificationSystem = useCallback(async () => {
    try {
      await dispatch(initializeNotifications()).unwrap();
      await dispatch(requestPermissions()).unwrap();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }, [dispatch]);

  const showInAppNotification = useCallback((
    title: string,
    message: string,
    type: NotificationType = 'info',
    options?: {
      priority?: NotificationPriority;
      category?: string;
      imageUrl?: string;
      autoHide?: boolean;
      duration?: number;
      saveToCenter?: boolean;
      actions?: Array<{
        id: string;
        title: string;
        onPress: () => void;
        destructive?: boolean;
      }>;
    }
  ) => {
    const notification: CustomNotification = {
      id: `inapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      isRead: false,
      priority: options?.priority || 'normal',
      category: options?.category,
      imageUrl: options?.imageUrl,
      autoHide: options?.autoHide,
      duration: options?.duration,
      actions: options?.actions,
    };

    // Show the in-app notification
    dispatch(addInAppNotification(notification));
    
    // Also save to notification center by default (unless explicitly disabled)
    if (options?.saveToCenter !== false) {
      dispatch(addNotification(notification));
    }
  }, [dispatch]);

  const showLocalNotification = useCallback(async (
    title: string,
    message: string,
    type: NotificationType = 'info',
    options?: {
      priority?: NotificationPriority;
      category?: string;
      imageUrl?: string;
      sound?: string;
      vibration?: boolean;
      data?: any;
    }
  ) => {
    try {
      const notification = {
        title,
        message,
        type,
        isRead: false,
        priority: options?.priority || 'normal',
        category: options?.category,
        imageUrl: options?.imageUrl,
        sound: options?.sound,
        vibration: options?.vibration,
        data: options?.data,
      };

      await dispatch(scheduleLocalNotification(notification)).unwrap();
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }, [dispatch]);

  const showSuccessNotification = useCallback((title: string, message: string, inApp = true) => {
    if (inApp) {
      showInAppNotification(title, message, 'success', {
        priority: 'normal',
        autoHide: true,
        duration: 3000,
        category: 'success',
        saveToCenter: true, // Always save success notifications
      });
    } else {
      showLocalNotification(title, message, 'success');
    }
  }, [showInAppNotification, showLocalNotification]);

  const showErrorNotification = useCallback((title: string, message: string, inApp = true) => {
    if (inApp) {
      showInAppNotification(title, message, 'error', {
        priority: 'high',
        autoHide: false,
        category: 'error',
        saveToCenter: true, // Always save error notifications
        actions: [
          {
            id: 'dismiss',
            title: 'Dismiss',
            onPress: () => {},
          },
        ],
      });
    } else {
      showLocalNotification(title, message, 'error', { priority: 'high' });
    }
  }, [showInAppNotification, showLocalNotification]);

  const showWarningNotification = useCallback((title: string, message: string, inApp = true) => {
    if (inApp) {
      showInAppNotification(title, message, 'warning', {
        priority: 'high',
        autoHide: true,
        duration: 5000,
        category: 'warning',
        saveToCenter: true, // Always save warning notifications
      });
    } else {
      showLocalNotification(title, message, 'warning', { priority: 'high' });
    }
  }, [showInAppNotification, showLocalNotification]);

  const showInfoNotification = useCallback((title: string, message: string, inApp = true) => {
    if (inApp) {
      showInAppNotification(title, message, 'info', {
        priority: 'normal',
        autoHide: true,
        duration: 4000,
        category: 'info',
        saveToCenter: true, // Always save info notifications
      });
    } else {
      showLocalNotification(title, message, 'info');
    }
  }, [showInAppNotification, showLocalNotification]);

  const updateNotificationConfig = useCallback((newConfig: Partial<typeof config>) => {
    dispatch(updateConfig(newConfig));
  }, [dispatch, config]);

  // Convenience methods for common notification scenarios
  const notifyUserAction = useCallback((action: string, success: boolean) => {
    if (success) {
      showSuccessNotification('Success', `${action} completed successfully`);
    } else {
      showErrorNotification('Error', `Failed to ${action.toLowerCase()}`);
    }
  }, [showSuccessNotification, showErrorNotification]);

  const notifyNetworkStatus = useCallback((isOnline: boolean) => {
    if (isOnline) {
      showSuccessNotification('Connected', 'Internet connection restored');
    } else {
      showWarningNotification('Offline', 'No internet connection');
    }
  }, [showSuccessNotification, showWarningNotification]);

  const notifyDataUpdate = useCallback((dataType: string) => {
    showInfoNotification('Updated', `${dataType} has been updated`);
  }, [showInfoNotification]);

  return {
    // State
    notifications,
    inAppNotifications,
    config,
    isLoading,
    error,
    unreadCount,
    fcmToken,

    // Actions
    initializeNotificationSystem,
    showInAppNotification,
    showLocalNotification,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    updateNotificationConfig,

    // Convenience methods
    notifyUserAction,
    notifyNetworkStatus,
    notifyDataUpdate,
  };
};