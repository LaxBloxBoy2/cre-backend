'use client';

import axios from 'axios';

// Base URL for the API
export const API_BASE_URL = 'https://cre-backend-0pvq.onrender.com';

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout to 60 seconds to accommodate slower responses
  timeout: 60000,
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('accessToken');

        // Special handling for demo token
        if (token === 'demo_access_token') {
          console.log('Using demo token for request');
          config.headers.Authorization = `Bearer demo_access_token`;
          return config;
        }

        if (token) {
          console.log('Adding auth token to request');
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('No auth token found for request');
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh and better error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't log 401 errors as they're expected when not authenticated
    if (error.response && error.response.status !== 401) {
      console.error('API Error:', error.response?.status, error.response?.data || error.message);
    }

    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    // Special handling for demo token - never try to refresh it
    const token = localStorage.getItem('accessToken');
    if (token === 'demo_access_token') {
      console.log('Using demo token - skipping refresh attempt');

      // For demo token, we'll just return a rejected promise without redirecting
      // This allows the fallback data to be used
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Attempting token refresh for 401 error');
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error('No refresh token available');
          // No refresh token, redirect to login

          // Clear any existing tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');

          // Small delay to ensure localStorage is cleared
          await new Promise(resolve => setTimeout(resolve, 100));

          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // For demo purposes, we'll just simulate a successful refresh
        if (window.location.hostname === 'localhost') {
          console.log('Running on localhost - simulating successful refresh');

          // Simulate a successful token refresh
          const newAccessToken = 'demo_access_token';
          const newRefreshToken = 'demo_refresh_token';

          // Save the new tokens
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        // Call the refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/refresh`, {
          refresh_token: refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Token refresh successful');

        // Save the new tokens
        localStorage.setItem('accessToken', response.data.access_token);
        localStorage.setItem('refreshToken', response.data.refresh_token);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);

        // If refresh token is invalid, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Small delay to ensure localStorage is cleared
        await new Promise(resolve => setTimeout(resolve, 100));

        // Only redirect to login if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // For 404 errors, just reject the promise without redirecting
    // This allows the fallback data to be used
    if (error.response?.status === 404) {
      console.log('404 error - endpoint not found, using fallback data');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
