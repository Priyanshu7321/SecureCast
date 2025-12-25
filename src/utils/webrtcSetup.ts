/**
 * WebRTC Setup for React Native
 * This file configures WebRTC polyfills for PeerJS to work in React Native
 */

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
} from 'react-native-webrtc';

// Extend global interface for TypeScript
declare global {
  var RTCPeerConnection: any;
  var RTCIceCandidate: any;
  var RTCSessionDescription: any;
  var MediaStream: any;
  var MediaStreamTrack: any;
  var navigator: any;
  var window: any;
}

// Setup WebRTC polyfills for PeerJS
export const setupWebRTC = () => {
  console.log('Setting up WebRTC polyfills for React Native...');

  // Polyfill global WebRTC APIs
  if (typeof globalThis !== 'undefined') {
    // Core WebRTC APIs
    (globalThis as any).RTCPeerConnection = RTCPeerConnection;
    (globalThis as any).RTCIceCandidate = RTCIceCandidate;
    (globalThis as any).RTCSessionDescription = RTCSessionDescription;
    
    // Media APIs
    (globalThis as any).MediaStream = MediaStream;
    (globalThis as any).MediaStreamTrack = MediaStreamTrack;
    
    // Navigator APIs
    (globalThis as any).navigator = (globalThis as any).navigator || {};
    (globalThis as any).navigator.mediaDevices = mediaDevices;
    (globalThis as any).navigator.getUserMedia = mediaDevices.getUserMedia?.bind(mediaDevices);
    
    // Additional WebRTC support
    (globalThis as any).window = (globalThis as any).window || globalThis;
    
    console.log('✅ WebRTC polyfills configured successfully');
  } else {
    console.error('❌ Global object not available for WebRTC setup');
  }
};

// Check if WebRTC is properly configured
export const checkWebRTCSupport = () => {
  const checks = {
    RTCPeerConnection: typeof (globalThis as any).RTCPeerConnection !== 'undefined',
    RTCIceCandidate: typeof (globalThis as any).RTCIceCandidate !== 'undefined',
    RTCSessionDescription: typeof (globalThis as any).RTCSessionDescription !== 'undefined',
    MediaStream: typeof (globalThis as any).MediaStream !== 'undefined',
    mediaDevices: !!((globalThis as any).navigator && (globalThis as any).navigator.mediaDevices),
  };

  const allSupported = Object.values(checks).every(Boolean);
  
  console.log('WebRTC Support Check:', checks);
  
  return {
    supported: allSupported,
    details: checks,
  };
};