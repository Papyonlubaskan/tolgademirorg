interface AnalyticsConfig {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  hotjarId?: string;
  enabled: boolean;
}

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

interface PageView {
  page: string;
  title: string;
  url: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

interface UserProperties {
  userId?: string;
  userType?: 'visitor' | 'subscriber' | 'admin';
  subscriptionStatus?: 'active' | 'inactive' | 'trial';
  customProperties?: Record<string, any>;
}

class AnalyticsManager {
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];
  private userProperties: UserProperties = {};

  constructor() {
    this.config = {
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
      googleTagManagerId: process.env.NEXT_PUBLIC_GTM_ID,
      facebookPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
      hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
      enabled: process.env.NODE_ENV === 'production'
    };

    this.initializeAnalytics();
  }

  // Initialize analytics
  private initializeAnalytics(): void {
    if (typeof window === 'undefined' || !this.config.enabled) return;

    // Google Analytics
    if (this.config.googleAnalyticsId) {
      this.loadGoogleAnalytics();
    }

    // Google Tag Manager
    if (this.config.googleTagManagerId) {
      this.loadGoogleTagManager();
    }

    // Facebook Pixel
    if (this.config.facebookPixelId) {
      this.loadFacebookPixel();
    }

    // Hotjar
    if (this.config.hotjarId) {
      this.loadHotjar();
    }
  }

  // Load Google Analytics
  private loadGoogleAnalytics(): void {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.config.googleAnalyticsId, {
      page_title: document.title,
      page_location: window.location.href
    });
  }

  // Load Google Tag Manager
  private loadGoogleTagManager(): void {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${this.config.googleTagManagerId}');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${this.config.googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);
  }

  // Load Facebook Pixel
  private loadFacebookPixel(): void {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${this.config.facebookPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }

  // Load Hotjar
  private loadHotjar(): void {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${this.config.hotjarId},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(script);
  }

  // Track page view
  trackPageView(page: string, title: string, url: string): void {
    if (!this.config.enabled) return;

    const pageView: PageView = {
      page,
      title,
      url,
      timestamp: Date.now(),
      userId: this.userProperties.userId,
      sessionId: this.getSessionId()
    };

    this.pageViews.push(pageView);

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('config', this.config.googleAnalyticsId, {
        page_title: title,
        page_location: url
      });
    }

    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }

    // Google Tag Manager
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'page_view',
        page_title: title,
        page_location: url,
        page_path: page
      });
    }
  }

  // Track event
  trackEvent(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    this.events.push(event);

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.customParameters
      });
    }

    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq('track', event.action, {
        content_category: event.category,
        content_name: event.label,
        value: event.value,
        ...event.customParameters
      });
    }

    // Google Tag Manager
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: event.action,
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.customParameters
      });
    }
  }

  // Track custom event
  trackCustomEvent(eventName: string, parameters: Record<string, any> = {}): void {
    this.trackEvent({
      action: eventName,
      category: 'Custom',
      customParameters: parameters
    });
  }

  // Track book view
  trackBookView(bookId: string, bookTitle: string): void {
    this.trackEvent({
      action: 'view_item',
      category: 'Books',
      label: bookTitle,
      customParameters: {
        item_id: bookId,
        item_name: bookTitle,
        item_category: 'Books'
      }
    });
  }

  // Track chapter read
  trackChapterRead(bookId: string, chapterId: string, chapterTitle: string): void {
    this.trackEvent({
      action: 'read_chapter',
      category: 'Books',
      label: chapterTitle,
      customParameters: {
        book_id: bookId,
        chapter_id: chapterId,
        chapter_title: chapterTitle
      }
    });
  }

  // Track search
  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent({
      action: 'search',
      category: 'Site',
      label: query,
      value: resultsCount,
      customParameters: {
        search_term: query,
        results_count: resultsCount
      }
    });
  }

  // Track newsletter subscription
  trackNewsletterSubscription(email: string): void {
    this.trackEvent({
      action: 'subscribe',
      category: 'Newsletter',
      label: 'Newsletter Subscription',
      customParameters: {
        email: email
      }
    });
  }

  // Track contact form submission
  trackContactForm(name: string, subject: string): void {
    this.trackEvent({
      action: 'contact',
      category: 'Forms',
      label: 'Contact Form',
      customParameters: {
        contact_name: name,
        contact_subject: subject
      }
    });
  }

  // Track download
  trackDownload(fileName: string, fileType: string): void {
    this.trackEvent({
      action: 'download',
      category: 'Files',
      label: fileName,
      customParameters: {
        file_name: fileName,
        file_type: fileType
      }
    });
  }

  // Track social share
  trackSocialShare(platform: string, content: string): void {
    this.trackEvent({
      action: 'share',
      category: 'Social',
      label: platform,
      customParameters: {
        platform: platform,
        content: content
      }
    });
  }

  // Set user properties
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('config', this.config.googleAnalyticsId, {
        user_id: properties.userId,
        custom_map: properties.customProperties
      });
    }

    // Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq('track', 'CompleteRegistration', {
        user_id: properties.userId,
        ...properties.customProperties
      });
    }
  }

  // Get session ID
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Get analytics data
  getAnalyticsData(): {
    events: AnalyticsEvent[];
    pageViews: PageView[];
    userProperties: UserProperties;
  } {
    return {
      events: this.events,
      pageViews: this.pageViews,
      userProperties: this.userProperties
    };
  }

  // Clear analytics data
  clearAnalyticsData(): void {
    this.events = [];
    this.pageViews = [];
    this.userProperties = {};
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  // Get analytics status
  isEnabled(): boolean {
    return this.config.enabled;
  }

  // Get configuration
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }
}

// Global analytics manager instance
const analyticsManager = new AnalyticsManager();

// Export manager and types
export { analyticsManager };
export type { AnalyticsEvent, PageView, UserProperties };
export default analyticsManager;
