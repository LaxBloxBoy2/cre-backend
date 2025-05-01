'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DarkCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

export function DarkCard({
  title,
  subtitle,
  children,
  className,
  footer,
  hoverable = true,
}: DarkCardProps) {
  return (
    <div 
      className={cn(
        "bg-dark-card rounded-xl shadow-lg overflow-hidden",
        hoverable && "transition-all duration-200 hover:shadow-accent-glow/10",
        className
      )}
    >
      {(title || subtitle) && (
        <div className="p-4 border-b border-dark-border">
          {title && <h3 className="text-lg font-medium text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
      
      {footer && (
        <div className="p-4 border-t border-dark-border bg-dark-card-hover">
          {footer}
        </div>
      )}
    </div>
  );
}
