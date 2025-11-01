// Global Error Handler
// Centralized error handling and logging

interface ErrorInfo {
  message: string;
  stack?: string;
  component?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrors = 100;

  // Error log et
  logError(error: Error | any, component?: string) {
    try {
      // Error objesi değilse string'e çevir
      let message = 'Unknown error';
      let stack = '';
      
      if (error instanceof Error) {
        message = error.message || 'Unknown error';
        stack = error.stack || '';
      } else if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object') {
        if (error.message) {
          message = error.message;
        } else if (error.toString) {
          message = error.toString();
        } else {
          message = JSON.stringify(error);
        }
        stack = error.stack || '';
      } else if (error !== null && error !== undefined) {
        message = String(error);
      }

      const errorInfo: ErrorInfo = {
        message: message,
        stack: stack,
        component: component || 'Unknown',
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      };

      this.errors.push(errorInfo);
      
      // Max error sayısını aş
      if (this.errors.length > this.maxErrors) {
        this.errors = this.errors.slice(-this.maxErrors);
      }

      // Console'da daha güvenli log
      console.error('🚨 Error logged:', {
        message: errorInfo.message || 'Unknown error',
        component: errorInfo.component || 'Unknown',
        timestamp: new Date(errorInfo.timestamp).toISOString(),
        url: errorInfo.url || 'Unknown'
      });
    } catch (logError) {
      // Error logging'de hata olursa basit log
      console.error('🚨 Error logging failed:', logError);
      console.error('🚨 Original error:', error);
    }
  }

  // API error handle et
  handleApiError(error: any, endpoint: string) {
    const errorMessage = error.message || 'API Error';
    const errorInfo: ErrorInfo = {
      message: `API Error in ${endpoint}: ${errorMessage}`,
      stack: error.stack,
      component: 'API',
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    this.errors.push(errorInfo);
    console.error('🚨 API Error:', errorInfo);

    // Kullanıcıya göster
    this.showUserError('API bağlantısında sorun oluştu. Lütfen sayfayı yenileyin.');
  }

  // JSON parse error handle et
  handleJsonError(error: Error, data: string, context: string) {
    const errorInfo: ErrorInfo = {
      message: `JSON Parse Error in ${context}: ${error.message}`,
      stack: error.stack,
      component: 'JSON',
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    this.errors.push(errorInfo);
    console.error('🚨 JSON Error:', errorInfo);

    // localStorage'ı temizle
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        console.log('🗑️ localStorage cleared due to JSON error');
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
    }
  }

  // Network error handle et
  handleNetworkError(error: any, url: string) {
    const errorInfo: ErrorInfo = {
      message: `Network Error for ${url}: ${error.message}`,
      stack: error.stack,
      component: 'Network',
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    this.errors.push(errorInfo);
    console.error('🚨 Network Error:', errorInfo);

    // Kullanıcıya göster
    this.showUserError('İnternet bağlantınızı kontrol edin.');
  }

  // Kullanıcıya error göster
  showUserError(message: string) {
    if (typeof window === 'undefined') return;

    // Toast notification göster
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 5 saniye sonra kaldır
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  // Error'ları al
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  // Son N error'ı al
  getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errors.slice(-count);
  }

  // Error'ları temizle
  clearErrors() {
    this.errors = [];
    console.log('🗑️ Errors cleared');
  }

  // Error istatistikleri
  getErrorStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last1h = now - (60 * 60 * 1000);

    const errors24h = this.errors.filter(e => e.timestamp > last24h);
    const errors1h = this.errors.filter(e => e.timestamp > last1h);

    const byComponent = this.errors.reduce((acc, error) => {
      const component = error.component || 'Unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      last24h: errors24h.length,
      last1h: errors1h.length,
      byComponent
    };
  }

  // Error report oluştur
  generateErrorReport(): string {
    const stats = this.getErrorStats();
    const recentErrors = this.getRecentErrors(5);

    return `
Error Report - ${new Date().toISOString()}
=====================================
Total Errors: ${stats.total}
Last 24h: ${stats.last24h}
Last 1h: ${stats.last1h}

By Component:
${Object.entries(stats.byComponent).map(([comp, count]) => `  ${comp}: ${count}`).join('\n')}

Recent Errors:
${recentErrors.map((error, i) => `
${i + 1}. ${error.component} - ${error.message}
   Time: ${new Date(error.timestamp).toISOString()}
   URL: ${error.url || 'N/A'}
`).join('')}
    `.trim();
  }

  // Error recovery strategies
  recoverFromError(error: Error, context: string): boolean {
    try {
      // Chunk load error recovery
      if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
        console.log('🔄 Attempting chunk error recovery...');
        if (typeof window !== 'undefined') {
          window.location.reload();
          return true;
        }
      }

      // Network error recovery
      if (error.message.includes('fetch') || error.message.includes('network')) {
        console.log('🔄 Attempting network error recovery...');
        if (typeof window !== 'undefined') {
          setTimeout(() => window.location.reload(), 2000);
          return true;
        }
      }

      // JSON parse error recovery
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        console.log('🔄 Attempting JSON error recovery...');
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
          return true;
        }
      }

      // Memory error recovery
      if (error.message.includes('memory') || error.message.includes('allocation')) {
        console.log('🔄 Attempting memory error recovery...');
        if (typeof window !== 'undefined') {
          // Clear caches
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          window.location.reload();
          return true;
        }
      }

      return false;
    } catch (recoveryError) {
      console.error('❌ Error recovery failed:', recoveryError);
      return false;
    }
  }

  // Health check
  isSystemHealthy(): boolean {
    const stats = this.getErrorStats();
    const recentErrors = this.getRecentErrors(10);
    
    // Son 10 error'da critical error var mı?
    const hasCriticalErrors = recentErrors.some(error => 
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Cannot find module') ||
      error.message.includes('ENOENT')
    );

    // Son 1 saatte çok fazla error var mı?
    const tooManyErrors = stats.last1h > 20;

    return !hasCriticalErrors && !tooManyErrors;
  }

  // Auto-recovery system
  startAutoRecovery() {
    setInterval(() => {
      if (!this.isSystemHealthy()) {
        console.warn('🚨 System unhealthy, attempting recovery...');
        const recentErrors = this.getRecentErrors(1);
        if (recentErrors.length > 0) {
          this.recoverFromError(new Error(recentErrors[0].message), 'AutoRecovery');
        }
      }
    }, 60000); // Her dakika kontrol et
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Global error handler setup
if (typeof window !== 'undefined') {
  // Unhandled errors
  window.addEventListener('error', (event) => {
    let error;
    if (event.error instanceof Error) {
      error = event.error;
    } else if (event.error) {
      error = new Error(String(event.error));
    } else {
      error = new Error(event.message || 'Unknown error');
    }
    
    errorHandler.logError(error, 'Global');
    
    // Critical error'da sayfayı yenile
    if (error?.message?.includes('ChunkLoadError') || 
        error?.message?.includes('Loading chunk')) {
      console.log('🔄 Chunk load error detected, reloading page...');
      setTimeout(() => window.location.reload(), 1000);
    }
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    let error;
    if (event.reason instanceof Error) {
      error = event.reason;
    } else if (event.reason && typeof event.reason === 'object') {
      error = new Error(JSON.stringify(event.reason));
    } else {
      error = new Error(String(event.reason || 'Unknown promise rejection'));
    }
    
    errorHandler.logError(error, 'Promise');
    
    // Network error'da retry
    if (event.reason?.message?.includes('fetch')) {
      console.log('🔄 Network error detected, retrying...');
      setTimeout(() => window.location.reload(), 2000);
    }
  });

  // Resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const target = event.target as any;
      if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
        console.warn('🚨 Resource loading error:', target.src || target.href);
        errorHandler.logError(new Error(`Resource loading failed: ${target.tagName}`), 'Resource');
      }
    }
  }, true);
}

// Helper functions
export const logError = (error: Error, component?: string) => {
  errorHandler.logError(error, component);
};

export const handleApiError = (error: any, endpoint: string) => {
  errorHandler.handleApiError(error, endpoint);
};

export const handleJsonError = (error: Error, data: string, context: string) => {
  errorHandler.handleJsonError(error, data, context);
};

export const handleNetworkError = (error: any, url: string) => {
  errorHandler.handleNetworkError(error, url);
};

export const showUserError = (message: string) => {
  errorHandler.showUserError(message);
};

export default errorHandler;
