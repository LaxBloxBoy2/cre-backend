'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { UserSettingsProvider } from '../contexts/UserSettingsContext';
import { ToastProvider } from '../contexts/ToastContext';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';

interface OptimizedClientLayoutProps {
  children: React.ReactNode;
}

export default function OptimizedClientLayout({ children }: OptimizedClientLayoutProps) {
  // Create a client
  const [queryClient] = useState(() => new QueryClient());
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    try {
      // Skip authentication check for login and public pages
      const isPublicPage = pathname === '/login' || pathname === '/' || pathname === '/test';
      console.log('Layout - Current path:', pathname, 'Is public page:', isPublicPage);

      if (isPublicPage) {
        // Don't check auth for public pages
        setIsLoading(false);
        return;
      }

      // Check if user is authenticated
      const token = localStorage.getItem('accessToken');
      console.log('Layout - Token exists:', !!token);

      // Special handling for demo token
      if (token === 'demo_access_token') {
        console.log('Layout - Using demo token');
        setIsAuthenticated(true);
        setIsLoading(false);

        // In a real app, we would fetch alerts from the API
        // For now, we'll just use a mock count
        setAlertCount(3);
        return;
      }

      if (!token) {
        console.log('Layout - No token and not on public page, redirecting to login');
        // Use router for a cleaner navigation experience
        router.push('/login');
      } else {
        setIsAuthenticated(true);

        // In a real app, we would fetch alerts from the API
        // For now, we'll just use a mock count
        setAlertCount(3);
      }
    } catch (error) {
      console.error('Layout - Error checking authentication:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router, pathname]);

  // Render function to handle different states
  const renderContent = () => {
    // Don't show layout for login and public pages
    if (pathname === '/login' || pathname === '/' || pathname === '/test') {
      return children;
    }

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg" suppressHydrationWarning>
          <div className="text-center" suppressHydrationWarning>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4 mx-auto" suppressHydrationWarning></div>
            <h1 className="text-2xl font-bold text-white mb-2" suppressHydrationWarning>Loading QAPT Platform...</h1>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect to login
    }

    return (
      <div className="flex h-screen bg-dark-bg" suppressHydrationWarning>
        <Sidebar alertCount={alertCount} />
        <div className="flex-1 flex flex-col overflow-hidden" suppressHydrationWarning>
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-dark-bg-secondary p-4" suppressHydrationWarning>
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UserSettingsProvider>
            <ToastProvider>
              {renderContent()}
            </ToastProvider>
          </UserSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
