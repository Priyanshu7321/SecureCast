import Peer from 'peerjs';
import { ConnectedDevice, ScreenShareRequest, PeerConnection } from '../types';
import { MediaStream } from 'react-native-webrtc';
import { DEFAULT_PEER_CONFIG, ICE_SERVERS, PeerServerConfig } from '../config/peerConfig';

class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, PeerConnection> = new Map();
  private onConnectionCallback?: (device: ConnectedDevice) => void;
  private onDisconnectionCallback?: (peerId: string) => void;
  private onDataCallback?: (data: any, fromPeerId: string) => void;
  private onStreamCallback?: (stream: any, fromPeerId: string) => void;
  private onErrorCallback?: (error: string) => void;
  private currentServerConfig: PeerServerConfig = DEFAULT_PEER_CONFIG;

  // Initialize PeerJS with a unique ID
  async initialize(serverConfig?: PeerServerConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Use provided config or default
        const config = serverConfig || this.currentServerConfig;
        this.currentServerConfig = config;
        
        // Generate a unique peer ID
        const peerId = this.generatePeerId();
        
        console.log(`Initializing PeerJS with server: ${config.host}:${config.port}`);
        
        // Set a timeout for initialization
        const initTimeout = setTimeout(() => {
          console.error('PeerJS initialization timeout');
          reject(new Error(`Connection timeout - unable to reach ${config.host}`));
        }, 15000); // 15 second timeout

        this.peer = new Peer(peerId, {
          host: config.host,
          port: config.port,
          path: config.path,
          secure: config.secure,
          config: {
            iceServers: ICE_SERVERS,
          },
          debug: 2, // Enable debug logging
        });

        this.peer.on('open', (id) => {
          clearTimeout(initTimeout);
          console.log('PeerJS initialized with ID:', id);
          this.setupEventListeners();
          resolve(id);
        });

        this.peer.on('error', (error) => {
          clearTimeout(initTimeout);
          console.error('PeerJS initialization error:', error);
          
          // Handle specific WebRTC support errors
          if (error.type === 'browser-incompatible') {
            this.onErrorCallback?.('WebRTC not properly configured for React Native');
          } else if (error.type === 'network') {
            this.onErrorCallback?.('Network error - check your internet connection');
          } else if (error.type === 'server-error') {
            this.onErrorCallback?.('PeerJS server error - try again later');
          } else {
            this.onErrorCallback?.(`Failed to initialize: ${error.message}`);
          }
          reject(error);
        });

      } catch (error) {
        console.error('PeerJS setup error:', error);
        reject(error);
      }
    });
  }

  private generatePeerId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `securecast_${timestamp}_${random}`;
  }

  private setupEventListeners() {
    if (!this.peer) return;

    // Handle incoming connections
    this.peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      this.handleIncomingConnection(conn);
    });

    // Handle incoming calls (media streams)
    this.peer.on('call', (call) => {
      console.log('Incoming call from:', call.peer);
      this.handleIncomingCall(call);
    });

    this.peer.on('disconnected', () => {
      console.log('PeerJS disconnected');
      this.onErrorCallback?.('Connection to server lost');
    });

    this.peer.on('close', () => {
      console.log('PeerJS connection closed');
    });
  }

  private handleIncomingConnection(conn: any) {
    conn.on('open', () => {
      console.log('Data connection opened with:', conn.peer);
      
      const peerConnection: PeerConnection = {
        peerId: conn.peer,
        connection: conn,
        isDataChannelOpen: true,
      };
      
      this.connections.set(conn.peer, peerConnection);

      const device: ConnectedDevice = {
        id: conn.peer,
        peerId: conn.peer,
        name: `Device ${conn.peer.slice(-6)}`,
        isConnected: true,
        lastConnected: Date.now(),
        connectionStatus: 'connected',
      };

      this.onConnectionCallback?.(device);

      // Handle incoming data
      conn.on('data', (data: any) => {
        console.log('Received data from', conn.peer, ':', data);
        this.onDataCallback?.(data, conn.peer);
      });

      conn.on('close', () => {
        console.log('Data connection closed with:', conn.peer);
        this.connections.delete(conn.peer);
        this.onDisconnectionCallback?.(conn.peer);
      });

      conn.on('error', (error: any) => {
        console.error('Data connection error with', conn.peer, ':', error);
        this.onErrorCallback?.(`Connection error with ${conn.peer}: ${error.message}`);
      });
    });
  }

  private handleIncomingCall(call: any) {
    // For screen sharing, we don't need to provide a local stream initially
    call.answer();

    call.on('stream', (remoteStream: any) => {
      console.log('Received stream from:', call.peer);
      this.onStreamCallback?.(remoteStream, call.peer);
      
      // Update connection with media connection
      const peerConnection = this.connections.get(call.peer);
      if (peerConnection) {
        peerConnection.mediaConnection = call;
        this.connections.set(call.peer, peerConnection);
      }
    });

    call.on('close', () => {
      console.log('Media connection closed with:', call.peer);
    });

    call.on('error', (error: any) => {
      console.error('Media connection error with', call.peer, ':', error);
      this.onErrorCallback?.(`Media error with ${call.peer}: ${error.message}`);
    });
  }

  // Connect to another peer
  async connectToPeer(peerId: string): Promise<ConnectedDevice> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('PeerJS not initialized'));
        return;
      }

      if (this.connections.has(peerId)) {
        reject(new Error('Already connected to this peer'));
        return;
      }

      console.log('Connecting to peer:', peerId);
      const conn = this.peer.connect(peerId);

      conn.on('open', () => {
        console.log('Connected to peer:', peerId);
        
        const peerConnection: PeerConnection = {
          peerId,
          connection: conn,
          isDataChannelOpen: true,
        };
        
        this.connections.set(peerId, peerConnection);

        const device: ConnectedDevice = {
          id: peerId,
          peerId,
          name: `Device ${peerId.slice(-6)}`,
          isConnected: true,
          lastConnected: Date.now(),
          connectionStatus: 'connected',
        };

        // Handle incoming data
        conn.on('data', (data: any) => {
          console.log('Received data from', peerId, ':', data);
          this.onDataCallback?.(data, peerId);
        });

        conn.on('close', () => {
          console.log('Connection closed with:', peerId);
          this.connections.delete(peerId);
          this.onDisconnectionCallback?.(peerId);
        });

        conn.on('error', (error: any) => {
          console.error('Connection error with', peerId, ':', error);
          this.onErrorCallback?.(`Connection error: ${error.message}`);
        });

        resolve(device);
      });

      conn.on('error', (error: any) => {
        console.error('Failed to connect to peer', peerId, ':', error);
        reject(new Error(`Failed to connect: ${error.message}`));
      });
    });
  }

  // Send data to a specific peer
  sendData(peerId: string, data: any): boolean {
    const peerConnection = this.connections.get(peerId);
    if (peerConnection && peerConnection.isDataChannelOpen) {
      try {
        peerConnection.connection.send(data);
        console.log('Sent data to', peerId, ':', data);
        return true;
      } catch (error) {
        console.error('Failed to send data to', peerId, ':', error);
        return false;
      }
    }
    return false;
  }

  // Send screen share request
  sendScreenShareRequest(peerId: string): boolean {
    const request: ScreenShareRequest = {
      id: `req_${Date.now()}`,
      fromPeerId: this.peer?.id || '',
      toPeerId: peerId,
      timestamp: Date.now(),
      status: 'pending',
      type: 'screen_share_request',
    };

    return this.sendData(peerId, request);
  }

  // Start screen sharing
  async startScreenShare(peerId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('PeerJS not initialized'));
        return;
      }

      // For React Native, we'll simulate screen capture
      // In a real implementation, you'd use react-native-webrtc
      this.getScreenStream()
        .then((stream) => {
          const call = this.peer!.call(peerId, stream);
          
          call.on('stream', (remoteStream) => {
            // Handle any response stream if needed
            console.log('Screen share call established with:', peerId);
          });

          call.on('error', (error) => {
            console.error('Screen share call error:', error);
            reject(error);
          });

          // Update connection with media connection
          const peerConnection = this.connections.get(peerId);
          if (peerConnection) {
            peerConnection.mediaConnection = call;
            this.connections.set(peerId, peerConnection);
          }

          resolve(stream);
        })
        .catch(reject);
    });
  }

  // Get screen stream (Native screen capture with camera fallback for video sharing)
  private async getScreenStream(): Promise<any> {
    try {
      console.log('📱 [ScreenCapture] Getting video stream for sharing...');
      
      // Import screen capture manager
      const { screenCaptureManager } = require('../modules/ScreenCapture');
      
      let stream;
      
      try {
        // Check if native screen capture is supported
        const isSupported = await screenCaptureManager.isSupported();
        if (!isSupported) {
          throw new Error('Native screen capture not supported on this device');
        }

        // Start native screen capture
        stream = await screenCaptureManager.startCapture();
        console.log('✅ [ScreenCapture] Native screen capture stream obtained:', stream.id);
        return stream;
        
      } catch (nativeError) {
        console.error('📱 [ScreenCapture] Native screen capture failed, using camera for video sharing:', nativeError);
        
        // Fallback to camera for actual video sharing
        const { mediaDevices } = require('react-native-webrtc');
        
        if (!mediaDevices) {
          throw new Error('React Native WebRTC not available - cannot share video');
        }

        // Use camera for actual video streaming
        stream = await mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 15, max: 30 },
            facingMode: 'user', // Front camera
          },
          audio: true, // Include microphone audio
        });
        
        console.log('✅ [ScreenCapture] Camera video stream obtained for sharing:', stream.id);
        return stream;
      }
      
    } catch (error) {
      console.error('💥 [ScreenCapture] Error getting video stream:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          throw new Error('Camera/microphone permission denied. Please grant permissions in device settings.');
        } else if (error.message.includes('NotFoundError')) {
          throw new Error('No camera or microphone found on this device.');
        } else if (error.message.includes('NotSupportedError')) {
          throw new Error('Video capture is not supported on this device.');
        } else {
          throw new Error(`Video sharing failed: ${error.message}`);
        }
      } else {
        throw new Error(`Video sharing failed: ${String(error)}`);
      }
    }
  }

  // Stop screen sharing
  stopScreenShare(peerId: string) {
    const peerConnection = this.connections.get(peerId);
    if (peerConnection?.mediaConnection) {
      peerConnection.mediaConnection.close();
      peerConnection.mediaConnection = undefined;
      this.connections.set(peerId, peerConnection);
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
  }

  // Get current peer ID
  getPeerId(): string | null {
    return this.peer?.id || null;
  }

  // Get current server configuration
  getCurrentServerConfig(): PeerServerConfig {
    return this.currentServerConfig;
  }

  // Change server configuration (requires reinitialization)
  setServerConfig(config: PeerServerConfig) {
    this.currentServerConfig = config;
  }

  // Get connected devices
  getConnectedDevices(): ConnectedDevice[] {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.peerId,
      peerId: conn.peerId,
      name: `Device ${conn.peerId.slice(-6)}`,
      isConnected: conn.isDataChannelOpen,
      lastConnected: Date.now(),
      connectionStatus: conn.isDataChannelOpen ? 'connected' : 'disconnected',
    }));
  }

  // Disconnect from a peer
  disconnectFromPeer(peerId: string) {
    const peerConnection = this.connections.get(peerId);
    if (peerConnection) {
      peerConnection.connection.close();
      if (peerConnection.mediaConnection) {
        peerConnection.mediaConnection.close();
      }
      this.connections.delete(peerId);
    }
  }

  // Cleanup
  destroy() {
    this.connections.forEach((conn) => {
      conn.connection.close();
      if (conn.mediaConnection) {
        conn.mediaConnection.close();
      }
    });
    this.connections.clear();
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  // Event listeners
  onConnection(callback: (device: ConnectedDevice) => void) {
    this.onConnectionCallback = callback;
  }

  onDisconnection(callback: (peerId: string) => void) {
    this.onDisconnectionCallback = callback;
  }

  onData(callback: (data: any, fromPeerId: string) => void) {
    this.onDataCallback = callback;
  }

  onStream(callback: (stream: any, fromPeerId: string) => void) {
    this.onStreamCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }
}

export const peerService = new PeerService();