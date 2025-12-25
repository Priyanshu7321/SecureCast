import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { peerService } from '../services/peerService';

const PeerJSDebug: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Not initialized');

  const testPeerJSConnection = async () => {
    setIsInitializing(true);
    setConnectionStatus('Testing connection...');

    try {
      // Test with a shorter timeout
      const id = await Promise.race([
        peerService.initialize(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);

      setPeerId(id);
      setConnectionStatus('Connected successfully ✅');
      Alert.alert('Success!', `PeerJS connected with ID: ${id.slice(-8)}`);
    } catch (error) {
      setConnectionStatus(`Failed: ${error}`);
      console.error('PeerJS test failed:', error);
      
      // Show detailed error information
      Alert.alert(
        'Connection Failed',
        `Error: ${error}\n\nPossible causes:\n• No internet connection\n• PeerJS server is down\n• Firewall blocking connection\n• WebRTC not properly configured`,
        [
          { text: 'OK' },
          { 
            text: 'Retry', 
            onPress: () => testPeerJSConnection() 
          }
        ]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const resetTest = () => {
    peerService.destroy();
    setPeerId(null);
    setConnectionStatus('Not initialized');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PeerJS Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[
          styles.statusText, 
          { color: connectionStatus.includes('✅') ? '#4CAF50' : connectionStatus.includes('Failed') ? '#F44336' : '#FF9800' }
        ]}>
          {connectionStatus}
        </Text>
      </View>

      {peerId && (
        <View style={styles.peerIdContainer}>
          <Text style={styles.peerIdLabel}>Peer ID:</Text>
          <Text style={styles.peerIdText}>{peerId}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isInitializing && styles.disabledButton]}
          onPress={testPeerJSConnection}
          disabled={isInitializing}
        >
          <Text style={styles.buttonText}>
            {isInitializing ? 'Testing...' : 'Test PeerJS Connection'}
          </Text>
        </TouchableOpacity>

        {peerId && (
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetTest}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Connection Requirements:</Text>
        <Text style={styles.infoText}>• Internet connection required</Text>
        <Text style={styles.infoText}>• PeerJS server must be accessible</Text>
        <Text style={styles.infoText}>• WebRTC APIs must be available</Text>
        <Text style={styles.infoText}>• No firewall blocking WebSocket connections</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  peerIdContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  peerIdLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  peerIdText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: '#6C757D',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
});

export default PeerJSDebug;