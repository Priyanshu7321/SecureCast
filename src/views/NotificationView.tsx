import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useNotificationViewModel } from '../viewmodels/useNotificationViewModel';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import { CustomNotification, NotificationType, NotificationPriority } from '../types/notification';
import { createSafeNotification } from '../utils/notificationUtils';
import NotificationCenter from '../components/notifications/NotificationCenter';
import NotificationDebug from '../components/NotificationDebug';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type NotificationViewNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

interface Props {
  navigation: NotificationViewNavigationProp;
}

const NotificationView: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const dispatch = useAppDispatch();
  
  const {
    config,
    isLoading,
    error,
    unreadCount,
    fcmToken,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    updateNotificationConfig,
    notifyUserAction,
    notifyNetworkStatus,
    notifyDataUpdate,
  } = useNotificationViewModel();

  // Direct test function
  const addDirectNotification = () => {
    const notification = createSafeNotification(
      'Direct Test Notification',
      'This notification was added directly to the store from NotificationView',
      'info',
      {
        priority: 'normal',
        category: 'test',
      }
    );
    
    console.log('NotificationView: Adding direct notification:', notification);
    dispatch(addNotification(notification));
  };

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    updateNotificationConfig({ [key]: value });
  };

  const testNotifications = () => {
    Alert.alert(
      'Test Notifications',
      'Choose a notification type to test:',
      [
        {
          text: 'Success',
          onPress: () => showSuccessNotification('Test Success', 'This is a success notification!'),
        },
        {
          text: 'Error',
          onPress: () => showErrorNotification('Test Error', 'This is an error notification!'),
        },
        {
          text: 'Warning',
          onPress: () => showWarningNotification('Test Warning', 'This is a warning notification!'),
        },
        {
          text: 'Info',
          onPress: () => showInfoNotification('Test Info', 'This is an info notification!'),
        },
        {
          text: 'Local Notification',
          onPress: () => showSuccessNotification('Local Test', 'This is a local notification!', false),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const testScenarios = () => {
    Alert.alert(
      'Test Scenarios',
      'Choose a scenario to test:',
      [
        {
          text: 'User Action Success',
          onPress: () => notifyUserAction('Profile Update', true),
        },
        {
          text: 'User Action Failed',
          onPress: () => notifyUserAction('Profile Update', false),
        },
        {
          text: 'Network Online',
          onPress: () => notifyNetworkStatus(true),
        },
        {
          text: 'Network Offline',
          onPress: () => notifyNetworkStatus(false),
        },
        {
          text: 'Data Updated',
          onPress: () => notifyDataUpdate('User Profile'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
        onPress={() => setActiveTab('notifications')}
      >
        <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
        onPress={() => setActiveTab('settings')}
      >
        <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.tabContent}>
      {/* Direct Test Button */}
      <View style={styles.testSection}>
        <TouchableOpacity style={styles.directTestButton} onPress={addDirectNotification}>
          <Text style={styles.directTestButtonText}>🧪 Direct Store Test</Text>
        </TouchableOpacity>
      </View>
      
      <NotificationCenter />
    </View>
  );

  const renderSettings = () => (
    <View>
    <ScrollView style={styles.tabContent}>
        {/* Debug Info */}
        <NotificationDebug />

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={config.enablePush}
              onValueChange={(value) => handleConfigChange('enablePush', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Local Notifications</Text>
            <Switch
              value={config.enableLocal}
              onValueChange={(value) => handleConfigChange('enableLocal', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>In-App Notifications</Text>
            <Switch
              value={config.enableInApp}
              onValueChange={(value) => handleConfigChange('enableInApp', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Sound</Text>
            <Switch
              value={config.soundEnabled}
              onValueChange={(value) => handleConfigChange('soundEnabled', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Vibration</Text>
            <Switch
              value={config.vibrationEnabled}
              onValueChange={(value) => handleConfigChange('vibrationEnabled', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Badge Count</Text>
            <Switch
              value={config.badgeEnabled}
              onValueChange={(value) => handleConfigChange('badgeEnabled', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Unread Count:</Text>
            <Text style={styles.infoValue}>{unreadCount}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>FCM Token:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {fcmToken ? `${fcmToken.substring(0, 20)}...` : 'Not available'}
            </Text>
          </View>
        </View>

        {/* Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testNotifications}>
            <Text style={styles.testButtonText}>Test Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testScenarios}>
            <Text style={styles.testButtonText}>Test Scenarios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => {}}
        />
      )}

      {renderTabBar()}
      
      {activeTab === 'notifications' ? renderNotifications() : renderSettings()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 16,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  testSection: {
    backgroundColor: 'white',
    padding: 16,
    margin: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  directTestButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  directTestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationView;