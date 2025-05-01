'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import QaptLogo from './QaptLogo';
import ThemeToggle from './ThemeToggle';
import TopAlerts from './TopAlerts';

export default function Topbar() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, we would get the user info from the JWT token
    // For now, we'll just use mock data
    setUserName('John Doe');
    setUserRole('Analyst');
  }, []);

  const handleLogout = () => {
    console.log('Topbar - Logout button clicked');
    try {
      logout();
    } catch (error) {
      console.error('Topbar - Error during logout:', error);
      // Fallback logout method if the context method fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
  };

  return (
    <div className="h-16 flex items-center justify-between px-6 shadow-lg"
         style={{
           backgroundColor: 'var(--bg-card)',
           borderBottom: '1px solid var(--border-dark)'
         }}>
      <div className="flex items-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {/* Dynamic title based on current page */}
          {typeof window !== 'undefined' && window.location.pathname.includes('/deals/')
            ? 'Deal Details'
            : window.location.pathname.includes('/deals')
              ? 'Deals'
              : window.location.pathname.includes('/dashboard')
                ? 'Dashboard'
                : 'QAPT'}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <TopAlerts />
        <ThemeToggle variant="icon" />
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{userName}</span>
          {userRole && (
            <span className="ml-2 px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: 'var(--bg-card-hover)',
                    color: 'var(--accent)'
                  }}>
              {userRole}
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="transition-colors duration-200"
          style={{
            color: 'var(--text-muted)',
            ':hover': { color: 'var(--accent)' }
          }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
