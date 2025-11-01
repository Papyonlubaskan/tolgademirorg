import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  middleware() {
    return (request: NextRequest) => {
      const ip = this.getClientIP(request);
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Eski kayıtları temizle
      for (const [key, value] of this.requests.entries()) {
        if (value.resetTime < now) {
          this.requests.delete(key);
        }
      }

      // Mevcut IP için kayıt al
      const record = this.requests.get(ip);
      
      if (!record) {
        // İlk istek
        this.requests.set(ip, {
          count: 1,
          resetTime: now + this.config.windowMs
        });
        return null;
      }

      if (record.resetTime < now) {
        // Pencere süresi dolmuş, sıfırla
        this.requests.set(ip, {
          count: 1,
          resetTime: now + this.config.windowMs
        });
        return null;
      }

      if (record.count >= this.config.maxRequests) {
        // Rate limit aşıldı
        return NextResponse.json(
          { 
            success: false, 
            error: this.config.message,
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
            }
          }
        );
      }

      // İsteği say
      record.count++;
      return null;
    };
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }
}

// Rate limiter instances
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 dakika
  maxRequests: 5, // 5 giriş denemesi
  message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
});

export const contactRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 saat
  maxRequests: 10, // 10 mesaj
  message: 'Çok fazla mesaj gönderdiniz. Lütfen 1 saat sonra tekrar deneyin.'
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 dakika
  maxRequests: 100, // 100 API isteği
  message: 'API rate limit aşıldı. Lütfen daha sonra tekrar deneyin.'
});
