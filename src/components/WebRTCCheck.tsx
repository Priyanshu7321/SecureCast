import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { checkWebRTCSupport } from '../utils/webrtcSetup';

const WebRTCCheck: React.FC = () => {
  const [webrtcStatus, setWebrtcStatus] = useState<string>('Checking...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = () => {
    const result = checkWebRTCSupport();
    const checks: string[] = [];

    // Convert the details object to display strings
    checks.push(result.details.RTCPeerConnection ? '✅ RTCPeerConnection available' : '❌ RTCPeerConnection missing');
    checks.push(result.details.RTCIceCandidate ? '✅ RTCIceCandidate available' : '❌ RTCIceCandidate missing');
    checks.push(result.details.RTCSessionDescription ? '✅ RTCSessionDescription available' : '❌ RTCSessionDescription missing');
    checks.push(result.details.MediaStream ? '✅ MediaStream available' : '❌ MediaStream missing');
    checks.push(result.details.mediaDevices ? '✅ navigator.mediaDevices available' : '❌ navigator.mediaDevices missing');

    setDetails(checks);
    setWebrtcStatus(result.supported ? 'WebRTC Ready ✅' : 'WebRTC Issues ❌');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebRTC Compatibility Check</Text>
      
      <View style={styles.statusContainer}>
        <Text style={[styles.status, { color: webrtcStatus.includes('✅') ? '#4CAF50' : '#F44336' }]}>
          {webrtcStatus}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        {details.map((detail, index) => (
          <Text key={index} style={styles.detailText}>
            {detail}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.recheckButton} onPress={checkSupport}>
        <Text style={styles.recheckText}>Recheck</Text>
      </TouchableOpacity>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  recheckButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  recheckText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WebRTCCheck;