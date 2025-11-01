'use client';

import { useState, useEffect } from 'react';

// Zaman farkını hesapla
const getTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (error) {
    return 'Bilinmeyen zaman';
  }
};

const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  action_url?: string;
  data?: any;
  metadata?: any;
}

interface NotificationCenterProps {
  showFullView?: boolean;
  onViewAll?: () => void;
}

export default function NotificationCenter({ showFullView = false, onViewAll }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: showFullView ? 50 : 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    by_type: {},
    by_priority: {}
  });

  // Dismissed notifications'ı yükle
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

  useEffect(() => {
    loadNotifications();
    loadStats();
    
    // Gerçek zamanlı bildirim kontrolü
    const interval = setInterval(() => {
      loadNotifications();
      loadStats();
    }, 30000); // 30 saniyede bir kontrol

    return () => clearInterval(interval);
  }, [filter, pagination.page, searchTerm, showFullView, dismissedNotifications]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (filter !== 'all') {
        if (filter === 'unread') {
          params.append('unread_only', 'true');
        } else {
          params.append('type', filter);
        }
      }

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(
        `/api/admin/notifications?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Dismissed olmayan bildirimleri filtrele
          const filteredNotifications = (result.data.notifications || [])
            .filter((n: Notification) => !dismissedNotifications.includes(n.id));
          
          setNotifications(filteredNotifications);
          setPagination(prev => ({
            ...prev,
            total: filteredNotifications.length,
            totalPages: Math.ceil(filteredNotifications.length / pagination.limit),
            hasMore: filteredNotifications.length >= pagination.limit
          }));
        }
      } else {
        // Fallback mock data
        setNotifications([
          {
            id: '1',
            type: 'system',
            title: 'Sistem Bildirimi',
            message: 'Admin paneli başarıyla güncellendi',
            priority: 'normal',
            is_read: false,
            created_at: new Date(Date.now() - 5 * 60000).toISOString()
          },
          {
            id: '2',
            type: 'content',
            title: 'Yeni İçerik',
            message: 'Bir kitap bölümü eklendi',
            priority: 'low',
            is_read: true,
            created_at: new Date(Date.now() - 30 * 60000).toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Notification loading error:', error);
      // Mock data fallback
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/notifications?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats({
            total: result.data.total || 0,
            unread: result.data.unreadCount || 0,
            by_type: {},
            by_priority: {}
          });
        }
      }
    } catch (error) {
      console.error('Stats loading error:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(
        `/api/admin/notifications`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            notificationId: notificationId,
            is_read: true 
          })
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        loadStats();
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) {
        alert('Okunmamış bildirim yok');
        return;
      }

      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(
        `/api/admin/notifications`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            markAllAsRead: true
          })
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        loadStats();
        alert('Tüm bildirimler okundu olarak işaretlendi');
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      // Dismissed listesine ekle ve localStorage'a kaydet
      const updatedDismissed = [...dismissedNotifications, ...notificationIds];
      setDismissedNotifications(updatedDismissed);
      localStorage.setItem('admin_dismissed_notifications', JSON.stringify(updatedDismissed));
      
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(
        `/api/admin/notifications`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            notificationIds: notificationIds
          })
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => !notificationIds.includes(n.id))
        );
        loadStats();
        alert('Seçili bildirimler kalıcı olarak silindi');
      }
    } catch (error) {
      console.error('Delete notifications error:', error);
      alert('Bildirimler silinirken hata oluştu');
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) {
      alert('Silinecek bildirim bulunmuyor');
      return;
    }

    const confirmed = window.confirm(
      `Tüm bildirimleri (${notifications.length} adet) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    );

    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(
        `/api/admin/notifications`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            deleteAll: true
          })
        }
      );

      if (response.ok) {
        // Tüm bildirimleri dismissed listesine ekle
        const allNotificationIds = notifications.map(n => n.id);
        const updatedDismissed = [...dismissedNotifications, ...allNotificationIds];
        setDismissedNotifications(updatedDismissed);
        localStorage.setItem('admin_dismissed_notifications', JSON.stringify(updatedDismissed));
        
        // State'i temizle
        setNotifications([]);
        setStats(prev => ({
          ...prev,
          total: 0,
          unread: 0
        }));
        
        showSuccessMessage('Tüm bildirimler kalıcı olarak silindi');
      } else {
        alert('Bildirimler silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete all notifications error:', error);
      alert('Bildirimler silinirken hata oluştu');
    }
  };

  const createTestNotification = async () => {
    try {
      const testNotification = {
        type: 'system',
        title: 'Test Bildirimi',
        message: 'Bu bir test bildirimidir - sistem çalışıyor!',
        priority: 'normal',
        data: {
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(
        `/api/books`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            },
          body: JSON.stringify(testNotification)
        }
      );

      if (response.ok) {
        loadNotifications();
        loadStats();
        showSuccessMessage('Test bildirimi oluşturuldu');
      }
    } catch (error) {
      console.error('Create test notification error:', error);
    }
  };

  const showSuccessMessage = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
    toast.innerHTML = `<i class="ri-check-line mr-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system': return 'ri-settings-3-line';
      case 'content': return 'ri-edit-circle-line';
      case 'user': return 'ri-user-line';
      case 'security': return 'ri-shield-check-line';
      case 'performance': return 'ri-speed-line';
      case 'comment': return 'ri-message-2-line';
      case 'like': return 'ri-heart-line';
      case 'error': return 'ri-error-warning-line';
      default: return 'ri-notification-line';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'text-red-600 bg-red-100';
    if (priority === 'high') return 'text-orange-600 bg-orange-100';
    
    switch (type) {
      case 'system': return 'text-blue-600 bg-blue-100';
      case 'content': return 'text-green-600 bg-green-100';
      case 'security': return 'text-purple-600 bg-purple-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRelativeTime = (timestamp: string) => {
    try {
      if (!timestamp) return 'Bilinmeyen zaman';
      
      const now = new Date();
      const time = new Date(timestamp);
      
      // Invalid date kontrolü
      if (isNaN(time.getTime())) {
        return 'Geçersiz tarih';
      }
      
      const diffInMs = now.getTime() - time.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInMinutes < 1) return 'Az önce';
      if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
      if (diffInHours < 24) return `${diffInHours} saat önce`;
      if (diffInDays < 7) return `${diffInDays} gün önce`;
      
      // 7 günden eski ise tarih göster
      return time.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short',
        year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Bilinmeyen zaman';
    }
  };

  if (showFullView) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bildirim Merkezi</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Tüm sistem bildirimleri ve uyarılar</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Okunmamış</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.unread}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Toplam</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Sistem</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{(stats.by_type as any)?.system || 0}</p>
                </div>
                <i className="ri-settings-3-line text-blue-600 text-2xl"></i>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">İçerik</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">{(stats.by_type as any)?.content || 0}</p>
                </div>
                <i className="ri-edit-circle-line text-green-600 text-2xl"></i>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Güvenlik</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{(stats.by_type as any)?.security || 0}</p>
                </div>
                <i className="ri-shield-check-line text-purple-600 text-2xl"></i>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">Kritik</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-300">{(stats.by_priority as any)?.critical || 0}</p>
                </div>
                <i className="ri-error-warning-line text-red-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Bildirimlərdə axtarış..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8"
            >
              <option value="all">Tüm Bildirimler</option>
              <option value="unread">Okunmamış</option>
              <option value="system">Sistem</option>
              <option value="content">İçerik</option>
              <option value="security">Güvenlik</option>
              <option value="user">Kullanıcı</option>
              <option value="error">Hata</option>
            </select>
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-check-double-line mr-2"></i>
              Tümünü Okundu İşaretle
            </button>
            <button
              onClick={deleteAllNotifications}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-delete-bin-2-line mr-2"></i>
              Tümünü Sil
            </button>
            <button
              onClick={createTestNotification}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              Test Bildirimi
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Bildirimler yükleniyor...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-notification-off-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Bildirim bulunamadı</h3>
              <p className="text-gray-500">Seçili filtrelere uygun bildirim bulunmuyor</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type, notification.priority)}`}>
                      <i className={`${getNotificationIcon(notification.type)} text-lg`}></i>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-lg font-medium ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notification.title}
                          {!notification.is_read && <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full inline-block"></span>}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            notification.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            notification.priority === 'low' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {notification.priority === 'critical' ? 'Kritik' :
                             notification.priority === 'high' ? 'Yüksek' :
                             notification.priority === 'low' ? 'Düşük' : 'Normal'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {getRelativeTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mt-2">{notification.message}</p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            <i className="ri-price-tag-3-line mr-1"></i>
                            {notification.type}
                          </span>
                          <span>
                            <i className="ri-time-line mr-1"></i>
                            {new Date(notification.created_at).toLocaleString('tr-TR')}
                          </span>
                          {notification.is_read && notification.read_at && (
                            <span>
                              <i className="ri-check-line mr-1"></i>
                              {new Date(notification.read_at).toLocaleString('tr-TR')} okundu
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              <i className="ri-check-line mr-1"></i>
                              Okundu İşaretle
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotifications([notification.id])}
                            className="text-sm text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line mr-1"></i>
                            Sil
                          </button>
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className="text-sm text-green-600 hover:text-green-800 cursor-pointer"
                            >
                              <i className="ri-external-link-line mr-1"></i>
                              Görüntüle
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {!isLoading && pagination.hasMore && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-arrow-down-line mr-2"></i>
                Daha Fazla Yükle ({pagination.total - notifications.length} kalan)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact view for dashboard
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Son Bildirimler</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.unread > 0 ? `${stats.unread} okunmamış bildirim` : 'Tüm bildirimler okundu'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={createTestNotification}
              className="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-800/30 text-green-600 dark:text-green-400 rounded-lg transition-colors cursor-pointer"
              title="Test Bildirimi Oluştur"
            >
              <i className="ri-add-line text-sm"></i>
            </button>
            
            <button
              onClick={markAllAsRead}
              className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
              title="Tümünü Okundu İşaretle"
            >
              <i className="ri-check-double-line text-sm"></i>
            </button>
            
            <button
              onClick={deleteAllNotifications}
              className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-800/30 text-red-600 dark:text-red-400 rounded-lg transition-colors cursor-pointer"
              title="Tüm Bildirimleri Sil"
            >
              <i className="ri-delete-bin-2-line text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-notification-off-line text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500">Henüz bildirim bulunmuyor</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.slice(0, 10).map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type, notification.priority)}`}>
                    <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium truncate ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                        {!notification.is_read && <span className="ml-1 w-1.5 h-1.5 bg-orange-500 rounded-full inline-block"></span>}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {getRelativeTime(notification.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{notification.message}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        notification.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        notification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.type}
                      </span>
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Okundu işaretle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button 
          onClick={onViewAll}
          className="w-full text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <i className="ri-more-line mr-2"></i>
          Tüm bildirimleri görüntüle ({stats.total})
        </button>
      </div>
    </div>
  );
}