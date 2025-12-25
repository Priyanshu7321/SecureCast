import { ConnectedDevice } from '../types';

interface ConnectionOffer {
  type: 'offer' | 'answer';
  deviceId: string;
  deviceName: string;
  sdp: string;
  iceCandidates: any[];
  timestamp: number;
}

class ServerlessPeerService {
  private localDeviceId: string;
  private localDeviceName: string;
  private peerConnections: Map<string, any> = new Map();
  private dataChannels: Map<string, any> = new Map();
  private onConnectionCallback?: (device: ConnectedDevice) => void;
  private onDisconnectionCallback?: (deviceId: string) => void;
  private onDataCallback?: (data: any, fromDeviceId: string) => void;
  private onErrorCallback?: (error: string) => void;
  private onStreamCallback?: (stream: any, fromDeviceId: string) => void;

  constructor() {
    this.localDeviceId = this.generateDeviceId();
    this.localDeviceName = `Device_${this.localDeviceId.slice(-6)}`;
  }

  private generateDeviceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `serverless_${timestamp}_${random}`;
  }

  getLocalDeviceInfo() {
    return {
      id: this.localDeviceId,
      name: this.localDeviceName,
      timestamp: Date.now(),
    };
  }

  async createConnectionOffer(): Promise<string> {
    try {
      console.log('🚀 Starting connection offer creation...');
      
      // Check if WebRTC is available from global setup
      const RTCPeerConnection = (globalThis as any).RTCPeerConnection;
      
      if (!RTCPeerConnection) {
        console.error('❌ RTCPeerConnection not available in global scope');
        throw new Error('WebRTC not properly configured. Please check WebRTC setup.');
      }

      console.log('✅ RTCPeerConnection found, creating peer connection...');
      
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      console.log('✅ PeerConnection created successfully');

      const iceCandidates: any[] = [];
      let iceGatheringComplete = false;

      // Set up ICE candidate collection
      peerConnection.onicecandidate = (event: any) => {
        console.log('🧊 ICE candidate event:', event.candidate ? 'New candidate' : 'Gathering complete');
        if (event.candidate) {
          iceCandidates.push({
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          });
          console.log(`📡 Collected ${iceCandidates.length} ICE candidates so far`);
        } else {
          iceGatheringComplete = true;
          console.log('🏁 ICE gathering completed');
        }
      };

      // Create data channel
      console.log('📡 Creating data channel...');
      const dataChannel = peerConnection.createDataChannel('messages', {
        ordered: true,
      });

      console.log('✅ Data channel created successfully');

      // Store connections
      this.peerConnections.set(this.localDeviceId, peerConnection);
      this.dataChannels.set(this.localDeviceId, dataChannel);

      // Create offer
      console.log('📝 Creating WebRTC offer...');
      const offer = await peerConnection.createOffer();
      console.log('✅ Offer created, SDP length:', offer.sdp?.length || 0);
      
      await peerConnection.setLocalDescription(offer);
      console.log('✅ Local description set, waiting for ICE gathering...');

      // Wait for ICE gathering with timeout
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ ICE gathering timeout, proceeding with ${iceCandidates.length} candidates`);
          resolve();
        }, 3000); // 3 second timeout

        const checkGathering = () => {
          if (iceGatheringComplete || peerConnection.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            console.log(`🎉 ICE gathering completed with ${iceCandidates.length} candidates`);
            resolve();
          } else {
            setTimeout(checkGathering, 100);
          }
        };
        checkGathering();
      });

      const connectionOffer: ConnectionOffer = {
        type: 'offer',
        deviceId: this.localDeviceId,
        deviceName: this.localDeviceName,
        sdp: offer.sdp || '',
        iceCandidates,
        timestamp: Date.now(),
      };

      console.log('🎉 WebRTC offer created successfully!');
      console.log(`📊 Offer stats: SDP length: ${offer.sdp?.length}, ICE candidates: ${iceCandidates.length}`);
      
      return JSON.stringify(connectionOffer, null, 2);
    } catch (error) {
      console.error('💥 Error creating WebRTC offer:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to create offer: ${error.message}`);
      } else {
        throw new Error(`Failed to create offer: ${String(error)}`);
      }
    }
  }

  async acceptConnectionOffer(offerString: string): Promise<string> {
    try {
      console.log('📥 Accepting connection offer...');
      const offer: ConnectionOffer = JSON.parse(offerString);
      
      if (offer.type !== 'offer') {
        throw new Error('Invalid offer format');
      }

      const RTCPeerConnection = (globalThis as any).RTCPeerConnection;
      const RTCSessionDescription = (globalThis as any).RTCSessionDescription;
      const RTCIceCandidate = (globalThis as any).RTCIceCandidate;

      if (!RTCPeerConnection || !RTCSessionDescription || !RTCIceCandidate) {
        throw new Error('WebRTC classes not available');
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      const iceCandidates: any[] = [];
      let iceGatheringComplete = false;

      peerConnection.onicecandidate = (event: any) => {
        if (event.candidate) {
          iceCandidates.push({
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          });
        } else {
          iceGatheringComplete = true;
        }
      };

      peerConnection.ondatachannel = (event: any) => {
        const dataChannel = event.channel;
        this.dataChannels.set(offer.deviceId, dataChannel);

        dataChannel.onopen = () => {
          console.log('✅ Data channel opened with:', offer.deviceName);
          
          // Store device name in peer connection for later reference
          peerConnection._deviceName = offer.deviceName;
          
          const device: ConnectedDevice = {
            id: offer.deviceId,
            peerId: offer.deviceId,
            name: offer.deviceName,
            isConnected: true,
            lastConnected: Date.now(),
            connectionStatus: 'connected',
          };
          this.onConnectionCallback?.(device);
        };

        dataChannel.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            this.onDataCallback?.(data, offer.deviceId);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        dataChannel.onclose = () => {
          console.log('❌ Data channel closed with:', offer.deviceName);
          this.onDisconnectionCallback?.(offer.deviceId);
        };
      };

      // Handle incoming streams
      peerConnection.ontrack = (event: any) => {
        console.log('📹 Received track from:', offer.deviceName);
        if (event.streams && event.streams[0]) {
          console.log('🎥 Received stream from:', offer.deviceName);
          this.onStreamCallback?.(event.streams[0], offer.deviceId);
        }
      };

      this.peerConnections.set(offer.deviceId, peerConnection);

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: offer.sdp })
      );

      for (const candidate of offer.iceCandidates) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 3000);

        const checkGathering = () => {
          if (iceGatheringComplete || peerConnection.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkGathering, 100);
          }
        };
        checkGathering();
      });

      const connectionAnswer: ConnectionOffer = {
        type: 'answer',
        deviceId: this.localDeviceId,
        deviceName: this.localDeviceName,
        sdp: answer.sdp || '',
        iceCandidates,
        timestamp: Date.now(),
      };

      console.log('✅ WebRTC answer created successfully');
      return JSON.stringify(connectionAnswer, null, 2);
    } catch (error) {
      console.error('💥 Error accepting offer:', error);
      throw new Error(`Failed to accept offer: ${error}`);
    }
  }

  async completeConnection(answerString: string): Promise<void> {
    try {
      console.log('🔗 Completing connection...');
      const answer: ConnectionOffer = JSON.parse(answerString);
      
      if (answer.type !== 'answer') {
        throw new Error('Invalid answer format');
      }

      const RTCSessionDescription = (globalThis as any).RTCSessionDescription;
      const RTCIceCandidate = (globalThis as any).RTCIceCandidate;

      const peerConnection = this.peerConnections.get(this.localDeviceId);
      if (!peerConnection) {
        throw new Error('No pending connection found');
      }

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: answer.sdp })
      );

      for (const candidate of answer.iceCandidates) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }

      const dataChannel = this.dataChannels.get(this.localDeviceId);
      if (dataChannel) {
        dataChannel.onopen = () => {
          console.log('✅ Data channel opened with:', answer.deviceName);
          
          // Store device name in peer connection for later reference
          const peerConnection = this.peerConnections.get(answer.deviceId);
          if (peerConnection) {
            peerConnection._deviceName = answer.deviceName;
            
            // Handle incoming streams for this connection
            peerConnection.ontrack = (event: any) => {
              console.log('📹 Received track from:', answer.deviceName);
              if (event.streams && event.streams[0]) {
                console.log('🎥 Received stream from:', answer.deviceName);
                this.onStreamCallback?.(event.streams[0], answer.deviceId);
              }
            };
          }
          
          const device: ConnectedDevice = {
            id: answer.deviceId,
            peerId: answer.deviceId,
            name: answer.deviceName,
            isConnected: true,
            lastConnected: Date.now(),
            connectionStatus: 'connected',
          };
          this.onConnectionCallback?.(device);
        };

        dataChannel.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            this.onDataCallback?.(data, answer.deviceId);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        dataChannel.onclose = () => {
          console.log('❌ Data channel closed with:', answer.deviceName);
          this.onDisconnectionCallback?.(answer.deviceId);
        };
      }

      this.peerConnections.set(answer.deviceId, peerConnection);
      this.peerConnections.delete(this.localDeviceId);

      console.log('🎉 WebRTC connection completed successfully');
    } catch (error) {
      console.error('💥 Error completing connection:', error);
      throw new Error(`Failed to complete connection: ${error}`);
    }
  }

  sendData(deviceId: string, data: any): boolean {
    const dataChannel = this.dataChannels.get(deviceId);
    if (!dataChannel || dataChannel.readyState !== 'open') {
      return false;
    }

    try {
      dataChannel.send(JSON.stringify(data));
      console.log('📤 Sent data to', deviceId, ':', data);
      return true;
    } catch (error) {
      console.error('💥 Failed to send data:', error);
      return false;
    }
  }

  getConnectedDevices(): ConnectedDevice[] {
    const devices: ConnectedDevice[] = [];
    
    this.dataChannels.forEach((dataChannel, deviceId) => {
      if (dataChannel.readyState === 'open') {
        // Try to get the actual device name from stored connections
        const peerConnection = this.peerConnections.get(deviceId);
        let deviceName = `Device_${deviceId.slice(-6)}`;
        
        // If we have connection metadata, use the actual device name
        if (peerConnection && peerConnection._deviceName) {
          deviceName = peerConnection._deviceName;
        }
        
        devices.push({
          id: deviceId,
          peerId: deviceId,
          name: deviceName,
          isConnected: true,
          lastConnected: Date.now(),
          connectionStatus: 'connected',
        });
      }
    });

    console.log(`📊 Serverless devices status: ${devices.length} connected`);
    return devices;
  }

  disconnectFromDevice(deviceId: string) {
    const peerConnection = this.peerConnections.get(deviceId);
    const dataChannel = this.dataChannels.get(deviceId);

    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(deviceId);
    }

    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(deviceId);
    }

    this.onDisconnectionCallback?.(deviceId);
    console.log('🔌 Disconnected from device:', deviceId);
  }

  destroy() {
    this.peerConnections.forEach((connection) => {
      connection.close();
    });
    this.dataChannels.forEach((channel) => {
      channel.close();
    });
    this.peerConnections.clear();
    this.dataChannels.clear();
    console.log('🧹 All WebRTC connections destroyed');
  }

  onConnection(callback: (device: ConnectedDevice) => void) {
    this.onConnectionCallback = callback;
  }

  onDisconnection(callback: (deviceId: string) => void) {
    this.onDisconnectionCallback = callback;
  }

  onData(callback: (data: any, fromDeviceId: string) => void) {
    this.onDataCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  onStream(callback: (stream: any, fromDeviceId: string) => void) {
    this.onStreamCallback = callback;
  }

  // Screen sharing functionality
  async startScreenShare(deviceId: string): Promise<any> {
    try {
      console.log('🎥 [ServerlessPeer] Starting video sharing with device:', deviceId);
      
      // Import screen capture manager
      console.log('🔍 [ServerlessPeer] Loading screen capture manager...');
      let screenCaptureManager;
      try {
        const module = require('../modules/ScreenCapture');
        screenCaptureManager = module.screenCaptureManager;
        console.log('✅ [ServerlessPeer] Screen capture manager loaded:', !!screenCaptureManager);
      } catch (moduleError) {
        console.error('❌ [ServerlessPeer] Failed to load screen capture module:', moduleError);
        throw new Error(`Screen capture module not available: ${moduleError}`);
      }
      
      let stream;
      
      try {
        console.log('📱 [ServerlessPeer] Attempting native screen capture...');
        
        // Check if native screen capture is supported
        const isSupported = await screenCaptureManager.isSupported();
        console.log('🔍 [ServerlessPeer] Native screen capture supported:', isSupported);
        
        if (!isSupported) {
          throw new Error('Native screen capture not supported on this device');
        }

        // Start native screen capture
        stream = await screenCaptureManager.startCapture();
        console.log('✅ [ServerlessPeer] Native screen capture stream obtained:', stream?.id);
        
      } catch (nativeError) {
        console.error('📱 [ServerlessPeer] Native screen capture failed:', nativeError);
        
        // Fallback to camera for actual video sharing
        try {
          console.log('📱 [ServerlessPeer] Falling back to camera for video sharing...');
          
          console.log('🔍 [ServerlessPeer] Loading react-native-webrtc...');
          let mediaDevices;
          try {
            const webrtc = require('react-native-webrtc');
            mediaDevices = webrtc.mediaDevices;
            console.log('✅ [ServerlessPeer] react-native-webrtc loaded');
            console.log('🔍 [ServerlessPeer] mediaDevices available:', !!mediaDevices);
          } catch (webrtcError) {
            console.error('❌ [ServerlessPeer] Failed to load react-native-webrtc:', webrtcError);
            throw new Error(`React Native WebRTC not available: ${webrtcError}`);
          }
          
          if (!mediaDevices) {
            throw new Error('React Native WebRTC mediaDevices not available. Please ensure react-native-webrtc is properly installed.');
          }

          console.log('🔍 [ServerlessPeer] Available mediaDevices methods:', Object.keys(mediaDevices));

          // Use camera for actual video sharing
          console.log('📷 [ServerlessPeer] Starting camera video stream...');
          stream = await mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 15, max: 30 },
              facingMode: 'user', // Use front camera
            },
            audio: true, // Include microphone audio
          });
          
          console.log('✅ [ServerlessPeer] Camera video stream obtained:', stream?.id);
          
        } catch (fallbackError) {
          console.error('❌ [ServerlessPeer] Camera video sharing failed:', fallbackError);
          
          // Create a simple mock stream for connection testing
          console.log('🧪 [ServerlessPeer] Creating mock stream for connection testing...');
          const mockStream = {
            id: `mock_serverless_${Date.now()}`,
            active: true,
            getTracks: () => [
              {
                id: `mock_video_${Date.now()}`,
                kind: 'video',
                enabled: true,
                readyState: 'live',
                stop: () => console.log('Mock video track stopped'),
              }
            ],
            addTrack: () => {},
            removeTrack: () => {},
            clone: () => mockStream,
            _isMockStream: true,
          };
          
          console.log('✅ [ServerlessPeer] Mock stream created for connection testing');
          stream = mockStream;
        }
      }

      console.log('🔍 [ServerlessPeer] Looking for peer connection...');
      const peerConnection = this.peerConnections.get(deviceId);
      if (!peerConnection) {
        console.error('❌ [ServerlessPeer] No peer connection found for device:', deviceId);
        throw new Error('No peer connection found for device');
      }
      console.log('✅ [ServerlessPeer] Peer connection found');

      // Remove any existing tracks first
      console.log('🔄 [ServerlessPeer] Removing existing tracks...');
      const senders = peerConnection.getSenders();
      if (senders && senders.length > 0) {
        console.log('🔄 [ServerlessPeer] Found', senders.length, 'existing senders');
        senders.forEach((sender: any) => {
          if (sender.track) {
            peerConnection.removeTrack(sender);
          }
        });
      }

      // Add new stream tracks to peer connection
      console.log('➕ [ServerlessPeer] Adding new video stream tracks...');
      const tracks = stream.getTracks();
      console.log('🔍 [ServerlessPeer] Stream has', tracks.length, 'tracks');
      
      tracks.forEach((track: any) => {
        peerConnection.addTrack(track, stream);
        console.log('📹 [ServerlessPeer] Added track to peer connection:', track.kind, track.id);
      });

      // Send screen share notification via data channel
      console.log('📤 [ServerlessPeer] Sending video share notification...');
      const notificationSent = this.sendData(deviceId, {
        type: 'screen_share_started',
        streamId: stream.id,
        trackCount: tracks.length,
        isNativeCapture: stream._isNativeCapture || false,
        isVideoShare: true,
        timestamp: Date.now(),
      });
      console.log('📤 [ServerlessPeer] Notification sent:', notificationSent);

      console.log('🎉 [ServerlessPeer] Video sharing started successfully');
      return stream;
    } catch (error) {
      console.error('💥 [ServerlessPeer] Error starting video sharing:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          throw new Error('Camera/microphone permission denied. Please grant camera and microphone permissions in device settings.');
        } else if (error.message.includes('NotFoundError') || error.message.includes('DevicesNotFoundError')) {
          throw new Error('No camera or microphone found on this device.');
        } else if (error.message.includes('NotSupportedError')) {
          throw new Error('Video capture is not supported on this device.');
        } else if (error.message.includes('react-native-webrtc')) {
          throw new Error('WebRTC not properly configured. Please check react-native-webrtc installation.');
        } else {
          throw new Error(`Video sharing failed: ${error.message}`);
        }
      } else {
        throw new Error(`Video sharing failed: ${String(error)}`);
      }
    }
  }

  stopScreenShare(deviceId: string) {
    try {
      console.log('⏹️ Stopping screen share with device:', deviceId);
      
      const peerConnection = this.peerConnections.get(deviceId);
      if (peerConnection) {
        // Remove all senders (tracks)
        const senders = peerConnection.getSenders();
        senders.forEach((sender: any) => {
          if (sender.track) {
            sender.track.stop();
          }
          peerConnection.removeTrack(sender);
        });
      }

      // Stop native screen capture if active
      try {
        const { screenCaptureManager } = require('../modules/ScreenCapture');
        if (screenCaptureManager.isCurrentlyCapturing()) {
          screenCaptureManager.stopCapture();
        }
      } catch (error) {
        console.log('Native screen capture stop failed (might be using fallback):', error);
      }

      // Send screen share stopped notification
      this.sendData(deviceId, {
        type: 'screen_share_stopped',
        timestamp: Date.now(),
      });

      console.log('✅ Screen sharing stopped');
    } catch (error) {
      console.error('💥 Error stopping screen share:', error);
    }
  }

  // Debug method to check current state
  getDebugInfo() {
    return {
      localDeviceId: this.localDeviceId,
      localDeviceName: this.localDeviceName,
      peerConnectionsCount: this.peerConnections.size,
      dataChannelsCount: this.dataChannels.size,
      connectedDevices: this.getConnectedDevices(),
    };
  }
}

export const serverlessPeerService = new ServerlessPeerService();