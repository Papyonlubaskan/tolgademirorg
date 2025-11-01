
'use client';

import { useState } from 'react';

interface QuickActionsProps {
  onSectionChange: (section: string) => void;
}

export default function QuickActions({ onSectionChange }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    {
      id: 'new-post',
      label: 'Yeni Blog Yazısı',
      icon: 'ri-article-line',
      color: 'bg-blue-500',
      action: () => onSectionChange('blog')
    },
    {
      id: 'new-book',
      label: 'Yeni Kitap Ekle',
      icon: 'ri-book-line',
      color: 'bg-purple-500',
      action: () => onSectionChange('books')
    },
    {
      id: 'new-event',
      label: 'Yeni Etkinlik',
      icon: 'ri-calendar-event-line',  
      color: 'bg-green-500',
      action: () => onSectionChange('events')
    },
    {
      id: 'new-page',
      label: 'Yeni Sayfa',
      icon: 'ri-pages-line',
      color: 'bg-orange-500',
      action: () => onSectionChange('pages')
    },
    {
      id: 'maintenance',
      label: 'Bakım Modu',
      icon: 'ri-tools-line',
      color: 'bg-red-500',
      action: () => onSectionChange('maintenance')
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Hızlı İşlem Butonları */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3">
          {quickActions.map((action, index) => (
            <div
              key={action.id}
              className="animate-in slide-in-from-bottom duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                className={`${action.color} hover:scale-105 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap`}
                title={action.label}
              >
                <i className={action.icon}></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ana FAB Butonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer whitespace-nowrap ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        <i className="ri-add-line text-xl"></i>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black dark:bg-gray-900 bg-opacity-20 dark:bg-opacity-40 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
