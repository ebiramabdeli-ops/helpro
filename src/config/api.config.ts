/**
 * API Configuration
 * Central configuration for all API endpoints
 */

// Environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const AI_BASE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 10000,
  },
  ai: {
    baseUrl: AI_BASE_URL,
    timeout: 5000,
  },
  auth: {
    tokenKey: 'helpro_auth_token',
    refreshTokenKey: 'helpro_refresh_token',
  },
  storage: {
    languageKey: 'helpro_language',
    themeKey: 'helpro_theme',
  },
};

/**
 * API Endpoints
 */
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    verify: '/auth/verify',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  
  // Users
  users: {
    me: '/users/me',
    profile: '/users/profile',
    updateLanguage: '/users/me/language',
    verification: '/users/verification',
  },
  
  // Services
  services: {
    list: '/services',
    categories: '/services/categories',
    search: '/services/search',
  },
  
  // Orders (Bookings)
  orders: {
    create: '/orders',
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    complete: (id: string) => `/orders/${id}/complete`,
  },
  
  // Payments
  payments: {
    createIntent: '/payments/intent',
    confirm: '/payments/confirm',
    history: '/payments/history',
  },
  
  // Reviews
  reviews: {
    create: '/reviews',
    list: '/reviews',
    forUser: (userId: string) => `/reviews/user/${userId}`,
  },
  
  // AI Service
  ai: {
    analyze: '/ai/analyze',
    decide: '/ai/decide',
    match: '/ai/match',
    myScore: '/ai/my-score',
    health: '/ai/health',
  },
  
  // Admin
  admin: {
    users: '/admin/users',
    orders: '/admin/orders',
    stats: '/admin/stats',
  },
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

/**
 * Simple API Client
 */
export const apiClient = {
  get: async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem(config.auth.tokenKey);
    const response = await fetch(`${config.api.baseUrl}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  post: async (url: string, data?: any, options?: RequestInit) => {
    const token = localStorage.getItem(config.auth.tokenKey);
    const response = await fetch(`${config.api.baseUrl}${url}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  put: async (url: string, data?: any, options?: RequestInit) => {
    const token = localStorage.getItem(config.auth.tokenKey);
    const response = await fetch(`${config.api.baseUrl}${url}`, {
      method: 'PUT',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  delete: async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem(config.auth.tokenKey);
    const response = await fetch(`${config.api.baseUrl}${url}`, {
      method: 'DELETE',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};
