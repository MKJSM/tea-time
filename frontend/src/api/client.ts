import axios from 'axios';
import { config } from '../config';

const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
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
