// API Client
// Base client for all backend API communications

import { Platform } from 'react-native';
import { parseConnectionError, formatConnectionError, isConnectionError } from '@/utils/connectionUtils';
import { Sentry } from '@/config/sentry';
import { globalDeduplicator, createRequestKey } from '@/utils/requestDeduplicator';
import { globalConcurrencyLimiter } from '@/utils/concurrencyLimiter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cached device fingerprint (loaded once, reused for all requests)
let _cachedDeviceFingerprint: string | null = null;
let _fingerprintLoadPromise: Promise<string | null> | null = null;

async function getDeviceFingerprintHeader(): Promise<string | null> {
  if (_cachedDeviceFingerprint) return _cachedDeviceFingerprint;
  if (_fingerprintLoadPromise) return _fingerprintLoadPromise;
  _fingerprintLoadPromise = (async () => {
    try {
      const stored = await AsyncStorage.getItem('@security_device_fingerprint');
      if (stored) {
        const fp = JSON.parse(stored);
        _cachedDeviceFingerprint = fp.hash || fp.id || null;
      }
    } catch { /* non-critical */ }
    return _cachedDeviceFingerprint;
  })();
  return _fingerprintLoadPromise;
}

// Emulators can't reach host's localhost directly
// BlueStacks uses Hyper-V network, host is reachable at 172.19.128.1
// Stock Android emulator: 10.0.2.2, iOS simulator: localhost works natively
function resolveBaseURL(url: string): string {
  if (Platform.OS === 'android' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return url.replace('localhost', '172.19.128.1').replace('127.0.0.1', '172.19.128.1');
  }
  return url;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: { [key: string]: string[] };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp?: string;
    [key: string]: any;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  deduplicate?: boolean; // Enable/disable deduplication per-request
}

// Region getter - will be set by RegionContext
let getRegionFn: (() => string) | null = null;

