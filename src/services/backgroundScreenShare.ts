import { AppState, AppStateStatus } from 'react-native';
import { serverlessPeerService } from './serverlessPeerService';
import { peerService } from './peerService';

interface ActiveScreenShare {
  deviceId: string;
  deviceName: string;
  type: 'peerjs' | 'serverless';
  startTime: number;
  stream?: any;
}

class BackgroundScreenShareManager {
  private activeShares: Map<string, ActiveScreenShare> = new Map();
  private appStateSubscription: any = null;
  private isAppInBackground = false;

  initialize() {
    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    console.log('🔄 Background screen share manager initialized');
  }

  destroy() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.stopAllShares();
    console.log('🧹 Background screen share manager destroyed');
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log(`📱 App state changed: ${nextAppState}`);
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.isAppInBackground = true;
      this.handleAppGoingToBackground();
    } else if (nextAppState === 'active') {
      this.isAppInBackground = false;
      this.handleAppComingToForeground();
    }
  };

  private handleAppGoingToBackground() {
    const activeSharesCount = this.activeShares.size;
    
    if (activeSharesCount > 0) {
      console.log(`📱 App going to background with ${activeSharesCount} active screen shares`);
      
      // Show persistent notification
      this.showBackgroundNotification();
      
      // Log active shares for debugging
      this.activeShares.forEach((share, deviceId) => {
        console.log(`🔄 Background share active: ${share.deviceName} (${share.type})`);
      });
    }
  }

  private handleAppComingToForeground() {
    const activeSharesCount = this.activeShares.size;
    
    if (activeSharesCount > 0) {
      console.log(`📱 App returning to foreground with ${activeSharesCount} active screen shares`);
      
      // Hide background notification
      this.hideBackgroundNotification();
      
      // Verify shares are still active
      this.verifyActiveShares();
    }
  }

  addActiveShare(deviceId: string, deviceName: string, type: 'peerjs' | 'serverless', stream?: any) {
    const share: ActiveScreenShare = {
      deviceId,
      deviceName,
      type,
      startTime: Date.now(),
      stream,
    };
    
    this.activeShares.set(deviceId, share);
    console.log(`📤 Added active screen share: ${deviceName} (${type})`);
    
    // If app is in background, update notification
    if (this.isAppInBackground) {
      this.showBackgroundNotification();
    }
  }

  removeActiveShare(deviceId: string) {
    const share = this.activeShares.get(deviceId);
    if (share) {
      this.activeShares.delete(deviceId);
      console.log(`⏹️ Removed active screen share: ${share.deviceName}`);
      
      // Update or hide notification
      if (this.activeShares.size === 0) {
        this.hideBackgroundNotification();
      } else if (this.isAppInBackground) {
        this.showBackgroundNotification();
      }
    }
  }

  getActiveShares(): ActiveScreenShare[] {
    return Array.from(this.activeShares.values());
  }

  isScreenSharingActive(): boolean {
    return this.activeShares.size > 0;
  }

  stopAllShares() {
    console.log(`🛑 Stopping all ${this.activeShares.size} active screen shares`);
    
    this.activeShares.forEach((share, deviceId) => {
      try {
        if (share.type === 'serverless') {
          serverlessPeerService.stopScreenShare(deviceId);
        } else {
          peerService.stopScreenShare(deviceId);
        }
      } catch (error) {
        console.error(`Failed to stop share with ${share.deviceName}:`, error);
      }
    });
    
    this.activeShares.clear();
    this.hideBackgroundNotification();
  }

  private verifyActiveShares() {
    // Check if shares are still actually active
    this.activeShares.forEach((share, deviceId) => {
      const duration = Date.now() - share.startTime;
      console.log(`🔍 Verifying share with ${share.deviceName}: ${Math.round(duration / 1000)}s active`);
      
      // You could add logic here to ping the remote device
      // or check if the stream is still active
    });
  }

  private showBackgroundNotification() {
    const shareCount = this.activeShares.size;
    const deviceNames = Array.from(this.activeShares.values())
      .map(share => share.deviceName)
      .join(', ');
    
    console.log(`🔔 Would show notification: Sharing screen with ${shareCount} device(s): ${deviceNames}`);
    
    // In a real implementation, you would show a persistent notification here
    // For React Native, you'd use @react-native-async-storage/async-storage
    // and react-native-push-notification or similar
    
    // Example notification content:
    const notificationData = {
      title: '📺 Screen Sharing Active',
      message: `Sharing with ${shareCount} device${shareCount > 1 ? 's' : ''}: ${deviceNames}`,
      ongoing: true, // Makes it persistent
      actions: [
        { title: 'Stop All', action: 'stop_all' },
        { title: 'Open App', action: 'open_app' },
      ],
    };
    
    // Store notification data for when we implement actual notifications
    console.log('📋 Notification data:', notificationData);
  }

  private hideBackgroundNotification() {
    console.log('🔕 Would hide background notification');
    // In a real implementation, you would cancel the persistent notification here
  }

  // Get sharing status for UI
  getShareStatus() {
    const shares = this.getActiveShares();
    const totalDuration = shares.reduce((total, share) => {
      return total + (Date.now() - share.startTime);
    }, 0);
    
    return {
      isActive: shares.length > 0,
      shareCount: shares.length,
      devices: shares.map(share => ({
        name: share.deviceName,
        type: share.type,
        duration: Date.now() - share.startTime,
      })),
      totalDuration: Math.round(totalDuration / 1000), // in seconds
    };
  }
}

export const backgroundScreenShareManager = new BackgroundScreenShareManager();
export default BackgroundScreenShareManager;