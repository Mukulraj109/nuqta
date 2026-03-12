import { getApiUrl, API_CONFIG } from '@/config/env';
import * as authStorage from '@/utils/authStorage';

// Types
interface ApiConfig {
  baseURL: string;
  timeout: number;
  defaultHeaders: Record<string, string>;
}

// NOTE: ApiResponse is now imported from services/apiClient.ts to avoid duplication
// This interface is kept here for backward compatibility but should use the main one
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: { [key: string]: string[] };
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Configuration - Using environment variables
const config: ApiConfig = {
  baseURL: getApiUrl(), // Uses EXPO_PUBLIC_API_BASE_URL from .env
  timeout: API_CONFIG.timeout, // 30 seconds from env
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.defaultHeaders = config.defaultHeaders;
    this.loadAuthToken();
  }

  // Load auth token from storage
  private async loadAuthToken(): Promise<void> {
    // Skip during SSR (server-side rendering)
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const token = await authStorage.getAuthToken();
      this.authToken = token;
    } catch (_error) {
      // silently handle
    }
  }

  // Set auth token
  public async setAuthToken(token: string | null): Promise<void> {
    this.authToken = token;

    // Skip storage during SSR
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (token) {
        await authStorage.saveAuthToken(token);
      } else {
        await authStorage.clearAuthData();
      }
    } catch (_error) {
      // silently handle
    }
  }

  // Get auth headers
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  // Create request with timeout
  private createRequestWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout')),
          this.timeout
        )
      ),
    ]);
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: any;

    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      throw new ApiError({
        message: 'Invalid JSON response',
        status: response.status,
        code: 'INVALID_JSON',
      });
    }

    if (!response.ok) {
      throw new ApiError({
        message: data?.message || `HTTP ${response.status}`,
        status: response.status,
        code: data?.code || 'HTTP_ERROR',
        details: data?.details,
      });
    }

    // Return normalized ApiResponse format
    return {
      success: true,
      data: data?.data || data,
      message: data?.message,
    };
  }

  // Make API request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      ...this.defaultHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await this.createRequestWithTimeout(url, requestOptions);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError({
        message: error instanceof Error ? error.message : 'Network error',
        status: 0,
        code: 'NETWORK_ERROR',
      });
    }
  }

  // HTTP Methods
  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload file
  public async upload<T>(
    endpoint: string,
    file: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      ...this.getAuthHeaders(),
      // Don't set Content-Type for FormData, let browser set it with boundary
    };

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        try {
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
          });
          const result = await this.handleResponse<T>(response);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError({
          message: 'Upload failed',
          status: 0,
          code: 'UPLOAD_ERROR',
        }));
      });

      xhr.addEventListener('timeout', () => {
        reject(new ApiError({
          message: 'Upload timeout',
          status: 0,
          code: 'UPLOAD_TIMEOUT',
        }));
      });

      xhr.open('POST', url);
      xhr.timeout = this.timeout;

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(file);
    });
  }

  // Refresh auth token
  public async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.post<{ token: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });

      await this.setAuthToken(response.data.token);
      await authStorage.saveRefreshToken(response.data.refreshToken);

      return response.data.token;
    } catch (error) {
      // Clear tokens on refresh failure
      await this.setAuthToken(null);
      await authStorage.clearAuthData();
      throw error;
    }
  }

  // Clear auth
  public async clearAuth(): Promise<void> {
    await this.setAuthToken(null);
    await authStorage.clearAuthData();
  }
}

// Custom error class
class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(error: { message: string; status: number; code?: string; details?: any }) {
    super(error.message);
    this.name = 'ApiError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient(config);
export { ApiError };
export type { ApiResponse, ApiConfig };
