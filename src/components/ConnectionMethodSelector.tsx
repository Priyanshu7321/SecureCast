import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ConnectionMethodSelectorProps {
  onMethodSelect: (method: 'serverless' | 'server') => void;
}

const ConnectionMethodSelector: React.FC<ConnectionMethodSelectorProps> = ({ onMethodSelect }) => {
  const [selectedMethod, setSelectedMethod] = useState<'serverless' | 'server' | null>(null);

  const handleMethodSelect = (method: 'serverless' | 'server') => {
    setSelectedMethod(method);
    onMethodSelect(method);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Connection Method</Text>
      <Text style={styles.subtitle}>How do you want to connect to other devices?</Text>

      <View style={styles.methodsContainer}>
        <TouchableOpacity
          style={[
            styles.methodButton,
            styles.serverlessButton,
            selectedMethod === 'serverless' && styles.selectedButton
          ]}
          onPress={() => handleMethodSelect('serverless')}
        >
          <Text style={styles.methodIcon}>🔒</Text>
          <Text style={styles.methodTitle}>Serverless P2P</Text>
          <Text style={styles.methodDescription}>
            Share connection info via WhatsApp/clipboard{'\n'}
            Maximum privacy - no servers involved
          </Text>
          <View style={styles.privacyBadge}>
            <Text style={styles.privacyText}>🔒 MAXIMUM PRIVACY</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodButton,
            styles.serverButton,
            selectedMethod === 'server' && styles.selectedButton
          ]}
          onPress={() => handleMethodSelect('server')}
        >
          <Text style={styles.methodIcon}>🌐</Text>
          <Text style={styles.methodTitle}>Server-Assisted</Text>
          <Text style={styles.methodDescription}>
            Automatic connection via signaling server{'\n'}
            Easy setup - just share peer IDs
          </Text>
          <View style={[styles.privacyBadge, styles.mediumPrivacy]}>
            <Text style={styles.privacyText}>🔐 MEDIUM PRIVACY</Text>
          </View>
        </TouchableOpacity>
      </View>

      {selectedMethod && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedText}>
            ✅ {selectedMethod === 'serverless' ? 'Serverless P2P' : 'Server-Assisted'} method selected
          </Text>
          <Text style={styles.selectedDescription}>
            {selectedMethod === 'serverless' 
              ? 'You can now create connection offers to share manually'
              : 'You can now initialize PeerJS and connect using peer IDs'
            }
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  methodsContainer: {
    marginBottom: 16,
  },
  methodButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  serverlessButton: {
    backgroundColor: '#f8fff8',
  },
  serverButton: {
    backgroundColor: '#f8f9ff',
  },
  selectedButton: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  methodIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  privacyBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediumPrivacy: {
    backgroundColor: '#FF9800',
  },
  privacyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  selectedDescription: {
    fontSize: 12,
    color: '#2e7d32',
  },
});

export default ConnectionMethodSelector;