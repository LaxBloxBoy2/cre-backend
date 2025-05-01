'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import SidebarLink from './SidebarLink';
import QaptLogo from './QaptLogo';
import HamburgerToggle from './HamburgerToggle';
import RecentlyViewed from './RecentlyViewed';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { KanbanIcon } from './icons';

interface SidebarProps {
  alertCount?: number;
}

export default function Sidebar({ alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { showToast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDealsOpen, setIsDealsOpen] = useState(false);
  const [isLeasesOpen, setIsLeasesOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load collapsed state
      const savedCollapsed = localStorage.getItem('qaptSidebarCollapsed');
      if (savedCollapsed) {
        setCollapsed(savedCollapsed === 'true');
      }
    }
  }, []);

  // Get the active deal ID from the URL if we're on a deal page
  // Also check if we're on a tools page or lease management page
  useEffect(() => {
    if (pathname.startsWith('/deals/') && params.id) {
      setActiveDealId(params.id as string);
      setIsDealsOpen(true);
    }

    if (pathname.startsWith('/tools')) {
      setIsToolsOpen(true);
    }

    if (pathname.startsWith('/tools/lease-management')) {
      setIsLeasesOpen(true);
    }
  }, [pathname, params]);

  useEffect(() => {
    // In a real app, we would get the user role from the JWT token
    // For now, we'll just use a mock role
    setUserRole('Analyst');
  }, []);

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  // Fetch deals for the dropdown
  const { data: deals } = useQuery({
    queryKey: ['deals-sidebar'],
    queryFn: () => api.get('/api/deals').then(res => res.data),
    enabled: isDealsOpen,
  });

  // Handle sidebar toggle
  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);

    // Save to localStorage
    localStorage.setItem('qaptSidebarCollapsed', newCollapsed ? 'true' : 'false');

    // Show toast notification
    showToast(`Sidebar ${newCollapsed ? 'collapsed' : 'expanded'}`, 'success');
  };

  // Handle parent item click when sidebar is collapsed
  const handleParentClick = (e: React.MouseEvent, setStateFunction: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (collapsed) {
      e.preventDefault();
      e.stopPropagation();

      // Expand the sidebar
      setCollapsed(false);
      localStorage.setItem('qaptSidebarCollapsed', 'false');

      // Open the dropdown
      setStateFunction(true);
    }
  };

  return (
    <div
      className={`sidebar h-full flex flex-col shadow-lg relative ${collapsed ? 'sidebar-collapsed' : ''}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)'
      }}
      aria-expanded={!collapsed}
    >
      <div className="p-4 flex items-center justify-between"
           style={{ borderBottom: '1px solid var(--border-dark)' }}>
        <h1 className="text-xl font-bold flex items-center">
          {collapsed ? (
            <QaptLogo className="h-6 w-6" style={{ color: 'var(--accent)' }} />
          ) : (
            <>
              <QaptLogo className="h-6 w-6 mr-2" style={{ color: 'var(--accent)' }} />
              <span className="font-semibold tracking-tight">QAPT</span>
            </>
          )}
        </h1>
        <HamburgerToggle collapsed={collapsed} onToggle={handleToggle} />
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          <li className="relative group">
            <Link
              href="/dashboard"
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200`}
              style={{
                backgroundColor: isActive('/dashboard') ? 'var(--bg-card-hover)' : 'transparent',
                color: isActive('/dashboard') ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <svg
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="link-label">Dashboard</span>
            </Link>

            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
              <div className="px-2 py-1 rounded shadow-lg whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--bg-card-hover)',
                     color: 'var(--text-primary)',
                     border: '1px solid var(--border-dark)'
                   }}>
                Dashboard
              </div>
            </div>
          </li>
          <li className="space-y-1 relative group">
            <button
              onClick={(e) => {
                handleParentClick(e, setIsDealsOpen);
                if (!collapsed) {
                  setIsDealsOpen(!isDealsOpen);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-md transition-all duration-200`}
              style={{
                backgroundColor: isActive('/deals') ? 'var(--bg-card-hover)' : 'transparent',
                color: isActive('/deals') ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="link-label">Deals</span>
              </div>
              {!collapsed && (
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${isDealsOpen ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 top-6 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
              <div className="px-2 py-1 rounded shadow-lg whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--bg-card-hover)',
                     color: 'var(--text-primary)',
                     border: '1px solid var(--border-dark)'
                   }}>
                Deals
              </div>
            </div>

            {isDealsOpen && (
              <div className="pl-10 space-y-1">
                <Link
                  href="/deals"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname === '/deals' ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname === '/deals' ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  All Deals
                </Link>

                <Link
                  href="/pipeline"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname === '/pipeline' ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname === '/pipeline' ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  Pipeline
                </Link>

                {activeDealId && (
                  <>
                    <Link
                      href={`/deals/${activeDealId}`}
                      className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                      style={{
                        backgroundColor: pathname === `/deals/${activeDealId}` ? 'var(--bg-card-hover)' : 'transparent',
                        color: pathname === `/deals/${activeDealId}` ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      Overview
                    </Link>

                    <Link
                      href={`/deals/${activeDealId}/scenarios`}
                      className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                      style={{
                        backgroundColor: pathname === `/deals/${activeDealId}/scenarios` ? 'var(--bg-card-hover)' : 'transparent',
                        color: pathname === `/deals/${activeDealId}/scenarios` ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      Scenarios
                    </Link>

                    <Link
                      href={`/deals/${activeDealId}/underwriting`}
                      className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                      style={{
                        backgroundColor: pathname === `/deals/${activeDealId}/underwriting` ? 'var(--bg-card-hover)' : 'transparent',
                        color: pathname === `/deals/${activeDealId}/underwriting` ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      Underwriting
                    </Link>

                    <Link
                      href={`/deals/${activeDealId}/progress`}
                      className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                      style={{
                        backgroundColor: pathname === `/deals/${activeDealId}/progress` ? 'var(--bg-card-hover)' : 'transparent',
                        color: pathname === `/deals/${activeDealId}/progress` ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      Progress
                    </Link>

                    <Link
                      href={`/deals/${activeDealId}/waterfall`}
                      className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                      style={{
                        backgroundColor: pathname === `/deals/${activeDealId}/waterfall` ? 'var(--bg-card-hover)' : 'transparent',
                        color: pathname === `/deals/${activeDealId}/waterfall` ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      Waterfall
                    </Link>
                  </>
                )}
              </div>
            )}
          </li>
          {/* Tools Section */}
          <li className="space-y-1 relative group">
            <button
              onClick={(e) => {
                handleParentClick(e, setIsToolsOpen);
                if (!collapsed) {
                  setIsToolsOpen(!isToolsOpen);
                }
              }}
              className="w-full flex items-center justify-between px-4 py-2 rounded-md transition-all duration-200"
              style={{
                backgroundColor: isActive('/tools') ? 'var(--bg-card-hover)' : 'transparent',
                color: isActive('/tools') ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="link-label">Tools</span>
              </div>
              {!collapsed && (
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${isToolsOpen ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 top-6 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
              <div className="px-2 py-1 rounded shadow-lg whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--bg-card-hover)',
                     color: 'var(--text-primary)',
                     border: '1px solid var(--border-dark)'
                   }}>
                Tools
              </div>
            </div>

            {isToolsOpen && (
              <div className="pl-10 space-y-1.5">
                <Link
                  href="/tools/doc-room"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname.startsWith('/tools/doc-room') ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname.startsWith('/tools/doc-room') ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Doc Room
                </Link>

                <Link
                  href="/tools/e-signature"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname.startsWith('/tools/e-signature') ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname.startsWith('/tools/e-signature') ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  e-Signature
                </Link>

                <Link
                  href="/comps"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname.startsWith('/comps') ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname.startsWith('/comps') ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Market Comps
                </Link>

                <Link
                  href="/tools/bulk-import"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname.startsWith('/tools/bulk-import') ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname.startsWith('/tools/bulk-import') ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Bulk Import
                </Link>

                <Link
                  href="/tools/invoices"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname.startsWith('/tools/invoices') ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname.startsWith('/tools/invoices') ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Invoices
                </Link>

                <Link
                  href="/tools/funds"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname.startsWith('/tools/funds') ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname.startsWith('/tools/funds') ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Fund Management
                </Link>



                <Link
                  href="/tools/fund-optimizer"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname.startsWith('/tools/fund-optimizer') ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname.startsWith('/tools/fund-optimizer') ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Fund Optimizer
                </Link>
              </div>
            )}
          </li>

          {/* LP Portal */}
          <li className="relative group">
            <Link
              href="/lp"
              className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
              style={{
                backgroundColor: isActive('/lp') ? 'var(--bg-card-hover)' : 'transparent',
                color: isActive('/lp') ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <svg
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="link-label">LP Portal</span>
            </Link>

            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
              <div className="px-2 py-1 rounded shadow-lg whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--bg-card-hover)',
                     color: 'var(--text-primary)',
                     border: '1px solid var(--border-dark)'
                   }}>
                LP Portal
              </div>
            </div>
          </li>
          {userRole === 'Admin' || userRole === 'Manager' ? (
            <li className="relative group">
              <Link
                href="/admin"
                className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                style={{
                  backgroundColor: isActive('/admin') ? 'var(--bg-card-hover)' : 'transparent',
                  color: isActive('/admin') ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                <svg
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="link-label">Admin</span>
              </Link>

              {/* Tooltip for collapsed state */}
              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
                <div className="px-2 py-1 rounded shadow-lg whitespace-nowrap"
                     style={{
                       backgroundColor: 'var(--bg-card-hover)',
                       color: 'var(--text-primary)',
                       border: '1px solid var(--border-dark)'
                     }}>
                  Admin
                </div>
              </div>
            </li>
          ) : null}
          <li className="relative group">
            <Link
              href="/calendar"
              className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
              style={{
                backgroundColor: isActive('/calendar') ? 'var(--bg-card-hover)' : 'transparent',
                color: isActive('/calendar') ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <svg
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="link-label">Calendar</span>
            </Link>

            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
              <div className="px-2 py-1 rounded shadow-lg whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--bg-card-hover)',
                     color: 'var(--text-primary)',
                     border: '1px solid var(--border-dark)'
                   }}>
                Calendar
              </div>
            </div>
          </li>
          {/* Leases Section */}
          <li className="space-y-1 relative group">
            <button
              onClick={(e) => {
                handleParentClick(e, setIsLeasesOpen);
                if (!collapsed) {
                  setIsLeasesOpen(!isLeasesOpen);
                }
              }}
              className="w-full flex items-center justify-between px-4 py-2 rounded-md transition-all duration-200"
              style={{
                backgroundColor: pathname.startsWith('/tools/lease-management') ? 'var(--bg-card-hover)' : 'transparent',
                color: pathname.startsWith('/tools/lease-management') ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="link-label">Leases</span>
              </div>
              {!collapsed && (
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${isLeasesOpen ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 top-6 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
              <div className="px-2 py-1 rounded shadow-lg whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--bg-card-hover)',
                     color: 'var(--text-primary)',
                     border: '1px solid var(--border-dark)'
                   }}>
                Leases
              </div>
            </div>

            {isLeasesOpen && (
              <div className="pl-10 space-y-1.5">
                <Link
                  href="/tools/lease-management"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname === '/tools/lease-management' ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname === '/tools/lease-management' ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Dashboard
                </Link>

                <Link
                  href="/tools/lease-management/leases"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname === '/tools/lease-management/leases' ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname === '/tools/lease-management/leases' ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Leases
                </Link>

                <Link
                  href="/tools/lease-management/rent-roll"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname === '/tools/lease-management/rent-roll' ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname === '/tools/lease-management/rent-roll' ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Rent Roll
                </Link>

                <Link
                  href="/tools/lease-management/tenants"
                  className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: pathname.startsWith('/tools/lease-management/tenants') ? 'var(--bg-card-hover)' : 'transparent',
                    color: pathname.startsWith('/tools/lease-management/tenants') ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    letterSpacing: '0.01em',
                    paddingTop: '0.4rem',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Tenants
                </Link>
              </div>
            )}
          </li>
          <li className="relative group">
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 rounded-md transition-all duration-200"
              style={{
                backgroundColor: isActive('/settings') ? 'var(--bg-card-hover)' : 'transparent',
                color: isActive('/settings') ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              <svg
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="link-label">Settings</span>
            </Link>

            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 hidden group-hover:sidebar-collapsed:block">
              <div className="px-2 py-1 rounded shadow-lg whitespace-nowrap"
                   style={{
                     backgroundColor: 'var(--bg-card-hover)',
                     color: 'var(--text-primary)',
                     border: '1px solid var(--border-dark)'
                   }}>
                Settings
              </div>
            </div>
          </li>
        </ul>

        {/* Recently Viewed Deals */}
        {!collapsed && <RecentlyViewed />}
      </nav>
      <div className="p-4" style={{ borderTop: '1px solid var(--border-dark)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>Role: <span style={{ color: 'var(--accent)' }}>{userRole || 'Loading...'}</span></p>
          <p className="mt-1">Version: <span style={{ color: 'var(--text-primary)' }}>1.0.0</span></p>
        </div>
      </div>
    </div>
  );
}
