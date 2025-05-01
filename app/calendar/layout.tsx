'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

interface CalendarLayoutProps {
  children: ReactNode;
}

export default function CalendarLayout({ children }: CalendarLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="w-full">
        {children}
      </div>
    </ProtectedRoute>
  );
}
