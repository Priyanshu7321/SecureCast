import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { screenCaptureManager } from '../modules/ScreenCapture';

export interface PermissionResult {
  granted: boolean;
  message?: string;
}

export class PermissionsManager {
  static async requestScreenSharePermissions(): Promise<PermissionResult> {
    try {
      console.log('🔐 [Permissions] Requesting video sharing permissions...');
      console.log('🔍 [Permissions] Platform:', Platform.OS);
      
      if (Platform.OS === 'android') {
        // For video sharing, we need camera and audio permissions
        const permissions = [
          PermissionsAndroid.PERMISSIONS.CAMERA,        // For video capture
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,  // For audio during video share
        ];

        console.log('🔍 [Permissions] Checking existing permissions...');
        // Check if permissions are already granted
        const checkResults = await Promise.all(
          permissions.map(permission => PermissionsAndroid.check(permission))
        );
        console.log('🔍 [Permissions] Permission check results:', checkResults);

        const allGranted = checkResults.every(result => result === true);
        console.log('🔍 [Permissions] All permissions granted:', allGranted);
        
        if (allGranted) {
          console.log('✅ [Permissions] All video sharing permissions already granted');
          return { granted: true };
        }

        console.log('🔐 [Permissions] Requesting missing permissions...');
        // Request permissions
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        console.log('🔐 [Permissions] Permission request results:', granted);
        
        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        console.log('🔍 [Permissions] Camera permission granted:', cameraGranted);
        console.log('🔍 [Permissions] Audio permission granted:', audioGranted);

        if (cameraGranted && audioGranted) {
          console.log('✅ [Permissions] All video sharing permissions granted');
          return { granted: true };
        } else {
          const missingPermissions = [];
          if (!cameraGranted) missingPermissions.push('Camera');
          if (!audioGranted) missingPermissions.push('Microphone');
          
          console.log('❌ [Permissions] Missing permissions:', missingPermissions);
          return {
            granted: false,
            message: `${missingPermissions.join(' and ')} permission${missingPermissions.length > 1 ? 's' : ''} required for video sharing.`
          };
        }
      } else {
        console.log('🍎 [Permissions] iOS platform, permissions handled automatically');
        // iOS handles permissions automatically via system prompts
        return { granted: true };
      }
    } catch (error) {
      console.error('❌ [Permissions] Permission request error:', error);
      return {
        granted: false,
        message: 'Failed to request permissions. Please check app settings.'
      };
    }
  }

  static async checkScreenSharePermissions(): Promise<PermissionResult> {
    try {
      if (Platform.OS === 'android') {
        const cameraGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        const audioGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

        if (cameraGranted && audioGranted) {
          return { granted: true };
        } else {
          const missingPermissions = [];
          if (!cameraGranted) missingPermissions.push('Camera');
          if (!audioGranted) missingPermissions.push('Microphone');
          
          return {
            granted: false,
            message: `${missingPermissions.join(' and ')} permission${missingPermissions.length > 1 ? 's' : ''} not granted for video sharing.`
          };
        }
      } else {
        return { granted: true };
      }
    } catch (error) {
      console.error('Permission check error:', error);
      return {
        granted: false,
        message: 'Failed to check permissions.'
      };
    }
  }

  static showPermissionAlert(message: string, onRetry?: () => void) {
    Alert.alert(
      'Screen Recording Permissions',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(onRetry ? [{ text: 'Grant Permissions', onPress: onRetry }] : []),
        { text: 'Settings', onPress: () => {
          Alert.alert('Settings', 'Go to Settings > Apps > SecureCast > Permissions to grant screen recording and microphone access.');
        }},
      ]
    );
  }

  // For actual screen capture using native module
  static async requestScreenCapturePermission(): Promise<boolean> {
    try {
      console.log('📱 Requesting native screen capture permission...');
      return await screenCaptureManager.requestPermission();
    } catch (error) {
      console.error('Screen capture permission error:', error);
      return false;
    }
  }

  // Legacy camera permissions for fallback demo
  static async requestCameraPermissions(): Promise<PermissionResult> {
    try {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

        if (cameraGranted && audioGranted) {
          return { granted: true };
        } else {
          const missingPermissions = [];
          if (!cameraGranted) missingPermissions.push('Camera');
          if (!audioGranted) missingPermissions.push('Microphone');
          
          return {
            granted: false,
            message: `${missingPermissions.join(' and ')} permission${missingPermissions.length > 1 ? 's' : ''} required for camera demo.`
          };
        }
      } else {
        return { granted: true };
      }
    } catch (error) {
      console.error('Camera permission request error:', error);
      return {
        granted: false,
        message: 'Failed to request camera permissions.'
      };
    }
  }
}

export default PermissionsManager;