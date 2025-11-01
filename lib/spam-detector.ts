/**
 * Spam Yorum Tespiti
 * Yorumları otomatik olarak spam olarak işaretler
 */

interface SpamCheckResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
}

export class SpamDetector {
  // Spam kelimeleri ve ifadeler
  private static spamKeywords = [
    'viagra', 'cialis', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'buy now', 'limited offer', 'act now', 'free money',
    'make money fast', 'work from home', 'bitcoin', 'crypto investment',
    'weight loss', 'diet pills', 'porn', 'xxx', 'sex', 'escort',
    'loan', 'credit card', 'debt', 'mortgage', 'insurance quote',
    'https://', 'http://', 'bit.ly', 'goo.gl', 'tinyurl'
  ];

  // Türkçe spam kelimeleri
  private static turkishSpamKeywords = [
    'seks', 'porno', 'kumar', 'bahis', 'kazanç', 'para kazan',
    'hızlı para', 'tıkla kazan', 'ücretsiz', 'bedava', 'indirim',
    'site tanıtımı', 'reklam', 'takipçi', 'beğeni', 'instagram'
  ];

  // Şüpheli karakterler ve desenler
  private static suspiciousPatterns = [
    /(.)\1{4,}/g, // Aynı karakterin 5+ kez tekrarı (aaaaa)
    /[A-Z]{10,}/g, // 10+ büyük harf peşpeşe
    /\d{10,}/g, // 10+ rakam peşpeşe
    /[^\w\s]{5,}/g, // 5+ özel karakter peşpeşe
  ];

  /**
   * Yorumu spam olarak kontrol et
   */
  static checkSpam(content: string, userName: string, userEmail: string): SpamCheckResult {
    let score = 0;
    const reasons: string[] = [];
    const lowerContent = content.toLowerCase();
    const lowerName = userName.toLowerCase();
    const lowerEmail = userEmail.toLowerCase();

    // 1. Spam anahtar kelime kontrolü
    for (const keyword of this.spamKeywords) {
      if (lowerContent.includes(keyword) || lowerName.includes(keyword) || lowerEmail.includes(keyword)) {
        score += 30;
        reasons.push(`Spam kelime tespit edildi: "${keyword}"`);
      }
    }

    // 2. Türkçe spam kelime kontrolü
    for (const keyword of this.turkishSpamKeywords) {
      if (lowerContent.includes(keyword) || lowerName.includes(keyword)) {
        score += 25;
        reasons.push(`Türkçe spam kelime tespit edildi: "${keyword}"`);
      }
    }

    // 3. URL kontrolü (çok fazla link)
    const urlMatches = content.match(/https?:\/\/[^\s]+/g) || [];
    if (urlMatches.length > 2) {
      score += 40;
      reasons.push(`Çok fazla URL (${urlMatches.length} adet)`);
    } else if (urlMatches.length > 0) {
      score += 15;
      reasons.push(`URL içeriyor (${urlMatches.length} adet)`);
    }

    // 4. Şüpheli karakter desenleri
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        score += 20;
        reasons.push('Şüpheli karakter deseni tespit edildi');
        break;
      }
    }

    // 5. Çok kısa veya çok uzun yorumlar
    if (content.length < 5) {
      score += 25;
      reasons.push('Çok kısa yorum');
    } else if (content.length > 1000) {
      score += 15;
      reasons.push('Çok uzun yorum');
    }

    // 6. Sadece büyük harf kullanımı
    const uppercaseRatio = (content.match(/[A-ZİĞÜŞÖÇ]/g) || []).length / content.length;
    if (uppercaseRatio > 0.5 && content.length > 10) {
      score += 20;
      reasons.push('Aşırı büyük harf kullanımı');
    }

    // 7. Email adresinde şüpheli ifadeler
    const tempEmailPatterns = ['temp', 'trash', 'disposable', 'fake', 'test', '10minute'];
    for (const pattern of tempEmailPatterns) {
      if (lowerEmail.includes(pattern)) {
        score += 30;
        reasons.push('Geçici/sahte email adresi');
        break;
      }
    }

    // 8. Aynı cümlenin tekrarı
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    if (sentences.length > 2 && uniqueSentences.size < sentences.length / 2) {
      score += 25;
      reasons.push('Tekrarlayan cümleler');
    }

    // 9. Emoji overload
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
    if (emojiCount > 10) {
      score += 20;
      reasons.push(`Çok fazla emoji (${emojiCount} adet)`);
    }

    // Spam eşiği: 50+
    const isSpam = score >= 50;

    return {
      isSpam,
      score,
      reasons
    };
  }

  /**
   * Spam skoruna göre yorum durumu belirle
   */
  static determineStatus(spamCheck: SpamCheckResult): 'approved' | 'pending' | 'spam' {
    if (spamCheck.score >= 70) {
      return 'spam'; // Kesin spam
    } else if (spamCheck.score >= 50) {
      return 'pending'; // İncelenmeli
    } else {
      return 'approved'; // Güvenli
    }
  }
}

