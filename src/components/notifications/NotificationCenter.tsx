import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store';
import { markAsRead, deleteNotification, markAllAsRead, clearAllNotifications } from '../../store/slices/notificationSlice';
import { CustomNotification } from '../../types/notification';

interface NotificationItemProps {
  notification: CustomNotification;
  onPress: (notification: CustomNotification) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onDelete,
}) => {
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#007AFF';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadItem,
      ]}
      onPress={() => onPress(notification)}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: getNotificationColor(notification.type) },
          ]}
        />
        
        <View style={styles.contentContainer}>
          <View style={styles.itemHeader}>
            <Text style={[styles.title, !notification.isRead && styles.unreadText]}>
              {notification.title}
            </Text>
            <Text style={styles.timestamp}>
              {formatTime(notification.timestamp)}
            </Text>
          </View>
          
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          
          {notification.category && (
            <Text style={styles.category}>
              {notification.category}
            </Text>
          )}
        </View>

        {notification.imageUrl && (
          <Image source={{ uri: notification.imageUrl }} style={styles.notificationImage} />
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(notification.id)}
      >
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const NotificationCenter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector(state => state.notification);
  const [refreshKey, setRefreshKey] = useState(0);
  
  console.log('NotificationCenter render - notifications:', notifications.length, notifications);

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
    console.log('Force refresh triggered, notifications:', notifications);
  };

  const handleNotificationPress = (notification: CustomNotification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }
    // Handle navigation or other actions based on notification data
    console.log('Notification pressed:', notification);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteNotification(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleClearAll = () => {
    dispatch(clearAllNotifications());
  };

  const renderNotification = ({ item }: { item: CustomNotification }) => (
    <NotificationItem
      notification={item}
      onPress={handleNotificationPress}
      onDelete={handleDelete}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        Notifications {unreadCount > 0 && `(${unreadCount})`}
      </Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={[styles.headerButton, { backgroundColor: '#FF6B6B' }]} onPress={forceRefresh}>
          <Text style={styles.headerButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.headerButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.headerButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
            <Text style={styles.headerButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        key={refreshKey}
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        extraData={notifications.length}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    marginRight: 8,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
  },
  typeIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  category: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  notificationImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
  },
  deleteText: {
    color: '#999',
    fontSize: 16,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationCenter;