
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [endTime, setEndTime] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Zaman güncelleme fonksiyonu
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR'));
      
      // Geri sayım hesapla
      const storedEndTime = localStorage.getItem('maintenanceEndTime');
      if (storedEndTime) {
        const end = new Date(storedEndTime).getTime();
        const now = new Date().getTime();
        const diff = end - now;
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          setTimeRemaining(`${hours}s ${minutes}d ${seconds}sn`);
          setEndTime(storedEndTime);
        } else {
          setTimeRemaining('');
          setEndTime('');
        }
      }
    };

    // İlk zaman ayarla
    updateTime();
    
    // Her saniye güncelle
    const timeInterval = setInterval(updateTime, 1000);

    let mounted = true;
    let checkInterval: NodeJS.Timeout;

    const checkMaintenanceStatus = async () => {
      if (!mounted || isRedirecting) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout

        const response = await fetch('/api/settings/maintenance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          const apiMaintenanceMode = result.maintenanceMode || false;

          console.log('Maintenance page check - MySQL API:', apiMaintenanceMode);

          // Bakım modu kapatıldıysa ana sayfaya yönlendir
          if (!apiMaintenanceMode && mounted) {
            console.log('Maintenance disabled, redirecting to home...');
            setIsRedirecting(true);
            router.push('/');
          }
        } else {
          console.warn(`Maintenance API returned ${response.status}, continuing with local state`);
        }
      } catch (error) {
        console.warn('Maintenance status check warning:', error);
        
        // API hatası durumunda ana sayfaya yönlendir
        if (mounted) {
          console.log('Maintenance API error, redirecting to home...');
          setIsRedirecting(true);
          router.push('/');
        }
      }
    };

    // Storage değişikliklerini dinle
    const handleStorageChange = (e: StorageEvent) => {
      if (!mounted) return;
      
      if (e.key === 'maintenanceMode') {
        const newMaintenanceMode = e.newValue === 'true';
        console.log('Maintenance page - storage change:', newMaintenanceMode);
        
        if (!newMaintenanceMode) {
          console.log('Storage change: redirecting to home from maintenance page');
          setIsRedirecting(true);
          router.push('/');
        }
      }
    };

    // Visibility change - sekme değişimlerinde kontrol
    const handleVisibilityChange = () => {
      if (!mounted || isRedirecting) return;
      if (!document.hidden) {
        console.log('Maintenance page became visible, checking status...');
        checkMaintenanceStatus();
      }
    };

    // Window focus - sayfa odaklandığında kontrol
    const handleWindowFocus = () => {
      if (!mounted || isRedirecting) return;
      console.log('Maintenance page focused, checking status...');
      checkMaintenanceStatus();
    };

    // Custom event listener (admin panelinden gelen değişiklikler)
    const handleMaintenanceChange = (e: CustomEvent) => {
      if (!mounted) return;
      
      const { maintenanceMode, source, synced } = e.detail;
      console.log('Maintenance page - custom event:', { maintenanceMode, source, synced });
      
      if (!maintenanceMode && synced) {
        console.log('Custom event: redirecting to home from maintenance page');
        setIsRedirecting(true);
        router.push('/');
      }
    };

    // İlk kontrol
    checkMaintenanceStatus();

    // 5 saniyede bir periyodik kontrol (daha az sık)
    checkInterval = setInterval(checkMaintenanceStatus, 5000);

    // Event listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('maintenanceModeChanged', handleMaintenanceChange as EventListener);

    // Cleanup
    return () => {
      mounted = false;
      clearInterval(timeInterval);
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('maintenanceModeChanged', handleMaintenanceChange as EventListener);
    };
  }, [router, isRedirecting]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Maintenance Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-tools-fill text-4xl text-orange-600 dark:text-orange-400"></i>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Site Bakımda</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Şu anda sitemiz bakım çalışmaları nedeniyle geçici olarak hizmet dışında.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700 dark:text-gray-300 font-medium">Durum</span>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-orange-600 dark:text-orange-400 font-medium">Bakım Devam Ediyor</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {timeRemaining ? 'Kalan Süre' : 'Tahmini Süre'}
              </span>
              <span className="text-gray-800 dark:text-gray-200 font-semibold">
                {timeRemaining || 'Kısa süre'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Son Güncelleme</span>
              <span className="text-gray-800" suppressHydrationWarning={true}>
                {currentTime}
              </span>
            </div>
          </div>

          {isRedirecting && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center text-green-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                <span className="text-sm">Bakım tamamlandı! Ana sayfaya yönlendiriliyorsunuz...</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Animation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <i className="ri-settings-3-line text-gray-600"></i>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Sistem Güncellemeleri</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Veritabanı optimizasyonu</span>
              <span className="text-xs text-green-600 ml-auto">Tamamlandı</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Sistem senkronizasyonu</span>
              <span className="text-xs text-blue-600 ml-auto">Devam ediyor</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-600">Cache temizliği</span>
              <span className="text-xs text-gray-500 ml-auto">Bekliyor</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Bizimle İletişimde Kalın</h3>
          <p className="text-gray-600 text-sm mb-4">
            Acil durumlar için aşağıdaki kanallardan bize ulaşabilirsiniz.
          </p>
          
          <div className="space-y-2">
            <a href="https://www.instagram.com/tolgademir1914" target="_blank" rel="noopener noreferrer" 
               className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
              <i className="ri-instagram-line"></i>
              <span className="text-sm">Instagram</span>
            </a>
            <a href="https://whatsapp.com/channel/0029VbC6iaFJUM2YHVSaFP0e" target="_blank" rel="noopener noreferrer"
               className="flex items-center space-x-3 text-gray-600 hover:text-green-600 transition-colors cursor-pointer">
              <i className="ri-whatsapp-line"></i>
              <span className="text-sm">WhatsApp Kanalı</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Anlayışınız için teşekkürler. En kısa sürede geri döneceğiz!
          </p>
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Sistem otomatik olarak kontrol edilmektedir...
          </div>
        </div>
      </div>
    </div>
  );
}
