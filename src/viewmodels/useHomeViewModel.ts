import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchUser, clearError } from '../store/slices/userSlice';
import { setLoading, setError } from '../store/slices/appSlice';
import { Linking, Alert } from 'react-native';

export const useHomeViewModel = () => {
  const dispatch = useAppDispatch();
  const { currentUser, isLoading: userLoading, error: userError } = useAppSelector(state => state.user);
  const { isLoading: appLoading, error: appError, theme } = useAppSelector(state => state.app);

  // Load initial data
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      await dispatch(fetchUser('1')).unwrap(); // Load user with ID 1
    } catch (error) {
      dispatch(setError(error as string));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const openURL = useCallback(async (url: string) => {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        await Linking.openURL(url);
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', `Cannot open URL: ${url}`);
        }
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open URL: ${error}`);
      console.log('URL opening error:', error);
    }
  }, []);

  const clearErrors = useCallback(() => {
    dispatch(clearError());
    dispatch(setError(null));
  }, [dispatch]);

  const refreshData = useCallback(() => {
    loadUser();
  }, [loadUser]);

  return {
    // State
    user: currentUser,
    isLoading: userLoading || appLoading,
    error: userError || appError,
    theme,
    
    // Actions
    openURL,
    clearErrors,
    refreshData,
    loadUser,
  };
};