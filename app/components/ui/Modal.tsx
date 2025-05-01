"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className={cn(
          "bg-card-dark rounded-xl shadow-lg border border-dark-card-hover w-full transition-all duration-200",
          maxWidth,
          className
        )}
      >
        {title && (
          <div className="px-6 py-4 border-b border-dark-card-hover">
            <h3 className="text-lg font-medium text-white">{title}</h3>
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-dark-card-hover flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
