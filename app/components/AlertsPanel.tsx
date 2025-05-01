'use client';

import { useState } from 'react';
import { BellIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useUserSettings } from '../contexts/UserSettingsContext';

interface Alert {
  id: string;
  title: string;
  message: string;
  date: Date;
  type: 'info' | 'warning' | 'success';
  dealId?: string;
  read: boolean;
}

export default function AlertsPanel() {
  const { settings } = useUserSettings();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      title: 'Distribution Alert',
      message: 'Upcoming distribution for Oakwood Heights scheduled for next week.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      type: 'info',
      dealId: '2',
      read: false
    },
    {
      id: '2',
      title: 'Occupancy Change',
      message: 'Downtown Office Tower occupancy increased to 94%.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      type: 'success',
      dealId: '1',
      read: false
    },
    {
      id: '3',
      title: 'Cap Rate Warning',
      message: 'Market cap rates for retail properties are trending upward, potentially affecting Riverside Plaza exit valuation.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      type: 'warning',
      dealId: '3',
      read: true
    }
  ]);

  const markAsRead = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id
          ? { ...alert, read: true }
          : alert
      )
    );
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // Don't render if alerts are disabled
  if (settings && !settings.alertsEnabled) {
    return null;
  }

  const getAlertTypeStyles = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-900/20 border-blue-500/50 text-blue-200';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-200';
      case 'success':
        return 'bg-green-900/20 border-green-500/50 text-green-200';
      default:
        return 'bg-dark-card-hover border-dark-border text-white';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'info':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-blue-400" />
          </div>
        );
      case 'warning':
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckIcon className="h-4 w-4 text-green-400" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-dark-card-hover flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-text-secondary" />
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Alerts & Notifications</h3>
        {alerts.length > 0 && (
          <button
            className="text-xs text-accent hover:text-accent/80 transition-colors"
            onClick={() => setAlerts(prev => prev.map(alert => ({ ...alert, read: true })))}
          >
            Mark all as read
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 bg-dark-card-hover/50 rounded-lg">
          <BellIcon className="h-8 w-8 text-text-secondary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No alerts at this time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertTypeStyles(alert.type)} ${!alert.read ? 'shadow-lg' : 'opacity-80'}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium text-white">{alert.title}</h4>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-text-secondary hover:text-white transition-colors"
                    >
                      <Cross2Icon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{alert.message}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-text-secondary/70">
                      {alert.date.toLocaleDateString()} - {alert.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {!alert.read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="text-xs text-accent hover:text-accent/80 transition-colors"
                      >
                        Mark as read
                      </button>
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
