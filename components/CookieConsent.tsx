'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Çerez Kullanımı
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sitemizde deneyiminizi geliştirmek için çerezler kullanıyoruz. 
              Google Analytics ile site kullanımınızı anonim olarak takip ediyoruz. 
              Detaylar için{' '}
              <a 
                href="/privacy-policy" 
                className="text-orange-600 dark:text-orange-400 hover:underline"
              >
                gizlilik politikamızı
              </a>{' '}
              inceleyebilirsiniz.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              Sadece Gerekli
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
