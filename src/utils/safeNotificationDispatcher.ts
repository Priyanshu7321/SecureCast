import { Dispatch } from '@reduxjs/toolkit';
import { addNotification, addInAppNotification } from '../store/slices/notificationSlice';
import { CustomNotification, NotificationType, NotificationPriority } from '../types/notification';

/**
 * Safe notification dispatcher that ensures no functions are passed to Redux
 */
export class SafeNotificationDispatcher {
  private dispatch: Dispatch;

  constructor(dispatch: Dispatch) {
    this.dispatch = dispatch;
  }

  /**
   * Safely dispatch a notification without any functions or non-serializable data
   */
  dispatchSafeNotification(
    title: string,
    message: string,
    type: NotificationType = 'info',
    options?: {
      priority?: NotificationPriority;
      category?: string;
      imageUrl?: string;
      autoHide?: boolean;
      duration?: number;
      isInApp?: boolean;
      saveToCenter?: boolean;
    }
  ) {
    console.log('🛡️ [SafeNotificationDispatcher] Creating safe notification:', title);
    
    // Create a completely clean notification object
    const safeNotification: CustomNotification = {
      id: `safe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: String(title), // Ensure it's a string
      message: String(message), // Ensure it's a string
      type,
      timestamp: Date.now(),
      isRead: false,
      priority: options?.priority || 'normal',
      category: options?.category,
      imageUrl: options?.imageUrl,
      autoHide: options?.autoHide,
      duration: options?.duration,
      // Explicitly set actions to undefined to prevent any serialization issues
      actions: undefined,
    };

    console.log('🛡️ [SafeNotificationDispatcher] Safe notification created:', safeNotification);
    console.log('🛡️ [SafeNotificationDispatcher] Notification has actions?', !!safeNotification.actions);

    // Dispatch to in-app notifications if requested
    if (options?.isInApp !== false) {
      console.log('🛡️ [SafeNotificationDispatcher] Dispatching to in-app notifications');
      this.dispatch(addInAppNotification(safeNotification));
    }

    // Dispatch to notification center if requested
    if (options?.saveToCenter !== false) {
      console.log('🛡️ [SafeNotificationDispatcher] Dispatching to notification center');
      this.dispatch(addNotification(safeNotification));
    }
  }

  /**
   * Show a success notification
   */
  showSuccess(title: string, message: string) {
    this.dispatchSafeNotification(title, message, 'success', {
      priority: 'normal',
      autoHide: true,
      duration: 3000,
      category: 'success',
    });
  }

  /**
   * Show an error notification
   */
  showError(title: string, message: string) {
    this.dispatchSafeNotification(title, message, 'error', {
      priority: 'high',
      autoHide: false,
      category: 'error',
    });
  }

  /**
   * Show a warning notification
   */
  showWarning(title: string, message: string) {
    this.dispatchSafeNotification(title, message, 'warning', {
      priority: 'high',
      autoHide: true,
      duration: 5000,
      category: 'warning',
    });
  }

  /**
   * Show an info notification
   */
  showInfo(title: string, message: string) {
    this.dispatchSafeNotification(title, message, 'info', {
      priority: 'normal',
      autoHide: true,
      duration: 4000,
      category: 'info',
    });
  }
}