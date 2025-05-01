'use client';

import { useContext } from 'react';
import { ToastContext } from '../../contexts/ToastContext';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  className?: string;
}

export function useToast() {
  const { showToast } = useContext(ToastContext);

  return {
    toast: ({ title, description, variant = 'default' }: ToastProps) => {
      // Map the variant to the ToastType expected by the context
      const toastType = variant === 'destructive' ? 'error' : 
                        variant === 'success' ? 'success' : 
                        variant === 'warning' ? 'warning' : 'info';
      
      // Use the description if provided, otherwise use the title
      const message = description || title;
      
      showToast(message, toastType);
    }
  };
}
