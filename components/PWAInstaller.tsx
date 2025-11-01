'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowInstallButton(false);
      }
    };

    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    checkInstalled();
    updateOnlineStatus();
    registerServiceWorker();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation dismissed');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('PWA installation error:', error);
    }
  };

  const handleUpdateClick = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  // Don't show if already installed or offline
  if (isInstalled || !isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showInstallButton && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <i className="ri-download-line text-orange-600 dark:text-orange-400 text-lg"></i>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Uygulamayı Yükle
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Bu siteyi ana ekranınıza ekleyerek daha hızlı erişim sağlayın.
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-md hover:bg-orange-700 transition-colors"
                >
                  Yükle
                </button>
                <button
                  onClick={() => setShowInstallButton(false)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Daha sonra
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowInstallButton(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <i className="ri-close-line text-sm"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
        <div className="flex items-center">
          <i className="ri-wifi-off-line text-yellow-600 dark:text-yellow-400 mr-2"></i>
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Çevrimdışısınız. Bazı özellikler sınırlı olabilir.
          </span>
        </div>
      </div>
    </div>
  );
}

// Update available notification
export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdate(true);
      });
    }
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <i className="ri-refresh-line text-blue-600 dark:text-blue-400 mr-2"></i>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Yeni güncelleme mevcut
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
          >
            Güncelle
          </button>
        </div>
      </div>
    </div>
  );
}
