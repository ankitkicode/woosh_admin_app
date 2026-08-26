import { store } from '../../app/store';
import { logout } from '../../modules/auth/store/authSlice';

// We should use an environment variable for this in production
const API_BASE_URL = 'http://localhost:5001/api/v1';

interface FetchOptions extends RequestInit {
  data?: any;
}

export async function apiClient<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, headers: customHeaders, ...customOptions } = options;

  const state = store.getState();
  const token = state.auth.token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...customHeaders,
  };

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    headers,
    ...customOptions,
  };

  if (data) {
    config.body = JSON.stringify(data);
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
