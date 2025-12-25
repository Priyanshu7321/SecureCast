import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import userSlice from './slices/userSlice';
import appSlice from './slices/appSlice';
import notificationSlice from './slices/notificationSlice';
import authSlice from './slices/authSlice';
import peerSlice from './slices/peerSlice';

export const store = configureStore({
  reducer: {
    user: userSlice,
    app: appSlice,
    notification: notificationSlice,
    auth: authSlice,
    peer: peerSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'notification/addNotification',
          'notification/addInAppNotification',
          'notification/scheduleLocal/fulfilled',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          'payload.actions',
          'payload.actions.0.onPress',
          'payload.actions.1.onPress',
          'payload.actions.2.onPress',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'notification.notifications.0.actions',
          'notification.notifications.1.actions',
          'notification.notifications.2.actions',
          'notification.inAppNotifications.0.actions',
          'notification.inAppNotifications.1.actions',
          'notification.inAppNotifications.2.actions',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;