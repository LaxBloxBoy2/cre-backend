"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { DarkCard } from './DarkCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    positive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  onClick,
}: MetricCardProps) {
  return (
    <DarkCard 
      className={cn("overflow-hidden", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
          {description && (
            <p className="text-text-secondary text-xs mt-1">{description}</p>
          )}
          {trend && (
            <p className={cn(
              "text-sm mt-2 flex items-center",
              trend.positive ? "text-green-400" : "text-red-400"
            )}>
              {trend.positive ? (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-full bg-dark-card-hover text-accent">
            {icon}
          </div>
        )}
      </div>
    </DarkCard>
  );
}
