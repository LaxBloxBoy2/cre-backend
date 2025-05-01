'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  children,
  className,
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: "bg-dark-card-hover text-text-secondary",
    success: "bg-green-900/30 text-green-400",
    warning: "bg-yellow-900/30 text-yellow-400",
    danger: "bg-red-900/30 text-red-400",
    info: "bg-blue-900/30 text-blue-400",
    accent: "bg-dark-card-hover text-accent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
