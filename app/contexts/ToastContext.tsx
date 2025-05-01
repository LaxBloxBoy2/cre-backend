'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '../components/ui/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastOptions {
  title?: string;
  description: string;
  variant?: ToastType;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (options: ToastOptions) => {
    const id = Date.now().toString();
    const message = options.title
      ? `${options.title}: ${options.description}`
      : options.description;
    const type = options.variant || 'default';

    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
