import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, SignUpCredentials, AuthResponse, User } from '../types';

class AuthService {
  private baseUrl = 'https://jsonplaceholder.typicode.com'; // Mock API
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  // Simulate API delay
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      await this.delay(2000); // Simulate network delay

      // Mock validation
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      if (!credentials.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Simulate login failure for demo
      if (credentials.email === 'fail@test.com') {
        throw new Error('Invalid email or password');
      }

      // Mock successful response
      const mockUser: User = {
        id: '1',
        name: credentials.email.split('@')[0],
        email: credentials.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(credentials.email.split('@')[0])}&background=007AFF&color=fff`,
        token: `mock_token_${Date.now()}`,
      };

      const response: AuthResponse = {
        user: mockUser,
        token: mockUser.token!,
        message: 'Login successful',
      };

      // Store token and user data
      await this.storeAuthData(response.token, response.user);

      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      await this.delay(2500); // Simulate network delay

      // Mock validation
      if (!credentials.name || !credentials.email || !credentials.password) {
        throw new Error('All fields are required');
      }

      if (!credentials.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Simulate email already exists
      if (credentials.email === 'exists@test.com') {
        throw new Error('Email already exists');
      }

      // Mock successful response
      const mockUser: User = {
        id: Date.now().toString(),
        name: credentials.name,
        email: credentials.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(credentials.name)}&background=34C759&color=fff`,
        token: `mock_token_${Date.now()}`,
      };

      const response: AuthResponse = {
        user: mockUser,
        token: mockUser.token!,
        message: 'Account created successfully',
      };

      // Store token and user data
      await this.storeAuthData(response.token, response.user);

      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Sign up failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.tokenKey, this.userKey]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await this.delay(1000); // Simulate network delay
      
      // Mock token validation
      return token.startsWith('mock_token_');
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async refreshToken(token: string): Promise<string> {
    try {
      await this.delay(1000);
      
      // Mock token refresh
      const newToken = `mock_token_${Date.now()}`;
      await AsyncStorage.setItem(this.tokenKey, newToken);
      
      return newToken;
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  private async storeAuthData(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.tokenKey, token],
        [this.userKey, JSON.stringify(user)],
      ]);
    } catch (error) {
      console.error('Store auth data error:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      await this.delay(1500);

      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Mock response
      return {
        message: 'Password reset instructions have been sent to your email',
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send reset email');
    }
  }
}

export const authService = new AuthService();