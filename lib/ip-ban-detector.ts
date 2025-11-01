/**
 * Gelişmiş IP Ban Sistemi
 * VPN ve Proxy tespit özellikleri ile
 */

export class IPBanDetector {
  /**
   * VPN/Proxy tespit (basit heuristics)
   */
  static isLikelyVPN(ip: string): boolean {
    // Bilinen VPN IP aralıkları (örnekler)
    const vpnRanges = [
      /^10\./,           // Özel ağ
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Özel ağ
      /^192\.168\./,     // Özel ağ
      /^127\./,          // Localhost
      /^::1$/,           // IPv6 localhost
      /^169\.254\./,     // Link-local
    ];
    
    return vpnRanges.some(range => range.test(ip));
  }

  /**
   * IP subnet kontrolü
   * Aynı subnet'ten gelen istekleri tespit et
   */
  static getSubnet(ip: string): string {
    if (ip.includes(':')) {
      // IPv6 - ilk 4 bloğu al
      return ip.split(':').slice(0, 4).join(':');
    } else {
      // IPv4 - ilk 3 okteti al
      return ip.split('.').slice(0, 3).join('.');
    }
  }

  /**
   * Browser fingerprint oluştur
   * User-Agent + Accept-Language + diğer headerlar
   */
  static createFingerprint(headers: Headers): string {
    const userAgent = headers.get('user-agent') || '';
    const acceptLang = headers.get('accept-language') || '';
    const acceptEnc = headers.get('accept-encoding') || '';
    const connection = headers.get('connection') || '';
    
    const fingerprint = `${userAgent}|${acceptLang}|${acceptEnc}|${connection}`;
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Şüpheli aktivite skoru hesapla
   */
  static async calculateSuspicionScore(
    ip: string,
    fingerprint: string,
    executeQuery: Function
  ): Promise<number> {
    let score = 0;
    
    // 1. Aynı IP'den çok fazla yorum var mı? (+20 puan)
    const ipCommentCount = await executeQuery(
      'SELECT COUNT(*) as total FROM comments WHERE user_ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
      [ip]
    );
    if (ipCommentCount[0]?.total > 10) score += 20;
    if (ipCommentCount[0]?.total > 20) score += 30;
    
    // 2. Aynı subnet'ten birden fazla IP var mı? (+15 puan)
    const subnet = this.getSubnet(ip);
    const subnetCount = await executeQuery(
      'SELECT COUNT(DISTINCT user_ip) as total FROM comments WHERE user_ip LIKE ?',
      [`${subnet}%`]
    );
    if (subnetCount[0]?.total > 3) score += 15;
    
    // 3. Aynı fingerprint farklı IP'lerden mi? (+25 puan - VPN değiştirme)
    const fingerprintQuery = await executeQuery(
      'SELECT COUNT(DISTINCT user_ip) as total FROM comments WHERE user_fingerprint = ?',
      [fingerprint]
    );
    if (fingerprintQuery[0]?.total > 2) score += 25;
    
    // 4. Çok kısa sürede birden fazla yorum (+30 puan)
    const recentComments = await executeQuery(
      'SELECT COUNT(*) as total FROM comments WHERE user_ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
      [ip]
    );
    if (recentComments[0]?.total > 3) score += 30;
    
    return score;
  }

  /**
   * Ban önerisi
   * Score >= 50: Otomatik ban
   * Score >= 30: Manuel inceleme öner
   */
  static shouldBan(score: number): { autoBan: boolean; recommend: boolean; score: number } {
    return {
      autoBan: score >= 70,
      recommend: score >= 40,
      score
    };
  }
}

