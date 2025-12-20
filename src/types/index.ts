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