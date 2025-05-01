"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  variant = 'default',
  className,
  animated = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-4",
  };

  const variantClasses = {
    default: "bg-gradient-to-r from-[#30E3CA] to-[#11999E]",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-text-secondary">{label}</span>
          {showValue && (
            <span className="text-sm text-white">{value}{max !== 100 ? `/${max}` : '%'}</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-dark-card-hover rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "rounded-full transition-all duration-300 ease-in-out",
            variantClasses[variant],
            animated && "animate-pulse-glow",
            sizeClasses[size]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
