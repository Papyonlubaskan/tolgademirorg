
'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import DashboardHome from './DashboardHome';
import StatisticsManager from './StatisticsManager';
import BooksManager from './BooksManager';
import MediaManager from './MediaManager';
import MessagesManager from './MessagesManager';
import CommentsManager from './CommentsManager';
import SecurityCenter from './SecurityCenter';
import MaintenanceManager from './MaintenanceManager';
import SettingsManager from './SettingsManager';
import NotificationCenter from './NotificationCenter';
import ActiveAdminUsers from '@/components/ActiveAdminUsers';

interface AdminDashboardProps {
  onLogout?: () => void;
}

interface SystemNotification {
  id: number;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  time: string;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  // Kullanıcı aktivitesini izle
  useEffect(() => {
    const updateActivity = () => setLastActivity(new Date());

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Dismissed notifications'ı localStorage'dan yükle
  useEffect(() => {
    const dismissed = localStorage.getItem('admin_dismissed_notifications');
    if (dismissed) {
      try {
        setDismissedNotifications(JSON.parse(dismissed));
      } catch (error) {
        console.error('Error loading dismissed notifications:', error);
      }
    }
  }, []);

  // Bildirim sayısını yükle
  useEffect(() => {
    loadNotificationCount();
    loadNotifications();
    
    // Her 30 saniyede bir bildirim sayısını kontrol et
    const notificationInterval = setInterval(() => {
      loadNotificationCount();
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(notificationInterval);
  }, [dismissedNotifications]);

  const loadNotificationCount = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/notifications?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUnreadNotificationCount(result.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Notification count loading error:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/notifications?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Dismissed olmayan bildirimleri filtrele
          const allNotifications = (result.data.notifications || [])
            .filter((n: any) => !dismissedNotifications.includes(n.id))
            .slice(0, 5)
            .map((n: any) => ({
              id: n.id,
              type: n.type === 'comment' ? 'info' : n.type === 'like' ? 'success' : 'info',
              message: n.message,
              time: formatTimeAgo(n.time)
            }));
          
          setNotifications(allNotifications);
          setUnreadNotificationCount(allNotifications.length);
        }
      }
    } catch (error) {
      console.error('Notifications loading error:', error);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  // Otomatik çıkış kontrolü (30 dakika)
  useEffect(() => {
    const checkActivity = setInterval(() => {
      if (!lastActivity) return;
      
      const timeDiff = new Date().getTime() - lastActivity.getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      if (timeDiff > thirtyMinutes) {
        alert('Güvenlik nedenle oturumunuz sonlandırılacak.');
        if (onLogout) onLogout();
      }
    }, 60000); // Her dakika kontrol et

    return () => clearInterval(checkActivity);
  }, [lastActivity, onLogout]);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome onSectionChange={setActiveSection} />;
      case 'statistics':
        return <StatisticsManager />;
      case 'books':
        return <BooksManager />;
      case 'media':
        return <MediaManager />;
      case 'messages':
        return <MessagesManager />;
      case 'comments':
        return <CommentsManager />;
      case 'security':
        return <SecurityCenter />;
      case 'maintenance':
        return <MaintenanceManager />;
      case 'settings':
        return <SettingsManager />;
      case 'notifications':
        return <NotificationCenter showFullView={true} />;
      case 'activity-log':
        return <DashboardHome onSectionChange={setActiveSection} />;
      default:
        return <DashboardHome onSectionChange={setActiveSection} />;
    }
  };

  const clearNotification = (id: number | string) => {
    const idStr = id.toString();
    
    // Dismissed listesine ekle ve localStorage'a kaydet
    const updatedDismissed = [...dismissedNotifications, idStr];
    setDismissedNotifications(updatedDismissed);
    localStorage.setItem('admin_dismissed_notifications', JSON.stringify(updatedDismissed));
    
    // UI'dan kaldır
    setNotifications(prev => prev.filter(n => n.id.toString() !== idStr));
    setUnreadNotificationCount(prev => Math.max(0, prev - 1));
  };
  
  const clearAllNotifications = () => {
    // Tüm mevcut bildirimleri dismissed listesine ekle
    const allIds = notifications.map(n => n.id.toString());
    const updatedDismissed = [...dismissedNotifications, ...allIds];
    setDismissedNotifications(updatedDismissed);
    localStorage.setItem('admin_dismissed_notifications', JSON.stringify(updatedDismissed));
    
    // UI'ı temizle
    setNotifications([]);
    setUnreadNotificationCount(0);
    setShowNotifications(false);
  };

  const getSectionTitle = () => {
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'statistics': 'İstatistikler',
      'books': 'Kitap Yönetimi',
      'media': 'Medya Yönetimi',
      'messages': 'Mesaj Yönetimi',
      'security': 'Güvenlik Merkezi',
      'maintenance': 'Bakım Modu',
      'settings': 'Site Ayarları',
      'comments': 'Yorum Yönetimi',
      'notifications': 'Bildirim Merkezi',
      'activity-log': 'Aktivite Günlükleri'
    };
    return titles[activeSection] || 'Dashboard';
  };

