# PeerJS Screen Sharing Implementation

## Overview
This React Native app implements a PeerJS-based screen sharing system with a clean MVVM architecture. The app allows devices to connect to each other over the internet and share screens using WebRTC technology.

## Architecture

### Core Components

1. **PeerService** (`src/services/peerService.ts`)
   - Manages PeerJS connections and WebRTC functionality
   - Handles peer discovery, connection management, and data/media streaming
   - Provides event-driven callbacks for connection status updates

2. **PeerSlice** (`src/store/slices/peerSlice.ts`)
   - Redux state management for peer connections and screen sharing
   - Async thunks for connection operations
   - State management for connected devices and screen share requests

3. **HomeScreenView** (`src/views/HomeScreenView.tsx`)
   - Main screen for peer ID display and device connection
   - Auto-generates unique peer IDs
   - Allows users to connect to other devices by entering their peer IDs

4. **ConnectionsScreenView** (`src/views/ConnectionsScreenView.tsx`)
   - Displays connected devices
   - Manages screen share requests (send/receive)
   - Handles screen sharing session controls

## Key Features

### 1. Automatic Peer ID Generation
- Each device gets a unique peer ID in format: `securecast_{timestamp}_{random}`
- Peer IDs are displayed and can be copied to clipboard
- Users can refresh their peer ID if needed

### 2. Device Connection
- Connect to other devices using their peer IDs
- Real-time connection status monitoring
- Automatic reconnection handling

### 3. Screen Share Requests
- Send screen share requests to connected devices
- Receive and respond to incoming requests
- Request status tracking (pending, accepted, rejected)

### 4. Screen Sharing (Mock Implementation)
- Currently uses mock streams for React Native compatibility
- Ready for integration with react-native-webrtc for real screen capture
- Proper WebRTC connection management

## Navigation Structure

```
MainTabNavigator
├── HomeTab (HomeScreenView)
│   ├── Peer ID display and management
│   ├── Connection status
│   └── Add device functionality
└── ConnectionsTab (ConnectionsScreenView)
    ├── Connected devices list
    ├── Screen share controls
    └── Request management
```

## Usage Flow

1. **Initialize**: App auto-generates a unique peer ID
2. **Connect**: Share peer ID with other devices or enter their peer IDs
3. **Request**: Send screen share requests to connected devices
4. **Share**: Accept/reject incoming requests and start screen sharing

## Technical Implementation

### PeerJS Configuration
- Uses public PeerJS server (peerjs-server.herokuapp.com)
- STUN servers for NAT traversal
- Secure WebSocket connections

### State Management
- Redux Toolkit for state management
- Async thunks for connection operations
- Real-time state updates via PeerJS callbacks

### Error Handling
- Connection failure recovery
- Network error notifications
- User-friendly error messages

## Future Enhancements

1. **Real Screen Capture**: Integrate react-native-webrtc for actual screen recording
2. **File Sharing**: Extend data channel for file transfers
3. **Voice Chat**: Add audio streaming capabilities
4. **Custom Signaling**: Implement custom signaling server for better control
5. **Security**: Add encryption for sensitive data transmission

## Dependencies

- `peerjs`: WebRTC peer-to-peer connections
- `react-native-webrtc`: Native WebRTC implementation (ready for integration)
- `@react-native-clipboard/clipboard`: Clipboard functionality
- `@reduxjs/toolkit`: State management
- `@react-navigation/bottom-tabs`: Tab navigation

## Testing

The implementation includes:
- Connection status monitoring
- Error handling and user feedback
- Mock screen sharing for development
- Real-time notifications for connection events

## Production Readiness

Current status: **Development Ready**
- ✅ PeerJS integration complete
- ✅ UI/UX implementation complete
- ✅ State management complete
- ✅ Error handling complete
- 🔄 Screen capture (mock implementation)
- 🔄 Production WebRTC integration needed

The app is ready for development testing and can be extended with real screen capture functionality using react-native-webrtc.