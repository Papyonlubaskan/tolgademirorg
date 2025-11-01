
'use client';

import { useState, useEffect } from 'react';
import ActivityLog from './ActivityLog';
import VisitorMap from './VisitorMap';
import NotificationCenter from './NotificationCenter';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface DashboardHomeProps {
  onSectionChange: (section: string) => void;
}

interface DashboardStats {
  totalBooks: number;
  totalChapters: number;
  totalComments: number;
  totalMessages: number;
  totalEvents: number;
  totalVisitors: number;
  publishedBooks: number;
  draftBooks: number;
  upcomingEvents: number;
  totalBlogPosts: number;
  publishedPosts: number;
  draftPosts: number;
}

interface PopularContent {
  books: Array<{
    id: string;
    title: string;
    chapters: number;
    comments: number;
    likes: number;
  }>;
  events: Array<{
    id: string;
    title: string;
    date: string;
    participants: number;
    maxParticipants: number;
  }>;
}

interface Notification {
  id: string;
  type: 'comment' | 'message' | 'event' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  data?: any;
}

export default function DashboardHome({ onSectionChange }: DashboardHomeProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalChapters: 0,
    totalComments: 0,
    totalMessages: 0,
    totalEvents: 0,
    totalVisitors: 0,
    publishedBooks: 0,
    draftBooks: 0,
    upcomingEvents: 0,
    totalBlogPosts: 0,
    publishedPosts: 0,
    draftPosts: 0
  });

  const [popularContent, setPopularContent] = useState<PopularContent>({
    books: [],
    events: []
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Verileri yükle
  useEffect(() => {
    loadDashboardData();
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadPopularContent(),
        loadNotifications()
      ]);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Dashboard veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const overview = result.data.overview || {};
          setStats({
            totalBooks: overview.totalBooks || 0,
            totalChapters: overview.totalChapters || 0,
            totalComments: overview.totalComments || 0,
            totalMessages: 0,
            totalEvents: 0,
            totalVisitors: 0,
            publishedBooks: overview.totalBooks || 0,
            draftBooks: 0,
            upcomingEvents: 0,
            totalBlogPosts: 0,
            publishedPosts: 0,
            draftPosts: 0
          });
        }
      }
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    }
  };

  const getFallbackStats = (): DashboardStats => {
    return {
      totalBooks: 8,
      totalChapters: 45,
      totalComments: 234,
      totalMessages: 67,
      totalEvents: 12,
      totalVisitors: 15420,
      publishedBooks: 6,
      draftBooks: 2,
      upcomingEvents: 3,
      totalBlogPosts: 24,
      publishedPosts: 18,
      draftPosts: 6
    };
  };

  const loadPopularContent = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // popularBooks ve recentBooks'u kullan
          const popularBooks = (result.data.popularBooks || []).map((book: any) => ({
            id: book.id.toString(),
            title: book.title,
            chapters: 0,
            comments: 0,
            likes: book.like_count || 0
          }));

          setPopularContent({
            books: popularBooks.slice(0, 5),
            events: []
          });
        }
      }
    } catch (error) {
      console.error('Popüler içerik yükleme hatası:', error);
    }
  };

  const getFallbackPopularContent = (): PopularContent => {
    return {
      books: [
        { id: '1', title: "Kelebek Etkisi", chapters: 12, comments: 45, likes: 128 },
        { id: '2', title: "Ruhun Dili", chapters: 15, comments: 67, likes: 195 },
        { id: '3', title: "Sonsuz Döngü", chapters: 8, comments: 23, likes: 89 }
      ],
      events: [
        { 
          id: '1', 
          title: "Yazım Atölyesi", 
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
          participants: 15, 
          maxParticipants: 25 
        },
        { 
          id: '2', 
          title: "Kitap Okuma Kulübü", 
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), 
          participants: 8, 
          maxParticipants: 15 
        }
      ]
    };
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
          setNotifications(result.data.notifications || []);
          return;
        }
      }
      
      // Fallback
      const notifications: Notification[] = [];

      // Güvenli API çağrıları
      const apiCalls = [
        {
          name: 'comments',
          url: `/api/books`,
          type: 'comment'
        },
        {
          name: 'messages',
          url: `/api/books`,
          type: 'message'
        },
        {
          name: 'events',
          url: `/api/books`,
          type: 'event'
        }
      ];

      // Her API çağrısını güvenli şekilde yap
      for (const apiCall of apiCalls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(apiCall.url, {
            headers: { 
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data && Array.isArray(data.data)) {
              if (apiCall.type === 'comment') {
                data.data.forEach((comment: any) => {
                  if (comment && comment.id) {
                    notifications.push({
                      id: `comment-${comment.id}`,
                      type: 'comment',
                      title: 'Yeni Yorum',
                      message: `${comment.author_name || 'Anonim'} bir yorum bıraktı: "${(comment.content || '').substring(0, 50)}..."`,
                      time: comment.created_at || new Date().toISOString(),
                      isRead: false,
                      data: comment
                    });
                  }
                });
              } else if (apiCall.type === 'message') {
                data.data.forEach((message: any) => {
                  if (message && message.id) {
                    notifications.push({
                      id: `message-${message.id}`,
                      type: 'message',
                      title: 'Yeni Mesaj',
                      message: `${message.name || 'Anonim'} adlı kişiden mesaj: "${(message.message || '').substring(0, 50)}..."`,
                      time: message.created_at || new Date().toISOString(),
                      isRead: false,
                      data: message
                    });
                  }
                });
              } else if (apiCall.type === 'event') {
                const now = new Date();
                const upcomingEvents = data.data.filter((event: any) => {
                  if (!event || !event.event_date) return false;
                  try {
                    const eventDate = new Date(event.event_date);
                    const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                    return daysDiff > 0 && daysDiff <= 7;
                  } catch (error) {
                    return false;
                  }
                });

                upcomingEvents.forEach((event: any) => {
                  if (event && event.id) {
                    try {
                      const eventDate = new Date(event.event_date);
                      const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                      
                      notifications.push({
                        id: `event-${event.id}`,
                        type: 'event',
                        title: 'Yaklaşan Etkinlik',
                        message: `"${event.title || 'İsimsiz Etkinlik'}" etkinliği ${daysDiff} gün sonra başlayacak`,
                        time: eventDate.toISOString(),
                        isRead: false,
                        data: event
                      });
                    } catch (error) {
                      console.error('Event date processing error:', error);
                    }
                  }
                });
              }
            }
          }
        } catch (apiError) {
          console.error(`${apiCall.name} API hatası:`, apiError);
          // Bu API hata verirse diğerlerine devam et
          continue;
        }
      }

      // Eğer hiç bildirim yoksa sistem bildirimi ekle
      if (notifications.length === 0) {
        notifications.push({
          id: 'system-welcome',
          type: 'system',
          title: 'Admin Paneli Aktif',
          message: 'Sistem çalışıyor ve hazır durumda',
          time: new Date().toISOString(),
          isRead: false
        });
      }

      // Tarihe göre sırala (en yeni önce)
      notifications.sort((a, b) => {
        try {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        } catch (error) {
          return 0;
        }
      });
      
      setNotifications(notifications.slice(0, 10));

    } catch (error) {
      console.error('Bildirim yükleme hatası:', error);
      // Fallback bildirim
      setNotifications([{
        id: 'fallback-1',
        type: 'system',
        title: 'Sistem Bildirimi',
        message: 'Admin paneli başarıyla yüklendi',
        time: new Date().toISOString(),
        isRead: false
      }]);
    }
  };

  const getEngagementRate = () => {
    if (!stats || stats.totalVisitors === 0) return 0;
    return Math.round((stats.totalComments / stats.totalVisitors) * 100);
  };

  const getContentRatio = () => {
    if (!stats || stats.totalBooks === 0) return 0;
    return Math.round(stats.totalChapters / stats.totalBooks);
  };

  const getResponseRate = () => {
    if (!stats || stats.totalMessages === 0) return 100;
    return Math.round(((stats.totalMessages - 2) / stats.totalMessages) * 100);
  };

  if (showAllActivities) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tüm Sistem Aktiviteleri</h2>
            <p className="text-gray-600 dark:text-gray-400">Sistemde gerçekleşen tüm aktivite kayıtları</p>
          </div>
          <button
            onClick={() => setShowAllActivities(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Dashboard'a Dön
          </button>
        </div>
        
        <ActivityLog showFullView={true} onViewAll={() => setShowAllActivities(false)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Dashboard yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen p-6 -m-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard'a Hoş Geldiniz</h1>
            <p className="text-orange-100" suppressHydrationWarning>
              Son güncelleme: {lastUpdate ? lastUpdate.toLocaleString('tr-TR') : 'Henüz güncellenmedi'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-orange-100">Sistem Durumu</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Toplam Kitap</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalBooks || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {stats?.publishedBooks || 0} yayında, {stats?.draftBooks || 0} taslak
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-700">
              <i className="ri-book-line text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Toplam Bölüm</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalChapters || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Kitap başına ort. {getContentRatio()} bölüm
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center border border-green-200 dark:border-green-700">
              <i className="ri-file-text-line text-green-600 dark:text-green-400 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Toplam Yorum</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalComments || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Etkileşim oranı: %{getEngagementRate()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700">
              <i className="ri-chat-3-line text-purple-600 dark:text-purple-400 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Ziyaretçi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats?.totalVisitors || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Bu ay toplam</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center border border-orange-200 dark:border-orange-700">
              <i className="ri-user-line text-orange-600 dark:text-orange-400 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">İçerik İstatistikleri</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Blog Yazıları</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats?.totalBlogPosts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Yayında Blog</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{stats?.publishedPosts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Taslak Blog</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">{stats?.draftPosts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Toplam Etkinlik</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats?.totalEvents || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Yaklaşan Etkinlik</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{stats?.upcomingEvents || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Performans Metrikleri</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Etkileşim Oranı</span>
                <span className="font-semibold">%{getEngagementRate()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(getEngagementRate(), 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">İçerik Oranı</span>
                <span className="font-semibold">{getContentRatio()} bölüm/kitap</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(getContentRatio() * 10, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Yanıt Oranı</span>
                <span className="font-semibold">%{getResponseRate()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${getResponseRate()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Hızlı İşlemler</h3>
          <div className="space-y-3">
            <button
              onClick={() => onSectionChange('books')}
              className="w-full flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-book-line text-blue-600 mr-3"></i>
              <span className="text-gray-700 dark:text-gray-300">Yeni Kitap Ekle</span>
            </button>
            
            <button
              onClick={() => onSectionChange('media')}
              className="w-full flex items-center p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/40 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-image-2-line text-green-600 mr-3"></i>
              <span className="text-gray-700 dark:text-gray-300">Medya Yönetimi</span>
            </button>
            
            <button
              onClick={() => onSectionChange('comments')}
              className="w-full flex items-center p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800/40 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-chat-3-line text-purple-600 mr-3"></i>
              <span className="text-gray-700 dark:text-gray-300">Yorumları Yönet</span>
            </button>
            
            <button
              onClick={() => onSectionChange('messages')}
              className="w-full flex items-center p-3 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-800/40 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-message-2-line text-orange-600 mr-3"></i>
              <span className="text-gray-700 dark:text-gray-300">Mesajları Görüntüle</span>
            </button>
            
            <button
              onClick={async () => {
                try {
                  const token = sessionStorage.getItem('admin_token');
                  const response = await fetch('/api/admin/backup/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ includeData: true, includeImages: true })
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                      alert('Yedek başarıyla oluşturuldu! Medya yönetiminde görüntüleyebilirsiniz.');
                      onSectionChange('media');
                    } else {
                      alert(`Hata: ${result.error || 'Yedek oluşturulamadı'}`);
                    }
                  } else {
                    alert('Yedek oluşturma başarısız oldu.');
                  }
                } catch (error) {
                  console.error('Yedek oluşturma hatası:', error);
                  alert('Yedek oluşturulurken bir hata oluştu.');
                }
              }}
              className="w-full flex items-center p-3 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-800/40 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-database-2-line text-teal-600 mr-3"></i>
              <span className="text-gray-700 dark:text-gray-300">Yedek Oluştur</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Popüler İçerik</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">En çok etkileşim alan içerikler</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">En Popüler Kitaplar</h4>
              {popularContent.books.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Henüz kitap bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {popularContent.books.map((book) => (
                    <div key={book.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{book.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {book.chapters} bölüm • {book.comments} yorum • {book.likes} beğeni
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Yaklaşan Etkinlikler</h4>
              {popularContent.events.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Yaklaşan etkinlik bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {popularContent.events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{event.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400" suppressHydrationWarning>
                          {event.date ? new Date(event.date).toLocaleDateString('tr-TR') : 'Tarih belirtilmemiş'} • 
                          {event.maxParticipants > 0 ? ` ${event.participants}/${event.maxParticipants} kişi` : ` ${event.participants} katılımcı`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <NotificationCenter 
            showFullView={false}
            onViewAll={() => onSectionChange('notifications')}
          />
        </div>
      </div>

      {/* Activity Log and Visitor Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityLog 
          showFullView={false}
          onViewAll={() => setShowAllActivities(true)}
        />
        <VisitorMap />
      </div>
    </div>
  );
}
