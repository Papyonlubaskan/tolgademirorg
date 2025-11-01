import crypto from 'crypto';
import QRCode from 'qrcode';

interface TwoFactorAuthConfig {
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
  window: number;
}

class TwoFactorAuth {
  private config: TwoFactorAuthConfig;

  constructor(config?: Partial<TwoFactorAuthConfig>) {
    this.config = {
      issuer: config?.issuer || 'Tolga Demir',
      algorithm: config?.algorithm || 'sha1',
      digits: config?.digits || 6,
      period: config?.period || 30,
      window: config?.window || 1
    };
  }

  // Generate secret key for user
  generateSecret(userId: string, userEmail: string): { secret: string; qrCodeUrl: string; manualEntryKey: string } {
    const secret = crypto.randomBytes(20).toString('hex');
    
    const otpAuthUrl = `otpauth://totp/${this.config.issuer}:${userEmail}?secret=${secret}&issuer=${this.config.issuer}&algorithm=${this.config.algorithm.toUpperCase()}&digits=${this.config.digits}&period=${this.config.period}`;
    
    return {
      secret,
      qrCodeUrl: otpAuthUrl,
      manualEntryKey: secret
    };
  }

  // Generate QR code data URL
  async generateQRCode(otpAuthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpAuthUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Verify TOTP code
  verifyToken(secret: string, token: string): boolean {
    const tokenInt = parseInt(token, 10);
    if (isNaN(tokenInt) || token.length !== this.config.digits) {
      return false;
    }

    const time = Math.floor(Date.now() / 1000 / this.config.period);
    
    for (let i = -this.config.window; i <= this.config.window; i++) {
      const expectedToken = this.generateTOTP(secret, time + i);
      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  }

  // Generate TOTP code for given time
  private generateTOTP(secret: string, time: number): string {
    const key = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(Math.floor(time / 0x100000000), 0);
    buffer.writeUInt32BE(time & 0xffffffff, 4);

    const hmac = crypto.createHmac(this.config.algorithm, key);
    hmac.update(buffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);

    return (code % Math.pow(10, this.config.digits)).toString().padStart(this.config.digits, '0');
  }

  // Base32 decode
  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const encodedCleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    if (encodedCleaned.length === 0) {
      return Buffer.alloc(0);
    }

    const buffer = Buffer.alloc(Math.floor(encodedCleaned.length * 5 / 8));
    let bufferIndex = 0;
    let bits = 0;
    let value = 0;

    for (let i = 0; i < encodedCleaned.length; i++) {
      const char = encodedCleaned[i];
      const charIndex = alphabet.indexOf(char);
      
      if (charIndex === -1) {
        throw new Error(`Invalid character: ${char}`);
      }

      value = (value << 5) | charIndex;
      bits += 5;

      if (bits >= 8) {
        buffer[bufferIndex++] = (value >>> (bits - 8)) & 0xff;
        bits -= 8;
      }
    }

    return buffer;
  }

  // Generate backup codes
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Verify backup code
  verifyBackupCode(backupCodes: string[], code: string): boolean {
    const normalizedCode = code.toUpperCase().replace(/[^A-F0-9]/g, '');
    const index = backupCodes.indexOf(normalizedCode);
    
    if (index !== -1) {
      // Remove used backup code
      backupCodes.splice(index, 1);
      return true;
    }
    
    return false;
  }

  // Get time remaining until next token
  getTimeRemaining(): number {
    const time = Math.floor(Date.now() / 1000);
    return this.config.period - (time % this.config.period);
  }

  // Check if 2FA is properly configured
  isConfigured(secret: string): boolean {
    try {
      return secret && secret.length > 0 && this.base32Decode(secret).length > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const twoFactorAuth = new TwoFactorAuth();

// Helper functions
export const generate2FASecret = (userId: string, userEmail: string) => {
  return twoFactorAuth.generateSecret(userId, userEmail);
};

export const verify2FAToken = (secret: string, token: string) => {
  return twoFactorAuth.verifyToken(secret, token);
};

export const generate2FAQRCode = async (otpAuthUrl: string) => {
  return await twoFactorAuth.generateQRCode(otpAuthUrl);
};

export const generate2FABackupCodes = (count?: number) => {
  return twoFactorAuth.generateBackupCodes(count);
};

export const verify2FABackupCode = (backupCodes: string[], code: string) => {
  return twoFactorAuth.verifyBackupCode(backupCodes, code);
};
