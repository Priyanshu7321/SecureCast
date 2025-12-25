import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import {
  sendScreenShareRequest,
  startScreenShare,
  stopScreenShare,
  disconnectFromPeer,
  addScreenShareRequest,
  updateScreenShareRequest,
  setScreenShareState,
  addServerlessDevice,
  removeServerlessDevice,
} from '../store/slices/peerSlice';
import { peerService } from '../services/peerService';
import { serverlessPeerService } from '../services/serverlessPeerService';
import { screenShareService } from '../services/screenShareService';
import { useNotificationViewModel } from '../viewmodels/useNotificationViewModel';
import { ConnectedDevice, ScreenShareRequest } from '../types';
import StatusDialog from '../components/StatusDialog';
import ServerlessDebug from '../components/ServerlessDebug';
import ScreenShareViewer from '../components/ScreenShareViewer';
import ScreenShareRequestDialog from '../components/ScreenShareRequestDialog';

const ConnectionsScreenView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { connectedDevices, serverlessDevices, screenShareRequests, screenShareState, isLoading } = useAppSelector(state => state.peer);
  const { showSuccessNotification, showErrorNotification, showInfoNotification } = useNotificationViewModel();

  const [refreshing, setRefreshing] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ScreenShareRequest | null>(null);
  const [messageText, setMessageText] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<Array<{id: string, from: string, message: string, timestamp: number, type: 'peerjs' | 'serverless'}>>([]);
  const [showMessaging, setShowMessaging] = useState(false);
  const [serverlessScreenShare, setServerlessScreenShare] = useState<{[deviceId: string]: {isSharing: boolean, isReceiving: boolean, stream?: any}}>({});
  const [showScreenShareRequest, setShowScreenShareRequest] = useState(false);
  const [currentScreenShareRequest, setCurrentScreenShareRequest] = useState<{fromDevice: string, deviceType: 'peerjs' | 'serverless', deviceId: string} | null>(null);

  useEffect(() => {
    console.log('🔄 [ConnectionsScreen] Component mounted, setting up listeners...');
    console.log('🔍 [ConnectionsScreen] Initial device counts - PeerJS:', connectedDevices.length, 'Serverless:', serverlessDevices.length);
    
    // Set up screen sharing service event listeners
    screenShareService.setOnScreenShareStarted((streamId) => {
      console.log('📺 [ConnectionsScreen] Screen share service started:', streamId);
      showSuccessNotification('Screen Capture Active', 'Android screen capture started successfully');
    });
    
    screenShareService.setOnScreenShareStopped(() => {
      console.log('⏹️ [ConnectionsScreen] Screen share service stopped');
      showInfoNotification('Screen Capture Stopped', 'Android screen capture stopped');
    });
    
    screenShareService.setOnScreenShareError((error) => {
      console.error('💥 [ConnectionsScreen] Screen share service error:', error);
      showErrorNotification('Screen Capture Error', error);
    });
    
    // Set up PeerJS event listeners
    peerService.onData((data, fromPeerId) => {
      console.log('Received data:', data, 'from:', fromPeerId);
      
      if (data.type === 'screen_share_request') {
        const request: ScreenShareRequest = data;
        // Use new dialog for screen share requests
        setCurrentScreenShareRequest({
          fromDevice: fromPeerId.slice(-6),
          deviceType: 'peerjs',
          deviceId: fromPeerId,
        });
        setShowScreenShareRequest(true);
        
        // Also keep the old flow for compatibility
        dispatch(addScreenShareRequest(request));
        setCurrentRequest(request);
      } else if (data.type === 'screen_share_response') {
        const response = data;
        if (response.status === 'accepted') {
          showSuccessNotification('Request Accepted', 'Screen sharing request was accepted');
        } else if (response.status === 'rejected') {
          showErrorNotification('Request Rejected', 'Screen sharing request was rejected');
        }
        dispatch(updateScreenShareRequest({ id: response.id, status: response.status }));
      } else if (data.type === 'custom_message') {
        // Handle custom messages
        const newMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from: fromPeerId.slice(-6),
          message: data.message,
          timestamp: Date.now(),
          type: 'peerjs' as 'peerjs' | 'serverless',
        };
        setReceivedMessages(prev => [...prev, newMessage]);
        showInfoNotification('Message Received', `${fromPeerId.slice(-6)}: ${data.message.substring(0, 30)}${data.message.length > 30 ? '...' : ''}`);
      }
    });

    peerService.onStream((stream, fromPeerId) => {
      console.log('Received stream from:', fromPeerId);
      dispatch(setScreenShareState({
        isReceiving: true,
        receivedStream: stream,
        receivingFromPeerId: fromPeerId,
      }));
      showSuccessNotification('Screen Share Started', `Now receiving screen from ${fromPeerId.slice(-6)}`);
    });

    peerService.onError((error) => {
      showErrorNotification('Connection Error', error);
    });

    // Set up serverless peer service listeners
    serverlessPeerService.onConnection((device) => {
      console.log('✅ Serverless device connected:', device);
      dispatch(addServerlessDevice(device));
      showSuccessNotification('Device Connected', `Connected to ${device.name} via serverless P2P`);
    });

    serverlessPeerService.onDisconnection((deviceId) => {
      console.log('❌ Serverless device disconnected:', deviceId);
      dispatch(removeServerlessDevice(deviceId));
      showInfoNotification('Device Disconnected', 'Serverless P2P device disconnected');
    });

    serverlessPeerService.onData((data, fromDeviceId) => {
      console.log('📨 Received serverless data:', data, 'from:', fromDeviceId);
      
      if (data.type === 'custom_message') {
        // Handle custom messages from serverless devices
        const newMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from: fromDeviceId.slice(-6),
          message: data.message,
          timestamp: Date.now(),
          type: 'serverless' as 'peerjs' | 'serverless',
        };
        setReceivedMessages(prev => [...prev, newMessage]);
        showInfoNotification('Serverless Message', `${fromDeviceId.slice(-6)}: ${data.message.substring(0, 30)}${data.message.length > 30 ? '...' : ''}`);
      } else if (data.type === 'screen_share_request') {
        // Handle screen share requests from serverless devices
        setCurrentScreenShareRequest({
          fromDevice: fromDeviceId.slice(-6),
          deviceType: 'serverless',
          deviceId: fromDeviceId,
        });
        setShowScreenShareRequest(true);
      } else if (data.type === 'screen_share_response') {
        if (data.status === 'accepted') {
          showSuccessNotification('Request Accepted', 'Starting screen share...');
          handleStartServerlessScreenShare(fromDeviceId);
        } else {
          showErrorNotification('Request Rejected', 'Screen share request was rejected');
        }
      } else if (data.type === 'screen_share_started') {
        showSuccessNotification('Screen Share Started', `Now receiving screen from ${fromDeviceId.slice(-6)}`);
      } else if (data.type === 'screen_share_stopped') {
        setServerlessScreenShare(prev => ({
          ...prev,
          [fromDeviceId]: { ...prev[fromDeviceId], isReceiving: false, stream: undefined }
        }));
        showInfoNotification('Screen Share Stopped', 'Remote device stopped sharing');
      } else {
        showInfoNotification('Message Received', `Got message from ${fromDeviceId.slice(-6)}`);
      }
    });

    // Handle serverless streams
    serverlessPeerService.onStream((stream, fromDeviceId) => {
      console.log('🎥 Received serverless stream from:', fromDeviceId);
      setServerlessScreenShare(prev => ({
        ...prev,
        [fromDeviceId]: { ...prev[fromDeviceId], isReceiving: true, stream }
      }));
      showSuccessNotification('Screen Share Started', `Now receiving screen from ${fromDeviceId.slice(-6)}`);
    });

    // Get initial serverless devices
    const initialServerlessDevices = serverlessPeerService.getConnectedDevices();
    console.log('🔍 Initial serverless devices:', initialServerlessDevices.length);
    initialServerlessDevices.forEach(device => {
      console.log('📱 Adding initial serverless device:', device.name);
      dispatch(addServerlessDevice(device));
    });

    return () => {
      // Cleanup listeners and screen sharing service
      console.log('🧹 [ConnectionsScreen] Component unmounting, cleaning up...');
      screenShareService.cleanup();
    };
  }, [dispatch, showSuccessNotification, showErrorNotification, showInfoNotification]);

  // Log device changes
  useEffect(() => {
    console.log('📊 [ConnectionsScreen] Device state changed:');
    console.log('🔍 [ConnectionsScreen] PeerJS devices:', connectedDevices.length, connectedDevices.map(d => d.name));
    console.log('🔍 [ConnectionsScreen] Serverless devices:', serverlessDevices.length, serverlessDevices.map(d => d.name));
    console.log('🔍 [ConnectionsScreen] Total devices:', connectedDevices.length + serverlessDevices.length);
  }, [connectedDevices, serverlessDevices]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Refresh both regular and serverless devices
    const currentServerlessDevices = serverlessPeerService.getConnectedDevices();
    currentServerlessDevices.forEach(device => {
      dispatch(addServerlessDevice(device));
    });
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleSendRequest = async (device: ConnectedDevice) => {
    try {
      await dispatch(sendScreenShareRequest(device.peerId)).unwrap();
      showSuccessNotification('Request Sent', `Screen share request sent to ${device.name}`);
    } catch (error) {
      showErrorNotification('Failed to Send', error as string);
    }
  };

  const handleStartReceiving = async (device: ConnectedDevice) => {
    // This is called when user accepts an incoming request
    try {
      dispatch(setScreenShareState({
        isReceiving: true,
        receivingFromPeerId: device.peerId,
      }));
      showInfoNotification('Ready to Receive', `Waiting for screen share from ${device.name}`);
    } catch (error) {
      showErrorNotification('Failed to Start', error as string);
    }
  };

  const handleAcceptRequest = async () => {
    if (!currentRequest) return;

    try {
      // Send acceptance response
      const response = {
        ...currentRequest,
        status: 'accepted' as const,
        type: 'screen_share_response' as const,
      };
      
      peerService.sendData(currentRequest.fromPeerId, response);
      dispatch(updateScreenShareRequest({ id: currentRequest.id, status: 'accepted' }));
      
      // Start receiving
      dispatch(setScreenShareState({
        isReceiving: true,
        receivingFromPeerId: currentRequest.fromPeerId,
      }));

      setShowRequestDialog(false);
      setCurrentRequest(null);
      showSuccessNotification('Request Accepted', 'Ready to receive screen share');
    } catch (error) {
      showErrorNotification('Failed to Accept', error as string);
    }
  };

  const handleRejectRequest = () => {
    if (!currentRequest) return;

    const response = {
      ...currentRequest,
      status: 'rejected' as const,
      type: 'screen_share_response' as const,
    };
    
    peerService.sendData(currentRequest.fromPeerId, response);
    dispatch(updateScreenShareRequest({ id: currentRequest.id, status: 'rejected' }));
    
    setShowRequestDialog(false);
    setCurrentRequest(null);
    showInfoNotification('Request Rejected', 'Screen share request was rejected');
  };

  const handleStopSharing = (device: ConnectedDevice) => {
    dispatch(stopScreenShare(device.peerId));
    showInfoNotification('Sharing Stopped', `Stopped sharing screen with ${device.name}`);
  };

  const handleStopReceiving = () => {
    dispatch(setScreenShareState({
      isReceiving: false,
      receivedStream: undefined,
      receivingFromPeerId: undefined,
    }));
    showInfoNotification('Receiving Stopped', 'Stopped receiving screen share');
  };

  const handleDisconnect = (device: ConnectedDevice) => {
    Alert.alert(
      'Disconnect Device',
      `Are you sure you want to disconnect from ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            // Check if it's a serverless device
            const isServerless = serverlessDevices.find(d => d.id === device.id);
            if (isServerless) {
              serverlessPeerService.disconnectFromDevice(device.id);
              dispatch(removeServerlessDevice(device.id));
            } else {
              dispatch(disconnectFromPeer(device.peerId));
            }
            showInfoNotification('Disconnected', `Disconnected from ${device.name}`);
          },
        },
      ]
    );
  };

  const handleSendCustomMessage = (device: ConnectedDevice) => {
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message to send');
      return;
    }

    const isServerless = serverlessDevices.find(d => d.id === device.id);
    const messageData = {
      type: 'custom_message',
      message: messageText.trim(),
      timestamp: Date.now(),
    };

    let success = false;
    if (isServerless) {
      success = serverlessPeerService.sendData(device.id, messageData);
    } else {
      success = peerService.sendData(device.peerId, messageData);
    }

    if (success) {
      showSuccessNotification('Message Sent', `Sent to ${device.name}`);
      // Add to our own message history
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: 'You',
        message: messageText.trim(),
        timestamp: Date.now(),
        type: (isServerless ? 'serverless' : 'peerjs') as 'peerjs' | 'serverless',
      };
      setReceivedMessages(prev => [...prev, newMessage]);
      setMessageText('');
    } else {
      showErrorNotification('Send Failed', 'Failed to send message');
    }
  };

  const handleSendToAllDevices = () => {
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message to send');
      return;
    }

    const allDevices = [...connectedDevices, ...serverlessDevices];
    if (allDevices.length === 0) {
      Alert.alert('Error', 'No connected devices to send message to');
      return;
    }

    let successCount = 0;
    const messageData = {
      type: 'custom_message',
      message: messageText.trim(),
      timestamp: Date.now(),
    };

    allDevices.forEach(device => {
      const isServerless = serverlessDevices.find(d => d.id === device.id);
      let success = false;
      
      if (isServerless) {
        success = serverlessPeerService.sendData(device.id, messageData);
      } else {
        success = peerService.sendData(device.peerId, messageData);
      }
      
      if (success) successCount++;
    });

    if (successCount > 0) {
      showSuccessNotification('Messages Sent', `Sent to ${successCount}/${allDevices.length} devices`);
      // Add to our own message history
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: 'You (Broadcast)',
        message: messageText.trim(),
        timestamp: Date.now(),
        type: 'peerjs' as 'peerjs' | 'serverless',
      };
      setReceivedMessages(prev => [...prev, newMessage]);
      setMessageText('');
    } else {
      showErrorNotification('Send Failed', 'Failed to send messages');
    }
  };

  // Serverless screen sharing handlers
  const handleRequestServerlessScreenShare = (device: ConnectedDevice) => {
    console.log('📥 [ConnectionsScreen] Requesting screen share from device:', device.name, device.id);
    
    Alert.alert(
      'Request Screen Share',
      `Request screen sharing from ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {
          console.log('❌ [ConnectionsScreen] User cancelled screen share request');
        }},
        { text: 'Request', onPress: () => {
          console.log('✅ [ConnectionsScreen] User confirmed screen share request, sending...');
          
          const success = serverlessPeerService.sendData(device.id, {
            type: 'screen_share_request',
            timestamp: Date.now(),
          });
          
          console.log('📤 [ConnectionsScreen] Screen share request sent, success:', success);
          
          if (success) {
            showInfoNotification('Request Sent', `Screen share request sent to ${device.name}`);
          } else {
            showErrorNotification('Send Failed', 'Failed to send screen share request');
          }
        }},
      ]
    );
  };

  const handleStartServerlessScreenShare = async (deviceId: string) => {
    try {
      console.log('🎬 [ConnectionsScreen] Starting Android screen share with MediaProjection...');
      console.log('🔍 [ConnectionsScreen] Device ID:', deviceId);
      
      // Check if screen sharing is supported
      const isSupported = await screenShareService.isSupported();
      if (!isSupported) {
        showErrorNotification('Not Supported', 'Screen sharing is not supported on this device');
        return;
      }
      
      // Start screen sharing with Android MediaProjection
      const result = await screenShareService.startScreenShare();
      if (!result?.success) {
        showErrorNotification('Permission Denied', 'Screen capture permission was denied or failed to start');
        return;
      }
      
      console.log('✅ [ConnectionsScreen] Android screen share started:', result);
      
      // Add this device as a connected peer for screen sharing
      screenShareService.addConnectedPeer(deviceId);
      
      // Update local state
      setServerlessScreenShare(prev => ({
        ...prev,
        [deviceId]: { 
          ...prev[deviceId], 
          isSharing: true, 
          stream: { id: result.streamId, _isScreenShare: true }
        }
      }));
      
      // Start serverless P2P connection for the screen stream
      try {
        const p2pStream = await serverlessPeerService.startScreenShare(deviceId);
        console.log('✅ [ConnectionsScreen] P2P connection established for screen share');
        
        // Update stream with P2P connection info
        setServerlessScreenShare(prev => ({
          ...prev,
          [deviceId]: { 
            ...prev[deviceId], 
            stream: { 
              id: result.streamId, 
              _isScreenShare: true,
              _p2pStream: p2pStream
            }
          }
        }));
        
      } catch (p2pError) {
        console.warn('⚠️ [ConnectionsScreen] P2P connection failed, but screen capture is active:', p2pError);
      }
      
      showSuccessNotification('Screen Share Started', `Now sharing your screen with device ${deviceId}`);
      
    } catch (error) {
      console.error('💥 [ConnectionsScreen] Android screen share failed:', error);
      console.log('🔍 [ConnectionsScreen] About to call showErrorNotification...');
      showErrorNotification('Screen Share Failed', `Failed to start screen sharing: ${error}`);
      console.log('🔍 [ConnectionsScreen] showErrorNotification called');
    }
  };

  const handleStopServerlessScreenShare = async (deviceId: string) => {
    console.log('⏹️ [ConnectionsScreen] Stopping Android screen share for device:', deviceId);
    
    try {
      // Remove peer from screen sharing service
      screenShareService.removeConnectedPeer(deviceId);
      
      // Check if there are other connected peers
      const connectedPeers = screenShareService.getConnectedPeers();
      
      // If no more peers, stop the screen sharing service
      if (connectedPeers.length === 0) {
        console.log('ℹ️ [ConnectionsScreen] No more connected peers, stopping screen share service');
        await screenShareService.stopScreenShare();
      }
      
      // Stop P2P connection
      serverlessPeerService.stopScreenShare(deviceId);
      
      // Update local state
      setServerlessScreenShare(prev => ({
        ...prev,
        [deviceId]: { ...prev[deviceId], isSharing: false, stream: undefined }
      }));
      
      showInfoNotification('Screen Share Stopped', 'Stopped sharing screen');
      console.log('✅ [ConnectionsScreen] Android screen share stopped');
      
    } catch (error) {
      console.error('💥 [ConnectionsScreen] Error stopping screen share:', error);
      showErrorNotification('Stop Failed', 'Failed to stop screen sharing');
    }
  };

  const handleOfferToShareScreen = (device: ConnectedDevice) => {
    console.log('🎬 [ConnectionsScreen] Offering to share video with device:', device.name, device.id);
    
    Alert.alert(
      'Share Your Video',
      `Share your camera video with ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {
          console.log('❌ [ConnectionsScreen] User cancelled video share offer');
        }},
        { text: 'Share Video', onPress: () => {
          console.log('✅ [ConnectionsScreen] User confirmed video share, starting...');
          handleStartServerlessScreenShare(device.id);
        }},
      ]
    );
  };

  // Screen share request dialog handlers
  const handleAcceptScreenShareRequest = () => {
    if (!currentScreenShareRequest) return;

    const { deviceId, deviceType } = currentScreenShareRequest;

    if (deviceType === 'serverless') {
      serverlessPeerService.sendData(deviceId, {
        type: 'screen_share_response',
        status: 'accepted',
        timestamp: Date.now(),
      });
      setServerlessScreenShare(prev => ({
        ...prev,
        [deviceId]: { ...prev[deviceId], isReceiving: true }
      }));
    } else {
      // Handle PeerJS acceptance
      peerService.sendData(deviceId, {
        type: 'screen_share_response',
        status: 'accepted',
        timestamp: Date.now(),
      });
    }

    setShowScreenShareRequest(false);
    setCurrentScreenShareRequest(null);
    showSuccessNotification('Request Accepted', 'Ready to receive screen share');
  };

  const handleRejectScreenShareRequest = () => {
    if (!currentScreenShareRequest) return;

    const { deviceId, deviceType } = currentScreenShareRequest;

    if (deviceType === 'serverless') {
      serverlessPeerService.sendData(deviceId, {
        type: 'screen_share_response',
        status: 'rejected',
        timestamp: Date.now(),
      });
    } else {
      // Handle PeerJS rejection
      peerService.sendData(deviceId, {
        type: 'screen_share_response',
        status: 'rejected',
        timestamp: Date.now(),
      });
    }

    setShowScreenShareRequest(false);
    setCurrentScreenShareRequest(null);
    showInfoNotification('Request Rejected', 'Screen share request was rejected');
  };

  const getDeviceRequestStatus = (device: ConnectedDevice) => {
    const pendingRequest = screenShareRequests.find(
      req => req.toPeerId === device.peerId && req.status === 'pending'
    );
    return pendingRequest ? 'request_sent' : 'none';
  };

  const hasIncomingRequest = (device: ConnectedDevice) => {
    return screenShareRequests.some(
      req => req.fromPeerId === device.peerId && req.status === 'pending'
    );
  };

  const renderDeviceItem = ({ item: device }: { item: ConnectedDevice }) => {
    const requestStatus = getDeviceRequestStatus(device);
    const hasIncoming = hasIncomingRequest(device);
    const isSharing = screenShareState.sharingWithPeerId === device.peerId;
    const isReceiving = screenShareState.receivingFromPeerId === device.peerId;
    const isServerless = serverlessDevices.find(d => d.id === device.id);
    
    // Get serverless screen share state
    const serverlessState = serverlessScreenShare[device.id] || { isSharing: false, isReceiving: false };

    return (
      <View style={styles.deviceItem}>
        <View style={styles.deviceHeader}>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceId}>ID: {device.peerId.slice(-8)}</Text>
            <View style={styles.deviceStatusContainer}>
              <View
                style={[
                  styles.deviceStatusIndicator,
                  { backgroundColor: device.isConnected ? '#4CAF50' : '#F44336' }
                ]}
              />
              <Text style={styles.deviceStatusText}>
                {device.isConnected ? 'Connected' : 'Disconnected'}
                {isServerless ? ' (Serverless P2P)' : ' (PeerJS)'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={() => handleDisconnect(device)}
          >
            <Text style={styles.disconnectButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Screen Share Status */}
        {((isSharing || isReceiving) || (isServerless && (serverlessState.isSharing || serverlessState.isReceiving))) && (
          <View style={styles.shareStatusContainer}>
            <Text style={styles.shareStatusText}>
              {(isSharing || (isServerless && serverlessState.isSharing)) && '📤 Sharing screen with this device'}
              {(isReceiving || (isServerless && serverlessState.isReceiving)) && '📥 Receiving screen from this device'}
            </Text>
          </View>
        )}

        {/* Action Buttons - only show for non-serverless devices */}
        {!isServerless && (
          <View style={styles.deviceActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.sendButton,
                (requestStatus === 'request_sent' || isSharing) && styles.disabledButton
              ]}
              onPress={() => handleSendRequest(device)}
              disabled={!device.isConnected || requestStatus === 'request_sent' || isSharing || isLoading}
            >
              <Text style={styles.actionButtonText}>
                {isSharing ? '📤 Sharing' : requestStatus === 'request_sent' ? '⏳ Sent' : '📤 Send'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.receiveButton,
                (!hasIncoming && !isReceiving) && styles.disabledButton
              ]}
              onPress={() => isReceiving ? handleStopReceiving() : handleStartReceiving(device)}
              disabled={!device.isConnected && !isReceiving}
            >
              <Text style={styles.actionButtonText}>
                {isReceiving ? '⏹️ Stop' : hasIncoming ? '📥 Receive' : '📥 Receive'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Serverless device actions */}
        {isServerless && (
          <View style={styles.deviceActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={() => handleSendCustomMessage(device)}
              disabled={!messageText.trim()}
            >
              <Text style={styles.actionButtonText}>💬 Send Message</Text>
            </TouchableOpacity>
            
            {/* Screen Share Actions for Serverless */}
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => {
                console.log('🖱️ [ConnectionsScreen] Screen share button clicked for device:', device.name, device.id);
                console.log('🔍 [ConnectionsScreen] Current serverless state:', serverlessState);
                
                if (serverlessState.isSharing) {
                  console.log('⏹️ [ConnectionsScreen] Stopping screen share...');
                  handleStopServerlessScreenShare(device.id);
                } else {
                  console.log('📤 [ConnectionsScreen] Starting screen share offer...');
                  handleOfferToShareScreen(device);
                }
              }}
            >
              <Text style={styles.actionButtonText}>
                {serverlessState.isSharing ? '⏹️ Stop Video' : '📹 Share Video'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.requestButton]}
              onPress={() => {
                console.log('🖱️ [ConnectionsScreen] Request screen button clicked for device:', device.name, device.id);
                handleRequestServerlessScreenShare(device);
              }}
            >
              <Text style={styles.actionButtonText}>📥 Request Video</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PeerJS device messaging */}
        {!isServerless && (
          <View style={styles.messagingSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={() => handleSendCustomMessage(device)}
              disabled={!messageText.trim()}
            >
              <Text style={styles.actionButtonText}>💬 Send Message</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Request Status */}
        {!isServerless && requestStatus === 'request_sent' && (
          <Text style={styles.requestStatusText}>
            ⏳ Screen share request sent, waiting for response...
          </Text>
        )}
        
        {!isServerless && hasIncoming && (
          <Text style={styles.requestStatusText}>
            📨 Incoming screen share request - tap Receive to accept
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📱</Text>
      <Text style={styles.emptyTitle}>No Connected Devices</Text>
      <Text style={styles.emptyMessage}>
        Go to the Home screen to connect to other devices first.
      </Text>
    </View>
  );

  // Combine both PeerJS and serverless devices
  const allDevices = [...connectedDevices, ...serverlessDevices];
  const totalDeviceCount = allDevices.length;

  console.log('📊 Device counts - PeerJS:', connectedDevices.length, 'Serverless:', serverlessDevices.length, 'Total:', totalDeviceCount);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connected Devices</Text>
        <Text style={styles.subtitle}>
          {totalDeviceCount} device{totalDeviceCount !== 1 ? 's' : ''} connected
          {connectedDevices.length > 0 && ` (${connectedDevices.length} PeerJS)`}
          {serverlessDevices.length > 0 && ` (${serverlessDevices.length} Serverless)`}
        </Text>
        
        {/* Toggle Messaging Button */}
        <TouchableOpacity
          style={styles.toggleMessagingButton}
          onPress={() => setShowMessaging(!showMessaging)}
        >
          <Text style={styles.toggleMessagingText}>
            {showMessaging ? '📱 Hide Messaging' : '💬 Show Messaging'}
          </Text>
        </TouchableOpacity>

        {/* Screen Sharing Quick Access */}
        {totalDeviceCount > 0 && (
          <TouchableOpacity
            style={styles.screenShareButton}
            onPress={() => {
              // Navigate to screen share tab or show quick actions
              Alert.alert(
                'Screen Sharing',
                'Go to the Screen Share tab for full screen sharing controls, or use the device buttons below for quick actions.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.screenShareButtonText}>
              📺 Screen Sharing Available
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messaging Interface */}
      {showMessaging && (
        <View style={styles.messagingContainer}>
          <Text style={styles.messagingTitle}>📨 P2P Messaging</Text>
          
          {/* Message Input */}
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type your message here..."
              multiline
              numberOfLines={2}
            />
            <View style={styles.messageButtons}>
              <TouchableOpacity
                style={[styles.messageButton, !messageText.trim() && styles.disabledButton]}
                onPress={handleSendToAllDevices}
                disabled={!messageText.trim() || totalDeviceCount === 0}
              >
                <Text style={styles.messageButtonText}>📢 Send to All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.messageButton, styles.clearButton]}
                onPress={() => setReceivedMessages([])}
                disabled={receivedMessages.length === 0}
              >
                <Text style={styles.messageButtonText}>🗑️ Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Message History */}
          <View style={styles.messageHistory}>
            <Text style={styles.messageHistoryTitle}>Message History:</Text>
            <ScrollView style={styles.messageList} nestedScrollEnabled>
              {receivedMessages.length === 0 ? (
                <Text style={styles.noMessagesText}>No messages yet. Send a message to test the connection!</Text>
              ) : (
                receivedMessages.slice(-10).reverse().map((msg) => (
                  <View key={msg.id} style={styles.messageItem}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageFrom}>{msg.from}</Text>
                      <Text style={styles.messageType}>({msg.type})</Text>
                      <Text style={styles.messageTime}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.messageText}>{msg.message}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      <FlatList
        data={allDevices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.id || item.peerId}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={totalDeviceCount === 0 ? styles.emptyList : undefined}
      />

      {/* Debug Component */}
      <ServerlessDebug />

      {/* Screen Share Request Dialog */}
      <ScreenShareRequestDialog
        visible={showScreenShareRequest}
        fromDevice={currentScreenShareRequest?.fromDevice || ''}
        deviceType={currentScreenShareRequest?.deviceType || 'peerjs'}
        onAccept={handleAcceptScreenShareRequest}
        onReject={handleRejectScreenShareRequest}
      />

      {/* Screen Share Request Dialog */}
      <StatusDialog
        visible={showRequestDialog}
        type="info"
        title="Screen Share Request"
        message={
          currentRequest
            ? `${currentRequest.fromPeerId.slice(-6)} wants to share their screen with you. Do you want to accept?`
            : ''
        }
        onClose={handleRejectRequest}
        onConfirm={handleAcceptRequest}
        confirmText="Accept"
        cancelText="Reject"
      />

      {/* PeerJS Screen Share Viewer */}
      {screenShareState.isReceiving && screenShareState.receivedStream && (
        <ScreenShareViewer
          stream={screenShareState.receivedStream}
          fromDevice={screenShareState.receivingFromPeerId?.slice(-6) || 'Unknown'}
          type="peerjs"
          onClose={handleStopReceiving}
        />
      )}

      {/* Serverless Screen Share Viewers */}
      {Object.entries(serverlessScreenShare).map(([deviceId, state]) => {
        if (state.isReceiving && state.stream) {
          const device = serverlessDevices.find(d => d.id === deviceId);
          return (
            <ScreenShareViewer
              key={deviceId}
              stream={state.stream}
              fromDevice={device?.name || deviceId.slice(-6)}
              type="serverless"
              onClose={() => {
                setServerlessScreenShare(prev => ({
                  ...prev,
                  [deviceId]: { ...prev[deviceId], isReceiving: false, stream: undefined }
                }));
              }}
            />
          );
        }
        return null;
      })}
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  deviceItem: {
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
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  deviceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceStatusText: {
    fontSize: 14,
    color: '#666',
  },
  disconnectButton: {
    padding: 8,
    backgroundColor: '#f44336',
    borderRadius: 6,
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareStatusContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  shareStatusText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  deviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
    marginVertical: 2,
    minWidth: 80,
  },
  sendButton: {
    backgroundColor: '#007AFF',
  },
  receiveButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  requestStatusText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  toggleMessagingButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'center',
  },
  toggleMessagingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  screenShareButton: {
    backgroundColor: '#ff9500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'center',
  },
  screenShareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  messagingContainer: {
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
  messagingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  messageInputContainer: {
    marginBottom: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  messageButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  messageButton: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  messagingSection: {
    marginTop: 8,
  },
  messageHistory: {
    maxHeight: 200,
  },
  messageHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  messageList: {
    maxHeight: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  noMessagesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  messageItem: {
    backgroundColor: 'white',
    padding: 8,
    marginBottom: 4,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageFrom: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  messageType: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  shareButton: {
    backgroundColor: '#ff9500',
  },
  requestButton: {
    backgroundColor: '#5856d6',
  },
});

export default ConnectionsScreenView;