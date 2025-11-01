
'use client';

import { useState, useEffect } from 'react';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [quickStats, setQuickStats] = useState([
    { label: 'Toplam Kitap', value: '0', color: 'text-blue-600' },
    { label: 'Bölümler', value: '0', color: 'text-green-600' },
    { label: 'Yorumlar', value: '0', color: 'text-orange-600' },
    { label: 'Beğeniler', value: '0', color: 'text-purple-600' }
  ]);

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.overview) {
          const { totalBooks, totalChapters, totalComments, totalLikes } = result.data.overview;
          setQuickStats([
            { label: 'Toplam Kitap', value: totalBooks.toString(), color: 'text-blue-600' },
            { label: 'Bölümler', value: totalChapters.toString(), color: 'text-green-600' },
            { label: 'Yorumlar', value: totalComments.toString(), color: 'text-orange-600' },
            { label: 'Beğeniler', value: totalLikes.toString(), color: 'text-purple-600' }
          ]);
        }
      }
    } catch (error) {
      console.error('Quick stats load error:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'ri-dashboard-line' },
    { id: 'statistics', name: 'İstatistikler', icon: 'ri-bar-chart-line' },
    { id: 'books', name: 'Kitap Yönetimi', icon: 'ri-book-line' },
    { id: 'media', name: 'Medya Yönetimi', icon: 'ri-image-line' },
    { id: 'messages', name: 'Mesaj Yönetimi', icon: 'ri-mail-line' },
    { id: 'comments', name: 'İçerik Yorumları', icon: 'ri-chat-3-line' },
    { id: 'security', name: 'Güvenlik Merkezi', icon: 'ri-shield-check-line' },
    { id: 'maintenance', name: 'Bakım Modu', icon: 'ri-tools-line' },
    { id: 'settings', name: 'Site Ayarları', icon: 'ri-settings-line' },
    { id: 'notifications', name: 'Bildirim Merkezi', icon: 'ri-notification-line' }
  ];


  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Yönetim Merkezi</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            <i className={`ri-${isCollapsed ? 'menu-unfold' : 'menu-fold'}-line text-gray-700 dark:text-gray-300`}></i>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Hızlı Durum</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((stat, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer group ${
                activeSection === item.id
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-300 border-l-4 border-orange-500'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isCollapsed ? item.name : ''}
            >
              <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 ${
                activeSection === item.id ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
              }`}>
                <i className={`${item.icon} text-lg`}></i>
              </div>
              {!isCollapsed && (
                <span className="ml-3 font-medium text-sm">{item.name}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Sistem Durumu</span>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-200">
              <div>• Veritabanı: Bağlı</div>
              <div>• Cache: Aktif</div>
              <div>• SSL: Güvenli</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
