'use client';

import { useState, useEffect } from 'react';

interface SitePreviewProps {
  onClose: () => void;
}

export default function SitePreview({ onClose }: SitePreviewProps) {
  const [currentUrl, setCurrentUrl] = useState('/');

  const previewPages = [
    { url: '/', name: 'Ana Sayfa', icon: 'ri-home-line' },
    { url: '/about', name: 'Hakkımda', icon: 'ri-user-line' },
    { url: '/books', name: 'Kitaplar', icon: 'ri-book-line' },
    { url: '/contact', name: 'İletişim', icon: 'ri-mail-line' }
  ];

  const handlePageChange = (url: string) => {
    setCurrentUrl(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Site Önizleme</h2>
            <div className="flex items-center space-x-2">
              {previewPages.map(page => (
                <button
                  key={page.url}
                  onClick={() => handlePageChange(page.url)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    currentUrl === page.url
                      ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <i className={page.icon}></i>
                  <span>{page.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>

            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-300 font-mono">
              {window.location.origin}{currentUrl}
            </div>

            <button
              onClick={() => window.open(`${window.location.origin}${currentUrl}`, '_blank')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-external-link-line mr-2"></i>
              Yeni Sekmede Aç
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={`${window.location.origin}${currentUrl}`}
            className="w-full h-full border-0"
            title="Site Preview"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Site Aktif</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="ri-time-line"></i>
                <span>Son güncelleme: {new Date().toLocaleString('tr-TR')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-1"></i>
                Yenile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}