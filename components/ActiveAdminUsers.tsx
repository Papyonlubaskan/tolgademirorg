'use client';

import { useEffect, useState } from 'react';

interface ActiveSession {
  id: number;
  admin_id: number;
  username: string;
  email: string;
  last_activity: string;
  ip_address: string;
  user_agent: string;
}

export default function ActiveAdminUsers() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveSessions = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/active-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.data || []);
      }
    } catch (error) {
      console.error('Fetch active users error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Heartbeat - kendi session'ımızı canlı tut
  const sendHeartbeat = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const sessionId = sessionStorage.getItem('admin_session_id');

      if (!sessionId) return;

      await fetch('/api/admin/active-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  };

  useEffect(() => {
    fetchActiveSessions();

    // Her 30 saniyede bir güncelle
    const interval = setInterval(() => {
      fetchActiveSessions();
      sendHeartbeat();
    }, 30000);

    // İlk heartbeat
    sendHeartbeat();

    return () => clearInterval(interval);
  }, []);

  const formatLastActivity = (lastActivity: string) => {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins === 1) return '1 dakika önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 saat önce';
    return `${diffHours} saat önce`;
  };

  const getBrowserName = (userAgent: string) => {
    if (!userAgent) return 'Bilinmiyor';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Diğer';
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Aktif Kullanıcılar
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activeSessions.length} çevrimiçi
          </span>
        </div>
      </div>

      <div className="p-4">
        {activeSessions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            Aktif kullanıcı yok
          </p>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                    {session.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session.username}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <i className="ri-time-line"></i>
                    <span>{formatLastActivity(session.last_activity)}</span>
                    <span>•</span>
                    <i className="ri-global-line"></i>
                    <span>{getBrowserName(session.user_agent)}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Aktif
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

