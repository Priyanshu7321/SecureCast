import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { initializePeer } from '../store/slices/peerSlice';
import { useNotificationViewModel } from '../viewmodels/useNotificationViewModel';
import ServerlessConnection from '../components/ServerlessConnection';
import ConnectionMethodSelector from '../components/ConnectionMethodSelector';
import ServerSelector from '../components/ServerSelector';
import WebRTCCheck from '../components/WebRTCCheck';
import PeerJSDebug from '../components/PeerJSDebug';
import PeerJSTest from '../components/PeerJSTest';
import { peerService } from '../services/peerService';

const HomeScreenView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { peerId, isInitialized, isLoading, error } = useAppSelector(state => state.peer);
  const { showInfoNotification } = useNotificationViewModel();

  const [connectionMethod, setConnectionMethod] = useState<'serverless' | 'server' | null>(null);
  const [currentServer, setCurrentServer] = useState('official');

  const handleMethodSelect = (method: 'serverless' | 'server') => {
    setConnectionMethod(method);
    if (method === 'server' && !isInitialized && !isLoading) {
      // Initialize PeerJS when server method is selected
      dispatch(initializePeer());
    }
  };

  const handleServerChange = (serverKey: string, config: any) => {
    setCurrentServer(serverKey);
    peerService.setServerConfig(config);
    showInfoNotification('Server Changed', `Switched to ${serverKey} server. Restart connection to apply.`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SecureCast Home</Text>
        <Text style={styles.subtitle}>Screen sharing made simple</Text>
      </View>

      {/* Connection Method Selector */}
      <ConnectionMethodSelector onMethodSelect={handleMethodSelect} />

      {/* Show content based on selected method */}
      {connectionMethod === 'serverless' && (
        <ServerlessConnection />
      )}

      {connectionMethod === 'server' && (
        <>
          {/* Server Configuration */}
          <ServerSelector 
            currentServer={currentServer}
            onServerChange={handleServerChange}
          />

          {/* WebRTC Compatibility Check */}
          <WebRTCCheck />

          {/* PeerJS Connection Debug */}
          <PeerJSDebug />

          {/* PeerJS Integration Test */}
          <PeerJSTest />

          {/* Connection Status */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Connection Status</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: isInitialized ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.statusText}>
                {isInitialized ? 'Ready to connect' : 'Not initialized'}
              </Text>
            </View>
            {peerId && (
              <Text style={styles.peerIdText}>Peer ID: {peerId}</Text>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}
        </>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statusSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  peerIdText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    margin: 10,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});

export default HomeScreenView;