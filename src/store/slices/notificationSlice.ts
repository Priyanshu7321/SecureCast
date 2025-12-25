import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CustomNotification, NotificationConfig } from '../../types/notification';
import { notificationService } from '../../services/notificationService';
import { sanitizeNotification } from '../../utils/notificationUtils';

interface NotificationState {
  notifications: CustomNotification[];
  inAppNotifications: CustomNotification[];
  config: NotificationConfig;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  fcmToken: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  inAppNotifications: [],
  config: {
    enablePush: true,
    enableLocal: true,
    enableInApp: true,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
    categories: ['general', 'updates', 'alerts'],
  },
  isLoading: false,
  error: null,
  unreadCount: 0,
  fcmToken: null,
};

// Async thunks
export const initializeNotifications = createAsyncThunk(
  'notification/initialize',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.initialize();
      const token = await notificationService.getFCMToken();
      return { token };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize notifications');
    }
  }
);

export const requestPermissions = createAsyncThunk(
  'notification/requestPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const granted = await notificationService.requestPermissions();
      return { granted };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to request permissions');
    }
  }
);

export const scheduleLocalNotification = createAsyncThunk(
  'notification/scheduleLocal',
  async (notification: Omit<CustomNotification, 'id' | 'timestamp'>, { rejectWithValue }) => {
    try {
      const id = await notificationService.scheduleLocalNotification(notification);
      return { id, notification };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to schedule notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<CustomNotification>) => {
      console.log('🔍 [NotificationSlice] addNotification reducer called with:', action.payload);
      console.log('🔍 [NotificationSlice] Payload has actions?', !!action.payload.actions);
      if (action.payload.actions) {
        console.log('🔍 [NotificationSlice] Actions found:', action.payload.actions);
      }
      console.log('🔍 [NotificationSlice] Current notifications count:', state.notifications.length);
      
      // Use sanitization utility to ensure clean notification
      const notification = sanitizeNotification(action.payload);
      console.log('🔍 [NotificationSlice] Sanitized notification:', notification);
      
      state.notifications.unshift(notification);
      if (!notification.isRead) {
        state.unreadCount += 1;
      }
      console.log('🔍 [NotificationSlice] New notifications count:', state.notifications.length);
      console.log('🔍 [NotificationSlice] New unread count:', state.unreadCount);
    },
    
    addInAppNotification: (state, action: PayloadAction<CustomNotification>) => {
      // Use sanitization utility to ensure clean notification
      const notification = sanitizeNotification(action.payload);
      
      state.inAppNotifications.push(notification);
    },
    
    removeInAppNotification: (state, action: PayloadAction<string>) => {
      state.inAppNotifications = state.inAppNotifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },
    
    deleteNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    clearAllNotifications: (state) => {
      console.log('🧹 [NotificationSlice] Clearing all notifications');
      state.notifications = [];
      state.inAppNotifications = [];
      state.unreadCount = 0;
      console.log('🧹 [NotificationSlice] All notifications cleared');
    },
    
    updateConfig: (state, action: PayloadAction<Partial<NotificationConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    
    setFCMToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Initialize notifications
      .addCase(initializeNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fcmToken = action.payload.token;
      })
      .addCase(initializeNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Request permissions
      .addCase(requestPermissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPermissions.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestPermissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Schedule local notification
      .addCase(scheduleLocalNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scheduleLocalNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        // Use sanitization utility to ensure clean notification
        const baseNotification = {
          ...action.payload.notification,
          id: action.payload.id,
          timestamp: Date.now(),
        };
        const notification = sanitizeNotification(baseNotification);
        
        state.notifications.unshift(notification);
        if (!notification.isRead) {
          state.unreadCount += 1;
        }
      })
      .addCase(scheduleLocalNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addNotification,
  addInAppNotification,
  removeInAppNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  updateConfig,
  setFCMToken,
  setError,
  clearError,
} = notificationSlice.actions;

export default notificationSlice.reducer;