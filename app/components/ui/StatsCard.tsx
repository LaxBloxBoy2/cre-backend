"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { DarkCard } from './DarkCard';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    positive?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  className,
}: StatsCardProps) {
  return (
    <DarkCard className={cn("overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
          {change && (
            <p className={cn(
              "text-sm mt-1",
              change.positive ? "text-green-400" : "text-red-400"
            )}>
              {change.positive ? '↑' : '↓'} {change.value}
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
