'use client';

import { useDashboardMetrics } from '../hooks/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '../lib/utils';
import { Skeleton } from './ui/skeleton';
import MetricExplainer from './MetricExplainer';

export default function DashboardCards() {
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-dark)' }}>
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 mr-4" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                <Skeleton className="h-6 w-6" />
              </div>
              <div className="w-full">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Error loading dashboard metrics:', error);
    // Continue with fallback data
  }

  // Fallback data if API fails or data is not available
  const fallbackMetrics = {
    total_deals: 12,
    average_cap_rate: 5.8,
    average_development_margin: 18.5,
    total_project_cost: 24500000,
    average_rent_per_sf: 32.75,
    average_irr: 15.2,
    average_dscr: 1.35,
    deals_by_status: {
      draft: 3,
      in_review: 4,
      approved: 3,
      rejected: 1,
      archived: 1
    },
    deals_by_type: {
      office: 4,
      retail: 3,
      industrial: 2,
      multifamily: 2,
      mixed_use: 1
    }
  };

  // Use real data if available, otherwise fallback
  const displayMetrics = metrics || fallbackMetrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="rounded-xl border overflow-hidden shadow-md" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)',
        boxShadow: '0 0 12px rgba(0, 255, 179, 0.1)'
      }}>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-muted)' }}>Total Deals</dt>
                <dd className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{displayMetrics.total_deals}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-md" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)',
        boxShadow: '0 0 12px rgba(0, 255, 179, 0.1)'
      }}>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium truncate flex items-center" style={{ color: 'var(--text-muted)' }}>
                  Average Cap Rate
                  <MetricExplainer metric="cap_rate" value={displayMetrics.average_cap_rate} />
                </dt>
                <dd className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(displayMetrics.average_cap_rate)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-md" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)',
        boxShadow: '0 0 12px rgba(0, 255, 179, 0.1)'
      }}>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium truncate flex items-center" style={{ color: 'var(--text-muted)' }}>
                  Avg Development Margin
                  <MetricExplainer metric="development_margin" value={displayMetrics.average_development_margin} />
                </dt>
                <dd className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPercentage(displayMetrics.average_development_margin)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
