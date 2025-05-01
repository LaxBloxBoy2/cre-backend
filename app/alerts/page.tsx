'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAlerts, resolveAlert } from '../lib/api';
import axios from 'axios';

interface Alert {
  id: string;
  deal_id: string;
  deal_name: string;
  alert_type: 'market_change' | 'lease_expiration' | 'cap_rate_shift' | 'approval_needed' | 'document_required';
  severity: 'low' | 'medium' | 'high';
  message: string;
  created_at: string;
  is_resolved: boolean;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      if (process.env.NODE_ENV === 'production') {
        const data = await getAlerts();
        setAlerts(data);
      } else {
        // For development, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockAlerts: Alert[] = [
          {
            id: '1',
            deal_id: '1',
            deal_name: 'Downtown Office Tower',
            alert_type: 'market_change',
            severity: 'high',
            message: 'Market vacancy rates have increased by 3% in the last month, potentially affecting your underwriting assumptions.',
            created_at: '2023-06-15T10:30:00Z',
            is_resolved: false,
          },
          {
            id: '2',
            deal_id: '2',
            deal_name: 'Suburban Retail Center',
            alert_type: 'lease_expiration',
            severity: 'medium',
            message: 'Major tenant lease expires in 60 days with no renewal confirmation.',
            created_at: '2023-06-10T14:45:00Z',
            is_resolved: false,
          },
          {
            id: '3',
            deal_id: '3',
            deal_name: 'Industrial Park',
            alert_type: 'approval_needed',
            severity: 'high',
            message: 'Deal has been in review for 14 days and requires manager approval to proceed.',
            created_at: '2023-06-05T09:15:00Z',
            is_resolved: false,
          },
          {
            id: '4',
            deal_id: '4',
            deal_name: 'Luxury Apartments',
            alert_type: 'document_required',
            severity: 'low',
            message: 'Property inspection report is missing from the document repository.',
            created_at: '2023-06-01T16:20:00Z',
            is_resolved: true,
          },
          {
            id: '5',
            deal_id: '5',
            deal_name: 'Mixed-Use Development',
            alert_type: 'cap_rate_shift',
            severity: 'medium',
            message: 'Cap rates for similar properties have compressed by 25 basis points, potentially increasing property value.',
            created_at: '2023-05-28T11:10:00Z',
            is_resolved: true,
          },
        ];

        setAlerts(mockAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchAlerts();
  }, [router]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      // Show loading state
      setLoading(true);

      // Call the API to resolve the alert
      if (process.env.NODE_ENV === 'production') {
        await resolveAlert(alertId);
        // Re-fetch the alerts to get the updated list
        await fetchAlerts();
      } else {
        // In development, simulate API call and update local state
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update local state
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.id === alertId ? { ...alert, is_resolved: true } : alert
          )
        );

        // Show success message
        alert('Alert resolved successfully!');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('Failed to resolve alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'active') return !alert.is_resolved;
    if (filter === 'resolved') return alert.is_resolved;
    return true;
  });

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'market_change':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'lease_expiration':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'approval_needed':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'document_required':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'cap_rate_shift':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Alerts</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'resolved' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'active'
                  ? 'You have no active alerts at this time.'
                  : filter === 'resolved'
                  ? 'You have no resolved alerts.'
                  : 'You have no alerts at this time.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <li key={alert.id} className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      {getAlertTypeIcon(alert.alert_type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          <Link href={`/deals/${alert.deal_id}`} className="hover:underline">
                            {alert.deal_name}
                          </Link>
                        </p>
                        <div className="flex items-center">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityBadgeClass(
                              alert.severity
                            )}`}
                          >
                            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">{formatDate(alert.created_at)}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                      <div className="mt-2 flex justify-end">
                        {!alert.is_resolved ? (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-green-800">
                            <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
