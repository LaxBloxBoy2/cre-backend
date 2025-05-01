'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

interface ToolsLayoutProps {
  children: ReactNode;
}

export default function ToolsLayout({ children }: ToolsLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="w-full">
        {children}
      </div>
    </ProtectedRoute>
  );
}
