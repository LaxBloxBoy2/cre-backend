'use client';

import React, { useState, useEffect } from 'react';
import { getDealActivity } from '../../lib/api';
import { formatRelativeTime } from '../../lib/utils/date';
import { useToast } from '../../contexts/ToastContext';

interface Activity {
  id: string;
  deal_id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

interface ActivityLogProps {
  dealId: string;
}

export default function ActivityLog({ dealId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (expanded) {
      fetchActivities();
    }
  }, [expanded, dealId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      if (process.env.NODE_ENV === 'production') {
        const data = await getDealActivity(dealId);
        setActivities(data);
      } else {
        // Use mock data for development
        await new Promise(resolve => setTimeout(resolve, 1000));
        setActivities([
          {
            id: '1',
            deal_id: dealId,
            user_id: 'user1',
            user_name: 'John Doe',
            action: 'ran_underwriting',
            details: 'Ran underwriting analysis',
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          },
          {
            id: '2',
            deal_id: dealId,
            user_id: 'user2',
            user_name: 'Jane Smith',
            action: 'added_comment',
            details: 'Added a comment',
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          },
          {
            id: '3',
            deal_id: dealId,
            user_id: 'user3',
            user_name: 'Bob Johnson',
            action: 'updated_deal',
            details: 'Updated deal details',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      showToast('Failed to load activity log. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ran_underwriting':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'added_comment':
        return (
          <div className="h-8 w-8 rounded-full bg-green-900/30 flex items-center justify-center">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'updated_deal':
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-dark-card-hover flex items-center justify-center">
            <svg className="h-5 w-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="dark-card shadow-lg rounded-lg overflow-hidden mt-4 transition-all duration-200 hover:shadow-accent-glow/10">
      <div
        className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-dark-card-hover cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg leading-6 font-medium text-white">Activity Log</h3>
        <button
          type="button"
          className="text-text-secondary hover:text-white transition-colors duration-200"
          aria-expanded={expanded}
          aria-label="Toggle activity log"
        >
          <svg
            className={`h-5 w-5 transform ${expanded ? 'rotate-180' : ''} transition-transform duration-200`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-4 py-5 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <svg className="animate-spin h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-sm text-text-secondary">Loading activities...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-text-secondary">No activities recorded yet.</p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {activities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== activities.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-dark-card-hover" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>{getActionIcon(activity.action)}</div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-text-secondary">
                              <span className="font-medium text-white">{activity.user_name}</span> {activity.details}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-text-secondary">
                            {formatRelativeTime(activity.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
