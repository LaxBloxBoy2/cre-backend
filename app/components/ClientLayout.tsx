'use client';

import React from 'react';
import Layout from './Layout';
import { UserSettingsProvider } from '../contexts/UserSettingsContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import QueryProvider from '../providers/QueryProvider';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserSettingsProvider>
          <ToastProvider>
            <QueryProvider>
              <Layout>{children}</Layout>
            </QueryProvider>
          </ToastProvider>
        </UserSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
