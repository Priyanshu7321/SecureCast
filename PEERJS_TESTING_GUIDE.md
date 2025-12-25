# PeerJS Screen Sharing - Testing Guide

## Quick Start Testing

### 1. Build and Run the App
```bash
# Install dependencies (if not already done)
npm install

# Run on Android
npx react-native run-android

# Or run on iOS
npx react-native run-ios
```

### 2. Test PeerJS Integration

1. **Login/Signup**: Use the authentication system to access the main app
   - Demo credentials: email: `demo@example.com`, password: `demo123`

2. **Navigate to Home Tab**: You'll see the PeerJS screen sharing interface

3. **Test PeerJS Initialization**: 
   - Look for the "PeerJS Integration Test" section
   - Tap "Initialize PeerJS" to test the connection
   - You should see a success message with a peer ID

4. **Copy Your Peer ID**: 
   - Your unique peer ID will be displayed
   - Tap the "Copy" button to copy it to clipboard

### 3. Test Device Connection (Requires 2 Devices)

#### Device A (First Device):
1. Note down your peer ID (e.g., `securecast_abc123_xyz789`)
2. Share this ID with Device B

#### Device B (Second Device):
1. Tap "Add Device" button
2. Enter Device A's peer ID
3. Tap "Connect"
4. You should see a success notification

#### Both Devices:
- Navigate to "Connections" tab
- You should see the connected device listed
- Try sending screen share requests using the "Send" button

### 4. Test Screen Share Requests

1. **Send Request**: 
   - On Device A, tap "Send" button for Device B
   - Device B should receive a notification and dialog

2. **Accept/Reject Request**:
   - On Device B, accept or reject the request
   - Device A should receive feedback notification

3. **Mock Screen Sharing**:
   - Currently uses mock streams (not real screen capture)
   - You'll see status updates indicating sharing is active

## Expected Behavior

### ✅ Working Features:
- PeerJS initialization with unique peer IDs
- Device-to-device connection over internet
- Screen share request/response system
- Real-time connection status updates
- Error handling and user notifications
- Connection management (disconnect, reconnect)

### 🔄 Mock Features (Development):
- Screen capture (uses mock streams)
- Actual video streaming (ready for WebRTC integration)

## Troubleshooting

### Connection Issues:
1. **Check Internet**: Both devices need internet connectivity
2. **Firewall**: Ensure no firewall blocking WebRTC connections
3. **Peer ID**: Verify peer IDs are entered correctly (case-sensitive)

### App Issues:
1. **Restart App**: Close and reopen if connections seem stuck
2. **Clear State**: Use "Refresh" button to generate new peer ID
3. **Check Logs**: Look for console errors in Metro bundler

## Network Requirements

- **Internet Connection**: Required for PeerJS signaling server
- **WebRTC Support**: Modern devices support WebRTC by default
- **Ports**: Uses standard WebRTC ports (handled automatically)

## Testing Scenarios

### Basic Connection Test:
1. Initialize PeerJS on both devices ✓
2. Connect Device A to Device B ✓
3. Verify connection appears in Connections tab ✓

### Screen Share Request Test:
1. Send request from Device A to Device B ✓
2. Receive notification on Device B ✓
3. Accept request on Device B ✓
4. Verify sharing status on both devices ✓

### Error Handling Test:
1. Try connecting with invalid peer ID ✓
2. Try connecting to offline device ✓
3. Disconnect during active session ✓

## Next Steps for Production

1. **Real Screen Capture**: Integrate react-native-webrtc for actual screen recording
2. **Performance**: Optimize for real video streaming
3. **Security**: Add encryption for sensitive data
4. **Custom Server**: Deploy custom signaling server for better control

## Demo Credentials

For quick testing, use these demo login credentials:
- **Email**: `demo@example.com`
- **Password**: `demo123`

This will bypass the authentication and take you directly to the PeerJS screen sharing interface.