export function setRegionGetter(fn: (() => string) | null) {
  getRegionFn = fn;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;
  private refreshTokenCallback: (() => Promise<boolean>) | null = null;
  private logoutCallback: (() => void | Promise<void>) | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private isLoggingOut: boolean = false;
  // System page callbacks
  private maintenanceCallback: (() => void) | null = null;
  private appUpdateCallback: ((minVersion: string) => void) | null = null;
  private currentAppVersion: string = '1.0.0';
  // Region
  private currentRegion: string = 'bangalore';
  // Slow request warning callback (fires before timeout)
  private slowRequestCallback: ((endpoint: string) => void) | null = null;

  constructor() {
    // Use environment variable or fallback to user backend localhost
    // On Android emulators, remap localhost to 10.0.2.2 (host machine)
    const resolvedURL = resolveBaseURL(process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api');

    // In production, enforce HTTPS to prevent credential leakage over plaintext
    if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production' && !resolvedURL.startsWith('https://')) {
      throw new Error(`[ApiClient] FATAL: Production API URL must use HTTPS. Got: ${resolvedURL}`);
    }

    this.baseURL = resolvedURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Set current region for API requests
  setRegion(region: string) {
    this.currentRegion = region;
    this.defaultHeaders['X-Rez-Region'] = region;
  }

  // Get current region
  getRegion(): string {
    return this.currentRegion;
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Set refresh token callback
  setRefreshTokenCallback(callback: (() => Promise<boolean>) | null) {
    this.refreshTokenCallback = callback;
  }

  // Set logout callback (supports async callbacks)
  setLogoutCallback(callback: (() => void | Promise<void>) | null) {
    this.logoutCallback = callback;
  }

  // Set maintenance mode callback
  setMaintenanceCallback(callback: (() => void) | null) {
    this.maintenanceCallback = callback;
  }

  // Set app update callback
  setAppUpdateCallback(callback: ((minVersion: string) => void) | null) {
    this.appUpdateCallback = callback;
  }

  // Set current app version
  setCurrentAppVersion(version: string) {
    this.currentAppVersion = version;
  }

  // Set slow request warning callback (fires at 4s before actual timeout)
  setSlowRequestCallback(callback: ((endpoint: string) => void) | null) {
    this.slowRequestCallback = callback;
  }

  // Compare semantic versions (returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2)
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }

  // Handle token refresh
  private async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshTokenCallback) {
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshTokenCallback();

    try {
      const success = await this.refreshPromise;
      return success;
    } catch (error) {
      return false;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // Make HTTP request
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 8000
    } = options;

    const url = `${this.baseURL}${endpoint}`;

    // Get current region dynamically (in case it changed since constructor)
    const currentRegion = getRegionFn ? getRegionFn() : this.currentRegion;
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      'X-Rez-Region': currentRegion,
      ...headers
    };

    // Inject device fingerprint header for security tracking
    const fingerprint = await getDeviceFingerprintHeader();
    if (fingerprint) {
      requestHeaders['X-Device-Fingerprint'] = fingerprint;
      requestHeaders['X-Device-OS'] = `${Platform.OS} ${Platform.Version || ''}`.trim();
    }

    // Declared outside try so catch block can clear the timer
    let slowWarningId: ReturnType<typeof setTimeout> | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Show "taking longer than usual" warning at 4s
      if (this.slowRequestCallback && timeout >= 5000) {
        slowWarningId = setTimeout(() => {
          this.slowRequestCallback?.(endpoint);
        }, 4000);
      }

      const config: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        if (body instanceof FormData) {
          // Remove Content-Type for FormData (let browser set it)
          delete requestHeaders['Content-Type'];
          config.body = body;
        } else {
          config.body = JSON.stringify(body);
        }
      }

      const response = await globalConcurrencyLimiter.execute(() => fetch(url, config));
      clearTimeout(timeoutId);
      if (slowWarningId) clearTimeout(slowWarningId);

      const responseData = await response.json();

      if (!response.ok) {

        // Handle 503 Service Unavailable - Maintenance mode
        if (response.status === 503 && this.maintenanceCallback) {
          this.maintenanceCallback();
          return {
            success: false,
            error: 'Server is under maintenance. Please try again later.'
          };
        }

        // Handle 426 Upgrade Required - App version outdated
        if (response.status === 426 && this.appUpdateCallback) {
          const minVersion = responseData.minVersion || responseData.minimum_version || '1.0.0';
          this.appUpdateCallback(minVersion);
          return {
            success: false,
            error: 'Please update your app to continue.'
          };
        }

        // Check for version header in any response
        const serverMinVersion = response.headers.get('X-Min-App-Version');
        if (serverMinVersion && this.appUpdateCallback) {
          // Compare versions
          const needsUpdate = this.compareVersions(this.currentAppVersion, serverMinVersion) < 0;
          if (needsUpdate) {
            this.appUpdateCallback(serverMinVersion);
          }
        }

        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && this.authToken) {
          // If we're already logging out, skip all 401 handling
          if (this.isLoggingOut) {
            return {
              success: false,
              error: 'Session expired',
            };
          }

          // Check if the error is due to expired/revoked token
          const errorMessage = responseData.message?.toLowerCase() || '';
          const isTokenIssue = errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('jwt') || errorMessage.includes('token') || errorMessage.includes('revoked');

          // Only try to refresh if we have a refresh callback and token appears expired/revoked
          if (isTokenIssue) {
            if (this.refreshTokenCallback && !this.isLoggingOut) {
              const refreshSuccess = await this.handleTokenRefresh();
              if (refreshSuccess) {
                // Retry the original request with new token
                return this.makeRequest<T>(endpoint, options);
              }
            }

            // Token refresh failed or no refresh callback - trigger logout (once)
            if (this.logoutCallback && !this.isLoggingOut) {
              this.isLoggingOut = true;
              try {
                await this.logoutCallback();
              } catch (logoutError) {
                // Still clear local token as fallback
                this.setAuthToken(null);
              } finally {
                this.isLoggingOut = false;
              }
            } else if (!this.logoutCallback) {
              // No logout callback set - at minimum clear the token
              this.setAuthToken(null);
            }
          }
        }

        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
          errors: responseData.errors
        };
      }

      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message,
        meta: responseData.meta // Preserve meta field for pagination info
      };

    } catch (error) {
      if (slowWarningId) clearTimeout(slowWarningId);

      // Report API errors to Sentry with tier tags for filtering
      try {
        const { useSubscriptionStore } = require('@/stores/subscriptionStore');
        const { usePriveStore } = require('@/stores/priveStore');
        const subComputed = useSubscriptionStore.getState().computed;
        const priveEligibility = usePriveStore.getState().eligibility;

        Sentry?.withScope?.((scope: any) => {
          scope.setTag('endpoint', endpoint);
          scope.setTag('method', method);
          scope.setTag('user_tier', subComputed?.isVIP ? 'vip' : subComputed?.isPremium ? 'premium' : 'free');
          scope.setTag('prive_tier', priveEligibility?.tier ?? 'none');
          scope.setTag('error_type', error instanceof Error && error.name === 'AbortError' ? 'timeout'
            : error instanceof Error && isConnectionError(error) ? 'network' : 'api');
          Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
        });
      } catch {
        // Sentry/store unavailable — don't block error handling
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout - Backend server may be slow or unresponsive'
          };
        }

        // Provide better error messages for connection issues
        if (isConnectionError(error)) {
          const connectionError = parseConnectionError(error);
          return {
            success: false,
            error: `${connectionError.message}. ${connectionError.suggestions[0] || ''}`
          };
        }

        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred'
      };
    }
  }

  // GET request (with automatic deduplication)
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: { deduplicate?: boolean; timeout?: number }
  ): Promise<ApiResponse<T>> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, String(params[key]));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const requestOptions: RequestOptions = { method: 'GET' };
    if (options?.timeout) {
      requestOptions.timeout = options.timeout;
    }

    // Deduplicate GET requests by default (can be disabled per-request)
    const shouldDeduplicate = options?.deduplicate !== false;

    if (shouldDeduplicate) {
      // Include region in request key so region changes trigger new requests
      const currentRegion = getRegionFn ? getRegionFn() : this.currentRegion;
      const requestKey = createRequestKey(`${this.baseURL}${url}:region=${currentRegion}`, params);

      return globalDeduplicator.dedupe(
        requestKey,
        () => this.makeRequest<T>(url, requestOptions)
      );
    }

    return this.makeRequest<T>(url, requestOptions);
  }

  // POST request (optional deduplication)
  async post<T>(
    endpoint: string,
    data?: any,
    options?: { deduplicate?: boolean }
  ): Promise<ApiResponse<T>> {
    // POST requests are NOT deduplicated by default (usually mutating)
    const shouldDeduplicate = options?.deduplicate === true;

    if (shouldDeduplicate) {
      const requestKey = createRequestKey(`POST:${this.baseURL}${endpoint}`, data);

      return globalDeduplicator.dedupe(
        requestKey,
        () => this.makeRequest<T>(endpoint, { method: 'POST', body: data })
      );
    }

    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data
    });
  }

  // PUT request (optional deduplication)
  async put<T>(
    endpoint: string,
    data?: any,
    options?: { deduplicate?: boolean }
  ): Promise<ApiResponse<T>> {
    // PUT requests are NOT deduplicated by default (usually mutating)
    const shouldDeduplicate = options?.deduplicate === true;

    if (shouldDeduplicate) {
      const requestKey = createRequestKey(`PUT:${this.baseURL}${endpoint}`, data);

      return globalDeduplicator.dedupe(
        requestKey,
        () => this.makeRequest<T>(endpoint, { method: 'PUT', body: data })
      );
    }

    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  // PATCH request (optional deduplication)
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: { deduplicate?: boolean }
  ): Promise<ApiResponse<T>> {
    // PATCH requests are NOT deduplicated by default (usually mutating)
    const shouldDeduplicate = options?.deduplicate === true;

    if (shouldDeduplicate) {
      const requestKey = createRequestKey(`PATCH:${this.baseURL}${endpoint}`, data);

      return globalDeduplicator.dedupe(
        requestKey,
        () => this.makeRequest<T>(endpoint, { method: 'PATCH', body: data })
      );
    }

    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data
    });
  }

  // DELETE request (optional deduplication)
  async delete<T>(
    endpoint: string,
    data?: any,
    options?: { deduplicate?: boolean }
  ): Promise<ApiResponse<T>> {
    // DELETE requests are NOT deduplicated by default (usually mutating)
    const shouldDeduplicate = options?.deduplicate === true;

    if (shouldDeduplicate) {
      const requestKey = createRequestKey(`DELETE:${this.baseURL}${endpoint}`, data);

      return globalDeduplicator.dedupe(
        requestKey,
        () => this.makeRequest<T>(endpoint, { method: 'DELETE', body: data })
      );
    }

    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      body: data
    });
  }

  // Upload file (30s timeout for large files)
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
      timeout: API_TIMEOUTS.UPLOAD,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      const data = await response.json();

      return {
        success: response.ok,
        data,
        error: response.ok ? undefined : data.error
      };
    } catch (error) {
      return {
        success: false,
        error: 'Cannot connect to server'
      };
    }
  }

  // Set base URL (useful for testing or different environments)
  setBaseURL(url: string) {
    this.baseURL = url;
  }

  // Get base URL
  getBaseURL(): string {
    return this.baseURL;
  }

  // Get deduplication statistics
  getDeduplicationStats() {
    return globalDeduplicator.getStats();
  }

  // Print deduplication statistics
  printDeduplicationStats() {
    globalDeduplicator.printStats();
  }

  // Cancel all in-flight requests
  cancelAllRequests() {
    globalDeduplicator.cancelAll();
  }
}

// Timeout constants for callers that need specific timeouts
export const API_TIMEOUTS = {
  DEFAULT: 8000,
  UPLOAD: 30000,
  LONG_RUNNING: 15000,
} as const;

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
export type { ApiResponse, RequestOptions };
