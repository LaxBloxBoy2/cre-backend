'use client';

import { useState, useEffect } from 'react';
import { BellIcon, Cross2Icon, CheckIcon } from '@radix-ui/react-icons';
import { useUserSettings } from '../contexts/UserSettingsContext';
import Link from 'next/link';

interface Alert {
  id: string;
  title: string;
  message: string;
  date: Date;
  type: 'info' | 'warning' | 'success';
  dealId?: string;
  read: boolean;
}

export default function TopAlerts() {
  const { settings } = useUserSettings();
  const [isOpen, setIsOpen] = useState(false);
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

  const unreadCount = alerts.filter(alert => !alert.read).length;

  const markAsRead = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id
          ? { ...alert, read: true }
          : alert
      )
    );
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
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
      case 'warning':
        return 'border-yellow-900/30';
      case 'success':
        return 'border-green-900/30';
      case 'info':
      default:
        return 'border-blue-900/30';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'info':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        );
      case 'warning':
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
            <svg className="h-4 w-4 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2E36] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
        </button>
        {unreadCount > 0 && (
          <span className="absolute bottom-0 right-0 bg-[#00F0B4] text-black text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1A1D23] shadow-lg rounded-lg border border-gray-200 dark:border-[#2F374A] z-50">
          <div className="p-4 border-b border-gray-200 dark:border-[#2F374A] flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Alerts & Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#00F0B4] hover:text-[#00D0A0] transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No alerts at this time
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-[#2F374A]">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-[#22272E]/50 transition-colors ${!alert.read ? 'bg-gray-50 dark:bg-[#22272E]/30' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          >
                            <Cross2Icon className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {alert.date.toLocaleDateString()} - {alert.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {!alert.read && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="text-xs text-[#00F0B4] hover:text-[#00D0A0] transition-colors"
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

          <div className="p-3 border-t border-gray-200 dark:border-[#2F374A]">
            <Link
              href="/alerts"
              className="block w-full text-center text-sm text-[#00F0B4] hover:text-[#00D0A0] transition-colors"
            >
              View all alerts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
