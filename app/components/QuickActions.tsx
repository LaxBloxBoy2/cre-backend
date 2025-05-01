'use client';

import { useQuickActionCounts } from '../hooks/dashboard';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';

export default function QuickActions() {
  const { data, isLoading, error } = useQuickActionCounts();

  if (isLoading) {
    return (
      <div className="dark-card p-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center p-3 bg-dark-card-hover rounded-lg">
              <div className="mr-4">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    console.error('Error loading quick actions data:', error);
    // Continue with fallback data
  }

  // Fallback data if API fails
  const fallbackData = {
    pending_tasks: 5,
    unresolved_alerts: 3,
    upcoming_deadlines: 2
  };

  // Use real data if available, otherwise fallback
  const displayData = data || fallbackData;

  return (
    <div className="dark-card p-6">
      <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
      <div className="space-y-4">
        <Link href="/tasks" className="flex items-center p-3 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition-colors">
          <div className="mr-4 bg-blue-500/20 p-2 rounded-full">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white">Pending Tasks</h3>
            <p className="text-xs text-text-secondary">You have {displayData.pending_tasks} pending tasks</p>
          </div>
          <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/alerts" className="flex items-center p-3 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition-colors">
          <div className="mr-4 bg-red-500/20 p-2 rounded-full">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white">Unresolved Alerts</h3>
            <p className="text-xs text-text-secondary">{displayData.unresolved_alerts} alerts require attention</p>
          </div>
          <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/calendar" className="flex items-center p-3 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition-colors">
          <div className="mr-4 bg-yellow-500/20 p-2 rounded-full">
            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white">Upcoming Deadlines</h3>
            <p className="text-xs text-text-secondary">{displayData.upcoming_deadlines} deadlines in the next 7 days</p>
          </div>
          <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
