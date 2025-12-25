// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ConnectionsTab: undefined;
};

// User model
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  token?: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

// PeerJS and Screen Sharing types
export interface ConnectedDevice {
  id: string;
  peerId: string;
  name?: string;
  isConnected: boolean;
  lastConnected: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export interface ScreenShareRequest {
  id: string;
  fromPeerId: string;
  toPeerId: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  type: 'screen_share_request' | 'screen_share_response';
}

export interface PeerConnection {
  peerId: string;
  connection: any; // PeerJS DataConnection
  mediaConnection?: any; // PeerJS MediaConnection
  isDataChannelOpen: boolean;
}

export interface ScreenShareState {
  isSharing: boolean;
  isReceiving: boolean;
  currentStream?: any;
  receivedStream?: any;
  sharingWithPeerId?: string;
  receivingFromPeerId?: string;
}

// App state
export interface AppState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Navigation props
export interface NavigationProps {
  navigation: any;
  route: any;
}