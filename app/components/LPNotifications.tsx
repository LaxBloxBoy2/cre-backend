'use client';

import { useState, useEffect } from 'react';
import { BellIcon } from '@radix-ui/react-icons';
import { useUserSettings } from '../contexts/UserSettingsContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'deal' | 'system' | 'update';
  dealId?: string;
}

export default function LPNotifications() {
  const { settings } = useUserSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Mock notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Quarterly Update',
        message: 'New quarterly update available for Riverside Plaza',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        type: 'update',
        dealId: '1'
      },
      {
        id: '2',
        title: 'Distribution Notice',
        message: 'A distribution of $12,500 has been processed for Oakwood Heights',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: false,
        type: 'deal',
        dealId: '2'
      },
      {
        id: '3',
        title: 'New Investment Opportunity',
        message: 'Check out our latest multifamily acquisition opportunity in Austin, TX',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        read: true,
        type: 'deal',
        dealId: '3'
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Don't render if notifications are disabled
  if (!settings.notificationsEnabled) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="p-2 rounded-full bg-dark-card-hover hover:bg-dark-card-hover/80 text-text-secondary hover:text-white transition-colors duration-200 relative"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-accent text-dark-card text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-dark-card shadow-lg rounded-lg border border-dark-border z-50">
          <div className="p-4 border-b border-dark-border flex justify-between items-center">
            <h3 className="text-sm font-medium text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-text-secondary text-sm">
                No notifications
              </div>
            ) : (
              <ul className="divide-y divide-dark-border">
                {notifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`p-4 hover:bg-dark-card-hover/50 transition-colors cursor-pointer ${!notification.read ? 'bg-dark-card-hover/30' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-2 w-2 mt-1.5 rounded-full ${!notification.read ? 'bg-accent' : 'bg-transparent'}`}></div>
                      <div className="ml-2 flex-1">
                        <p className="text-sm font-medium text-white">{notification.title}</p>
                        <p className="text-xs text-text-secondary mt-1">{notification.message}</p>
                        <p className="text-xs text-text-secondary/70 mt-1">
                          {notification.date.toLocaleTimeString()} - {notification.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
