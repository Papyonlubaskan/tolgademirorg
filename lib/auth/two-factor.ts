import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class TwoFactorAuth {
  // 2FA secret oluştur
  static generateSecret(username: string, serviceName: string = 'Tolga Demir Admin'): speakeasy.GeneratedSecret {
    return speakeasy.generateSecret({
      name: username,
      issuer: serviceName,
      length: 32,
      symbols: false
    });
  }

  // QR kod oluştur
  static async generateQRCode(secret: string): Promise<string> {
    try {
      return await QRCode.toDataURL(secret);
    } catch (error) {
      console.error('QR code generation failed:', error);
      throw new Error('QR code generation failed');
    }
  }

  // 2FA token doğrula
  static verifyToken(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2 // 2 adım tolerans
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  // Backup kodları oluştur
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Backup kod doğrula
  static verifyBackupCode(backupCodes: string[], code: string): { isValid: boolean; remainingCodes: string[] } {
    const index = backupCodes.findIndex(backupCode => backupCode === code.toUpperCase());
    
    if (index === -1) {
      return { isValid: false, remainingCodes: backupCodes };
    }

    // Kullanılan kodu listeden çıkar
    const remainingCodes = [...backupCodes];
    remainingCodes.splice(index, 1);

    return { isValid: true, remainingCodes };
  }

  // 2FA kurulumu tamamla
  static async setupTwoFactor(username: string): Promise<TwoFactorSetup> {
    try {
      // Secret oluştur
      const secret = this.generateSecret(username);
      
      // QR kod oluştur
      const qrCodeUrl = await this.generateQRCode(secret.otpauth_url!);
      
      // Backup kodları oluştur
      const backupCodes = this.generateBackupCodes();

      return {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      console.error('2FA setup failed:', error);
      throw new Error('2FA setup failed');
    }
  }

  // Zaman damgası doğrula (replay attack koruması)
  static isTokenUsed(token: string, usedTokens: Set<string>): boolean {
    return usedTokens.has(token);
  }

  // Token'ı kullanıldı olarak işaretle
  static markTokenAsUsed(token: string, usedTokens: Set<string>): void {
    usedTokens.add(token);
    
    // 5 dakika sonra token'ı temizle
    setTimeout(() => {
      usedTokens.delete(token);
    }, 5 * 60 * 1000);
  }

  // 2FA durumunu kontrol et
  static isTwoFactorEnabled(secret: string | null): boolean {
    return secret !== null && secret.length > 0;
  }

  // Güvenli token oluştur (oturum için)
  static generateSecureToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Token süresini kontrol et
  static isTokenExpired(createdAt: number, validityMinutes: number = 30): boolean {
    const now = Date.now();
    const expirationTime = createdAt + (validityMinutes * 60 * 1000);
    return now > expirationTime;
  }
}
