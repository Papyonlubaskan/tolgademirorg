/**
 * Production-safe logger
 * Development'ta console.log kullanır
 * Production'da sessiz kalır
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Error'lar her zaman loglanır
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('ℹ️', ...args);
    }
  },
  
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', ...args);
    }
  }
};

// Client-side logger (browser)
export const clientLogger = {
  log: (...args: any[]) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (typeof window !== 'undefined') {
      console.error(...args);
    }
  }
};