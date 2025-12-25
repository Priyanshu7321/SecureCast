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
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;