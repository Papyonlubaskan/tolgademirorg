
'use client';

import { useState, useEffect } from 'react';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

export default function StatisticsManager() {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [stats, setStats] = useState({
    visitors: { current: 0, change: 0 },
    pageViews: { current: 0, change: 0 },
    bounceRate: { current: 0, change: 0 },
    avgTime: { current: '0:00', change: 0 }
  });

  useEffect(() => {
    loadStatistics();
    
    // Dark mode'u localStorage'dan yükle
    const savedDarkMode = localStorage.getItem('adminDarkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Maintenance mode'u localStorage'dan yükle
    const savedMaintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
    setMaintenanceMode(savedMaintenanceMode);
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Default stats tanımla
      const defaultStats = {
        visitors: { current: 0, change: 0 },
        pageViews: { current: 0, change: 0 },
        bounceRate: { current: 0, change: 0 },
        avgTime: { current: '0:00', change: 0 }
      };

      setStats(defaultStats);

      const response = await fetch(`/api/books`, {
        headers: {
          },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Statistics loaded:', result.data);
        
        if (result.data) {
          setStats({
            visitors: { 
              current: result.data.uniqueVisitors || 0, 
              change: 0 
            },
            pageViews: { 
              current: result.data.pageViews || 0, 
              change: 0 
            },
            bounceRate: { 
              current: result.data.bounceRate || 0, 
              change: 0 
            },
            avgTime: { 
              current: formatDuration(result.data.avgSessionDuration || 0), 
              change: 0 
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Hata durumunda default stats'ı kullan
      setStats({
        visitors: { current: 0, change: 0 },
        pageViews: { current: 0, change: 0 },
        bounceRate: { current: 0, change: 0 },
        avgTime: { current: '0:00', change: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const quickActions = [
    {
      id: 'cache-clear',
      name: 'Önbellek Temizle',
      icon: 'ri-refresh-line',
      description: 'Site önbelleğini temizle',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'backup-create',
      name: 'Yedek Oluştur',
      icon: 'ri-save-line',
      description: 'Site yedeği oluştur',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'seo-optimize',
      name: 'SEO Optimizasyonu',
      icon: 'ri-search-line',
      description: 'SEO ayarlarını optimize et',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'performance-check',
      name: 'Performans Testi',
      icon: 'ri-speed-line',
      description: 'Site performansını kontrol et',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const handleQuickAction = async (actionId: string) => {
    setProcessingAction(actionId);
    
    try {
      const token = sessionStorage.getItem('admin_token');
      
      switch (actionId) {
        case 'cache-clear':
          // Önbellek temizleme
          const cacheResponse = await fetch('/api/admin/cache/clear', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (cacheResponse.ok) {
            const cacheResult = await cacheResponse.json();
            showSuccessMessage(cacheResult.message || 'Önbellek başarıyla temizlendi!');
          } else {
            showErrorMessage('Önbellek temizleme başarısız!');
          }
          break;
          
        case 'backup-create':
          // Yedek oluşturma
          const backupResponse = await fetch('/api/admin/backup/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ includeData: true, includeImages: true })
          });
          
          if (backupResponse.ok) {
            const backupResult = await backupResponse.json();
            showSuccessMessage('Yedek başarıyla oluşturuldu!');
          } else {
            showErrorMessage('Yedek oluşturma başarısız!');
          }
          break;
          
        case 'seo-optimize':
          // SEO optimizasyonu
          const seoResponse = await fetch('/api/admin/seo/optimize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (seoResponse.ok) {
            const seoResult = await seoResponse.json();
            showSuccessMessage(seoResult.message || 'SEO optimizasyonu tamamlandı!');
          } else {
            showErrorMessage('SEO optimizasyonu başarısız!');
          }
          break;
          
        case 'performance-check':
          // Performans testi
          const perfResponse = await fetch('/api/admin/performance/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (perfResponse.ok) {
            const perfResult = await perfResponse.json();
            showSuccessMessage(perfResult.message || 'Performans testi tamamlandı!');
          } else {
            showErrorMessage('Performans testi başarısız!');
          }
          break;
          
        default:
          showErrorMessage('Bilinmeyen işlem!');
      }
    } catch (error) {
      console.error('Quick action error:', error);
      showErrorMessage('İşlem sırasında hata oluştu!');
    } finally {
      setProcessingAction(null);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('adminDarkMode', newDarkMode.toString());
    
    // Apply dark mode to admin panel
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    showSuccessMessage(newDarkMode ? 'Gece modu etkinleştirildi' : 'Gündüz modu etkinleştirildi');
  };

  const toggleMaintenanceMode = async () => {
    const newMaintenanceMode = !maintenanceMode;
    
    try {
      const token = sessionStorage.getItem('admin_token');
      
      // API'ye maintenance mode durumunu gönder
      const response = await fetch(`/api/settings/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ maintenanceMode: newMaintenanceMode }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // localStorage'u güncelle
        if (newMaintenanceMode) {
          localStorage.setItem('maintenanceMode', 'true');
        } else {
          localStorage.removeItem('maintenanceMode');
        }
        
        // State'i güncelle
        setMaintenanceMode(newMaintenanceMode);
        
        // Storage event'i tetikle (diğer sekmeler için)
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'maintenanceMode',
          newValue: newMaintenanceMode ? 'true' : null,
          oldValue: maintenanceMode ? 'true' : null,
          url: window.location.href
        }));
        
        showSuccessMessage(
          result.message || (newMaintenanceMode 
            ? 'Site bakım moduna alındı - Ziyaretçiler bakım sayfasını görecek' 
            : 'Bakım modu kapatıldı - Site normal çalışıyor')
        );
      } else {
        showErrorMessage('Bakım modu değiştirilemedi!');
      }
    } catch (error) {
      console.error('Maintenance mode error:', error);
      showErrorMessage('Bakım modu değiştirilirken hata oluştu!');
    }
  };

  const showSuccessMessage = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
    toast.innerHTML = `<i class="ri-check-line mr-2"></i>${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const showErrorMessage = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
    toast.innerHTML = `<i class="ri-error-warning-line mr-2"></i>${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">İstatistikler</h1>
          <p className="text-gray-500 dark:text-gray-400">Site performansını ve ziyaretçi verilerini görüntüleyin</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full flex items-center transition-colors cursor-pointer ${
              darkMode ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-md transform transition-transform ${
              darkMode ? 'translate-x-6' : 'translate-x-0.5'
            }`}></div>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {darkMode ? 'Gece Modu' : 'Gündüz Modu'}
          </span>
          
          {/* Maintenance Mode Toggle */}
          <button
            onClick={toggleMaintenanceMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center ${
              maintenanceMode 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
            }`}
          >
            <i className={`mr-2 ${maintenanceMode ? 'ri-tools-line' : 'ri-globe-line'}`}></i>
            {maintenanceMode ? 'Bakım Modu: Açık' : 'Bakım Modu: Kapalı'}
          </button>
        </div>
      </div>

      {/* Maintenance Mode Warning */}
      {maintenanceMode && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <i className="ri-error-warning-line text-red-500 mr-3 text-xl"></i>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Site Bakım Modunda</h3>
              <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                Ziyaretçiler şu anda bakım sayfasını görüyorlar. Site güncellemelerini tamamladıktan sonra bakım modunu kapatmayı unutmayın.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              disabled={processingAction === action.id}
              className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-center">
                {processingAction === action.id ? (
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                ) : (
                  <i className={`${action.icon} text-2xl mb-2`}></i>
                )}
                <p className="font-medium text-sm">{action.name}</p>
                <p className="text-xs opacity-90 mt-1">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Zaman Aralığı:</span>
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { key: '7days', label: '7 Gün' },
            { key: '30days', label: '30 Gün' },
            { key: '3months', label: '3 Ay' },
            { key: '1year', label: '1 Yıl' }
          ].map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                timeRange === range.key
                  ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Ziyaretçiler</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats?.visitors?.current?.toLocaleString() || '0'}</p>
                  <div className="flex items-center mt-1">
                    <i className={`ri-arrow-${(stats?.visitors?.change || 0) >= 0 ? 'up' : 'down'}-line text-sm mr-1 ${
                      (stats?.visitors?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}></i>
                    <span className={`text-sm ${
                      (stats?.visitors?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {Math.abs(stats?.visitors?.change || 0)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <i className="ri-user-line text-blue-600 dark:text-blue-400 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Sayfa Görüntüleme</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats?.pageViews?.current?.toLocaleString() || '0'}</p>
                  <div className="flex items-center mt-1">
                    <i className={`ri-arrow-${(stats?.pageViews?.change || 0) >= 0 ? 'up' : 'down'}-line text-sm mr-1 ${
                      (stats?.pageViews?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}></i>
                    <span className={`text-sm ${
                      (stats?.pageViews?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {Math.abs(stats?.pageViews?.change || 0)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <i className="ri-eye-line text-green-600 dark:text-green-400 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Çıkış Oranı</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats?.bounceRate?.current || 0}%</p>
                  <div className="flex items-center mt-1">
                    <i className={`ri-arrow-${(stats?.bounceRate?.change || 0) <= 0 ? 'down' : 'up'}-line text-sm mr-1 ${
                      (stats?.bounceRate?.change || 0) <= 0 ? 'text-green-500' : 'text-red-500'
                    }`}></i>
                    <span className={`text-sm ${
                      (stats?.bounceRate?.change || 0) <= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {Math.abs(stats?.bounceRate?.change || 0)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <i className="ri-logout-circle-line text-red-600 dark:text-red-400 text-xl"></i>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Ortalama Süre</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats?.avgTime?.current || '0:00'}</p>
                  <div className="flex items-center mt-1">
                    <i className={`ri-arrow-${(stats?.avgTime?.change || 0) >= 0 ? 'up' : 'down'}-line text-sm mr-1 ${
                      (stats?.avgTime?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}></i>
                    <span className={`text-sm ${
                      (stats?.avgTime?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {Math.abs(stats?.avgTime?.change || 0)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <i className="ri-time-line text-purple-600 dark:text-purple-400 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Visitors Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Ziyaretçi Trendi</h3>
              <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <i className="ri-line-chart-line text-4xl mb-2"></i>
                  <p>Site açıldığında veriler görünecek</p>
                </div>
              </div>
            </div>

            {/* Top Pages */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">En Çok Ziyaret Edilen Sayfalar</h3>
              <div className="space-y-3">
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <i className="ri-file-list-line text-3xl mb-2"></i>
                  <p>Site açıldığında veriler görünecek</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Sistem Durumu</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <i className="ri-server-line text-2xl text-green-600 dark:text-green-400 mb-2"></i>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Sunucu</p>
            <p className="text-xs text-green-600 dark:text-green-400">Çalışıyor</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <i className="ri-database-line text-2xl text-green-600 dark:text-green-400 mb-2"></i>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Veritabanı</p>
            <p className="text-xs text-green-600 dark:text-green-400">Bağlı</p>
          </div>
          <div className={`text-center p-4 rounded-lg ${
            maintenanceMode 
              ? 'bg-red-50 dark:bg-red-900/20' 
              : 'bg-green-50 dark:bg-green-900/20'
          }`}>
            <i className={`ri-global-line text-2xl mb-2 ${
              maintenanceMode 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}></i>
            <p className={`text-sm font-medium ${
              maintenanceMode 
                ? 'text-red-800 dark:text-red-200' 
                : 'text-green-800 dark:text-green-200'
            }`}>Site</p>
            <p className={`text-xs ${
              maintenanceMode 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {maintenanceMode ? 'Bakımda' : 'Aktif'}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <i className="ri-shield-check-line text-2xl text-green-600 dark:text-green-400 mb-2"></i>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Güvenlik</p>
            <p className="text-xs text-green-600 dark:text-green-400">Güvenli</p>
          </div>
        </div>
      </div>
    </div>
  );
}
