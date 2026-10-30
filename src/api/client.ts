/**
 * Recovery Compass — Centralized Typed API Client
 * Authoritative integration layer between React frontend and NestJS backend.
 */

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(status: number, error: ApiErrorPayload) {
    super(error.message || 'An unexpected error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code || 'UNKNOWN_ERROR';
    this.details = error.details;
    this.requestId = error.requestId || `RC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private tokenKey = 'recovery_compass_access_token';
  private refreshTokenKey = 'recovery_compass_refresh_token';

  constructor() {
    const metaEnv = (import.meta as { env?: Record<string, string> }).env;
    this.baseUrl = (metaEnv?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');
  }

  public getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  public setTokens(accessToken: string, refreshToken?: string): void {
    try {
      localStorage.setItem(this.tokenKey, accessToken);
      if (refreshToken) {
        localStorage.setItem(this.refreshTokenKey, refreshToken);
      }
    } catch (e) {
      console.warn('Failed to save tokens to localStorage', e);
    }
  }

  public clearTokens(): void {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    } catch (e) {
      console.warn('Failed to clear tokens from localStorage', e);
    }
  }

  private generateRequestId(): string {
    return `RC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuth = false, headers = {}, ...customConfig } = options;

    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const requestId = this.generateRequestId();
    const reqHeaders: Record<string, string> = {
      'X-Request-ID': requestId,
      ...(headers as Record<string, string>),
    };

    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token && !reqHeaders['Authorization']) {
        reqHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    if (!(customConfig.body instanceof FormData) && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...customConfig,
        headers: reqHeaders,
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const contentType = response.headers.get('content-type');
      let data: any;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/calendar')) {
        data = await response.text();
        return data as T;
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorPayload: ApiErrorPayload = data?.error || {
          code: `HTTP_${response.status}`,
          message: data?.message || response.statusText || 'Request failed',
          requestId: response.headers.get('x-request-id') || requestId,
        };
        throw new ApiError(response.status, errorPayload);
      }

      // Backend returns { data: T, meta: { ... } }
      if (data && typeof data === 'object' && 'data' in data) {
        return data.data as T;
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(0, {
        code: 'NETWORK_ERROR',
        message: err?.message || 'Unable to connect to Recovery Compass API server. Check your network.',
        requestId,
      });
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public upload<T>(endpoint: string, file: File, additionalFields?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, val]) => {
        formData.append(key, val);
      });
    }
    return this.post<T>(endpoint, formData);
  }
}

export const apiClient = new ApiClient();
