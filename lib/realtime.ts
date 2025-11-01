// Real-time güncelleme sistemi (WebSocket tabanlı)

interface RealtimeEvent {
  type: 'book_updated' | 'chapter_added' | 'message_received' | 'settings_changed' | 'maintenance_toggle';
  data: any;
  timestamp: string;
  userId?: string;
}

interface RealtimeSubscription {
  id: string;
  eventType: string;
  callback: (event: RealtimeEvent) => void;
  userId?: string;
}

class RealtimeManager {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private eventQueue: RealtimeEvent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // WebSocket bağlantısını başlat
    this.connect();
    
    // Sayfa kapatılırken bağlantıyı kapat
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  private connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Kuyruktaki event'leri gönder
        this.flushEventQueue();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.handleEvent(realtimeEvent);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached. Falling back to polling.');
      this.fallbackToPolling();
    }
  }

  private fallbackToPolling() {
    console.log('🔄 Falling back to polling mode');
    
    // Her 30 saniyede bir API'den güncellemeleri kontrol et
    setInterval(async () => {
      try {
        const response = await fetch('/api/realtime/check-updates');
        if (response.ok) {
          const updates = await response.json();
          updates.forEach((event: RealtimeEvent) => {
            this.handleEvent(event);
          });
        }
      } catch (error) {
        console.error('❌ Polling failed:', error);
      }
    }, 30000);
  }

  private handleEvent(event: RealtimeEvent) {
    // Event'i tüm abonelere gönder
    for (const subscription of this.subscriptions.values()) {
      if (subscription.eventType === event.type || subscription.eventType === '*') {
        try {
          subscription.callback(event);
        } catch (error) {
          console.error('❌ Subscription callback error:', error);
        }
      }
    }
  }

  private flushEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event && this.ws && this.isConnected) {
        this.ws.send(JSON.stringify(event));
      }
    }
  }

  // Event'e abone ol
  subscribe(eventType: string, callback: (event: RealtimeEvent) => void, userId?: string): string {
    const subscriptionId = Math.random().toString(36).substr(2, 9);
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      eventType,
      callback,
      userId
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    console.log(`📡 Subscribed to ${eventType} events`);
    
    return subscriptionId;
  }

  // Aboneliği iptal et
  unsubscribe(subscriptionId: string) {
    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.delete(subscriptionId);
      console.log(`📡 Unsubscribed from events`);
    }
  }

  // Event gönder (admin panelinden)
  sendEvent(type: RealtimeEvent['type'], data: any, userId?: string) {
    const event: RealtimeEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
      userId
    };

    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(event));
    } else {
      // Bağlantı yoksa kuyruğa ekle
      this.eventQueue.push(event);
    }
  }

  // Bağlantı durumunu kontrol et
  isConnectionActive(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Bağlantıyı kapat
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  // Bağlantıyı yeniden başlat
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Global realtime manager
export const realtimeManager = new RealtimeManager();

// React hook için realtime
export const useRealtime = () => {
  const subscribe = (eventType: string, callback: (event: RealtimeEvent) => void, userId?: string) => {
    return realtimeManager.subscribe(eventType, callback, userId);
  };

  const unsubscribe = (subscriptionId: string) => {
    realtimeManager.unsubscribe(subscriptionId);
  };

  const sendEvent = (type: RealtimeEvent['type'], data: any, userId?: string) => {
    realtimeManager.sendEvent(type, data, userId);
  };

  const isConnected = () => {
    return realtimeManager.isConnectionActive();
  };

  return {
    subscribe,
    unsubscribe,
    sendEvent,
    isConnected
  };
};

// Cache invalidation ile entegrasyon
export const invalidateCacheOnEvent = (event: RealtimeEvent) => {
  // Cache'i temizle
  const { invalidateCache } = require('@/lib/cache');
  
  switch (event.type) {
    case 'book_updated':
      invalidateCache('books');
      invalidateCache('book_content');
      break;
    case 'chapter_added':
      invalidateCache('book_content');
      break;
    case 'settings_changed':
      invalidateCache('settings');
      break;
    case 'message_received':
      invalidateCache('messages');
      break;
    case 'maintenance_toggle':
      invalidateCache('settings');
      break;
  }
};

// Admin paneli için event gönderme yardımcıları
export const notifyBookUpdate = (bookData: any) => {
  realtimeManager.sendEvent('book_updated', bookData);
};

export const notifyChapterAdd = (chapterData: any) => {
  realtimeManager.sendEvent('chapter_added', chapterData);
};

export const notifyMessageReceived = (messageData: any) => {
  realtimeManager.sendEvent('message_received', messageData);
};

export const notifySettingsChange = (settingsData: any) => {
  realtimeManager.sendEvent('settings_changed', settingsData);
};

export const notifyMaintenanceToggle = (maintenanceMode: boolean) => {
  realtimeManager.sendEvent('maintenance_toggle', { maintenance_mode: maintenanceMode });
};
