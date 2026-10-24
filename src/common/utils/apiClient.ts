import { store } from '../../app/store';
import { logout } from '../../modules/auth/store/authSlice';

// We use Vite environment variables. Fallback to localhost if not provided.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

interface FetchOptions extends RequestInit {
  data?: any;
}

export async function apiClient<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, headers: customHeaders, ...customOptions } = options;

  const state = store.getState();
  const token = state.auth.token;

  const isFormData =
    (typeof FormData !== 'undefined' && data instanceof FormData) ||
    (typeof FormData !== 'undefined' && (customOptions as any).body instanceof FormData);

  const headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(customHeaders as Record<string, string>),
  };

  if (!isFormData) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  } else {
    delete headers['Content-Type'];
  }

  const config: RequestInit = {
    method: customOptions.method || (data ? 'POST' : 'GET'),
    headers,
    ...customOptions,
  };

  if (data !== undefined) {
    config.body = isFormData ? data : (typeof data === 'string' ? data : JSON.stringify(data));
  } else if ((customOptions as any).body) {
    config.body = (customOptions as any).body;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (response.status === 401 && !endpoint.includes('/login')) {
    store.dispatch(logout());
    throw new Error('Session expired. Please log in again.');
  }

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || 'Something went wrong');
  }

  return responseData.data || responseData;
}

apiClient.get = <T = any>(endpoint: string, options: FetchOptions = {}) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T = any>(endpoint: string, data?: any, options: FetchOptions = {}) =>
  apiClient<T>(endpoint, { ...options, method: 'POST', data });

apiClient.put = <T = any>(endpoint: string, data?: any, options: FetchOptions = {}) =>
  apiClient<T>(endpoint, { ...options, method: 'PUT', data });

apiClient.delete = <T = any>(endpoint: string, options: FetchOptions = {}) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });

