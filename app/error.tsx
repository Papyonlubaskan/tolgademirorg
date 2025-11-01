'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
            <i className="ri-error-warning-line text-5xl text-gradient"></i>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Bir Şeyler Yanlış Gitti
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Üzgünüz, bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin veya ana sayfaya dönün.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
            <p className="text-sm text-red-800 dark:text-red-300 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="btn-primary"
          >
            <i className="ri-refresh-line mr-2"></i>
            Tekrar Dene
          </button>
          
          <Link href="/" className="btn-secondary">
            <i className="ri-home-line mr-2"></i>
            Ana Sayfaya Dön
          </Link>
        </div>

        {/* Support Link */}
        <div className="mt-8">
          <Link 
            href="/iletisim" 
            className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
          >
            Sorun devam ediyorsa bize bildirin →
          </Link>
        </div>
      </div>
    </div>
  );
}
