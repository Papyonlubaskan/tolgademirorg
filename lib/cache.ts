interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  serialize?: boolean; // Whether to serialize/deserialize data
}

interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
  tags: string[];
  createdAt: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 3600; // Default 1 hour
    const expiresAt = Date.now() + (ttl * 1000);
    
    this.store.set(key, {
      data,
      expiresAt,
      tags: options.tags || [],
      createdAt: Date.now()
    });
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async delByTag(tag: string): Promise<number> {
    let deletedCount = 0;
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());
    
    if (!pattern) {
      return allKeys;
    }
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    return entry ? Date.now() <= entry.expiresAt : false;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    
    if (!entry) {
      return -1;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return -2;
    }
    
    return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
  }

  async getStats(): Promise<{
    size: number;
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
  }> {
    return {
      size: this.store.size,
      hitRate: 0, // Would need to track hits/misses
      missRate: 0,
      totalHits: 0,
      totalMisses: 0
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Redis-like interface for future Redis integration
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<boolean>;
  delByTag(tag: string): Promise<number>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  getStats(): Promise<any>;
}

// Cache manager with Redis fallback
class CacheManager {
  private client: RedisClient;
  private memoryCache: MemoryCache;
  private useRedis: boolean;

  constructor() {
    this.memoryCache = new MemoryCache();
    this.useRedis = false; // Set to true when Redis is available
    
    // For now, use memory cache
    this.client = this.memoryCache as any;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      await this.client.set(key, serialized, options.ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async delByTag(tag: string): Promise<number> {
    try {
      return await this.client.delByTag(tag);
    } catch (error) {
      console.error('Cache delete by tag error:', error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  async getStats(): Promise<any> {
    try {
      return await this.client.getStats();
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  // Cache key generators
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  // Common cache keys
  static KEYS = {
    BOOKS: 'books',
    BOOK_DETAIL: (id: string) => `book:${id}`,
    BOOKS_LIST: (page: number, limit: number) => `books:list:${page}:${limit}`,
    CHAPTERS: (bookId: string) => `chapters:${bookId}`,
    CHAPTER_DETAIL: (bookId: string, chapterId: string) => `chapter:${bookId}:${chapterId}`,
    SETTINGS: 'settings',
    STATS: 'stats',
    USER_SESSION: (sessionId: string) => `session:${sessionId}`,
    RATE_LIMIT: (key: string) => `rate_limit:${key}`,
    CSRF_TOKEN: (token: string) => `csrf:${token}`,
    SEARCH_RESULTS: (query: string, page: number) => `search:${query}:${page}`,
    MEDIA_METADATA: (path: string) => `media:${path}`,
    OPTIMIZED_IMAGE: (path: string, options: string) => `image:${path}:${options}`
  };

  // Cache tags
  static TAGS = {
    BOOKS: 'books',
    CHAPTERS: 'chapters',
    SETTINGS: 'settings',
    STATS: 'stats',
    MEDIA: 'media',
    SEARCH: 'search',
    USER: 'user',
    CACHE: 'cache'
  };

  destroy(): void {
    this.memoryCache.destroy();
  }
}

// Global cache instance
const cache = new CacheManager();

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await cache.get(key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute original method
      const result = await method.apply(this, args);
      
      // Cache the result
      await cache.set(key, result, options);
      
      return result;
    };
  };
}

// Cache middleware for API routes
export function withCache<T>(
  keyGenerator: (req: any) => string,
  options: CacheOptions = {}
) {
  return async (req: any, res: any, next: any) => {
    const key = keyGenerator(req);
    
    // Try to get from cache
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return res.json(cached);
    }
    
    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to cache the response
    res.json = async (data: T) => {
      await cache.set(key, data, options);
      return originalJson(data);
    };
    
    next();
  };
}

// Cache invalidation helpers
export async function invalidateBooks(): Promise<void> {
  await cache.delByTag(CacheManager.TAGS.BOOKS);
}

export async function invalidateChapters(): Promise<void> {
  await cache.delByTag(CacheManager.TAGS.CHAPTERS);
}

export async function invalidateSettings(): Promise<void> {
  await cache.delByTag(CacheManager.TAGS.SETTINGS);
}

export async function invalidateStats(): Promise<void> {
  await cache.delByTag(CacheManager.TAGS.STATS);
}

export async function invalidateMedia(): Promise<void> {
  await cache.delByTag(CacheManager.TAGS.MEDIA);
}

export async function invalidateSearch(): Promise<void> {
  await cache.delByTag(CacheManager.TAGS.SEARCH);
}

// Cache warming functions
export async function warmCache(): Promise<void> {
  try {
    // Warm books cache
    const books = await fetch('/api/books').then(res => res.json());
    if (books.success) {
      await cache.set(CacheManager.KEYS.BOOKS, books.data, { ttl: 3600, tags: [CacheManager.TAGS.BOOKS] });
    }
    
    // Warm settings cache
    const settings = await fetch('/api/settings').then(res => res.json());
    if (settings.success) {
      await cache.set(CacheManager.KEYS.SETTINGS, settings.data, { ttl: 7200, tags: [CacheManager.TAGS.SETTINGS] });
    }
    
    console.log('Cache warmed successfully');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}

// Export cache instance and utilities
export { cache, CacheManager };
export default cache;