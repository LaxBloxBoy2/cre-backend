import axios from 'axios';
import { TokenResponse, UserLogin } from '@/types/user';
import { Deal, DealCreate, DealUpdate, DealSummary, ChatRequest, ChatResponse } from '@/types/deal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the token to requests
api.interceptors.request.use(
  (config) => {
    // Only add the token if we're in a browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Call the refresh endpoint
        const response = await axios.post(`${API_URL}/token/refresh`, { refresh_token: refreshToken }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const { access_token, refresh_token } = response.data;

        // Update tokens in localStorage
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async (credentials: UserLogin): Promise<TokenResponse> => {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await axios.post(`${API_URL}/token`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Deal endpoints
export const getDeals = async (): Promise<Deal[]> => {
  const response = await api.get('/api/deals');
  return response.data;
};

export const getDeal = async (id: string): Promise<Deal> => {
  const response = await api.get(`/api/deals/${id}`);
  return response.data;
};

export const createDeal = async (deal: DealCreate): Promise<Deal> => {
  const response = await api.post('/api/deals', deal);
  return response.data;
};

export const updateDeal = async (id: string, deal: DealUpdate): Promise<Deal> => {
  const response = await api.put(`/api/deals/${id}`, deal);
  return response.data;
};

export const deleteDeal = async (id: string): Promise<void> => {
  await api.delete(`/api/deals/${id}`);
};

// Portfolio endpoints
export const getPortfolioSummary = async (): Promise<DealSummary> => {
  const response = await api.get('/api/portfolio');
  return response.data;
};

// AI Chat endpoints
export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post('/ai-chat/v3', request);
  return response.data;
};

export default api;
