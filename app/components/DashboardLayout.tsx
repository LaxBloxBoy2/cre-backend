'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-card transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
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
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    pathname === '/dashboard'
                      ? 'bg-dark-card-hover text-accent'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    pathname.startsWith('/deals') && !pathname.includes('/progress')
                      ? 'bg-dark-card-hover text-accent'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Deals
                </Link>
              </li>
              <li>
                <Link
                  href="/tasks"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    pathname === '/tasks'
                      ? 'bg-dark-card-hover text-accent'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Tasks
                </Link>
              </li>
              <li>
                <Link
                  href="/alerts"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    pathname === '/alerts'
                      ? 'bg-dark-card-hover text-accent'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Alerts
                </Link>
              </li>
              <li>
                <Link
                  href="/calendar"
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    pathname === '/calendar'
                      ? 'bg-dark-card-hover text-accent'
                      : 'text-text-secondary hover:text-white hover:bg-dark-card-hover/50'
                  }`}
                >
                  <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Calendar
                </Link>
              </li>
            </ul>

            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Recent Deals
              </h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/deals/1"
                    className="flex items-center px-3 py-2 text-sm rounded-md text-text-secondary hover:text-white hover:bg-dark-card-hover/50 transition-colors"
                  >
                    Palo Alto Networks HQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/deals/2"
                    className="flex items-center px-3 py-2 text-sm rounded-md text-text-secondary hover:text-white hover:bg-dark-card-hover/50 transition-colors"
                  >
                    The Residences at Park Place
                  </Link>
                </li>
                <li>
                  <Link
                    href="/deals/3"
                    className="flex items-center px-3 py-2 text-sm rounded-md text-text-secondary hover:text-white hover:bg-dark-card-hover/50 transition-colors"
                  >
                    Westlake Shopping Center
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-dark-border">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-dark-card-hover flex items-center justify-center text-white">
                JD
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-text-secondary">john@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-dark-card shadow-lg border-b border-dark-border">
          <div className="h-16 px-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-text-secondary hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 px-4 flex justify-end">
              <div className="flex items-center space-x-4">
                <button className="text-text-secondary hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <button className="text-text-secondary hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
