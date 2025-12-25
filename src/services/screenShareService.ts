import { screenShareModule, ScreenShareModule, ScreenShareEvents } from '../modules/ScreenCapture';
import { EmitterSubscription } from 'react-native';

/**
 * Screen sharing service that integrates Android MediaProjection with PeerJS
 * Provides complete screen sharing functionality with WebRTC and P2P connections
 */
export class ScreenShareService {
  private screenShare: ScreenShareModule;
  private eventSubscriptions: EmitterSubscription[] = [];
  private isSharing = false;
  private currentStreamId: string | null = null;
  private connectedPeers: Set<string> = new Set();
  
  // Callbacks for service events
  private onScreenShareStarted?: (streamId: string) => void;
  private onScreenShareStopped?: () => void;
  private onScreenShareError?: (error: string) => void;
  
  constructor() {
    this.screenShare = screenShareModule;
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for screen sharing events
   */
  private setupEventListeners(): void {
    // Screen share started event
    const startedSubscription = this.screenShare.addEventListener(
      'screenShareStarted',
      (event) => {
        console.log('📺 [ScreenShareService] Screen share started:', event);
        this.isSharing = true;
        this.currentStreamId = event.streamId;
        this.onScreenShareStarted?.(event.streamId);
      }
    );
    
    // Screen share stopped event
    const stoppedSubscription = this.screenShare.addEventListener(
      'screenShareStopped',
      () => {
        console.log('⏹️ [ScreenShareService] Screen share stopped');
        this.isSharing = false;
        this.currentStreamId = null;
        this.connectedPeers.clear();
        this.onScreenShareStopped?.();
      }
    );
    
    // Screen share error event
    const errorSubscription = this.screenShare.addEventListener(
      'screenCaptureError',
      (event) => {
        console.error('💥 [ScreenShareService] Screen share error:', event.error);
        this.onScreenShareError?.(event.error);
      }
    );
    
    this.eventSubscriptions.push(startedSubscription, stoppedSubscription, errorSubscription);
  }
  
  /**
   * Check if screen sharing is supported on this device
   */
  async isSupported(): Promise<boolean> {
    try {
      return await this.screenShare.isSupported();
    } catch (error) {
      console.error('Error checking screen share support:', error);
      return false;
    }
  }
  
  /**
   * Request screen capture permission from user
   * Shows Android system dialog
   */
  async requestPermission(): Promise<boolean> {
    try {
      console.log('🔐 [ScreenShareService] Requesting screen capture permission...');
      
      if (!await this.isSupported()) {
        console.error('❌ [ScreenShareService] Screen sharing not supported');
        return false;
      }
      
      const granted = await this.screenShare.requestPermission();
      console.log('🔐 [ScreenShareService] Permission granted:', granted);
      
      return granted;
    } catch (error) {
      console.error('Error requesting screen capture permission:', error);
      return false;
    }
  }
  
  /**
   * Start screen sharing
   * - Requests MediaProjection permission if needed
   * - Starts foreground service
   * - Creates WebRTC video track
   * - Returns stream information for PeerJS connection
   */
  async startScreenShare(): Promise<{
    streamId: string;
    success: boolean;
  } | null> {
    try {
      console.log('🎥 [ScreenShareService] Starting screen share...');
      
      if (this.isSharing) {
        console.warn('⚠️ [ScreenShareService] Screen sharing already active');
        return {
          streamId: this.currentStreamId!,
          success: true,
        };
      }
      
      // Check support
      if (!await this.isSupported()) {
        console.error('❌ [ScreenShareService] Screen sharing not supported');
        return null;
      }
      
      // Request permission if needed
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.error('❌ [ScreenShareService] Permission denied');
        return null;
      }
      
      // Start screen sharing
      const result = await this.screenShare.startScreenShare();
      if (result?.success) {
        console.log('✅ [ScreenShareService] Screen share started successfully');
        return result;
      } else {
        console.error('❌ [ScreenShareService] Failed to start screen share');
        return null;
      }
      
    } catch (error) {
      console.error('💥 [ScreenShareService] Error starting screen share:', error);
      return null;
    }
  }
  
