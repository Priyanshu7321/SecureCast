import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { updateUser, clearError } from '../store/slices/userSlice';
import { setLoading } from '../store/slices/appSlice';
import { User } from '../types';

export const useProfileViewModel = () => {
  const dispatch = useAppDispatch();
  const { currentUser, isLoading, error } = useAppSelector(state => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });

  const updateFormData = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
    });
  }, [currentUser]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
    });
  }, [currentUser]);

  const saveProfile = useCallback(async () => {
    if (!currentUser) return;

    try {
      dispatch(setLoading(true));
      const updatedData: Partial<User> = {
        id: currentUser.id,
        name: formData.name,
        email: formData.email,
        avatar: currentUser.avatar,
      };
      
      await dispatch(updateUser(updatedData)).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, currentUser, formData]);

  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    user: currentUser,
    isLoading,
    error,
    isEditing,
    formData,
    
    // Actions
    updateFormData,
    startEditing,
    cancelEditing,
    saveProfile,
    clearErrors,
  };
};