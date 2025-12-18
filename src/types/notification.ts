export interface CustomNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  isRead: boolean;
  data?: any;
  actions?: NotificationAction[];
  priority: NotificationPriority;
  category?: string;
  imageUrl?: string;
  sound?: string;
  vibration?: boolean;
  autoHide?: boolean;
  duration?: number;
}

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'push' 
  | 'local'
  | 'custom';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
  onPress: () => void;
}

export interface NotificationConfig {
  enablePush: boolean;
  enableLocal: boolean;
  enableInApp: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  categories: string[];
}

export interface InAppNotificationProps {
  notification: CustomNotification;
  onPress?: () => void;
  onDismiss?: () => void;
  onActionPress?: (actionId: string) => void;
}