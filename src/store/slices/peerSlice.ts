import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ConnectedDevice, ScreenShareRequest, ScreenShareState } from '../../types';
import { peerService } from '../../services/peerService';

interface PeerState {
  peerId: string | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  connectedDevices: ConnectedDevice[];
  serverlessDevices: ConnectedDevice[];
  screenShareRequests: ScreenShareRequest[];
  screenShareState: ScreenShareState;
}

const initialState: PeerState = {
  peerId: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  connectedDevices: [],
  serverlessDevices: [],
  screenShareRequests: [],
  screenShareState: {
    isSharing: false,
    isReceiving: false,
  },
};

// Async thunks
export const initializePeer = createAsyncThunk(
  'peer/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const peerId = await peerService.initialize();
      return { peerId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize PeerJS');
    }
  }
);

export const connectToPeer = createAsyncThunk(
  'peer/connectToPeer',
  async (peerId: string, { rejectWithValue }) => {
    try {
      const device = await peerService.connectToPeer(peerId);
      return device;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to connect to peer');
    }
  }
);

export const sendScreenShareRequest = createAsyncThunk(
  'peer/sendScreenShareRequest',
  async (peerId: string, { rejectWithValue }) => {
    try {
      const success = peerService.sendScreenShareRequest(peerId);
      if (success) {
        return { peerId };
      } else {
        throw new Error('Failed to send screen share request');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send request');
    }
  }
);

export const startScreenShare = createAsyncThunk(
  'peer/startScreenShare',
  async (peerId: string, { rejectWithValue }) => {
    try {
      const stream = await peerService.startScreenShare(peerId);
      return { peerId, stream };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start screen share');
    }
  }
);

const peerSlice = createSlice({
  name: 'peer',
  initialState,
  reducers: {
    addConnectedDevice: (state, action: PayloadAction<ConnectedDevice>) => {
      const existingIndex = state.connectedDevices.findIndex(
        device => device.peerId === action.payload.peerId
      );
      
      if (existingIndex >= 0) {
        state.connectedDevices[existingIndex] = action.payload;
      } else {
        state.connectedDevices.push(action.payload);
      }
    },

    removeConnectedDevice: (state, action: PayloadAction<string>) => {
      state.connectedDevices = state.connectedDevices.filter(
        device => device.peerId !== action.payload
      );
    },

    updateDeviceStatus: (state, action: PayloadAction<{ peerId: string; status: ConnectedDevice['connectionStatus'] }>) => {
      const device = state.connectedDevices.find(d => d.peerId === action.payload.peerId);
      if (device) {
        device.connectionStatus = action.payload.status;
        device.isConnected = action.payload.status === 'connected';
      }
    },

    addScreenShareRequest: (state, action: PayloadAction<ScreenShareRequest>) => {
      // Remove any existing request from the same peer
      state.screenShareRequests = state.screenShareRequests.filter(
        req => req.fromPeerId !== action.payload.fromPeerId
      );
      state.screenShareRequests.push(action.payload);
    },

    updateScreenShareRequest: (state, action: PayloadAction<{ id: string; status: ScreenShareRequest['status'] }>) => {
      const request = state.screenShareRequests.find(req => req.id === action.payload.id);
      if (request) {
        request.status = action.payload.status;
      }
    },

    removeScreenShareRequest: (state, action: PayloadAction<string>) => {
      state.screenShareRequests = state.screenShareRequests.filter(
        req => req.id !== action.payload
      );
    },

    setScreenShareState: (state, action: PayloadAction<Partial<ScreenShareState>>) => {
      state.screenShareState = { ...state.screenShareState, ...action.payload };
    },

    clearError: (state) => {
      state.error = null;
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Serverless device management
    addServerlessDevice: (state, action: PayloadAction<ConnectedDevice>) => {
      const existingIndex = state.serverlessDevices.findIndex(
        device => device.id === action.payload.id
      );
      
      if (existingIndex >= 0) {
        state.serverlessDevices[existingIndex] = action.payload;
      } else {
        state.serverlessDevices.push(action.payload);
      }
    },

    removeServerlessDevice: (state, action: PayloadAction<string>) => {
      state.serverlessDevices = state.serverlessDevices.filter(
        device => device.id !== action.payload
      );
    },

    updateServerlessDeviceStatus: (state, action: PayloadAction<{ deviceId: string; status: ConnectedDevice['connectionStatus'] }>) => {
      const device = state.serverlessDevices.find(d => d.id === action.payload.deviceId);
      if (device) {
        device.connectionStatus = action.payload.status;
        device.isConnected = action.payload.status === 'connected';
      }
    },

    disconnectFromPeer: (state, action: PayloadAction<string>) => {
      const peerId = action.payload;
      peerService.disconnectFromPeer(peerId);
      state.connectedDevices = state.connectedDevices.filter(
        device => device.peerId !== peerId
      );
      // Clear any screen share requests from this peer
      state.screenShareRequests = state.screenShareRequests.filter(
        req => req.fromPeerId !== peerId && req.toPeerId !== peerId
      );
    },

    stopScreenShare: (state, action: PayloadAction<string>) => {
      const peerId = action.payload;
      peerService.stopScreenShare(peerId);
      state.screenShareState = {
        isSharing: false,
        isReceiving: false,
        currentStream: undefined,
        receivedStream: undefined,
        sharingWithPeerId: undefined,
        receivingFromPeerId: undefined,
      };
    },
  },

  extraReducers: (builder) => {
    builder
      // Initialize peer
      .addCase(initializePeer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializePeer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.peerId = action.payload.peerId;
      })
      .addCase(initializePeer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Connect to peer
      .addCase(connectToPeer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(connectToPeer.fulfilled, (state, action) => {
        state.isLoading = false;
        const existingIndex = state.connectedDevices.findIndex(
          device => device.peerId === action.payload.peerId
        );
        
        if (existingIndex >= 0) {
          state.connectedDevices[existingIndex] = action.payload;
        } else {
          state.connectedDevices.push(action.payload);
        }
      })
      .addCase(connectToPeer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Send screen share request
      .addCase(sendScreenShareRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendScreenShareRequest.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendScreenShareRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Start screen share
      .addCase(startScreenShare.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startScreenShare.fulfilled, (state, action) => {
        state.isLoading = false;
        state.screenShareState = {
          ...state.screenShareState,
          isSharing: true,
          currentStream: action.payload.stream,
          sharingWithPeerId: action.payload.peerId,
        };
      })
      .addCase(startScreenShare.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addConnectedDevice,
  removeConnectedDevice,
  updateDeviceStatus,
  addScreenShareRequest,
  updateScreenShareRequest,
  removeScreenShareRequest,
  setScreenShareState,
  clearError,
  setError,
  disconnectFromPeer,
  stopScreenShare,
  addServerlessDevice,
  removeServerlessDevice,
  updateServerlessDeviceStatus,
} = peerSlice.actions;

export default peerSlice.reducer;