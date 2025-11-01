'use client';

import { useEffect, useState } from 'react';
import { syncManager } from '@/lib/syncManager';

interface SyncProviderProps {
  children: React.ReactNode;
}

export default function SyncProvider({ children }: SyncProviderProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Sync manager'ı başlat
    const status = syncManager.getStatus();
    setIsConnected(status.connected);

    // Sync event'lerini dinle
    const handleBooksUpdate = (data: any) => {
      console.log('📚 Books updated via sync:', data);
      // Books güncellendiğinde sayfayı yenile
      window.location.reload();
    };

    const handleSettingsUpdate = (data: any) => {
      console.log('⚙️ Settings updated via sync:', data);
      // Settings güncellendiğinde sayfayı yenile
      window.location.reload();
    };

    const handlePageUpdate = (data: any) => {
      console.log('📄 Page updated via sync:', data);
      // Sayfa güncellendiğinde cache'i temizle
      localStorage.removeItem(`page_${data.slug}`);
    };

    const handleChapterUpdate = (data: any) => {
      console.log('📖 Chapter updated via sync:', data);
      // Bölüm güncellendiğinde kitap cache'ini temizle
      localStorage.removeItem(`book_content_${data.bookSlug}`);
      localStorage.removeItem(`page_${data.bookSlug}`);
      // Sayfayı yenile
      window.location.reload();
    };

    const handleAuthChange = (data: any) => {
      console.log('🔐 Auth changed via sync:', data);
      // Auth değiştiğinde sayfayı yenile
      window.location.reload();
    };

    // Event listener'ları ekle
    syncManager.on('books_updated', handleBooksUpdate);
    syncManager.on('settings_updated', handleSettingsUpdate);
    syncManager.on('page_updated', handlePageUpdate);
    syncManager.on('chapter_created', handleChapterUpdate);
    syncManager.on('chapter_updated', handleChapterUpdate);
    syncManager.on('chapter_deleted', handleChapterUpdate);
    syncManager.on('auth_changed', handleAuthChange);

    // Cleanup
    return () => {
      syncManager.off('books_updated', handleBooksUpdate);
      syncManager.off('settings_updated', handleSettingsUpdate);
      syncManager.off('page_updated', handlePageUpdate);
      syncManager.off('chapter_created', handleChapterUpdate);
      syncManager.off('chapter_updated', handleChapterUpdate);
      syncManager.off('chapter_deleted', handleChapterUpdate);
      syncManager.off('auth_changed', handleAuthChange);
    };
  }, []);

  return (
    <>
      {children}
      {/* Sync status indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isConnected ? 'Sync Connected' : 'Sync Disconnected'} />
        </div>
      )}
    </>
  );
}
