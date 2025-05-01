'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

interface AlertsLayoutProps {
  children: ReactNode;
}

export default function AlertsLayout({ children }: AlertsLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="w-full">
        {children}
      </div>
    </ProtectedRoute>
  );
}
