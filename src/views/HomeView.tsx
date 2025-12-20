import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { useNotificationViewModel } from '../viewmodels/useNotificationViewModel';
import { useAppSelector, useAppDispatch } from '../store';
import { addNotification, addInAppNotification } from '../store/slices/notificationSlice';
import { CustomNotification, NotificationType, NotificationPriority } from '../types/notification';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type HomeViewNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeViewNavigationProp;
}

const HomeView: React.FC<Props> = ({ navigation }) => {
  const {
    user,
    isLoading,
    error,
    openURL,
    clearErrors,
    refreshData,
  } = useHomeViewModel();

  const {
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    showLocalNotification
  } = useNotificationViewModel();
  const { unreadCount } = useAppSelector(state => state.notification);
  const dispatch = useAppDispatch();

  // Function to add persistent notification directly to the center
  const addPersistentNotification = (
    title: string,
    message: string,
    type: NotificationType,
    category?: string
  ) => {
    // Use showLocalNotification to trigger a system/local notification
    // This will appear in the device's notification tray AND be added to the internal store
    showLocalNotification(title, message, type, {
      category: category || type,
      priority: 'normal',
      actions: [
        { id: 'view', title: 'View', onPress: () => console.log('View') },
        { id: 'mark_read', title: 'Mark Read', onPress: () => console.log('Mark Read') },
        { id: 'dismiss', title: 'Dismiss', onPress: () => console.log('Dismiss') },
      ]
    });

    console.log('Triggered local persistent notification');
  };

  if (isLoading && !user) {
    return <LoadingSpinner message="Loading user data..." />;
  }

  return (
    <ScrollView style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={refreshData}
          onDismiss={clearErrors}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Welcome to SecureCast</Text>
        {user && (
          <View style={styles.userInfo}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <Text style={styles.userName}>Hello, {user.name}!</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionButtonText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={styles.notificationButtonContent}>
            <Text style={styles.actionButtonText}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#34C759' }]}
          onPress={() => showSuccessNotification('In-App Success', 'This shows as overlay AND saves to notification center!')}
        >
          <Text style={styles.actionButtonText}>Test In-App Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
          onPress={() => addPersistentNotification('Persistent Success', 'This goes directly to notification center only!', 'success', 'test')}
        >
          <Text style={styles.actionButtonText}>Add Persistent Notification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Tests</Text>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => addPersistentNotification('Success Message', 'Operation completed successfully!', 'success')}
        >
          <Text style={styles.actionButtonText}>Add Success</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => addPersistentNotification('Error Message', 'Something went wrong!', 'error')}
        >
          <Text style={styles.actionButtonText}>Add Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => addPersistentNotification('Warning Message', 'Please check your settings!', 'warning')}
        >
          <Text style={styles.actionButtonText}>Add Warning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => addPersistentNotification('Info Message', 'Here is some useful information!', 'info')}
        >
          <Text style={styles.actionButtonText}>Add Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>External Links</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.linkButton]}
          onPress={() => openURL('https://reactnative.dev/docs/tutorial')}
        >
          <Text style={styles.actionButtonText}>React Native Tutorial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.linkButton]}
          onPress={() => openURL('https://google.com')}
        >
          <Text style={styles.actionButtonText}>Open Google</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size="small" message="Updating..." />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  linkButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  notificationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeView;