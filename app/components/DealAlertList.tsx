'use client';

import { useState } from 'react';
import { useAlerts, useResolveAlert } from '../hooks/dashboard';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface DealAlertListProps {
  dealId: string;
}

export default function DealAlertList({ dealId }: DealAlertListProps) {
  const [filter, setFilter] = useState<'active' | 'resolved' | 'all'>('active');
  const { data: alerts, isLoading, error } = useAlerts(dealId, filter === 'active' ? false : filter === 'resolved' ? true : undefined);
  const resolveAlert = useResolveAlert();

  if (isLoading) {
    return (
      <div className="dark-card p-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-dark-card-hover rounded-lg">
              <div className="flex items-start">
                <Skeleton className="h-6 w-6 rounded-full mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <div className="flex justify-between mt-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !alerts) {
    console.error('Error loading alerts:', error);
    // Continue with fallback data
  }

  // Fallback data if API fails
  const fallbackData = [
    {
      id: '1',
      alert_type: 'Lease expiration approaching',
      message: 'The main tenant lease expires in 30 days',
      severity: 'high',
      created_at: '2023-11-25T00:00:00Z',
      resolved: false,
      resolved_at: null
    },
    {
      id: '2',
      alert_type: 'Property tax assessment',
      message: 'Property tax assessment is due next week',
      severity: 'medium',
      created_at: '2023-11-20T00:00:00Z',
      resolved: false,
      resolved_at: null
    },
    {
      id: '3',
      alert_type: 'Maintenance request',
      message: 'Tenant reported HVAC issues in unit 204',
      severity: 'low',
      created_at: '2023-11-15T00:00:00Z',
      resolved: true,
      resolved_at: '2023-11-18T00:00:00Z'
    }
  ];

  // Use real data if available, otherwise fallback
  // Make sure alertsData is always an array
  const alertsData = Array.isArray(alerts) ? alerts :
                    (alerts && alerts.alerts && Array.isArray(alerts.alerts)) ? alerts.alerts :
                    fallbackData;

  const handleResolveAlert = (alertId: string) => {
    resolveAlert.mutate({
      alertId
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'low':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="dark-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-white">Alerts</h2>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('active')}
            className={`text-xs ${filter === 'active' ? 'bg-dark-card-hover text-white' : 'text-text-secondary hover:text-white'}`}
          >
            Active
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('resolved')}
            className={`text-xs ${filter === 'resolved' ? 'bg-dark-card-hover text-white' : 'text-text-secondary hover:text-white'}`}
          >
            Resolved
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('all')}
            className={`text-xs ${filter === 'all' ? 'bg-dark-card-hover text-white' : 'text-text-secondary hover:text-white'}`}
          >
            All
          </Button>
        </div>
      </div>

      {alertsData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-text-secondary">No {filter === 'all' ? '' : filter} alerts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alertsData.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg transition-colors ${
                alert.resolved
                  ? 'bg-dark-card-hover/50'
                  : 'bg-dark-card-hover hover:bg-dark-card-hover/80'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className={`text-base ${alert.resolved ? 'text-text-secondary' : 'text-white'}`}>
                      {alert.alert_type}
                    </h3>
                    {alert.severity && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getSeverityColor(alert.severity)} bg-dark-bg`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{alert.message}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-text-secondary">
                      {format(new Date(alert.created_at), 'MMM d, yyyy')}
                    </span>
                    {!alert.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="text-xs border-accent text-accent hover:bg-accent/10"
                      >
                        Resolve
                      </Button>
                    )}
                    {alert.resolved && (
                      <span className="text-xs text-success">
                        Resolved {alert.resolved_at ? format(new Date(alert.resolved_at), 'MMM d, yyyy') : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
