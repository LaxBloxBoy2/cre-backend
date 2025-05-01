'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DarkCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  actions?: React.ReactNode;
}

export function DarkCard({
  title,
  description,
  children,
  className,
  headerClassName,
  bodyClassName,
  titleClassName,
  descriptionClassName,
  actions,
}: DarkCardProps) {
  return (
    <div
      className={cn(
        'bg-dark-card shadow-lg rounded-lg overflow-hidden transition-all duration-200 hover:shadow-accent-glow/10 border border-dark-border',
        className
      )}
    >
      {(title || description || actions) && (
        <div
          className={cn(
            'px-4 py-5 sm:px-6 border-b border-dark-border flex justify-between items-center',
            headerClassName
          )}
        >
          <div>
            {title && (
              <h3 className={cn('text-lg leading-6 font-medium text-white', titleClassName)}>
                {title}
              </h3>
            )}
            {description && (
              <p className={cn('mt-1 max-w-2xl text-sm text-text-secondary', descriptionClassName)}>
                {description}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className={cn('px-4 py-5 sm:p-6', bodyClassName)}>{children}</div>
    </div>
  );
}
