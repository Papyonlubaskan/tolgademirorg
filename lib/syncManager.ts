// Admin-Frontend Sync Manager
// Real-time data synchronization between admin panel and frontend

interface SyncEvent {
  type: 'book_created' | 'book_updated' | 'book_deleted' | 
        'chapter_created' | 'chapter_updated' | 'chapter_deleted' |
        'settings_updated' | 'page_updated' | 'message_received';
  data: any;
  timestamp: number;
}

class SyncManager {
  private listeners: Map<string, Function[]> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.startSync();
  }

  // Event listener ekle
  on(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  // Event listener kaldır
  off(eventType: string, callback: Function) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Event emit et
  emit(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Sync event callback error:', error);
        }
      });
    }
  }

  // Sync başlat
  private startSync() {
    if (typeof window === 'undefined') return;

    // localStorage değişikliklerini dinle
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Custom event'leri dinle
    window.addEventListener('adminDataChanged', this.handleAdminDataChange.bind(this));
    
    // Periodic sync (her 30 saniyede)
    setInterval(() => {
      this.performSync();
    }, 30000);

    this.isConnected = true;
    console.log('🔄 Sync Manager started');
  }

  // Storage değişikliklerini handle et
  private handleStorageChange(event: StorageEvent) {
    if (!event.key || !event.newValue) return;

    try {
      const data = JSON.parse(event.newValue);
      
      switch (event.key) {
        case 'books':
          this.emit('books_updated', data);
          break;
        case 'settings':
          this.emit('settings_updated', data);
          break;
        case 'admin_token':
          this.emit('auth_changed', { token: event.newValue });
          break;
      }
    } catch (error) {
      console.error('Storage sync error:', error);
    }
  }

  // Admin data değişikliklerini handle et
  private handleAdminDataChange(event: CustomEvent) {
    const { type, data } = event.detail;
    this.emit(type, data);
  }

  // Periodic sync
  private async performSync() {
    try {
      // Settings sync
      await this.syncSettings();
      
      // Books sync
      await this.syncBooks();
      
      // Pages sync
      await this.syncPages();
      
    } catch (error) {
      console.error('Periodic sync error:', error);
    }
  }

  // Settings sync
  private async syncSettings() {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const currentSettings = localStorage.getItem('settings');
          const newSettings = JSON.stringify(result.data);
          
          if (currentSettings !== newSettings) {
            localStorage.setItem('settings', newSettings);
            this.emit('settings_updated', result.data);
          }
        }
      }
    } catch (error) {
      console.error('Settings sync error:', error);
    }
  }

  // Books sync
  private async syncBooks() {
    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const currentBooks = localStorage.getItem('books');
          const newBooks = JSON.stringify(result.data);
          
          if (currentBooks !== newBooks) {
            localStorage.setItem('books', newBooks);
            this.emit('books_updated', result.data);
          }
        }
      }
    } catch (error) {
      console.error('Books sync error:', error);
    }
  }

  // Pages sync
  private async syncPages() {
    try {
      const response = await fetch('/api/admin/pages');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Her sayfa için ayrı ayrı sync
          result.data.forEach((page: any) => {
            const pageKey = `page_${page.slug}`;
            const currentPage = localStorage.getItem(pageKey);
            const newPage = JSON.stringify(page);
            
            if (currentPage !== newPage) {
              localStorage.setItem(pageKey, newPage);
              this.emit('page_updated', page);
            }
          });
        }
      }
    } catch (error) {
      console.error('Pages sync error:', error);
    }
  }

  // Manual sync trigger
  async triggerSync(type: string) {
    switch (type) {
      case 'settings':
        await this.syncSettings();
        break;
      case 'books':
        await this.syncBooks();
        break;
      case 'pages':
        await this.syncPages();
        break;
      case 'all':
        await this.performSync();
        break;
    }
  }

  // Admin panel'den data değişikliği bildir
  notifyDataChange(type: string, data: any) {
    const event = new CustomEvent('adminDataChanged', {
      detail: { type, data, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  // Cache temizle
  clearCache() {
    const keys = ['books', 'settings', 'page_home'];
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Page keys'leri temizle
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('page_')) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('🗑️ Cache cleared');
  }

  // Sync durumu
  getStatus() {
    return {
      connected: this.isConnected,
      listeners: Array.from(this.listeners.keys()),
      timestamp: Date.now()
    };
  }
}

// Global sync manager instance (lazy initialization)
let syncManagerInstance: SyncManager | null = null;

export const syncManager = {
  getInstance() {
    if (!syncManagerInstance && typeof window !== 'undefined') {
      syncManagerInstance = new SyncManager();
    }
    return syncManagerInstance;
  },
  
  on(eventType: string, callback: Function) {
    const instance = this.getInstance();
    if (instance) instance.on(eventType, callback);
  },
  
  off(eventType: string, callback: Function) {
    const instance = this.getInstance();
    if (instance) instance.off(eventType, callback);
  },
  
  emit(eventType: string, data: any) {
    const instance = this.getInstance();
    if (instance) instance.emit(eventType, data);
  },
  
  notifyDataChange(type: string, data: any) {
    const instance = this.getInstance();
    if (instance) instance.notifyDataChange(type, data);
  },
  
  clearCache() {
    const instance = this.getInstance();
    if (instance) instance.clearCache();
  },
  
  getStatus() {
    const instance = this.getInstance();
    return instance ? instance.getStatus() : { connected: false, listeners: [], timestamp: Date.now() };
  }
};

// Helper functions
export const notifyAdminChange = (type: string, data: any) => {
  syncManager.notifyDataChange(type, data);
};

export const clearAllCache = () => {
  syncManager.clearCache();
};

export const triggerDataSync = (type: string) => {
  (syncManager as any).triggerSync?.(type);
};

export default syncManager;
