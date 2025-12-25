import { CustomNotification } from '../types/notification';

/**
 * Debug function to log notification details
 */
export const debugNotification = (notification: any, source: string) => {
  console.log(`🐛 [${source}] Notification debug:`, {
    id: notification.id,
    title: notification.title,
    hasActions: !!notification.actions,
    actionsCount: notification.actions?.length || 0,
    actions: notification.actions,
  });
  
  if (notification.actions) {
    notification.actions.forEach((action: any, index: number) => {
      console.log(`🐛 [${source}] Action ${index}:`, {
        id: action.id,
        title: action.title,
        hasOnPress: !!action.onPress,
        onPressType: typeof action.onPress,
      });
    });
  }
};

/**
 * Sanitizes a notification object to ensure it's safe for Redux storage
 * Removes any non-serializable values like functions
 */
export const sanitizeNotification = (notification: CustomNotification): CustomNotification => {
  // Debug the incoming notification
  debugNotification(notification, 'sanitizeNotification-input');
  
  // Destructure to remove actions and any other potentially problematic fields
  const { actions, ...cleanNotification } = notification;
  
  const result = {
    ...cleanNotification,
    actions: undefined, // Always remove actions to prevent serialization issues
    // Ensure all required fields are present with safe defaults
    id: cleanNotification.id || `sanitized_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: cleanNotification.title || 'Notification',
    message: cleanNotification.message || '',
    type: cleanNotification.type || 'info',
    timestamp: cleanNotification.timestamp || Date.now(),
    isRead: cleanNotification.isRead || false,
    priority: cleanNotification.priority || 'normal',
  };
  
  // Debug the sanitized notification
  debugNotification(result, 'sanitizeNotification-output');
  
  return result;
};

/**
 * Creates a safe notification object for Redux storage
 */
export const createSafeNotification = (
  title: string,
  message: string,
  type: CustomNotification['type'] = 'info',
  options?: Partial<Omit<CustomNotification, 'id' | 'title' | 'message' | 'type' | 'actions'>>
): CustomNotification => {
  const notification: CustomNotification = {
    id: `safe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    message,
    type,
    timestamp: Date.now(),
    isRead: false,
    priority: 'normal',
    actions: undefined, // Never include actions
    ...options,
  };

  return sanitizeNotification(notification);
};