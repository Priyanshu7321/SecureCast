import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface ScreenShareViewerProps {
  stream?: any;
  fromDevice: string;
  onClose: () => void;
  type: 'peerjs' | 'serverless';
}

const ScreenShareViewer: React.FC<ScreenShareViewerProps> = ({
  stream,
  fromDevice,
  onClose,
  type,
}) => {
  if (!stream) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          📺 Screen Share from {fromDevice} ({type})
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.videoContainer}>
        {/* In a real implementation, you would use RTCView or similar component */}
        {/* For now, we'll show a placeholder */}
        <View style={styles.videoPlaceholder}>
          <Text style={styles.placeholderText}>
            🎥 Screen Share Active
          </Text>
          <Text style={styles.placeholderSubtext}>
            Receiving video stream from {fromDevice}
          </Text>
          <Text style={styles.streamInfo}>
            Stream ID: {stream.id || 'N/A'}
          </Text>
          <Text style={styles.streamInfo}>
            Type: {type.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <Text style={styles.controlButtonText}>⏹️ Stop Viewing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#f44336',
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  videoPlaceholder: {
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  placeholderText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  streamInfo: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  controls: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScreenShareViewer;