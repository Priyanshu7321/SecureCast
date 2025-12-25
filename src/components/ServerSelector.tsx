import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { PEER_SERVER_OPTIONS, PeerServerConfig } from '../config/peerConfig';

interface ServerSelectorProps {
  currentServer: string;
  onServerChange: (serverKey: string, config: PeerServerConfig) => void;
}

const ServerSelector: React.FC<ServerSelectorProps> = ({ currentServer, onServerChange }) => {
  const [showModal, setShowModal] = useState(false);

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#666';
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'high': return '🔒';
      case 'medium': return '🔐';
      case 'low': return '🔓';
      default: return '❓';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signaling Server</Text>
      
      <TouchableOpacity style={styles.currentServer} onPress={() => setShowModal(true)}>
        <View style={styles.serverInfo}>
          <Text style={styles.serverName}>
            {PEER_SERVER_OPTIONS[currentServer]?.description || 'Unknown Server'}
          </Text>
          <View style={styles.privacyBadge}>
            <Text style={styles.privacyIcon}>
              {getPrivacyIcon(PEER_SERVER_OPTIONS[currentServer]?.privacy)}
            </Text>
            <Text style={[styles.privacyText, { color: getPrivacyColor(PEER_SERVER_OPTIONS[currentServer]?.privacy) }]}>
              {PEER_SERVER_OPTIONS[currentServer]?.privacy.toUpperCase()} PRIVACY
            </Text>
          </View>
        </View>
        <Text style={styles.changeText}>Tap to change</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Signaling Server</Text>
            <Text style={styles.modalSubtitle}>
              Signaling servers only help devices find each other. Your data flows directly between devices.
            </Text>

            {Object.entries(PEER_SERVER_OPTIONS).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[styles.serverOption, currentServer === key && styles.selectedOption]}
                onPress={() => {
                  onServerChange(key, config);
                  setShowModal(false);
                }}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>{key.toUpperCase()}</Text>
                  <View style={[styles.privacyBadge, styles.smallBadge]}>
                    <Text style={styles.privacyIcon}>{getPrivacyIcon(config.privacy)}</Text>
                    <Text style={[styles.privacyText, { color: getPrivacyColor(config.privacy) }]}>
                      {config.privacy.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>{config.description}</Text>
                <Text style={styles.optionHost}>Host: {config.host}:{config.port}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔒 Privacy Information</Text>
        <Text style={styles.infoText}>
          • Signaling server only helps initial connection setup{'\n'}
          • Your screen sharing data flows directly between devices{'\n'}
          • No third party can see your actual content{'\n'}
          • Server is not involved after connection is established
        </Text>
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
    marginBottom: 12,
  },
  currentServer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  serverInfo: {
    marginBottom: 4,
  },
  serverName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallBadge: {
    marginLeft: 8,
  },
  privacyIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  privacyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  changeText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  serverOption: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  optionHost: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  closeButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#2e7d32',
    lineHeight: 16,
  },
});

export default ServerSelector;