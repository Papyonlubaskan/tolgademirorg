'use client';

import { useState } from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
  fullScreen?: boolean;
}

export default function ErrorMessage({
  title,
  message,
  type = 'error',
  onRetry,
  onClose,
  className = '',
  fullScreen = false
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  const typeConfig = {
    error: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-400',
      icon: '❌',
      defaultTitle: 'Hata Oluştu'
    },
    warning: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-400',
      icon: '⚠️',
      defaultTitle: 'Uyarı'
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-400',
      icon: 'ℹ️',
      defaultTitle: 'Bilgi'
    }
  };

  const config = typeConfig[type];

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const content = (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 text-2xl mr-3">
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${config.textColor} mb-1`}>
            {title || config.defaultTitle}
          </h3>
          <p className={`text-sm ${config.textColor}`}>
            {message}
          </p>
          {(onRetry || onClose) && (
            <div className="mt-4 flex items-center space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  Tekrar Dene
                </button>
              )}
              {onClose && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Kapat
                </button>
              )}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className={`flex-shrink-0 ml-3 ${config.textColor} hover:opacity-70 transition-opacity`}
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

// Empty state bileşeni
export function EmptyState({
  icon = '📭',
  title = 'İçerik Bulunamadı',
  message = 'Henüz herhangi bir içerik bulunmuyor.',
  actionLabel,
  onAction,
  className = ''
}: {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// 404 Not Found bileşeni
export function NotFound({
  title = 'Sayfa Bulunamadı',
  message = 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.',
  onGoHome,
  className = ''
}: {
  title?: string;
  message?: string;
  onGoHome?: () => void;
  className?: string;
}) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      <div className="text-center px-4">
        <div className="text-9xl font-bold text-orange-500 mb-4">404</div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
          {message}
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onGoHome || (() => window.location.href = '/')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Ana Sayfaya Dön
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Geri Dön
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast notification bileşeni
export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  const typeConfig = {
    success: {
      bgColor: 'bg-green-500',
      icon: '✓'
    },
    error: {
      bgColor: 'bg-red-500',
      icon: '✕'
    },
    warning: {
      bgColor: 'bg-yellow-500',
      icon: '⚠'
    },
    info: {
      bgColor: 'bg-blue-500',
      icon: 'ℹ'
    }
  };

  const config = typeConfig[type];

  useState(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  });

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 ${config.bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-slide-in-bottom`}>
      <span className="text-xl">{config.icon}</span>
      <p className="font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          if (onClose) onClose();
        }}
        className="ml-4 text-white/80 hover:text-white transition-colors"
      >
        <i className="ri-close-line text-xl"></i>
      </button>
    </div>
  );
}

// Confirmation dialog
export function ConfirmDialog({
  title = 'Emin misiniz?',
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'İptal',
  onConfirm,
  onCancel,
  type = 'warning'
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}) {
  const typeConfig = {
    warning: {
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
      icon: '⚠️'
    },
    danger: {
      buttonColor: 'bg-red-500 hover:bg-red-600',
      icon: '🗑️'
    },
    info: {
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      icon: 'ℹ️'
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 text-4xl">
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message}
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 ${config.buttonColor} text-white rounded-lg transition-colors font-medium`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
