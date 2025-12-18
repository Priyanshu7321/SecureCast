import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store';
import { removeInAppNotification, markAsRead } from '../../store/slices/notificationSlice';
import InAppNotification from './InAppNotification';

const NotificationManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { inAppNotifications } = useAppSelector(state => state.notification);

  const handleDismiss = (notificationId: string) => {
    dispatch(removeInAppNotification(notificationId));
  };

  const handlePress = (notificationId: string) => {
    // Handle notification press - navigate or perform action
    console.log('In-app notification pressed:', notificationId);
    
    // Mark as read in the notification center
    dispatch(markAsRead(notificationId));
    
    // Remove from in-app notifications
    dispatch(removeInAppNotification(notificationId));
  };

  const handleActionPress = (notificationId: string, actionId: string) => {
    console.log('Action pressed:', { notificationId, actionId });
    // Handle specific action
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {inAppNotifications.map((notification) => (
        <InAppNotification
          key={notification.id}
          notification={notification}
          onPress={() => handlePress(notification.id)}
          onDismiss={() => handleDismiss(notification.id)}
          onActionPress={(actionId) => handleActionPress(notification.id, actionId)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});

export default NotificationManager;