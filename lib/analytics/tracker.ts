export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

export interface PageView {
  page: string;
  title: string;
  url: string;
  referrer?: string;
  timestamp?: number;
}

export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private events: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];

  private constructor() {}

  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  // Sayfa görüntüleme kaydet
  public trackPageView(pageView: PageView): void {
    const view: PageView = {
      ...pageView,
      timestamp: Date.now()
    };

    this.pageViews.push(view);
    
    // LocalStorage'a kaydet
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('analytics_pageviews');
      const storedViews = stored ? JSON.parse(stored) : [];
      storedViews.push(view);
      
      // Son 100 görüntülemeyi sakla
      const recentViews = storedViews.slice(-100);
      localStorage.setItem('analytics_pageviews', JSON.stringify(recentViews));
    }

    // Google Analytics'e gönder (eğer varsa)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_title: view.title,
        page_location: view.url
      });
    }

    // Kendi analytics API'sine gönder
    if (typeof window !== 'undefined') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'page_view',
          properties: view
        })
      }).catch(error => console.warn('Analytics tracking failed:', error));
    }

    console.log('📊 Page view tracked:', view);
  }

  // Olay kaydet
  public trackEvent(event: AnalyticsEvent): void {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(analyticsEvent);

    // LocalStorage'a kaydet
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('analytics_events');
      const storedEvents = stored ? JSON.parse(stored) : [];
      storedEvents.push(analyticsEvent);
      
      // Son 200 olayı sakla
      const recentEvents = storedEvents.slice(-200);
      localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
    }

    // Google Analytics'e gönder
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, event.properties);
    }

    // Kendi analytics API'sine gönder
    if (typeof window !== 'undefined') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event.event,
          properties: event.properties,
          userId: event.userId
        })
      }).catch(error => console.warn('Analytics tracking failed:', error));
    }

    console.log('📊 Event tracked:', analyticsEvent);
  }

  // Kitap görüntüleme
  public trackBookView(bookId: string, bookTitle: string): void {
    this.trackEvent({
      event: 'book_view',
      properties: {
        book_id: bookId,
        book_title: bookTitle,
        page_type: 'book_detail'
      }
    });
  }

  // Kitap beğenme
  public trackBookLike(bookId: string, bookTitle: string, action: 'like' | 'unlike'): void {
    this.trackEvent({
      event: 'book_like',
      properties: {
        book_id: bookId,
        book_title: bookTitle,
        action: action
      }
    });
  }

  // İletişim formu gönderimi
  public trackContactForm(subject: string): void {
    this.trackEvent({
      event: 'contact_form_submit',
      properties: {
        form_type: 'contact',
        subject: subject
      }
    });
  }

  // Newsletter kayıt
  public trackNewsletterSignup(source: string = 'website'): void {
    this.trackEvent({
      event: 'newsletter_signup',
      properties: {
        source: source
      }
    });
  }

  // Admin paneli girişi
  public trackAdminLogin(success: boolean): void {
    this.trackEvent({
      event: 'admin_login',
      properties: {
        success: success,
        timestamp: Date.now()
      }
    });
  }

  // Arama yapıldı
  public trackSearch(query: string, results: number): void {
    this.trackEvent({
      event: 'search',
      properties: {
        search_query: query,
        results_count: results
      }
    });
  }

  // Mobil/Desktop kullanım
  public trackDeviceInfo(): void {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
    
    this.trackEvent({
      event: 'device_info',
      properties: {
        device_type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        user_agent: userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height
      }
    });
  }

  // Performans metrikleri
  public trackPerformance(metric: string, value: number): void {
    this.trackEvent({
      event: 'performance',
      properties: {
        metric: metric,
        value: value,
        unit: 'ms'
      }
    });
  }

  // Hata kaydetme
  public trackError(error: string, page: string, userId?: string): void {
    this.trackEvent({
      event: 'error',
      properties: {
        error_message: error,
        page: page,
        user_id: userId
      }
    });
  }

  // Verileri al
  public getPageViews(): PageView[] {
    return this.pageViews;
  }

  public getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  // LocalStorage'dan verileri yükle
  public loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedViews = localStorage.getItem('analytics_pageviews');
      if (storedViews) {
        this.pageViews = JSON.parse(storedViews);
      }

      const storedEvents = localStorage.getItem('analytics_events');
      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }
    } catch (error) {
      console.error('Analytics data loading failed:', error);
    }
  }

  // Verileri temizle
  public clearData(): void {
    this.events = [];
    this.pageViews = [];

    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_pageviews');
      localStorage.removeItem('analytics_events');
    }
  }

  // İstatistikleri al
  public getStats(): {
    totalPageViews: number;
    totalEvents: number;
    uniquePages: number;
    topPages: Array<{ page: string; views: number }>;
    topEvents: Array<{ event: string; count: number }>;
  } {
    const uniquePages = new Set(this.pageViews.map(pv => pv.page));
    
    const pageCounts: Record<string, number> = {};
    this.pageViews.forEach(pv => {
      pageCounts[pv.page] = (pageCounts[pv.page] || 0) + 1;
    });

    const eventCounts: Record<string, number> = {};
    this.events.forEach(ev => {
      eventCounts[ev.event] = (eventCounts[ev.event] || 0) + 1;
    });

    return {
      totalPageViews: this.pageViews.length,
      totalEvents: this.events.length,
      uniquePages: uniquePages.size,
      topPages: Object.entries(pageCounts)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      topEvents: Object.entries(eventCounts)
        .map(([event, count]) => ({ event, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }
}

export const analytics = AnalyticsTracker.getInstance();
