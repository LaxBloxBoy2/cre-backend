'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

interface LPLayoutProps {
  children: ReactNode;
}

export default function LPLayout({ children }: LPLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="w-full">
        {children}
      </div>
    </ProtectedRoute>
  );
}
