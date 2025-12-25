import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { screenShareService } from '../services/screenShareService';

/**
 * Test component for Android screen sharing functionality
 * Provides UI to test all screen sharing features
 */
const ScreenShareTest: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    // Check support on mount
    checkSupport();
    
    // Set up event listeners
    screenShareService.setOnScreenShareStarted((streamId) => {
      addEvent(`Screen share started: ${streamId}`);
      setIsSharing(true);
      setStreamId(streamId);
    });
    
    screenShareService.setOnScreenShareStopped(() => {
      addEvent('Screen share stopped');
      setIsSharing(false);
      setStreamId(null);
    });
    
    screenShareService.setOnScreenShareError((error) => {
      addEvent(`Screen share error: ${error}`);
      Alert.alert('Screen Share Error', error);
    });
    
    return () => {
      screenShareService.cleanup();
    };
  }, []);

  const addEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [`[${timestamp}] ${event}`, ...prev.slice(0, 9)]);
  };

  const checkSupport = async () => {
    try {
      const supported = await screenShareService.isSupported();
      setIsSupported(supported);
      addEvent(`Screen sharing supported: ${supported}`);
    } catch (error) {
      addEvent(`Support check failed: ${error}`);
    }
  };

  const requestPermission = async () => {
    try {
      addEvent('Requesting screen capture permission...');
      const granted = await screenShareService.requestPermission();
      setHasPermission(granted);
      addEvent(`Permission ${granted ? 'granted' : 'denied'}`);
      
      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'Screen capture permission is required for screen sharing.'
        );
      }
    } catch (error) {
      addEvent(`Permission request failed: ${error}`);
      Alert.alert('Permission Error', `Failed to request permission: ${error}`);
    }
  };

  const startScreenShare = async () => {
    try {
      addEvent('Starting screen share...');
      const result = await screenShareService.startScreenShare();
      
      if (result?.success) {
        addEvent(`Screen share started successfully: ${result.streamId}`);
        Alert.alert('Success', 'Screen sharing started successfully!');
      } else {
        addEvent('Failed to start screen share');
        Alert.alert('Failed', 'Failed to start screen sharing');
      }
    } catch (error) {
      addEvent(`Start screen share failed: ${error}`);
      Alert.alert('Error', `Failed to start screen sharing: ${error}`);
    }
  };

  const stopScreenShare = async () => {
    try {
      addEvent('Stopping screen share...');
      const success = await screenShareService.stopScreenShare();
      
      if (success) {
        addEvent('Screen share stopped successfully');
        Alert.alert('Stopped', 'Screen sharing stopped successfully!');
      } else {
        addEvent('Failed to stop screen share');
        Alert.alert('Failed', 'Failed to stop screen sharing');
      }
    } catch (error) {
      addEvent(`Stop screen share failed: ${error}`);
      Alert.alert('Error', `Failed to stop screen sharing: ${error}`);
    }
  };

  const getStatus = async () => {
    try {
      const currentStatus = await screenShareService.getStatus();
      setStatus(currentStatus);
      addEvent('Status updated');
    } catch (error) {
      addEvent(`Get status failed: ${error}`);
    }
  };

  const getVideoTrack = async () => {
    try {
      const track = await screenShareService.getVideoTrack();
      if (track) {
        addEvent(`Video track: ${track.trackId} (${track.enabled ? 'enabled' : 'disabled'})`);
        Alert.alert('Video Track', `Track ID: ${track.trackId}\nEnabled: ${track.enabled}`);
      } else {
        addEvent('No video track available');
        Alert.alert('No Track', 'No video track available');
      }
    } catch (error) {
      addEvent(`Get video track failed: ${error}`);
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Android Screen Share Test</Text>
      
      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>
          Supported: {isSupported === null ? 'Checking...' : isSupported ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Permission: {hasPermission === null ? 'Unknown' : hasPermission ? 'Granted' : 'Denied'}
        </Text>
        <Text style={styles.statusText}>
          Sharing: {isSharing ? 'Active' : 'Inactive'}
        </Text>
        <Text style={styles.statusText}>
          Stream ID: {streamId || 'None'}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>
        
        <TouchableOpacity 
          style={[styles.button, !isSupported && styles.buttonDisabled]} 
          onPress={requestPermission}
          disabled={!isSupported}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.startButton, (!hasPermission || isSharing) && styles.buttonDisabled]} 
          onPress={startScreenShare}
          disabled={!hasPermission || isSharing}
        >
          <Text style={styles.buttonText}>Start Screen Share</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.stopButton, !isSharing && styles.buttonDisabled]} 
          onPress={stopScreenShare}
          disabled={!isSharing}
        >
          <Text style={styles.buttonText}>Stop Screen Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={getStatus}>
          <Text style={styles.buttonText}>Get Status</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !isSharing && styles.buttonDisabled]} 
          onPress={getVideoTrack}
          disabled={!isSharing}
        >
          <Text style={styles.buttonText}>Get Video Track</Text>
        </TouchableOpacity>
      </View>

      {/* Status Details */}
      {status && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Status</Text>
          <Text style={styles.statusText}>Is Sharing: {status.isSharing ? 'Yes' : 'No'}</Text>
          <Text style={styles.statusText}>Stream ID: {status.streamId || 'None'}</Text>
          <Text style={styles.statusText}>Connected Peers: {status.connectedPeers.length}</Text>
          {status.serviceStatus && (
            <>
              <Text style={styles.statusText}>Service Capturing: {status.serviceStatus.isCapturing ? 'Yes' : 'No'}</Text>
              <Text style={styles.statusText}>Service Connected: {status.serviceStatus.serviceConnected ? 'Yes' : 'No'}</Text>
            </>
          )}
        </View>
      )}

      {/* Event Log */}
      <View style={styles.section}>
        <View style={styles.eventHeader}>
          <Text style={styles.sectionTitle}>Event Log</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearEvents}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.eventLog}>
          {events.length === 0 ? (
            <Text style={styles.noEvents}>No events yet</Text>
          ) : (
            events.map((event, index) => (
              <Text key={index} style={styles.eventText}>{event}</Text>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  eventLog: {
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    padding: 8,
    maxHeight: 200,
  },
  noEvents: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  eventText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});

export default ScreenShareTest;