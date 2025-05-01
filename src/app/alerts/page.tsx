'use client';

import { useState } from 'react';
import { useAlerts, useResolveAlert, Alert } from '@/hooks/useAlerts';
import { format, parseISO } from 'date-fns';

export default function AlertsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'resolved' | 'unresolved'>('all');

  // Fetch alerts with React Query
  const { data, isLoading, error } = useAlerts(
    undefined, // No deal ID filter
    statusFilter === 'all' ? undefined : statusFilter === 'resolved'
  );

  // Alert resolution mutation
  const resolveAlertMutation = useResolveAlert();

  // Filter alerts by type
  const filteredAlerts = data?.alerts ? data.alerts.filter(alert => {
    if (typeFilter === 'all') return true;
    return alert.alert_type.toLowerCase().includes(typeFilter.toLowerCase());
  }) : [];

  // Get alert type display name
  const getAlertTypeDisplay = (type: string): { name: string, className: string } => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('status') || lowerType.includes('approved')) {
      return { name: 'Status Update', className: 'bg-success/20 text-success' };
    } else if (lowerType.includes('comment')) {
      return { name: 'Comment', className: 'bg-info/20 text-info' };
    } else if (lowerType.includes('task') || lowerType.includes('deadline')) {
      return { name: 'Task', className: 'bg-warning/20 text-warning' };
    } else if (lowerType.includes('risk') || lowerType.includes('error')) {
      return { name: 'Risk', className: 'bg-error/20 text-error' };
    } else {
      return { name: 'Info', className: 'bg-info/20 text-info' };
    }
  };

  // Mark alert as resolved
  const markAsResolved = (alertId: string) => {
    resolveAlertMutation.mutate({
      alertId,
      data: { resolution_note: 'Marked as resolved by user' }
    });
  };

  // Mark all alerts as resolved
  const markAllAsResolved = () => {
    if (filteredAlerts.length === 0) return;

    if (confirm('Are you sure you want to mark all alerts as resolved?')) {
      // In a real app, we would have a batch operation endpoint
      // For now, we'll resolve them one by one
      filteredAlerts.forEach(alert => {
        if (!alert.resolved) {
          markAsResolved(alert.id);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-dark-card-hover text-text-secondary rounded-md hover:text-white transition-all duration-200"
            onClick={markAllAsResolved}
            disabled={isLoading || filteredAlerts.length === 0 || filteredAlerts.every(a => a.resolved)}
          >
            Mark All as Resolved
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-accent-gradient-from to-accent-gradient-to text-white rounded-md hover:shadow-accent-glow transition-all duration-200">
            Settings
          </button>
        </div>
      </div>

      <div className="bg-dark-card rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-dark-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
          <div className="flex space-x-2">
            <select
              className="bg-dark-bg text-text-secondary border border-dark-border rounded-md px-3 py-1 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="status">Status Updates</option>
              <option value="comment">Comments</option>
              <option value="task">Tasks</option>
              <option value="risk">Risk Alerts</option>
            </select>
            <select
              className="bg-dark-bg text-text-secondary border border-dark-border rounded-md px-3 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error">
            <p>Error loading alerts. Please try again.</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <p>No alerts found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {filteredAlerts.map((alert) => {
              const alertType = getAlertTypeDisplay(alert.alert_type);
              return (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-dark-card-hover transition-colors ${
                    !alert.resolved ? 'border-l-4 border-accent' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 p-1.5 rounded-full ${alertType.className}`}>
                        {alertType.name === 'Status Update' ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : alertType.name === 'Comment' || alertType.name === 'Info' ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : alertType.name === 'Task' ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{alertType.name}</h3>
                        <p className="text-sm text-text-secondary mt-1">{alert.message}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          {format(parseISO(alert.created_at), 'MMM dd, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!alert.resolved && (
                        <button
                          onClick={() => markAsResolved(alert.id)}
                          className="text-text-secondary hover:text-accent transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
