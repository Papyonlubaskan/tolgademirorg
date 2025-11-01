/**
 * Yorum Rate Limiting - IP Bazlı Akıllı Kontrol
 * Spam botları engeller, normal kullanıcıları rahatsız etmez
 */

interface CommentAttempt {
  timestamp: number;
  content: string;
}

interface IPRecord {
  attempts: CommentAttempt[];
  lastCleanup: number;
}

export class CommentRateLimiter {
  private static records: Map<string, IPRecord> = new Map();
  private static CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 saat

  // Kurallar
  private static RULES = {
    MAX_COMMENTS_PER_MINUTE: 3,      // Dakikada maksimum 3 yorum
    MAX_COMMENTS_PER_HOUR: 20,       // Saatte maksimum 20 yorum
    MAX_COMMENTS_PER_DAY: 100,       // Günde maksimum 100 yorum
    DUPLICATE_CHECK_WINDOW: 5 * 60 * 1000, // 5 dakika içinde aynı yorum
    SIMILAR_CONTENT_THRESHOLD: 0.8    // %80 benzerlik spam sayılır
  };

  /**
   * Yorum yazma izni kontrol et
   */
  static canComment(ip: string, content: string): {
    allowed: boolean;
    reason?: string;
    waitTime?: number;
  } {
    const now = Date.now();
    let record = this.records.get(ip);

    // Kayıt yoksa oluştur
    if (!record) {
      record = {
        attempts: [],
        lastCleanup: now
      };
      this.records.set(ip, record);
    }

    // Eski kayıtları temizle (1 günden eski)
    if (now - record.lastCleanup > this.CLEANUP_INTERVAL) {
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      record.attempts = record.attempts.filter(a => a.timestamp > oneDayAgo);
      record.lastCleanup = now;
    }

    // 1. Dakikalık kontrol (son 1 dakika)
    const oneMinuteAgo = now - (60 * 1000);
    const commentsInLastMinute = record.attempts.filter(a => a.timestamp > oneMinuteAgo).length;
    
    if (commentsInLastMinute >= this.RULES.MAX_COMMENTS_PER_MINUTE) {
      return {
        allowed: false,
        reason: 'Çok hızlı yorum yazıyorsunuz. Lütfen 1 dakika bekleyin.',
        waitTime: 60
      };
    }

    // 2. Saatlik kontrol (son 1 saat)
    const oneHourAgo = now - (60 * 60 * 1000);
    const commentsInLastHour = record.attempts.filter(a => a.timestamp > oneHourAgo).length;
    
    if (commentsInLastHour >= this.RULES.MAX_COMMENTS_PER_HOUR) {
      return {
        allowed: false,
        reason: 'Saatlik yorum limitine ulaştınız. Lütfen daha sonra tekrar deneyin.',
        waitTime: 3600
      };
    }

    // 3. Günlük kontrol (son 24 saat)
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const commentsInLastDay = record.attempts.filter(a => a.timestamp > oneDayAgo).length;
    
    if (commentsInLastDay >= this.RULES.MAX_COMMENTS_PER_DAY) {
      return {
        allowed: false,
        reason: 'Günlük yorum limitine ulaştınız. Yarın tekrar deneyin.',
        waitTime: 86400
      };
    }

    // 4. Aynı içerik kontrolü (son 5 dakika)
    const recentComments = record.attempts.filter(
      a => a.timestamp > (now - this.RULES.DUPLICATE_CHECK_WINDOW)
    );

    for (const attempt of recentComments) {
      if (this.areSimilar(content, attempt.content)) {
        return {
          allowed: false,
          reason: 'Bu yorumu daha önce yazdınız. Lütfen farklı bir yorum yazın.',
          waitTime: 300
        };
      }
    }

    // İzin verildi - kaydı ekle
    record.attempts.push({
      timestamp: now,
      content: content.substring(0, 200) // İlk 200 karakter yeterli
    });

    return { allowed: true };
  }

  /**
   * İki metnin benzerliğini kontrol et (Levenshtein benzeri basit yöntem)
   */
  private static areSimilar(text1: string, text2: string): boolean {
    const normalized1 = text1.toLowerCase().trim();
    const normalized2 = text2.toLowerCase().trim();

    // Tam eşleşme
    if (normalized1 === normalized2) return true;

    // Çok kısa metinler için hassas kontrol
    if (normalized1.length < 10 || normalized2.length < 10) {
      return normalized1 === normalized2;
    }

    // Kelime bazlı benzerlik
    const words1 = normalized1.split(/\s+/).filter(w => w.length > 3);
    const words2 = normalized2.split(/\s+/).filter(w => w.length > 3);

    if (words1.length === 0 || words2.length === 0) return false;

    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);
    const similarity = commonWords / totalWords;

    return similarity >= this.RULES.SIMILAR_CONTENT_THRESHOLD;
  }

  /**
   * IP kaydını sıfırla (test amaçlı)
   */
  static resetIP(ip: string): void {
    this.records.delete(ip);
  }

  /**
   * Tüm kayıtları temizle (test amaçlı)
   */
  static clearAll(): void {
    this.records.clear();
  }

  /**
   * IP için istatistikleri al
   */
  static getStats(ip: string): {
    totalComments: number;
    commentsLastHour: number;
    commentsLastDay: number;
  } {
    const record = this.records.get(ip);
    if (!record) {
      return {
        totalComments: 0,
        commentsLastHour: 0,
        commentsLastDay: 0
      };
    }

    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    return {
      totalComments: record.attempts.length,
      commentsLastHour: record.attempts.filter(a => a.timestamp > oneHourAgo).length,
      commentsLastDay: record.attempts.filter(a => a.timestamp > oneDayAgo).length
    };
  }
}

