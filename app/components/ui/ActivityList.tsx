"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { DarkCard } from './DarkCard';

interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'update' | 'create' | 'delete' | 'other';
  value?: string;
  icon?: React.ReactNode;
}

interface ActivityListProps {
  activities: Activity[];
  title?: string;
  className?: string;
  showMore?: () => void;
}

export function ActivityList({
  activities,
  title = "Recent Activity",
  className,
  showMore,
}: ActivityListProps) {
  return (
    <DarkCard 
      title={title}
      className={cn("overflow-hidden", className)}
      footer={showMore ? (
        <button 
          onClick={showMore}
          className="text-accent hover:text-white transition-colors duration-200 text-sm w-full text-center"
        >
          Show more
        </button>
      ) : undefined}
    >
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={cn(
              "p-2 rounded-full mt-1",
              activity.type === 'update' && "bg-blue-500/20 text-blue-400",
              activity.type === 'create' && "bg-green-500/20 text-green-400",
              activity.type === 'delete' && "bg-red-500/20 text-red-400",
              activity.type === 'other' && "bg-purple-500/20 text-purple-400",
            )}>
              {activity.icon || (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {activity.type === 'update' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  )}
                  {activity.type === 'create' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  )}
                  {activity.type === 'delete' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  )}
                  {activity.type === 'other' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="text-white font-medium">{activity.title}</h4>
                <span className="text-text-secondary text-xs">{activity.timestamp}</span>
              </div>
              <p className="text-text-secondary text-sm mt-1">{activity.description}</p>
              {activity.value && (
                <p className="text-accent font-medium mt-1">{activity.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </DarkCard>
  );
}
