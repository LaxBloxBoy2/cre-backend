"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type NotificationVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  id: string;
  title?: string;
  message: string;
  variant?: NotificationVariant;
  duration?: number;
  onClose: (id: string) => void;
  className?: string;
}

export function Notification({
  id,
  title,
  message,
  variant = 'default',
  duration = 5000,
  onClose,
  className,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Allow time for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return "border-l-4 border-green-400 bg-green-900/20";
      case 'error':
        return "border-l-4 border-red-400 bg-red-900/20";
      case 'warning':
        return "border-l-4 border-yellow-400 bg-yellow-900/20";
      case 'info':
        return "border-l-4 border-blue-400 bg-blue-900/20";
      default:
        return "border-l-4 border-accent bg-dark-card-hover";
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={cn(
        "max-w-sm w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden transition-all duration-300 transform",
        getVariantStyles(),
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && <p className="text-sm font-medium text-white">{title}</p>}
            <p className="mt-1 text-sm text-text-secondary">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 300);
              }}
              className="inline-flex text-text-secondary hover:text-white transition-colors duration-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
