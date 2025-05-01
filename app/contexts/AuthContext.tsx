'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  isAuthenticated: boolean;
  logout: () => void;
  checkAuth: () => boolean;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  logout: () => {},
  checkAuth: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    // Use a small delay to ensure client-side only execution
    const timer = setTimeout(() => {
      const authStatus = checkAuth();
      console.log('Auth status on mount:', authStatus);
      setIsInitialized(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const checkAuth = (): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const token = localStorage.getItem('accessToken');
      // For demo credentials, always consider them valid
      if (token === 'demo_access_token') {
        console.log('Using demo token');
        setIsAuthenticated(true);
        return true;
      }

      // For real tokens, check if they exist
      const isAuth = !!token;
      console.log('Token exists:', isAuth);
      setIsAuthenticated(isAuth);
      return isAuth;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  };

  const logout = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      console.log('Logging out user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      console.log('Redirecting to login page');
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect even if there was an error
      window.location.href = '/login';
    }
  };

  // Create a client-side only loading component
  const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg" suppressHydrationWarning>
      <div className="text-white text-lg flex flex-col items-center" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4" suppressHydrationWarning></div>
        <div suppressHydrationWarning>Initializing application...</div>
      </div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ isAuthenticated, logout, checkAuth }}>
      {isInitialized ? children : <LoadingScreen />}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
