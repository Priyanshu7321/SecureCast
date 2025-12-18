import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '../store';

const NotificationDebug: React.FC = () => {
  const { notifications, inAppNotifications, unreadCount } = useAppSelector(state => state.notification);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Debug Info</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats:</Text>
        <Text style={styles.text}>Total Notifications: {notifications.length}</Text>
        <Text style={styles.text}>In-App Notifications: {inAppNotifications.length}</Text>
        <Text style={styles.text}>Unread Count: {unreadCount}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Persistent Notifications:</Text>
        <ScrollView style={styles.scrollView}>
          {notifications.length === 0 ? (
            <Text style={styles.text}>No persistent notifications</Text>
          ) : (
            notifications.map((notification, index) => (
              <View key={notification.id} style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>
                  {index + 1}. {notification.title} ({notification.type})
                </Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationMeta}>
                  ID: {notification.id} | Read: {notification.isRead ? 'Yes' : 'No'}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>In-App Notifications:</Text>
        {inAppNotifications.length === 0 ? (
          <Text style={styles.text}>No in-app notifications</Text>
        ) : (
          inAppNotifications.map((notification, index) => (
            <View key={notification.id} style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>
                {index + 1}. {notification.title} ({notification.type})
              </Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 10,
    padding: 16,
    borderRadius: 8,
    maxHeight: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scrollView: {
    maxHeight: 150,
  },
  notificationItem: {
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  notificationMessage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  notificationMeta: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});

export default NotificationDebug;