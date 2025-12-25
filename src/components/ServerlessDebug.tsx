import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { serverlessPeerService } from '../services/serverlessPeerService';
import { useAppSelector } from '../store';

const ServerlessDebug: React.FC = () => {
  const { serverlessDevices } = useAppSelector(state => state.peer);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const refreshDebugInfo = () => {
    const info = serverlessPeerService.getDebugInfo();
    setDebugInfo(info);
    console.log('🔍 Serverless Debug Info:', info);
  };

  useEffect(() => {
    if (showDebug) {
      refreshDebugInfo();
      const interval = setInterval(refreshDebugInfo, 2000);
      return () => clearInterval(interval);
    }
  }, [showDebug]);

  if (!showDebug) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowDebug(true)}
      >
        <Text style={styles.toggleButtonText}>🔍 Show Serverless Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Serverless P2P Debug</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowDebug(false)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Redux Store:</Text>
        <Text style={styles.debugText}>
          Serverless devices in store: {serverlessDevices.length}
        </Text>
        {serverlessDevices.map((device, index) => (
          <Text key={device.id} style={styles.deviceText}>
            {index + 1}. {device.name} ({device.id.slice(-6)}) - {device.connectionStatus}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service State:</Text>
        {debugInfo && (
          <>
            <Text style={styles.debugText}>
              Local Device: {debugInfo.localDeviceName} ({debugInfo.localDeviceId.slice(-6)})
            </Text>
            <Text style={styles.debugText}>
              Peer Connections: {debugInfo.peerConnectionsCount}
            </Text>
            <Text style={styles.debugText}>
              Data Channels: {debugInfo.dataChannelsCount}
            </Text>
            <Text style={styles.debugText}>
              Connected Devices: {debugInfo.connectedDevices.length}
            </Text>
            {debugInfo.connectedDevices.map((device: any, index: number) => (
              <Text key={device.id} style={styles.deviceText}>
                {index + 1}. {device.name} ({device.id.slice(-6)}) - {device.connectionStatus}
              </Text>
            ))}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={refreshDebugInfo}
      >
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    margin: 10,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#856404',
  },
  toggleButton: {
    backgroundColor: '#ffc107',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#212529',
    fontWeight: '600',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  deviceText: {
    fontSize: 11,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginLeft: 8,
    marginBottom: 1,
  },
  refreshButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ServerlessDebug;