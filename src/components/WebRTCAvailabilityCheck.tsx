import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

const WebRTCAvailabilityCheck: React.FC = () => {
  const [webrtcStatus, setWebrtcStatus] = useState<string>('Checking...');
  const [mediaDevicesStatus, setMediaDevicesStatus] = useState<string>('Checking...');
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    checkWebRTCAvailability();
  }, []);

  const updateDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${info}`;
    console.log('🔧 [WebRTC Check]', logEntry);
    setDebugInfo(prev => `${logEntry}\n${prev}`);
  };

  const checkWebRTCAvailability = async () => {
    try {
      console.log('🔍 [WebRTC Check] Starting WebRTC availability check...');
      updateDebugInfo('Starting WebRTC availability check...');

      // Check if react-native-webrtc can be loaded
      let webrtc;
      try {
        webrtc = require('react-native-webrtc');
        console.log('✅ [WebRTC Check] react-native-webrtc loaded successfully');
        setWebrtcStatus('✅ Available');
        updateDebugInfo('react-native-webrtc: Available');
      } catch (error) {
        console.error('❌ [WebRTC Check] Failed to load react-native-webrtc:', error);
        setWebrtcStatus('❌ Not Available');
        updateDebugInfo(`react-native-webrtc: Not Available - ${error}`);
        return;
      }

      // Check mediaDevices
      if (webrtc.mediaDevices) {
        console.log('✅ [WebRTC Check] mediaDevices available');
        setMediaDevicesStatus('✅ Available');
        updateDebugInfo('mediaDevices: Available');

        // Check available methods
        const methods = Object.keys(webrtc.mediaDevices);
        console.log('🔍 [WebRTC Check] Available mediaDevices methods:', methods);
        setAvailableMethods(methods);
        updateDebugInfo(`Available methods: ${methods.join(', ')}`);

        // Check specific methods
        if (webrtc.mediaDevices.getUserMedia) {
          console.log('✅ [WebRTC Check] getUserMedia available');
          updateDebugInfo('getUserMedia: Available');
        } else {
          console.log('❌ [WebRTC Check] getUserMedia not available');
          updateDebugInfo('getUserMedia: Not Available');
        }

        if (webrtc.mediaDevices.getDisplayMedia) {
          console.log('✅ [WebRTC Check] getDisplayMedia available');
          updateDebugInfo('getDisplayMedia: Available');
        } else {
          console.log('❌ [WebRTC Check] getDisplayMedia not available');
          updateDebugInfo('getDisplayMedia: Not Available');
        }

      } else {
        console.error('❌ [WebRTC Check] mediaDevices not available');
        setMediaDevicesStatus('❌ Not Available');
        updateDebugInfo('mediaDevices: Not Available');
      }

      // Check other WebRTC components
      const components = ['RTCPeerConnection', 'RTCSessionDescription', 'RTCIceCandidate', 'MediaStream'];
      components.forEach(component => {
        if (webrtc[component]) {
          console.log(`✅ [WebRTC Check] ${component} available`);
          updateDebugInfo(`${component}: Available`);
        } else {
          console.log(`❌ [WebRTC Check] ${component} not available`);
          updateDebugInfo(`${component}: Not Available`);
        }
      });

    } catch (error) {
      console.error('💥 [WebRTC Check] Error during availability check:', error);
      updateDebugInfo(`Error during check: ${error}`);
    }
  };

  const testGetUserMedia = async () => {
    try {
      console.log('🧪 [WebRTC Check] Testing getUserMedia...');
      updateDebugInfo('Testing getUserMedia...');

      const webrtc = require('react-native-webrtc');
      if (!webrtc.mediaDevices || !webrtc.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not available');
      }

      const stream = await webrtc.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: true,
      });

      console.log('✅ [WebRTC Check] getUserMedia test successful:', stream.id);
      updateDebugInfo(`getUserMedia test: SUCCESS - Stream ID: ${stream.id}`);
      
      // Stop the stream
      stream.getTracks().forEach((track: any) => track.stop());
      
      Alert.alert('Success', 'getUserMedia test passed successfully!');
    } catch (error) {
      console.error('❌ [WebRTC Check] getUserMedia test failed:', error);
      updateDebugInfo(`getUserMedia test: FAILED - ${error}`);
      Alert.alert('Test Failed', `getUserMedia test failed: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 WebRTC Availability Check</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={styles.statusText}>react-native-webrtc: {webrtcStatus}</Text>
        <Text style={styles.statusText}>mediaDevices: {mediaDevicesStatus}</Text>
        <Text style={styles.statusText}>
          Available Methods: {availableMethods.length > 0 ? availableMethods.join(', ') : 'None'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={checkWebRTCAvailability}
        >
          <Text style={styles.buttonText}>Recheck Availability</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={testGetUserMedia}
        >
          <Text style={styles.buttonText}>Test getUserMedia</Text>
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

export default WebRTCAvailabilityCheck;