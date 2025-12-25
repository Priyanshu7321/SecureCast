import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { screenCaptureManager } from '../modules/ScreenCapture';

const ScreenCaptureDebug: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    try {
      console.log('🔧 [Debug] Checking screen capture support...');
      const supported = await screenCaptureManager.isSupported();
      console.log('🔧 [Debug] Support check result:', supported);
      setIsSupported(supported);
      updateDebugInfo(`Screen capture supported: ${supported}`);
    } catch (error) {
      console.error('🔧 [Debug] Support check error:', error);
      setIsSupported(false);
      updateDebugInfo(`Error checking support: ${error}`);
    }
  };

  const updateDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${info}`;
    console.log('🔧 [Debug]', logEntry);
    setDebugInfo(prev => `${logEntry}\n${prev}`);
  };

  const requestPermission = async () => {
    try {
      console.log('🔧 [Debug] Starting permission request...');
      updateDebugInfo('Requesting screen capture permission...');
      
      const granted = await screenCaptureManager.requestPermission();
      console.log('🔧 [Debug] Permission request completed:', granted);
      updateDebugInfo(`Permission granted: ${granted}`);
      
      if (!granted) {
        Alert.alert('Permission Denied', 'Screen capture permission was denied');
      } else {
        Alert.alert('Permission Granted', 'Screen capture permission was granted successfully');
      }
    } catch (error) {
      console.error('🔧 [Debug] Permission request error:', error);
      updateDebugInfo(`Permission request error: ${error}`);
      Alert.alert('Error', `Failed to request permission: ${error}`);
    }
  };

  const startCapture = async () => {
    try {
      console.log('🔧 [Debug] Starting screen capture...');
      updateDebugInfo('Starting screen capture...');
      setIsCapturing(true);
      
      const stream = await screenCaptureManager.startCapture();
      console.log('🔧 [Debug] Screen capture started:', stream);
      setCurrentStream(stream);
      updateDebugInfo(`Screen capture started. Stream ID: ${stream?.id || 'N/A'}`);
      
      Alert.alert('Success', 'Screen capture started successfully!');
    } catch (error) {
      console.error('🔧 [Debug] Start capture error:', error);
      setIsCapturing(false);
      updateDebugInfo(`Start capture error: ${error}`);
      Alert.alert('Error', `Failed to start capture: ${error}`);
    }
  };

  const stopCapture = async () => {
    try {
      console.log('🔧 [Debug] Stopping screen capture...');
      updateDebugInfo('Stopping screen capture...');
      
      await screenCaptureManager.stopCapture();
      console.log('🔧 [Debug] Screen capture stopped');
      setIsCapturing(false);
      setCurrentStream(null);
      updateDebugInfo('Screen capture stopped');
      
      Alert.alert('Success', 'Screen capture stopped');
    } catch (error) {
      console.error('🔧 [Debug] Stop capture error:', error);
      updateDebugInfo(`Stop capture error: ${error}`);
      Alert.alert('Error', `Failed to stop capture: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Screen Capture Debug</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={styles.statusText}>
          Supported: {isSupported === null ? 'Checking...' : isSupported ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={styles.statusText}>
          Capturing: {isCapturing ? '🔴 Active' : '⚫ Inactive'}
        </Text>
        <Text style={styles.statusText}>
          Stream: {currentStream ? `📹 ${currentStream.id}` : '❌ None'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={startCapture}
          disabled={isCapturing || !isSupported}
        >
          <Text style={styles.buttonText}>Start Capture</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={stopCapture}
          disabled={!isCapturing}
        >
          <Text style={styles.buttonText}>Stop Capture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Log:</Text>
        <Text style={styles.debugText}>{debugInfo || 'No debug info yet...'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#ccc',
    fontFamily: 'monospace',
  },
});

export default ScreenCaptureDebug;