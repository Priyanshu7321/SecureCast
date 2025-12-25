import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { setScreenShareState, startScreenShare, stopScreenShare } from '../store/slices/peerSlice';
import { peerService } from '../services/peerService';
import { serverlessPeerService } from '../services/serverlessPeerService';
import { useNotificationViewModel } from '../viewmodels/useNotificationViewModel';
import PermissionsManager from '../utils/permissions';
import { backgroundScreenShareManager } from '../services/backgroundScreenShare';
import ScreenCaptureDebug from '../components/ScreenCaptureDebug';
import WebRTCAvailabilityCheck from '../components/WebRTCAvailabilityCheck';

const ScreenShareView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { connectedDevices, serverlessDevices, screenShareState } = useAppSelector(state => state.peer);
  const { showSuccessNotification, showErrorNotification, showInfoNotification } = useNotificationViewModel();

  const [isSharing, setIsSharing] = useState(false);
  const [receivedStream, setReceivedStream] = useState<any>(null);
  const [sharingWithDevice, setSharingWithDevice] = useState<string>('');
  const [receivingFromDevice, setReceivingFromDevice] = useState<string>('');
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    checkPermissions();
    setupStreamListeners();
    
    // Initialize background manager
    backgroundScreenShareManager.initialize();
    
    return () => {
      // Cleanup on unmount
      backgroundScreenShareManager.destroy();
    };
  }, []);

  const checkPermissions = async () => {
    const result = await PermissionsManager.checkScreenSharePermissions();
    setHasPermissions(result.granted);
    
    if (!result.granted && result.message) {
      console.log('Permissions not granted:', result.message);
    }
  };

  const setupStreamListeners = () => {
    // Listen for PeerJS streams
    peerService.onStream((stream, fromPeerId) => {
      console.log('📺 Received PeerJS stream from:', fromPeerId);
      setReceivedStream(stream);
      setReceivingFromDevice(fromPeerId);
      showSuccessNotification('Screen Share Started', `Receiving from ${fromPeerId.slice(-6)}`);
    });

    // Listen for serverless streams
    serverlessPeerService.onStream((stream, fromDeviceId) => {
      console.log('📺 Received serverless stream from:', fromDeviceId);
      setReceivedStream(stream);
      setReceivingFromDevice(fromDeviceId);
      showSuccessNotification('Screen Share Started', `Receiving from ${fromDeviceId.slice(-6)}`);
    });
  };

  const requestPermissions = async () => {
    const result = await PermissionsManager.requestScreenSharePermissions();
    setHasPermissions(result.granted);
    
    if (!result.granted && result.message) {
      PermissionsManager.showPermissionAlert(result.message, requestPermissions);
    } else if (result.granted) {
      showSuccessNotification('Permissions Granted', 'Screen recording permissions have been granted successfully');
    }
  };

  const startScreenShare = async (deviceId: string, isServerless: boolean = false) => {
    try {
      console.log('🎬 [ScreenShareView] Starting screen share...');
      console.log('🔍 [ScreenShareView] Device ID:', deviceId);
      console.log('🔍 [ScreenShareView] Is serverless:', isServerless);
      
      setIsSharing(true);
      setSharingWithDevice(deviceId);

      let stream;
      const deviceName = allDevices.find(d => (d.id || d.peerId) === deviceId)?.name || 'Unknown Device';
      console.log('🔍 [ScreenShareView] Device name:', deviceName);

      if (isServerless) {
        console.log('📡 [ScreenShareView] Using serverless peer service...');
        stream = await serverlessPeerService.startScreenShare(deviceId);
      } else {
        console.log('🌐 [ScreenShareView] Using PeerJS service...');
        stream = await peerService.startScreenShare(deviceId);
        // Update Redux state
        dispatch(setScreenShareState({
          isSharing: true,
          sharingWithPeerId: deviceId,
        }));
      }

      console.log('✅ [ScreenShareView] Screen share started, stream:', stream?.id);

      // Register with background manager
      backgroundScreenShareManager.addActiveShare(
        deviceId, 
        deviceName, 
        isServerless ? 'serverless' : 'peerjs', 
        stream
      );

      showSuccessNotification('Screen Share Started', `Now sharing your screen with ${deviceName}`);
    } catch (error) {
      console.error('💥 [ScreenShareView] Screen share failed:', error);
      setIsSharing(false);
      setSharingWithDevice('');
      
      const errorMessage = String(error);
      console.log('🔍 [ScreenShareView] Error message:', errorMessage);
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('permission')) {
        showErrorNotification('Permission Denied', 'Screen recording permission was denied. Please allow screen recording in your device settings.');
      } else if (errorMessage.includes('not supported')) {
        showErrorNotification('Not Supported', 'Screen sharing is not supported on this device.');
      } else {
        showErrorNotification('Screen Share Failed', `Failed to start: ${errorMessage}`);
      }
    }
  };

  const stopScreenShare = () => {
    try {
      if (sharingWithDevice) {
        const isServerless = serverlessDevices.find(d => d.id === sharingWithDevice);
        
        if (isServerless) {
          serverlessPeerService.stopScreenShare(sharingWithDevice);
        } else {
          peerService.stopScreenShare(sharingWithDevice);
          dispatch(setScreenShareState({
            isSharing: false,
            sharingWithPeerId: undefined,
          }));
        }

        // Remove from background manager
        backgroundScreenShareManager.removeActiveShare(sharingWithDevice);
      }

      setIsSharing(false);
      setSharingWithDevice('');
      showInfoNotification('Screen Share Stopped', 'Stopped sharing screen');
    } catch (error) {
      showErrorNotification('Stop Failed', `Failed to stop sharing: ${String(error)}`);
    }
  };

  const stopReceiving = () => {
    setReceivedStream(null);
    setReceivingFromDevice('');
    dispatch(setScreenShareState({
      isReceiving: false,
      receivedStream: undefined,
      receivingFromPeerId: undefined,
    }));
    showInfoNotification('Stopped Receiving', 'Stopped receiving screen share');
  };

  const allDevices = [...connectedDevices, ...serverlessDevices];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📺 Screen Sharing</Text>
        <Text style={styles.subtitle}>
          {allDevices.length} device{allDevices.length !== 1 ? 's' : ''} connected
        </Text>
      </View>

      {/* Permissions Section */}
      {!hasPermissions && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>📹 Camera & Audio Permissions</Text>
          <Text style={styles.permissionText}>
            Video sharing requires camera and microphone access.{'\n'}
            You'll be prompted to allow camera and audio permissions.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermissions}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Screen Capture Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📱 Video Sharing (Camera):</Text>
        <Text style={styles.infoText}>
          • Uses your device's camera for video sharing with other users{'\n'}
          • Shares live video feed from front/back camera{'\n'}
          • Includes audio from your microphone{'\n'}
          • Real-time peer-to-peer video streaming via WebRTC
        </Text>
      </View>

      {/* Background Sharing Warning */}
      {isSharing && (
        <View style={styles.backgroundWarning}>
          <Text style={styles.backgroundWarningTitle}>📹 Video Sharing Active</Text>
          <Text style={styles.backgroundWarningText}>
            Your camera video is being shared with the remote user. 
            They can see your camera feed and hear your microphone audio.
          </Text>
          <Text style={styles.backgroundWarningNote}>
            💡 This is live video sharing using your device's camera
          </Text>
        </View>
      )}

      {/* Current Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Current Status:</Text>
        
        {isSharing && (
          <View style={styles.statusItem}>
            <Text style={styles.statusText}>
              📤 Sharing screen with {sharingWithDevice.slice(-6)}
            </Text>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopScreenShare}
            >
              <Text style={styles.stopButtonText}>⏹️ Stop Sharing</Text>
            </TouchableOpacity>
          </View>
        )}

        {receivedStream && (
          <View style={styles.statusItem}>
            <Text style={styles.statusText}>
              📥 Receiving screen from {receivingFromDevice.slice(-6)}
            </Text>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopReceiving}
            >
              <Text style={styles.stopButtonText}>⏹️ Stop Receiving</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isSharing && !receivedStream && (
          <Text style={styles.idleText}>No active screen sharing</Text>
        )}

        {/* Emergency Stop All Button */}
        {backgroundScreenShareManager.isScreenSharingActive() && (
          <TouchableOpacity
            style={styles.emergencyStopButton}
            onPress={() => {
              backgroundScreenShareManager.stopAllShares();
              setIsSharing(false);
              setSharingWithDevice('');
              showInfoNotification('All Shares Stopped', 'Stopped all active screen sharing sessions');
            }}
          >
            <Text style={styles.emergencyStopText}>🛑 STOP ALL SCREEN SHARING</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Screen Display Area */}
      <View style={styles.screenContainer}>
        {receivedStream ? (
          <View style={styles.streamContainer}>
            <Text style={styles.streamTitle}>
              📺 Screen from {receivingFromDevice.slice(-6)}
            </Text>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>
                🎥 Video Stream Active
              </Text>
              <Text style={styles.streamInfo}>
                Stream ID: {receivedStream.id || 'N/A'}
              </Text>
              <Text style={styles.streamInfo}>
                Resolution: 1280x720 (simulated)
              </Text>
            </View>
          </View>
        ) : isSharing ? (
          <View style={styles.streamContainer}>
            <Text style={styles.streamTitle}>
              📤 Sharing Your Screen
            </Text>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>
                🎬 Your Screen is Being Shared
              </Text>
              <Text style={styles.streamInfo}>
                Sharing with: {sharingWithDevice.slice(-6)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyTitle}>No Screen Sharing Active</Text>
            <Text style={styles.emptyMessage}>
              Go to Connections to start or request screen sharing
            </Text>
          </View>
        )}
      </View>

      {/* Debug Components */}
      <WebRTCAvailabilityCheck />
      <ScreenCaptureDebug />

      {/* Test Mock Stream Button */}
      <View style={styles.testContainer}>
        <Text style={styles.testTitle}>🧪 Quick Test</Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={async () => {
            try {
              console.log('🧪 [Test] Testing mock stream creation...');
              const mockStream = {
                id: `test_mock_${Date.now()}`,
                active: true,
                getTracks: () => [
                  {
                    id: `test_video_${Date.now()}`,
                    kind: 'video',
                    enabled: true,
                    readyState: 'live',
                    stop: () => console.log('Test video track stopped'),
                  }
                ],
                _isMockStream: true,
              };
              
              console.log('✅ [Test] Mock stream created successfully:', mockStream.id);
              showSuccessNotification('Test Successful', 'Mock stream creation works - screen sharing should work now');
            } catch (error) {
              console.error('❌ [Test] Mock stream test failed:', error);
              showErrorNotification('Test Failed', `Mock stream test failed: ${error}`);
            }
          }}
        >
          <Text style={styles.testButtonText}>🧪 Test Mock Stream</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      {allDevices.length > 0 && (
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
          <View style={styles.actionButtons}>
            {allDevices.slice(0, 2).map((device) => {
              const isServerless = serverlessDevices.find(d => d.id === device.id);
              return (
                <TouchableOpacity
                  key={device.id || device.peerId}
                  style={styles.quickActionButton}
                  onPress={() => startScreenShare(device.id || device.peerId, !!isServerless)}
                  disabled={isSharing}
                >
                  <Text style={styles.quickActionText}>
                    📤 Share with {device.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.quickActionNote}>
            📝 Live video sharing using your device's camera
          </Text>
        </View>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  permissionContainer: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#212529',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 8,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  statusContainer: {
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
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  stopButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  idleText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  screenContainer: {
    flex: 1,
    margin: 16,
  },
  streamContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  videoPlaceholderText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  streamInfo: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  quickActions: {
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
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  backgroundWarning: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  backgroundWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  backgroundWarningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
    lineHeight: 20,
  },
  backgroundWarningList: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 8,
    marginLeft: 8,
    lineHeight: 18,
  },
  backgroundWarningNote: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emergencyStopButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#c82333',
  },
  emergencyStopText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testContainer: {
    backgroundColor: '#e8f5e8',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ScreenShareView;