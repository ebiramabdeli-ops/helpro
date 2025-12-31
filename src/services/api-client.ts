/**
 * API Client
 * Centralized HTTP client with authentication, error handling, and retries
 */

import { config, endpoints, HTTP_STATUS, ERROR_MESSAGES } from '../config/api.config';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Get auth token from storage
   */
  private getToken(): string | null {
    return localStorage.getItem(config.auth.tokenKey);
  }

  /**
   * Get headers with auth token
   */
  private getHeaders(customHeaders?: Record<string, string>): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...customHeaders,
    });

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle no content
    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return {} as T;
    }

    // Parse JSON
    const data = await response.json().catch(() => ({}));

    // Handle errors
    if (!response.ok) {
      const message = data.message || ERROR_MESSAGES.SERVER_ERROR;
      const code = data.code || 'UNKNOWN_ERROR';

      // Handle specific status codes
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Token expired, redirect to login
          localStorage.removeItem(config.auth.tokenKey);
          window.location.href = '/login';
          throw new APIError(ERROR_MESSAGES.UNAUTHORIZED, response.status, code);

        case HTTP_STATUS.FORBIDDEN:
          throw new APIError(ERROR_MESSAGES.FORBIDDEN, response.status, code);

        case HTTP_STATUS.NOT_FOUND:
          throw new APIError(ERROR_MESSAGES.NOT_FOUND, response.status, code);

        case HTTP_STATUS.VALIDATION_ERROR:
          throw new APIError(message, response.status, code, data.details);

        default:
          throw new APIError(message, response.status, code, data);
      }
    }

    return data as T;
  }

  /**
   * Make HTTP request with timeout
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: this.getHeaders(options.headers as Record<string, string>),
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError('Request timeout', 0, 'TIMEOUT');
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new APIError(ERROR_MESSAGES.NETWORK_ERROR, 0, 'NETWORK_ERROR');
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instances
export const api = new APIClient(config.api.baseUrl, config.api.timeout);
export const aiApi = new APIClient(config.ai.baseUrl, config.ai.timeout);
