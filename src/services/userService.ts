import { User, ApiResponse } from '../types';

class UserService {
  private baseUrl = 'https://jsonplaceholder.typicode.com'; // Example API

  async getUser(userId: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      
      // Transform API response to our User model
      return {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=007AFF&color=fff`,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=007AFF&color=fff`,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      
      return data.map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=007AFF&color=fff`,
      }));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }
}

export const userService = new UserService();