  /**
   * Stop screen sharing
   * - Stops MediaProjection
   * - Stops foreground service
   * - Cleans up WebRTC resources
   * - Notifies connected peers
   */
  async stopScreenShare(): Promise<boolean> {
    try {
      console.log('⏹️ [ScreenShareService] Stopping screen share...');
      
      if (!this.isSharing) {
        console.log('ℹ️ [ScreenShareService] Screen sharing not active');
        return true;
      }
      
      const success = await this.screenShare.stopScreenShare();
      
      if (success) {
        console.log('✅ [ScreenShareService] Screen share stopped successfully');
      } else {
        console.error('❌ [ScreenShareService] Failed to stop screen share');
      }
      
      return success;
      
    } catch (error) {
      console.error('💥 [ScreenShareService] Error stopping screen share:', error);
      return false;
    }
  }
  
  /**
   * Get current screen sharing status
   */
  async getStatus(): Promise<{
    isSharing: boolean;
    streamId: string | null;
    connectedPeers: string[];
    serviceStatus?: {
      isCapturing: boolean;
      serviceConnected: boolean;
    };
  }> {
    try {
      const serviceStatus = await this.screenShare.getStatus();
      
      return {
        isSharing: this.isSharing,
        streamId: this.currentStreamId,
        connectedPeers: Array.from(this.connectedPeers),
        serviceStatus: serviceStatus || undefined,
      };
    } catch (error) {
      console.error('Error getting screen share status:', error);
      return {
        isSharing: this.isSharing,
        streamId: this.currentStreamId,
        connectedPeers: Array.from(this.connectedPeers),
      };
    }
  }
  
  /**
   * Get WebRTC video track for PeerJS connection
   */
  async getVideoTrack(): Promise<{
    trackId: string;
    streamId: string;
    enabled: boolean;
  } | null> {
    try {
      if (!this.isSharing) {
        console.warn('⚠️ [ScreenShareService] No active screen share');
        return null;
      }
      
      return await this.screenShare.getVideoTrack();
    } catch (error) {
      console.error('Error getting video track:', error);
      return null;
    }
  }
  
  /**
   * Add a peer to the connected peers list
   */
  addConnectedPeer(peerId: string): void {
    this.connectedPeers.add(peerId);
    console.log(`👥 [ScreenShareService] Added peer: ${peerId}, total: ${this.connectedPeers.size}`);
  }
  
  /**
   * Remove a peer from the connected peers list
   */
  removeConnectedPeer(peerId: string): void {
    this.connectedPeers.delete(peerId);
    console.log(`👥 [ScreenShareService] Removed peer: ${peerId}, total: ${this.connectedPeers.size}`);
    
    // If no peers connected, optionally stop screen sharing
    if (this.connectedPeers.size === 0 && this.isSharing) {
      console.log('ℹ️ [ScreenShareService] No peers connected, consider stopping screen share');
    }
  }
  
  /**
   * Get list of connected peers
   */
  getConnectedPeers(): string[] {
    return Array.from(this.connectedPeers);
  }
  
  /**
   * Set callback for screen share started event
   */
  setOnScreenShareStarted(callback: (streamId: string) => void): void {
    this.onScreenShareStarted = callback;
  }
  
  /**
   * Set callback for screen share stopped event
   */
  setOnScreenShareStopped(callback: () => void): void {
    this.onScreenShareStopped = callback;
  }
  
  /**
   * Set callback for screen share error event
   */
  setOnScreenShareError(callback: (error: string) => void): void {
    this.onScreenShareError = callback;
  }
  
  /**
   * Clean up resources and event listeners
   */
  cleanup(): void {
    console.log('🧹 [ScreenShareService] Cleaning up...');
    
    // Remove event listeners
    this.eventSubscriptions.forEach(subscription => subscription.remove());
    this.eventSubscriptions = [];
    
    // Clear callbacks
    this.onScreenShareStarted = undefined;
    this.onScreenShareStopped = undefined;
    this.onScreenShareError = undefined;
    
    // Clear state
    this.connectedPeers.clear();
    this.isSharing = false;
    this.currentStreamId = null;
  }
  
  /**
   * Get current sharing state (synchronous)
   */
  get isSharingScreen(): boolean {
    return this.isSharing;
  }
  
  /**
   * Get current stream ID (synchronous)
   */
  get streamId(): string | null {
    return this.currentStreamId;
  }
}

// Export singleton instance
export const screenShareService = new ScreenShareService();

// Export class for custom instances
export default ScreenShareService;