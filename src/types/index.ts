// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

// User model
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// App state
export interface AppState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
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