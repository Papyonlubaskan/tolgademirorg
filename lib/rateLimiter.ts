interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    
    // Clean expired entries
    this.cleanup();
    
    const current = store[key];
    
    if (!current || now > current.resetTime) {
      // Create new window
      store[key] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }
    
    if (current.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }
    
    // Increment counter
    current.count++;
    
    return {
      allowed: true,
      remaining: this.maxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter(60000, 2000); // 2000 requests per minute (like işlemleri için gevşetildi)
export const likesRateLimiter = new RateLimiter(60000, 5000); // 5000 requests per minute (sadece beğeni için)
export const authRateLimiter = new RateLimiter(300000, 10); // 10 requests per 5 minutes
export const contactRateLimiter = new RateLimiter(3600000, 10); // 10 requests per hour