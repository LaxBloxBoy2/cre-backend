'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { ToastProvider } from './contexts/ToastContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create a client
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UserSettingsProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </UserSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
