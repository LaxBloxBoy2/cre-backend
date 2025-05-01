'use client';

import { useRouter } from 'next/navigation';
import { useDashboardMetrics, useRiskScore, useDealStatusBreakdown, useQuickActionCounts } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const router = useRouter();

  // Fetch dashboard data with React Query
  const { data: metrics, isLoading: isMetricsLoading, error: metricsError } = useDashboardMetrics();
  const { data: riskScore, isLoading: isRiskLoading } = useRiskScore();
  const { data: statusBreakdown, isLoading: isStatusLoading } = useDealStatusBreakdown();
  const { data: quickActions, isLoading: isActionsLoading } = useQuickActionCounts();

  // Check if any data is loading
  const isLoading = isMetricsLoading || isRiskLoading || isStatusLoading || isActionsLoading;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-info/20 text-info';
      case 'in_review':
        return 'bg-warning/20 text-warning';
      case 'approved':
        return 'bg-success/20 text-success';
      case 'rejected':
        return 'bg-error/20 text-error';
      case 'archived':
        return 'bg-dark-card-hover text-text-secondary';
      default:
        return 'bg-dark-card-hover text-text-secondary';
    }
  };

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'text-success';
      case 'medium':
        return 'text-warning';
      case 'high':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex space-x-2">
          <select className="bg-dark-bg text-text-secondary border border-dark-border rounded-md px-3 py-1 text-sm">
            <option>All Deals</option>
            <option>Active Deals</option>
            <option>Archived Deals</option>
          </select>
          <button
            className="px-4 py-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200"
            onClick={() => router.push('/deals/new')}
          >
            New Deal
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading dashboard data...</p>
        </div>
      ) : metricsError ? (
        <div className="p-8 text-center text-error">
          <p>Error loading dashboard data. Please try again.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-dark-card rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-accent/10 mr-4">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Total Deals</h2>
                  <p className="text-3xl font-bold text-accent">{metrics?.total_deals || 0}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-secondary">Acquisition Value</p>
                  <p className="text-sm font-medium text-white">{formatCurrency(metrics?.total_acquisition_price || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Avg. Cap Rate</p>
                  <p className="text-sm font-medium text-white">{formatPercent(metrics?.average_cap_rate || 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-card rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">IRR vs Market</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-accent">{formatPercent(metrics?.average_irr || 0)}</p>
                  <p className="text-sm text-text-secondary">Average IRR</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-white">+3.4%</p>
                  <p className="text-xs text-text-secondary">vs Market (11.8%)</p>
                </div>
              </div>
              <div className="h-24 flex items-end justify-between">
                <div className="w-1/4 h-16 bg-accent/80 rounded-t-md"></div>
                <div className="w-1/4 h-20 bg-accent rounded-t-md"></div>
                <div className="w-1/4 h-12 bg-dark-bg rounded-t-md"></div>
                <div className="w-1/4 h-14 bg-dark-bg rounded-t-md"></div>
              </div>
            </div>

            <div className="bg-dark-card rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Risk Assessment</h2>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center w-full">
                  <div className="relative h-32 w-32 mx-auto">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-3xl font-bold text-white">{riskScore?.score || 50}</p>
                    </div>
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#2A2E37"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#36FFB0"
                        strokeWidth="3"
                        strokeDasharray={`${riskScore?.score || 50}, 100`}
                      />
                    </svg>
                  </div>
                  <p className={`text-sm font-medium ${getRiskLevelColor(riskScore?.level || 'medium')}`}>
                    {riskScore?.level?.toUpperCase() || 'MEDIUM'} RISK
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-text-secondary mb-2">Risk Factors:</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  {riskScore?.factors?.map((factor, index) => (
                    <li key={index} className="flex items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-error mr-2"></span>
                      {factor}
                    </li>
                  )) || (
                    <li className="flex items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-error mr-2"></span>
                      No risk factors available
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Deal Status and Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-card rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Deal Status</h2>
              <div className="space-y-4">
                {statusBreakdown?.statuses && Object.entries(statusBreakdown.statuses).map(([status, count]) => (
                  <div key={status} className="flex items-center">
                    <div className="w-32">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                        {status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${(count / statusBreakdown.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-8 text-right">
                      <span className="text-sm text-text-secondary">{count}</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-text-secondary">No status data available</p>
                )}
              </div>
            </div>

            <div className="bg-dark-card rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="p-4 bg-dark-bg rounded-lg hover:bg-dark-card-hover transition-colors"
                  onClick={() => router.push('/tasks')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Tasks Due Soon</span>
                    <span className="px-2 py-0.5 bg-warning/20 text-warning rounded-full text-xs">
                      {quickActions?.tasks_due_soon || 0}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">View and manage upcoming tasks</p>
                </button>

                <button
                  className="p-4 bg-dark-bg rounded-lg hover:bg-dark-card-hover transition-colors"
                  onClick={() => router.push('/alerts')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Unresolved Alerts</span>
                    <span className="px-2 py-0.5 bg-error/20 text-error rounded-full text-xs">
                      {quickActions?.alerts_unresolved || 0}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">Review important notifications</p>
                </button>

                <button
                  className="p-4 bg-dark-bg rounded-lg hover:bg-dark-card-hover transition-colors"
                  onClick={() => router.push('/deals?status=in_review')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Deals In Review</span>
                    <span className="px-2 py-0.5 bg-info/20 text-info rounded-full text-xs">
                      {quickActions?.deals_in_review || 0}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">Check deals awaiting approval</p>
                </button>

                <button
                  className="p-4 bg-dark-bg rounded-lg hover:bg-dark-card-hover transition-colors"
                  onClick={() => router.push('/documents')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Pending Documents</span>
                    <span className="px-2 py-0.5 bg-warning/20 text-warning rounded-full text-xs">
                      {quickActions?.documents_pending || 0}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">Upload or review documents</p>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
