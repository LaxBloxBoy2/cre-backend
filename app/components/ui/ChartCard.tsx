"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { DarkCard } from './DarkCard';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  chart: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  chart,
  className,
  footer,
}: ChartCardProps) {
  return (
    <DarkCard 
      title={title}
      subtitle={subtitle}
      footer={footer}
      className={cn("overflow-hidden", className)}
      hoverable={false}
    >
      <div className="h-64">
        {chart}
      </div>
    </DarkCard>
  );
}
