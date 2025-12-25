import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  initializeNotifications,
  requestPermissions,
  scheduleLocalNotification,
  addNotification,
  addInAppNotification,
  updateConfig,
  clearAllNotifications,
} from '../store/slices/notificationSlice';
import { CustomNotification, NotificationType, NotificationPriority } from '../types/notification';
import { createSafeNotification } from '../utils/notificationUtils';
import { SafeNotificationDispatcher } from '../utils/safeNotificationDispatcher';

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

  // Create a safe notification dispatcher
  const safeDispatcher = useMemo(() => new SafeNotificationDispatcher(dispatch), [dispatch]);

  // Initialize notifications on mount
  useEffect(() => {
    console.log('🔄 [NotificationViewModel] Initializing notification system...');
    
    // Clear any existing notifications that might have actions
    console.log('🧹 [NotificationViewModel] Clearing all existing notifications...');
    dispatch(clearAllNotifications());
    
    initializeNotificationSystem();

    // Add some demo notifications for testing (after a delay to ensure clean state)
    setTimeout(() => {
      console.log('🔄 [NotificationViewModel] Adding demo notifications...');
      const demoNotifications = [
        createSafeNotification(
          'Welcome to SecureCast!',
          'Your notification system is now active and ready to use.',
          'success',
          {
            isRead: false,
            priority: 'normal',
            category: 'welcome',
            timestamp: Date.now() - 300000, // 5 minutes ago
          }
        ),
        createSafeNotification(
          'Profile Updated',
          'Your profile information has been successfully updated.',
          'info',
          {
            isRead: true,
            priority: 'normal',
            category: 'profile',
            timestamp: Date.now() - 600000, // 10 minutes ago
          }
        ),
        createSafeNotification(
          'System Maintenance',
          'Scheduled maintenance will occur tonight from 2-4 AM.',
          'warning',
          {
            isRead: false,
            priority: 'high',
            category: 'system',
            timestamp: Date.now() - 1800000, // 30 minutes ago
          }
        ),
      ];

      demoNotifications.forEach(notification => {
        console.log('🔄 [NotificationViewModel] Adding demo notification:', notification.title);
        dispatch(addNotification(notification));
      });
    }, 2000); // Increased delay to ensure clean state
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
    console.log('🔍 [NotificationViewModel] Creating in-app notification:', title);
    console.log('🔍 [NotificationViewModel] Options received:', options);
    console.log('🔍 [NotificationViewModel] Options has actions?', !!options?.actions);
    if (options?.actions) {
      console.log('🔍 [NotificationViewModel] Actions in options:', options.actions);
    }
    
    // Use safe notification creation utility
    const notification = createSafeNotification(title, message, type, {
      priority: options?.priority || 'normal',
      category: options?.category,
      imageUrl: options?.imageUrl,
      autoHide: options?.autoHide,
      duration: options?.duration,
      // Actions are intentionally omitted to prevent serialization issues
    });

    console.log('🔍 [NotificationViewModel] Final notification object:', notification);
    console.log('🔍 [NotificationViewModel] Final notification has actions?', !!notification.actions);

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
      actions?: Array<{
        id: string;
        title: string;
        onPress?: () => void;
      }>;
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
        actions: options?.actions?.map(action => {
          const { onPress, ...serializableAction } = action;
          return serializableAction;
        }),
      };

      await dispatch(scheduleLocalNotification(notification)).unwrap();
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }, [dispatch]);

  const showSuccessNotification = useCallback((title: string, message: string, inApp = true) => {
    console.log('🔍 [NotificationViewModel] showSuccessNotification called:', title, message);
    safeDispatcher.showSuccess(title, message);
  }, [safeDispatcher]);

  const showErrorNotification = useCallback((title: string, message: string, inApp = true) => {
    console.log('🔍 [NotificationViewModel] showErrorNotification called:', title, message);
    console.log('🔍 [NotificationViewModel] Using safe dispatcher for error notification');
    
    // Use the safe dispatcher to ensure no serialization issues
    safeDispatcher.showError(title, message);
  }, [safeDispatcher]);

  const showWarningNotification = useCallback((title: string, message: string, inApp = true) => {
    console.log('🔍 [NotificationViewModel] showWarningNotification called:', title, message);
    safeDispatcher.showWarning(title, message);
  }, [safeDispatcher]);

  const showInfoNotification = useCallback((title: string, message: string, inApp = true) => {
    console.log('🔍 [NotificationViewModel] showInfoNotification called:', title, message);
    safeDispatcher.showInfo(title, message);
  }, [safeDispatcher]);

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