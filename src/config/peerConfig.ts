/**
 * PeerJS Configuration Options
 * Choose between different signaling servers based on your privacy/control needs
 */

export interface PeerServerConfig {
  host: string;
  port: number;
  path: string;
  secure: boolean;
  description: string;
  privacy: 'high' | 'medium' | 'low';
}

export const PEER_SERVER_OPTIONS: Record<string, PeerServerConfig> = {
  // Option 1: Official PeerJS Cloud (Current)
  official: {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    description: 'Official PeerJS cloud server - reliable but third-party',
    privacy: 'medium',
  },

  // Option 2: Alternative Public Server
  alternative: {
    host: 'peerjs-server.herokuapp.com',
    port: 443,
    path: '/',
    secure: true,
    description: 'Alternative public server - may be less reliable',
    privacy: 'medium',
  },

  // Option 3: Local Network Only (No Internet Required)
  local: {
    host: 'localhost',
    port: 9000,
    path: '/myapp',
    secure: false,
    description: 'Local server - requires setup but maximum privacy',
    privacy: 'high',
  },
};

// STUN servers for NAT traversal (Google's public STUN servers)
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];

// Default configuration
export const DEFAULT_PEER_CONFIG = PEER_SERVER_OPTIONS.official;

/**
 * Privacy Levels Explained:
 * 
 * HIGH PRIVACY (Local Server):
 * - Run your own signaling server
 * - No third-party involvement
 * - Requires technical setup
 * - Works on local network only
 * 
 * MEDIUM PRIVACY (Public Servers):
 * - Uses public signaling servers
 * - Only connection metadata passes through server
 * - Actual data is still peer-to-peer
 * - Easy setup, no configuration needed
 * 
 * The signaling server NEVER sees your:
 * - Screen sharing content
 * - Messages between devices
 * - Files being transferred
 * - Any actual application data
 * 
 * It only helps with:
 * - Initial device discovery
 * - WebRTC connection negotiation
 * - NAT traversal coordination
 */