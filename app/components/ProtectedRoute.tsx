'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import SimpleLayout from './SimpleLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, checkAuth } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Only run this once
    if (!isChecking) return;

    const checkAuthentication = async () => {
      try {
        // Check if user is authenticated
        const isAuth = checkAuth();
        console.log('ProtectedRoute - Auth check result:', isAuth);

        // If not authenticated, redirect to login
        if (!isAuth) {
          console.log('ProtectedRoute - Not authenticated, redirecting to login');
          setRedirecting(true);

          // Small delay to ensure state updates before redirect
          setTimeout(() => {
            // Use router for a cleaner navigation experience
            router.push('/login');
          }, 100);
        } else {
          console.log('ProtectedRoute - User is authenticated');
        }
      } catch (error) {
        console.error('ProtectedRoute - Error checking auth:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, [checkAuth, router, isChecking]);

  // If redirecting, show a message
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-lg flex flex-col items-center" style={{ color: 'var(--text-primary)' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'var(--accent)' }}></div>
          <div>Redirecting to login...</div>
        </div>
      </div>
    );
  }

  // If still checking or not authenticated, show loading state
  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-lg flex flex-col items-center" style={{ color: 'var(--text-primary)' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'var(--accent)' }}></div>
          <div>Checking authentication...</div>
        </div>
      </div>
    );
  }

  // If authenticated, render children with SimpleLayout
  return <SimpleLayout>{children}</SimpleLayout>;
}
