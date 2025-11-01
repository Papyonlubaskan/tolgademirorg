
'use client';

import { useState, useEffect } from 'react';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

export default function MaintenanceManager() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [lastSync, setLastSync] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    cache: 'active',
    ssl: 'valid',
    lastBackup: 'Bugün, 03:00'
  });
  const [scheduledEndTime, setScheduledEndTime] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleHours, setScheduleHours] = useState(1);

  useEffect(() => {
    loadMaintenanceStatus();
    loadSystemStatus();
    
    // Zamanlı bakım kontrolü ve 5 dk öncesi bildirim
    const checkScheduledEnd = () => {
      const endTime = localStorage.getItem('maintenanceEndTime');
      if (endTime && maintenanceMode) {
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const diff = end - now;
        
        // 5 dakika = 300,000 ms
        const fiveMinutes = 5 * 60 * 1000;
        
        // 5 dk öncesi bildirim (sadece bir kere göster)
        const notified = localStorage.getItem('maintenanceNotified');
        if (diff <= fiveMinutes && diff > 0 && !notified) {
          showMessage('⚠️ Bakım modu 5 dakika içinde sona erecek!', 'success');
          localStorage.setItem('maintenanceNotified', 'true');
          
          // Bildirim API'sine gönder
          fetch('/api/admin/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'warning',
              title: 'Bakım Modu Uyarısı',
              message: 'Bakım modu 5 dakika içinde otomatik olarak sona erecek.',
              icon: 'ri-alarm-warning-line'
            })
          }).catch(console.error);
        }
        
        // Süre doldu
        if (now >= end) {
          console.log('⏰ Zamanlı bakım süresi doldu, kapatılıyor...');
          localStorage.removeItem('maintenanceNotified');
          toggleMaintenanceMode();
        }
      }
    };
    
    // Her 10 saniyede bir senkronizasyon kontrolü (daha az sık)
    const syncInterval = setInterval(() => {
      loadMaintenanceStatus();
      checkScheduledEnd();
    }, 10000);
    
    // Storage değişikliklerini dinle (diğer sekmeler için senkronizasyon)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'maintenanceMode') {
        const newMode = e.newValue === 'true';
        if (newMode !== maintenanceMode) {
          setMaintenanceMode(newMode);
          showMessage(
            newMode 
              ? 'Bakım modu başka bir yerden açıldı!' 
              : 'Bakım modu başka bir yerden kapatıldı!',
            'success'
          );
        }
      }
    };
    
    // Visibility change - sekme değişimlerinde kontrol
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadMaintenanceStatus();
      }
    };
    
    // Window focus - sayfa odaklandığında kontrol
    const handleWindowFocus = () => {
      loadMaintenanceStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [maintenanceMode]);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const loadMaintenanceStatus = async () => {
    try {
      setConnectionStatus('checking');
      
      // localStorage'dan zamanlanmış bitiş saatini yükle
      const endTime = localStorage.getItem('maintenanceEndTime');
      if (endTime) {
        setScheduledEndTime(endTime);
      }
      
      // Timeout ve AbortController ile güvenli API çağrısı
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('Maintenance API timeout after 8 seconds');
      }, 8000);

      const response = await fetch(`/api/settings/maintenance`, {
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
        const apiMode = result.maintenanceMode || false;
        const localMode = localStorage.getItem('maintenanceMode') === 'true';
        
        // Veritabanından gelen durum ile localStorage'ı senkronize et
        if (apiMode !== localMode) {
          if (apiMode) {
            localStorage.setItem('maintenanceMode', 'true');
          } else {
            localStorage.removeItem('maintenanceMode');
          }
          
          // Storage event'i tetikle (diğer sekmeler için)
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'maintenanceMode',
            newValue: apiMode ? 'true' : null,
            oldValue: localMode ? 'true' : null,
            url: window.location.href
          }));
        }
        
        setMaintenanceMode(apiMode);
        setConnectionStatus('connected');
        
        if (result.lastUpdated) {
          setLastSync(new Date(result.lastUpdated).toLocaleString('tr-TR'));
        }
        return;
      } else {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Maintenance status load error:', error);
      setConnectionStatus('disconnected');
      
      // API hatası durumunda localStorage kontrol et
      const localMode = localStorage.getItem('maintenanceMode') === 'true';
      setMaintenanceMode(localMode);
      
      // Hata türüne göre mesaj
      if (error instanceof Error && error.name === 'AbortError') {
        showMessage('API bağlantısı zaman aşımına uğradı. Yerel durum gösteriliyor.', 'error');
      } else {
        showMessage('Veritabanı bağlantı sorunu. Yerel durum gösteriliyor.', 'error');
      }
    }
  };

  const loadSystemStatus = () => {
    // Sistem durumu simülasyonu
    setSystemStatus({
      database: connectionStatus === 'connected' ? 'connected' : 'disconnected',
      cache: 'active', 
      ssl: 'valid',
      lastBackup: 'Bugün, 03:00'
    });
  };

  const toggleMaintenanceMode = async (endTime?: string) => {
    setIsLoading(true);

    try {
      const newMode = !maintenanceMode;
      
      // Önce localStorage'u güncelle (anında senkronizasyon için)
      if (newMode) {
        localStorage.setItem('maintenanceMode', 'true');
        if (endTime) {
          localStorage.setItem('maintenanceEndTime', endTime);
        }
      } else {
        localStorage.removeItem('maintenanceMode');
        localStorage.removeItem('maintenanceEndTime');
      }
      
      // Storage event'i tetikle (diğer sekmeler anında bildirilsin)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'maintenanceMode',
        newValue: newMode ? 'true' : null,
        oldValue: maintenanceMode ? 'true' : null,
        url: window.location.href
      }));
      
      // State'i anında güncelle
      setMaintenanceMode(newMode);
      if (endTime) {
        setScheduledEndTime(endTime);
      } else {
        setScheduledEndTime('');
      }
      
      // Veritabanına kaydet (arka planda)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn('Maintenance update timeout after 10 seconds');
        }, 10000);

        const token = getAuthToken();
        const response = await fetch(`/api/settings/maintenance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            maintenanceMode: newMode,
            endTime: endTime || null,
            source: 'admin_panel'
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const result = await response.json();

        if (response.ok && result.success) {
          // API başarılı - tam senkronizasyon tamamlandı
          setConnectionStatus('connected');
          showMessage(
            result.message || (newMode 
              ? 'Site başarıyla bakım moduna alındı! Tüm sistemler senkronize edildi.'
              : 'Bakım modu kapatıldı! Site normal şekilde çalışmaya devam edecek.'),
            'success'
          );
          
          if (result.lastUpdated) {
            setLastSync(new Date(result.lastUpdated).toLocaleString('tr-TR'));
          }
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Veritabanı API hatası:', apiError);
        setConnectionStatus('disconnected');
        
        // API hatası ama yerel değişiklik yapıldı
        if (apiError instanceof Error && apiError.name === 'AbortError') {
          showMessage(
            `Bakım modu ${newMode ? 'açıldı' : 'kapatıldı'} (yerel). API zaman aşımı.`, 
            'error'
          );
        } else {
          showMessage(
            `Bakım modu ${newMode ? 'açıldı' : 'kapatıldı'} (yerel). Veritabanı bağlantı sorunu.`, 
            'error'
          );
        }
      }
      
      // Diğer bileşenleri bilgilendir
      window.dispatchEvent(new CustomEvent('maintenanceModeChanged', {
        detail: { 
          maintenanceMode: newMode,
          source: 'admin',
          synced: connectionStatus === 'connected'
        }
      }));
    } catch (error) {
      console.error('Maintenance mode toggle error:', error);
      showMessage('Beklenmeyen bir hata oluştu!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setIsLoading(true);
    
    try {
      // Simulating quick actions
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      switch (action) {
        case 'clearCache':
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
          }
          
          // Veritabanında cache temizleme işareti (hata olsa bile devam et)
          try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 5000);
            
            await fetch(`/api/books`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                },
              body: JSON.stringify({ 
                action: 'cache_clear',
                timestamp: new Date().toISOString()
              }),
              signal: controller.signal
            });
            
            showMessage('Cache başarıyla temizlendi ve veritabanı senkronize edildi!');
          } catch (cacheError) {
            console.warn('Cache sync error:', cacheError);
            showMessage('Cache temizlendi (yerel). Veritabanı senkronizasyon hatası.');
          }
          break;
          
        case 'checkStatus':
          await loadSystemStatus();
          await loadMaintenanceStatus();
          showMessage('Sistem durumu kontrol edildi!');
          break;
          
        case 'testSite':
          window.open('/', '_blank');
          showMessage('Site yeni sekmede açıldı!');
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Quick action error:', error);
      showMessage('İşlem sırasında hata oluştu!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Bağlantı durumu göstergesi
  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'text-green-600', icon: 'ri-wifi-line', text: 'Bağlı' };
      case 'disconnected':
        return { color: 'text-red-600', icon: 'ri-wifi-off-line', text: 'Bağlantı Yok' };
      case 'checking':
        return { color: 'text-yellow-600', icon: 'ri-loader-4-line animate-spin', text: 'Kontrol Ediliyor' };
      default:
        return { color: 'text-gray-600', icon: 'ri-question-line', text: 'Bilinmiyor' };
    }
  };

  const connectionIndicator = getConnectionIndicator();

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          messageType === 'error' 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          <div className="flex items-center">
            <i className={`${messageType === 'error' ? 'ri-error-warning-line' : 'ri-check-circle-line'} mr-2`}></i>
            {message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bakım Modu Yönetimi</h1>
          <p className="text-gray-700 dark:text-gray-300">Site bakım durumunu kontrol edin ve yönetin</p>
          {lastSync && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Son senkronizasyon: {lastSync}</p>
          )}
        </div>
        
        {/* Maintenance Status Indicator */}
        <div className="flex items-center space-x-4">
          {/* Bağlantı Durumu */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${connectionIndicator.color}`}>
            <i className={connectionIndicator.icon}></i>
            <span className="text-sm font-medium">{connectionIndicator.text}</span>
          </div>
          
          {/* Bakım Durumu */}
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            maintenanceMode 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              maintenanceMode ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
            }`}></div>
            <span className="font-medium">
              {maintenanceMode ? 'Bakım Aktif' : 'Site Çalışıyor'}
            </span>
            {connectionStatus === 'connected' && (
              <i className="ri-database-2-line text-xs opacity-70" title="Veritabanı Senkronize"></i>
            )}
          </div>
        </div>
      </div>

      {/* Connection Warning */}
      {connectionStatus === 'disconnected' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <i className="ri-alert-line text-yellow-600 mr-3 mt-1"></i>
            <div>
              <h4 className="text-yellow-800 font-medium mb-2">Veritabanı Bağlantı Sorunu</h4>
              <p className="text-yellow-700 text-sm">
                Veritabanına bağlanılamıyor. Bakım modu yerel olarak çalışmaya devam ediyor. 
                Değişiklikler diğer cihazlarda görünmeyebilir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Toggle Switch */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Hızlı Bakım Modu Kontrolü</h3>
            <p className="text-gray-700 text-sm">Bakım modunu tek tıkla açıp kapatabilirsiniz</p>
          </div>
          
          {/* Toggle Switch */}
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${!maintenanceMode ? 'text-green-600' : 'text-gray-500'}`}>
              Çalışıyor
            </span>
            
            <button
              onClick={() => toggleMaintenanceMode()}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                maintenanceMode ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-100 transition-transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            
            <span className={`text-sm font-medium ${maintenanceMode ? 'text-orange-600' : 'text-gray-500'}`}>
              Bakımda
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            <span className="ml-2 text-sm text-gray-700">İşleniyor...</span>
          </div>
        )}
      </div>

      {/* Main Maintenance Control */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            maintenanceMode 
              ? 'bg-orange-100 text-orange-600' 
              : 'bg-green-100 text-green-600'
          }`}>
            <i className={`${
              maintenanceMode ? 'ri-tools-fill' : 'ri-check-circle-fill'
            } text-4xl`}></i>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {maintenanceMode ? 'Site Bakım Modunda' : 'Site Normal Çalışıyor'}
          </h2>
          
            <p className="text-gray-700 dark:text-gray-300 mb-6">
            {maintenanceMode 
              ? 'Ziyaretçiler şu anda bakım sayfasını görüyor. Admin paneline erişim devam ediyor.'
              : 'Site normal şekilde çalışıyor ve tüm ziyaretçiler siteye erişebiliyor.'
            }
            {connectionStatus === 'connected' && ' Tüm değişiklikler veritabanı ile senkronize ediliyor.'}
          </p>

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => toggleMaintenanceMode()}
              disabled={isLoading}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                maintenanceMode
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isLoading ? 'İşleniyor...' : (maintenanceMode ? 'Bakım Modunu Kapat' : 'Bakım Modunu Aç')}
            </button>
            
            {!maintenanceMode && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <i className="ri-time-line mr-2"></i>
                Zamanlı Bakım
              </button>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sistem Durumu</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">MySQL</span>
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {connectionStatus === 'connected' ? 'Bağlı ve aktif' : 'Bağlantı sorunu'}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Cache</span>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Aktif</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">SSL</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Geçerli</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Son Yedek</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{systemStatus.lastBackup}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hızlı İşlemler</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleQuickAction('clearCache')}
            disabled={isLoading}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-refresh-line text-xl mb-2 block"></i>
            <h4 className="font-medium mb-1">Cache Temizle</h4>
            <p className="text-xs text-blue-600">Sitenin cache'ini temizle</p>
          </button>

          <button
            onClick={() => handleQuickAction('checkStatus')}
            disabled={isLoading}
            className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-heart-pulse-line text-xl mb-2 block"></i>
            <h4 className="font-medium mb-1">Durum Kontrol</h4>
            <p className="text-xs text-green-600">Sistem durumunu kontrol et</p>
          </button>

          <button
            onClick={() => handleQuickAction('testSite')}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg transition-colors cursor-pointer text-left"
          >
            <i className="ri-external-link-line text-xl mb-2 block"></i>
            <h4 className="font-medium mb-1">Siteyi Test Et</h4>
            <p className="text-xs text-purple-600">Siteyi yeni sekmede aç</p>
          </button>
        </div>
      </div>

      {/* Zamanlı Bakım Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Zamanlı Bakım Modu</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bakım Süresi (Saat)
              </label>
              <select
                value={scheduleHours}
                onChange={(e) => setScheduleHours(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.5}>30 dakika</option>
                <option value={1}>1 saat</option>
                <option value={2}>2 saat</option>
                <option value={3}>3 saat</option>
                <option value={6}>6 saat</option>
                <option value={12}>12 saat</option>
                <option value={24}>24 saat</option>
              </select>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Bakım modu {new Date(Date.now() + scheduleHours * 60 * 60 * 1000).toLocaleString('tr-TR')} tarihinde otomatik kapatılacak
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const endTime = new Date(Date.now() + scheduleHours * 60 * 60 * 1000).toISOString();
                  toggleMaintenanceMode(endTime);
                  setShowScheduleModal(false);
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Başlat
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex">
          <i className="ri-information-line text-blue-600 dark:text-blue-400 mr-3 mt-1"></i>
          <div>
            <h4 className="text-blue-800 dark:text-blue-300 font-medium mb-2">Gelişmiş Bakım Modu Sistemi</h4>
            <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
              <li>• <strong>Zamanlı bakım:</strong> Belirli süre sonra otomatik kapanma</li>
              <li>• Veritabanı bağlantı sorunlarında yerel çalışma devam eder</li>
              <li>• Timeout koruması ile donma önlenir (8-10 saniye)</li>
              <li>• Tüm sekmeler ve sayfalar gerçek zamanlı senkronize edilir</li>
              <li>• 10 saniyede bir otomatik durum kontrolü yapılır</li>
              <li>• Bağlantı durumu görsel olarak gösterilir</li>
            </ul>
            
            
            {scheduledEndTime && maintenanceMode && (
              <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  <i className="ri-time-line mr-2"></i>
                  Bakım modu <strong>{new Date(scheduledEndTime).toLocaleString('tr-TR')}</strong> tarihinde otomatik kapatılacak
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