  // Otomatik sistem bildirimi oluştur
  const createSystemNotification = async (title: string, message: string, priority: string = 'normal') => {
    try {
      // Bildirim oluşturuldu
      loadNotificationCount();
    } catch (error) {
      console.error('System notification creation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <AdminSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getSectionTitle()}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300" suppressHydrationWarning>
                Son aktivite: {lastActivity ? lastActivity.toLocaleTimeString('tr-TR') : 'Henüz aktivite yok'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Sistem Çalışıyor</span>
              </div>

              {/* Gelişmiş Bildirim Butonu */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer relative"
                >
                  <i className="ri-notification-line text-gray-700 dark:text-gray-300"></i>
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {showNotifications && notifications.length > 0 && (
                  <div 
                    className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    onMouseEnter={() => setShowNotifications(true)}
                    onMouseLeave={() => setShowNotifications(false)}
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white">Bildirimler</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAllNotifications();
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                        >
                          Tümünü Temizle
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            clearNotification(notification.id);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${ 
                                notification.type === 'warning' ? 'bg-orange-500' : 
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-gray-200 truncate">{notification.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer ml-2 flex-shrink-0"
                            >
                              <i className="ri-close-line text-sm"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <button 
                        onClick={() => {
                          setActiveSection('notifications');
                          setShowNotifications(false);
                        }}
                        className="w-full text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-more-line mr-2"></i>
                        Tüm bildirimleri görüntüle
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hızlı İşlemler */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.open('/', '_blank')}
                  className="w-10 h-10 flex items-center justify-center bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40 text-green-600 dark:text-green-400 rounded-lg transition-colors cursor-pointer border border-green-200 dark:border-green-700"
                  title="Siteyi Görüntüle"
                >
                  <i className="ri-external-link-line"></i>
                </button>

                <button
                  onClick={() => setActiveSection('settings')}
                  className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors cursor-pointer border border-blue-200 dark:border-blue-700"
                  title="Ayarlar"
                >
                  <i className="ri-settings-line"></i>
                </button>

                {/* Progressive Web App Install */}
                <button
                  className="w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/40 text-purple-600 dark:text-purple-400 rounded-lg transition-colors cursor-pointer border border-purple-200 dark:border-purple-700"
                  title="Mobil Uygulama Olarak Yükle"
                >
                  <i className="ri-download-2-line"></i>
                </button>
              </div>

              {/* Admin Profile */}
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <i className="ri-user-line text-white text-sm"></i>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Admin</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Süper Kullanıcı</div>
                </div>
              </div>

              {/* Çıkış */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 rounded-lg transition-colors cursor-pointer border border-red-200 dark:border-red-700"
                  title="Çıkış Yap"
                >
                  <i className="ri-logout-circle-line"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content with Active Users Sidebar */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Ana içerik - 3 kolon */}
            <div className="lg:col-span-3">
              {renderContent()}
            </div>

            {/* Sağ sidebar - Aktif Kullanıcılar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ActiveAdminUsers />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative group">
          <button className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-center group-hover:scale-110">
            <i className="ri-add-line text-xl"></i>
          </button>

          {/* Quick Actions Menu */}
          <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="space-y-1 w-48">
              <button
                onClick={() => {
                  setActiveSection('blog');
                  createSystemNotification('Hızlı İşlem', 'Blog yönetimine geçildi', 'low');
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-left whitespace-nowrap"
              >
                <i className="ri-article-line mr-2"></i>
                Yeni Blog Yazısı
              </button>
              <button
                onClick={() => {
                  setActiveSection('events');
                  createSystemNotification('Hızlı İşlem', 'Etkinlik yönetimine geçildi', 'low');
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-left whitespace-nowrap"
              >
                <i className="ri-calendar-event-line mr-2"></i>
                Yeni Etkinlik
              </button>
              <button
                onClick={() => {
                  setActiveSection('books');
                  createSystemNotification('Hızlı İşlem', 'Kitap yönetimine geçildi', 'low');
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-left whitespace-nowrap"
              >
                <i className="ri-book-line mr-2"></i>
                Yeni Kitap
              </button>
              <button
                onClick={() => {
                  setActiveSection('media');
                  createSystemNotification('Hızlı İşlem', 'Medya yönetimine geçildi', 'low');
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-left whitespace-nowrap"
              >
                <i className="ri-image-line mr-2"></i>
                Medya Yönetimi
              </button>
              <button
                onClick={() => {
                  setActiveSection('notifications');
                  createSystemNotification('Hızlı İşlem', 'Bildirim merkezine geçildi', 'low');
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-left whitespace-nowrap"
              >
                <i className="ri-notification-line mr-2"></i>
                Bildirim Merkezi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
    </div>
  );
}
