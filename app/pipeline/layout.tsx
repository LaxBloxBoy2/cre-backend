'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

interface PipelineLayoutProps {
  children: ReactNode;
}

export default function PipelineLayout({ children }: PipelineLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="w-full">
        {children}
      </div>
    </ProtectedRoute>
  );
}
