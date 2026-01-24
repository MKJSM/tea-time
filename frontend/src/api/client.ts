import axios from 'axios';

// Base configuration
const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});


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
