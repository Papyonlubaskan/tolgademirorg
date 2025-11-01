
'use client';

import { useState, useEffect } from 'react';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkActivity: number;
  activeUsers: number;
  responseTime: number;
}

export default function SystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkActivity: 0,
    activeUsers: 0,
    responseTime: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        // Simulate real-time metrics
        const newMetrics: SystemMetrics = {
          cpuUsage: Math.max(10, Math.min(90, metrics.cpuUsage + (Math.random() - 0.5) * 20)),
          memoryUsage: Math.max(20, Math.min(85, metrics.memoryUsage + (Math.random() - 0.5) * 15)),
          diskUsage: Math.max(15, Math.min(95, metrics.diskUsage + (Math.random() - 0.5) * 5)),
          networkActivity: Math.max(0, Math.min(100, Math.random() * 80)),
          activeUsers: Math.max(0, Math.floor(Math.random() * 20)),
          responseTime: Math.max(50, Math.min(500, 120 + (Math.random() - 0.5) * 100))
        };

        setMetrics(newMetrics);

        // Check for alerts
        const newAlerts: string[] = [];
        if (newMetrics.cpuUsage > 80) newAlerts.push('Yüksek CPU kullanımı');
        if (newMetrics.memoryUsage > 80) newAlerts.push('Yüksek bellek kullanımı');
        if (newMetrics.diskUsage > 90) newAlerts.push('Disk alanı yetersiz');
        if (newMetrics.responseTime > 300) newAlerts.push('Yavaş yanıt süresi');

        setAlerts(newAlerts);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring, metrics]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    // Initialize with realistic values
    setMetrics({
      cpuUsage: 35,
      memoryUsage: 45,
      diskUsage: 60,
      networkActivity: 25,
      activeUsers: 3,
      responseTime: 120
    });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setAlerts([]);
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600 bg-red-100';
    if (value >= thresholds.warning) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Sistem Monitörü</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerçek zamanlı sistem performansı</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {alerts.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">{alerts.length} Uyarı</span>
              </div>
            )}
            
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isMonitoring 
                  ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                  : 'bg-green-100 hover:bg-green-200 text-green-700'
              }`}
            >
              {isMonitoring ? (
                <>
                  <i className="ri-stop-circle-line mr-2"></i>
                  Durdur
                </>
              ) : (
                <>
                  <i className="ri-play-circle-line mr-2"></i>
                  Başlat
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!isMonitoring ? (
          <div className="text-center py-8">
            <i className="ri-computer-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 mb-4">Sistem izleme başlatılmadı</p>
            <button
              onClick={startMonitoring}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              İzlemeyi Başlat
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Uyarılar */}
            {alerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <i className="ri-alarm-warning-line text-red-600 mr-2"></i>
                  <h4 className="font-medium text-red-800">Sistem Uyarıları</h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {alerts.map((alert, index) => (
                    <li key={index}>• {alert}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metrik Kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* CPU Kullanımı */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">CPU</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.cpuUsage, { warning: 70, critical: 85 })}`}>
                    {metrics.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metrics.cpuUsage, { warning: 70, critical: 85 })}`}
                    style={{ width: `${metrics.cpuUsage}%` }}
                  ></div>
                </div>
              </div>

              {/* Bellek Kullanımı */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Bellek</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.memoryUsage, { warning: 75, critical: 85 })}`}>
                    {metrics.memoryUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metrics.memoryUsage, { warning: 75, critical: 85 })}`}
                    style={{ width: `${metrics.memoryUsage}%` }}
                  ></div>
                </div>
              </div>

              {/* Disk Kullanımı */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Disk</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.diskUsage, { warning: 80, critical: 90 })}`}>
                    {metrics.diskUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metrics.diskUsage, { warning: 80, critical: 90 })}`}
                    style={{ width: `${metrics.diskUsage}%` }}
                  ></div>
                </div>
              </div>

              {/* Ağ Aktivitesi */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Ağ</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                    {metrics.networkActivity.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.networkActivity}%` }}
                  ></div>
                </div>
              </div>

              {/* Aktif Kullanıcılar */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Kullanıcılar</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                    {metrics.activeUsers}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="ri-user-line text-purple-500"></i>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Aktif oturum</span>
                </div>
              </div>

              {/* Yanıt Süresi */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Yanıt Süresi</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.responseTime, { warning: 200, critical: 300 })}`}>
                    {metrics.responseTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="ri-time-line text-gray-500"></i>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ortalama süre</span>
                </div>
              </div>
            </div>

            {/* Sistem Bilgileri */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-3">Sistem Bilgileri</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">İşletim Sistemi:</span>
                  <span className="ml-2 font-medium">Linux Ubuntu 22.04</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Sunucu:</span>
                  <span className="ml-2 font-medium">Next.js 14.0</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Veritabanı:</span>
                  <span className="ml-2 font-medium">MySQL Database</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Çalışma Süresi:</span>
                  <span className="ml-2 font-medium">7 gün, 14 saat</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
