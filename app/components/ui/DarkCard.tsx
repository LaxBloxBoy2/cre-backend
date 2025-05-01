"use client";

import React from 'react';
import { cn } from '../../lib/utils';

interface DarkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function DarkCard({
  title,
  subtitle,
  icon,
  footer,
  hoverable = true,
  className,
  children,
  ...props
}: DarkCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl shadow-lg border transition-all duration-200",
        hoverable && "hover:shadow-accent-glow hover:scale-[1.02]",
        className
      )}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-dark)'
      }}
      {...props}
    >
      {(title || icon) && (
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-dark)' }}>
          <div>
            {title && <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{title}</h3>}
            {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          {icon && <div style={{ color: 'var(--accent)' }}>{icon}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && <div className="p-4 border-t" style={{ borderColor: 'var(--border-dark)' }}>{footer}</div>}
    </div>
  );
}
