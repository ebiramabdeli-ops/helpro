/**
 * Auth Service
 * Authentication and user management
 */

import { api } from './api-client';
import { config, endpoints } from '../config/api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'HELPER';
  language?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  verificationLevel: number;
  trustScore: number;
  subscriptionTier: string;
  preferredLanguage: string;
  createdAt: string;
}

/**
 * Auth Service
 */
export class AuthService {
  /**
   * Save tokens to localStorage
   */
  private static saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(config.auth.tokenKey, accessToken);
    localStorage.setItem(config.auth.refreshTokenKey, refreshToken);
  }

  /**
   * Clear tokens from localStorage
   */
  private static clearTokens(): void {
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.refreshTokenKey);
  }

  /**
   * Get current user from token
   */
  static async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (!token) return null;

    try {
      return await api.get<User>(endpoints.users.me);
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  /**
   * Login
   */
  static async login(email: string, password: string): Promise<User> {
    try {
      const response = await api.post<AuthResponse>(endpoints.auth.login, {
        email,
        password,
      });

      this.saveTokens(response.access_token, response.refresh_token);
      return response.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Register
   */
  static async register(data: RegisterRequest): Promise<User> {
    try {
      const response = await api.post<AuthResponse>(endpoints.auth.register, data);

      this.saveTokens(response.access_token, response.refresh_token);
      return response.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    try {
      await api.post(endpoints.auth.logout);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      this.clearTokens();
      window.location.href = '/';
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    try {
      const response = await api.post<{ access_token: string }>(
        endpoints.auth.refresh,
        { refresh_token: refreshToken }
      );

      localStorage.setItem(config.auth.tokenKey, response.access_token);
      return response.access_token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Forgot password
   */
  static async forgotPassword(email: string): Promise<void> {
    try {
      await api.post(endpoints.auth.forgotPassword, { email });
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.post(endpoints.auth.resetPassword, {
        token,
        password: newPassword,
      });
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  }

  /**
   * Update user language
   */
  static async updateLanguage(language: string): Promise<void> {
    try {
      await api.patch(endpoints.users.updateLanguage, { language });
    } catch (error) {
      console.error('Update language failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!localStorage.getItem(config.auth.tokenKey);
  }
}

/**
 * React Hook for Auth
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const user = await AuthService.login(email, password);
    setUser(user);
    return user;
  };

  const register = async (data: RegisterRequest) => {
    const user = await AuthService.register(data);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const updateLanguage = async (language: string) => {
    await AuthService.updateLanguage(language);
    if (user) {
      setUser({ ...user, preferredLanguage: language });
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateLanguage,
    refreshUser: loadUser,
  };
}

// Import React hooks
import { useState, useEffect } from 'react';
