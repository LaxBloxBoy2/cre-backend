import axios from 'axios';

// Get the API URL from environment variables or use a default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cre-backend-0pvq.onrender.com';
console.log('Using API URL:', API_URL);

// Create an axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to handle authentication
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add demo token for development
    if (process.env.NODE_ENV === 'development') {
      config.headers['X-Demo-Token'] = 'demo-token';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.status, error.response.data);

      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }

      // Handle 404 Not Found errors
      if (error.response.status === 404) {
        console.warn('API endpoint not found. This might be expected during development.');
      }

      // Handle 500 Internal Server Error
      if (error.response.status >= 500) {
        console.error('Server error. Please try again later or contact support.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
      console.warn('No response received from the server. Check your network connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Setup:', error.message);
    }

    return Promise.reject(error);
  }
);
