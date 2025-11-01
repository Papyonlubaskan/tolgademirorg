/**
 * Görsel Önbellek Yönetimi
 * 
 * Bu modül görsellerin önbelleklenmesi ve optimize edilmesi için kullanılır.
 */

interface ImageCacheEntry {
  url: string;
  timestamp: number;
  size?: number;
  format?: string;
}

class ImageCacheManager {
  private cache: Map<string, ImageCacheEntry>;
  private maxCacheSize: number;
  private cacheExpiry: number;

  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100; // Maksimum 100 görsel önbelleğe alınır
    this.cacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 gün (ms)
  }

  /**
   * Görseli önbelleğe ekle
   */
  add(key: string, url: string, metadata?: { size?: number; format?: string }): void {
    // Önbellek doluysa en eski girişi sil
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.getOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      size: metadata?.size,
      format: metadata?.format
    });
  }

  /**
   * Önbellekten görsel al
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Süre dolmuşsa sil
    if (Date.now() - entry.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.url;
  }

  /**
   * Önbellekten görsel sil
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Tüm önbelleği temizle
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Süresi dolmuş girişleri temizle
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * En eski girişin anahtarını bul
   */
  private getOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Önbellek istatistiklerini al
   */
  getStats(): {
    size: number;
    maxSize: number;
    expiry: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      expiry: this.cacheExpiry
    };
  }

  /**
   * Görsel URL'sini optimize et
   */
  optimizeUrl(url: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg';
  }): string {
    if (!url) return '';
    
    // Zaten optimize edilmiş URL'leri kontrol et
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    const cached = this.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Next.js image optimization parametreleri
    const params = new URLSearchParams();
    
    if (options?.width) params.set('w', options.width.toString());
    if (options?.height) params.set('h', options.height.toString());
    if (options?.quality) params.set('q', options.quality.toString());
    if (options?.format) params.set('f', options.format);

    const optimizedUrl = params.toString() 
      ? `${url}?${params.toString()}`
      : url;

    // Önbelleğe ekle
    this.add(cacheKey, optimizedUrl, {
      format: options?.format
    });

    return optimizedUrl;
  }
}

// Singleton instance
export const imageCacheManager = new ImageCacheManager();

// Periyodik temizlik (her 1 saatte bir)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleaned = imageCacheManager.cleanExpired();
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} süresi dolmuş görsel önbellekten temizlendi`);
    }
  }, 60 * 60 * 1000); // 1 saat
}

