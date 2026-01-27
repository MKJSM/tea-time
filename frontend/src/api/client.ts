import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '../config';

// 1. RTK Query Base
export const baseQuery = fetchBaseQuery({
  baseUrl: config.api.baseUrl,
  credentials: 'include',
  prepareHeaders: (headers) => {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  },
});

export const axiosBaseQuery = () => baseQuery;

// 2. Standalone Client (Axios replacement)
const request = async (method: string, url: string, data?: any, customConfig?: any) => {
  const fullUrl = `${config.api.baseUrl}${url}`;

  const headers: Record<string, string> = {
    ...(customConfig?.headers || {}),
  };

  let body = data;

  if (data && !(data instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    body = JSON.stringify(data);
  }

  if (data instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || response.statusText };
      }
      throw {
        response: {
          status: response.status,
          data: errorData
        },
        message: errorData.message || 'Request failed'
      };
    }

    const text = await response.text();
    const responseData = text ? JSON.parse(text) : {};

    return { data: responseData };
  } catch (err: any) {
    if (err.response) throw err;
    throw {
      message: err.message || 'Network error',
      response: { status: 0, data: { message: err.message || 'Network error' } }
    };
  }
};

const apiClient = {
  get: (url: string) => request('GET', url),
  post: (url: string, data?: any, config?: any) => request('POST', url, data, config),
  put: (url: string, data?: any) => request('PUT', url, data),
  delete: (url: string) => request('DELETE', url),
};

export default apiClient;
