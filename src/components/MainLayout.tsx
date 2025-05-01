'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(3); // Example alert count

  useEffect(() => {
    // In a real app, we would get the user info from the JWT token
    // For now, we'll just use mock data
    setUserName('John Doe');
    setUserRole('Analyst');
  }, []);

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Redirect to login page
    router.push('/login');
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-transparent transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-dark-border">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-md bg-gradient-to-r from-accent to-accent/80 flex items-center justify-center text-dark-bg font-bold text-lg">
                CRE
              </div>
              <span className="ml-2 text-lg font-semibold text-white">CRE Platform</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="font-medium">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive('/deals')
                      ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Deals</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/tasks"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive('/tasks')
                      ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="font-medium">Tasks</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/alerts"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive('/alerts')
                      ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="font-medium">Alerts</span>
                  {alertCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-accent text-dark-bg rounded-full text-xs">
                      {alertCount}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/calendar"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive('/calendar')
                      ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Calendar</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/lp"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive('/lp')
                      ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">LP Portal</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive('/settings')
                      ? 'bg-dark-card-hover text-accent shadow-accent-glow'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Settings</span>
                </Link>
              </li>
            </ul>

            {/* Recent Deals Section - Moved to Dashboard */}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-dark-border">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-dark-card-hover flex items-center justify-center text-white">
                JD
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-text-secondary">
                  {userRole && (
                    <span className="px-2 py-0.5 bg-dark-card-hover text-accent rounded-full text-xs">
                      {userRole}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto text-text-secondary hover:text-accent transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-dark-card shadow-lg border-b border-dark-border">
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-text-secondary hover:text-white transition-colors mr-4"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="lg:hidden flex items-center mr-4">
                <div className="w-8 h-8 rounded-md bg-gradient-to-r from-accent to-accent/80 flex items-center justify-center text-dark-bg font-bold text-lg">
                  CRE
                </div>
              </div>
              <h2 className="text-xl font-semibold text-white">
                {/* Dynamic title based on current page */}
                {pathname.includes('/deals/')
                  ? 'Deal Details'
                  : pathname.includes('/deals')
                    ? 'Deals'
                    : pathname.includes('/dashboard')
                      ? 'Dashboard'
                      : pathname.includes('/tasks')
                        ? 'Tasks'
                        : pathname.includes('/alerts')
                          ? 'Alerts'
                          : pathname.includes('/calendar')
                            ? 'Calendar'
                            : pathname.includes('/lp')
                              ? 'LP Portal'
                              : pathname.includes('/settings')
                                ? 'Settings'
                                : 'CRE Platform'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-text-secondary hover:text-accent transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <Link href="/alerts" className="relative text-text-secondary hover:text-accent transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {alertCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-accent text-dark-bg rounded-full text-xs px-1.5 py-0.5">
                    {alertCount}
                  </span>
                )}
              </Link>
              <Link href="/settings" className="text-text-secondary hover:text-accent transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <div className="md:hidden">
                <button
                  onClick={handleLogout}
                  className="text-text-secondary hover:text-accent transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-dark-bg p-6">
          {children}
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
