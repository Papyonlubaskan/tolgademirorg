'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-500';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-amber-500';
      case 'info':
      default:
        return 'bg-gradient-to-r from-orange-500 to-pink-500';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'ri-check-circle-line';
      case 'error':
        return 'ri-error-warning-line';
      case 'warning':
        return 'ri-alert-line';
      case 'info':
      default:
        return 'ri-information-line';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${getToastStyles(toast.type)} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in`}
            style={{
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <i className={`${getToastIcon(toast.type)} text-2xl`}></i>
            <p className="flex-1 font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Kapat"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
