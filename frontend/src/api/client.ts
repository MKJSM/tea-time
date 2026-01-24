
import axios from 'axios';
import { mockTeas, getDetailedOrder } from '../mockData';

// Base configuration
const API_URL = 'https://api.teahaven.com/v1';
const MOCK_LATENCY = [400, 800];

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Handlers
const handlers: Record<string, (method: string, data?: any, params?: any) => any> = {
  '/products': (method) => {
    if (method === 'GET') return mockTeas;
  },
  '/auth/login': (method, data) => {
    if (method === 'POST') {
      const { email } = data || { email: 'guest@teahaven.com' };
      return {
        user: {
          id: 'u-1',
          name: email.split('@')[0],
          email,
          avatar: 'https://picsum.photos/seed/teauser/200',
          loyaltyPoints: 450,
        },
        token: 'mock-jwt-token-' + Math.random().toString(36).substr(2),
      };
    }
  },
  '/orders': (method) => {
    if (method === 'GET') {
      return [getDetailedOrder('1'), getDetailedOrder('2')];
    }
  }
};

// Handle dynamic IDs for products and orders
const getDynamicHandler = (url: string, method: string) => {
  if (url.startsWith('/products/') && method === 'GET') {
    const id = url.split('/').pop();
    return mockTeas.find(t => t.id === id) || mockTeas[0];
  }
  if (url.startsWith('/orders/') && method === 'GET') {
    const id = url.split('/').pop();
    return getDetailedOrder(id || '1');
  }
  return null;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tea_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  async (response) => {
    const delay = Math.floor(Math.random() * (MOCK_LATENCY[1] - MOCK_LATENCY[0])) + MOCK_LATENCY[0];
    await sleep(delay);

    const path = response.config.url || '';
    const method = response.config.method?.toUpperCase() || '';

    const handler = handlers[path];
    const mockResult = handler ? handler(method, response.config.data ? JSON.parse(response.config.data) : null) : getDynamicHandler(path, method);

    if (mockResult) {
      return { ...response, data: mockResult };
    }

    return response;
  },
  (error) => {
    // If it's a 404 on our mock domain, we still check handlers
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      const path = error.config?.url || '';
      const method = error.config?.method?.toUpperCase() || '';
      const handler = handlers[path];
      const mockResult = handler ? handler(method) : getDynamicHandler(path, method);

      if (mockResult) {
        return Promise.resolve({ data: mockResult, status: 200, config: error.config });
      }
    }
    return Promise.reject(error);
  }
);

// RTK Query Base Query Utility
export const axiosBaseQuery = () => async ({ url, method, data, params }: any) => {
  try {
    const result = await apiClient({ url, method, data, params });
    return { data: result.data };
  } catch (axiosError: any) {
    let err = axiosError as any;
    return {
      error: {
        status: err.response?.status,
        data: err.response?.data || err.message,
      },
    };
  }
};

export default apiClient;
