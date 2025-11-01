// Performance monitoring utilities

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMetrics();
    }
  }

  private initializeMetrics() {
    // Page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      }
    });

    // First Contentful Paint
    this.observeMetric('paint', (entry: PerformanceEntry) => {
      if (entry.name === 'first-contentful-paint') {
        this.metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Largest Contentful Paint
    this.observeMetric('largest-contentful-paint', (entry: PerformanceEntry) => {
      this.metrics.largestContentfulPaint = entry.startTime;
    });

    // First Input Delay
    this.observeMetric('first-input', (entry: PerformanceEntry) => {
      this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
    });

    // Cumulative Layout Shift
    this.observeMetric('layout-shift', (entry: PerformanceEntry) => {
      if (!(entry as any).hadRecentInput) {
        this.metrics.cumulativeLayoutShift = (this.metrics.cumulativeLayoutShift || 0) + (entry as any).value;
      }
    });
  }

  private observeMetric(type: string, callback: (entry: PerformanceEntry) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Performance observer for ${type} not supported:`, error);
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  logMetrics() {
    console.group('📊 Performance Metrics');
    console.log('Page Load Time:', this.metrics.pageLoadTime?.toFixed(2) + 'ms');
    console.log('First Contentful Paint:', this.metrics.firstContentfulPaint?.toFixed(2) + 'ms');
    console.log('Largest Contentful Paint:', this.metrics.largestContentfulPaint?.toFixed(2) + 'ms');
    console.log('First Input Delay:', this.metrics.firstInputDelay?.toFixed(2) + 'ms');
    console.log('Cumulative Layout Shift:', this.metrics.cumulativeLayoutShift?.toFixed(4));
    console.groupEnd();
  }

  sendMetricsToAPI() {
    if (Object.keys(this.metrics).length === 0) return;

    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: window.location.pathname,
        metrics: this.metrics,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      })
    }).catch(error => {
      console.warn('Failed to send performance metrics:', error);
    });
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Image lazy loading utility
export function createImageObserver(callback: (entry: IntersectionObserverEntry) => void) {
  if (typeof window === 'undefined') return null;

  return new IntersectionObserver(
    (entries) => {
      entries.forEach(callback);
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.1
    }
  );
}

// Bundle size optimization
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload critical fonts
  const criticalFonts = [
    '/fonts/pacifico.woff2',
    '/fonts/geist.woff2'
  ];

  criticalFonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload critical images
  const criticalImages = [
    '/images/hero-bg.jpg',
    '/images/logo.png'
  ];

  criticalImages.forEach(image => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = image;
    link.as = 'image';
    document.head.appendChild(link);
  });
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
    limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
  };
}

export const performanceMonitor = new PerformanceMonitor();