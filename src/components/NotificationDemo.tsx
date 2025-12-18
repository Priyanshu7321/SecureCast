import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNotificationViewModel } from '../viewmodels/useNotificationViewModel';

const NotificationDemo: React.FC = () => {
  const {
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  } = useNotificationViewModel();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Demo</Text>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#4CAF50' }]}
        onPress={() => showSuccessNotification('Success!', 'Operation completed successfully')}
      >
        <Text style={styles.buttonText}>Show Success</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#F44336' }]}
        onPress={() => showErrorNotification('Error!', 'Something went wrong')}
      >
        <Text style={styles.buttonText}>Show Error</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#FF9800' }]}
        onPress={() => showWarningNotification('Warning!', 'Please check your settings')}
      >
        <Text style={styles.buttonText}>Show Warning</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#2196F3' }]}
        onPress={() => showInfoNotification('Info', 'Here is some useful information')}
      >
        <Text style={styles.buttonText}>Show Info</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationDemo;