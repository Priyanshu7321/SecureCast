import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { peerService } from '../services/peerService';

const PeerJSTest: React.FC = () => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Not initialized');

  useEffect(() => {
    // Set up event listeners
    peerService.onConnection((device) => {
      Alert.alert('Connection', `Connected to ${device.name}`);
    });

    peerService.onError((error) => {
      Alert.alert('Error', error);
    });

    return () => {
      // Cleanup
      peerService.destroy();
    };
  }, []);

  const handleInitialize = async () => {
    try {
      setConnectionStatus('Initializing...');
      const id = await peerService.initialize();
      setPeerId(id);
      setIsInitialized(true);
      setConnectionStatus('Ready');
      Alert.alert('Success', `PeerJS initialized with ID: ${id.slice(-8)}`);
    } catch (error) {
      setConnectionStatus('Failed');
      Alert.alert('Error', `Failed to initialize: ${error}`);
    }
  };

  const handleTestConnection = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Please initialize PeerJS first');
      return;
    }

    // This is just a test - in real usage, you'd connect to another peer
    Alert.alert('Test', 'PeerJS is ready for connections. Use the main app to connect to other devices.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PeerJS Integration Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusText, { color: isInitialized ? '#4CAF50' : '#F44336' }]}>
          {connectionStatus}
        </Text>
      </View>

      {peerId && (
        <View style={styles.peerIdContainer}>
          <Text style={styles.peerIdLabel}>Peer ID:</Text>
          <Text style={styles.peerIdText}>{peerId}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isInitialized && styles.disabledButton]}
        onPress={handleInitialize}
        disabled={isInitialized}
      >
        <Text style={styles.buttonText}>
          {isInitialized ? 'Initialized ✓' : 'Initialize PeerJS'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.testButton, !isInitialized && styles.disabledButton]}
        onPress={handleTestConnection}
        disabled={!isInitialized}
      >
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    margin: 10,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  peerIdContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  peerIdLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  peerIdText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PeerJSTest;