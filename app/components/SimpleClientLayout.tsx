'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface SimpleClientLayoutProps {
  children: React.ReactNode;
}

// Create a client
const queryClient = new QueryClient();

export default function SimpleClientLayout({ children }: SimpleClientLayoutProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-dark-bg">
        {children}
      </div>
    </QueryClientProvider>
  );
}
