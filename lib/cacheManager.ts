// Cache Management System
// Centralized cache invalidation and management

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  // Cache'e veri ekle
  set(key: string, data: any, ttl?: number): void {
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, entry);
    console.log(`💾 Cache set: ${key}`);
  }

  // Cache'den veri al
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // TTL kontrolü
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      console.log(`⏰ Cache expired: ${key}`);
      return null;
    }

    return entry.data;
  }

  // Cache'den veri sil
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return deleted;
  }

  // Pattern ile cache temizle
  clearPattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🗑️ Cache cleared pattern "${pattern}": ${deletedCount} entries`);
    }
    
    return deletedCount;
  }

  // Tüm cache'i temizle
  clearAll(): void {
    this.cache.clear();
    console.log('🗑️ All cache cleared');
  }

  // Expired entries'leri temizle
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cache cleanup: ${cleanedCount} expired entries removed`);
    }
    
    return cleanedCount;
  }

  // Cache istatistikleri
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    const total = entries.length;
    const expired = entries.filter(e => now - e.timestamp > e.ttl).length;
    const active = total - expired;
    
    const byTTL = entries.reduce((acc, entry) => {
      const ttlMinutes = Math.round(entry.ttl / (60 * 1000));
      acc[ttlMinutes] = (acc[ttlMinutes] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      total,
      active,
      expired,
      byTTL,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Memory usage tahmini
  private estimateMemoryUsage(): string {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry).length * 2; // Rough estimate
    }
    
    if (totalSize < 1024) {
      return `${totalSize} B`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(2)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  // Cache keys listesi
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Belirli bir key'in varlığını kontrol et
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // TTL kontrolü
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Cache'i yenile (TTL'yi sıfırla)
  refresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.timestamp = Date.now();
    console.log(`🔄 Cache refreshed: ${key}`);
    return true;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Auto cleanup her 2 dakikada (daha sık)
setInterval(() => {
  cacheManager.cleanup();
}, 2 * 60 * 1000);

// Memory monitoring
setInterval(() => {
  const stats = cacheManager.getStats();
  if (stats.memoryUsage.includes('MB') && parseFloat(stats.memoryUsage) > 10) {
    console.warn('⚠️ High memory usage detected:', stats.memoryUsage);
    cacheManager.cleanup();
  }
}, 30 * 1000); // Her 30 saniyede kontrol et

// Cache invalidation helpers
export const invalidateBooksCache = () => {
  cacheManager.clearPattern('^books');
  cacheManager.clearPattern('^book_');
  console.log('📚 Books cache invalidated');
};

export const invalidateSettingsCache = () => {
  cacheManager.clearPattern('^settings');
  console.log('⚙️ Settings cache invalidated');
};

export const invalidatePagesCache = () => {
  cacheManager.clearPattern('^page_');
  console.log('📄 Pages cache invalidated');
};

export const invalidateAllCache = () => {
  cacheManager.clearAll();
  console.log('🗑️ All cache invalidated');
};

// Cache wrapper for API calls
export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Cache'den kontrol et
  const cached = cacheManager.get(key);
  if (cached !== null) {
    console.log(`💾 Cache hit: ${key}`);
    return cached;
  }

  // Cache'de yoksa fetch et
  try {
    console.log(`🌐 Cache miss: ${key}, fetching...`);
    const data = await fetcher();
    cacheManager.set(key, data, ttl);
    console.log(`✅ Cache stored: ${key}`);
    return data;
  } catch (error) {
    console.error(`❌ Cache fetch error for ${key}:`, error);
    throw error;
  }
};

// Advanced cache strategies
export const withStaleWhileRevalidate = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> => {
  const cached = cacheManager.get(key);
  
  if (cached !== null) {
    // Background refresh
    setTimeout(async () => {
      try {
        const freshData = await fetcher();
        cacheManager.set(key, freshData, ttl);
        console.log(`🔄 Background refresh completed: ${key}`);
      } catch (error) {
        console.error(`Background refresh failed for ${key}:`, error);
      }
    }, 0);
    
    return cached;
  }

  // No cache, fetch immediately
  const data = await fetcher();
  cacheManager.set(key, data, ttl);
  return data;
};

// Cache warming
export const warmCache = async (keys: string[], fetchers: (() => Promise<any>)[]) => {
  console.log('🔥 Warming cache...');
  
  const promises = keys.map(async (key, index) => {
    try {
      const data = await fetchers[index]();
      cacheManager.set(key, data);
      console.log(`✅ Cache warmed: ${key}`);
    } catch (error) {
      console.error(`❌ Cache warming failed for ${key}:`, error);
    }
  });

  await Promise.allSettled(promises);
  console.log('🔥 Cache warming completed');
};

// Cache analytics
export const getCacheAnalytics = () => {
  const stats = cacheManager.getStats();
  const keys = cacheManager.getKeys();
  
  return {
    ...stats,
    keys: keys.length,
    hitRate: stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(2) + '%' : '0%',
    efficiency: stats.expired > 0 ? ((stats.active / (stats.active + stats.expired)) * 100).toFixed(2) + '%' : '100%'
  };
};

export default cacheManager;
