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