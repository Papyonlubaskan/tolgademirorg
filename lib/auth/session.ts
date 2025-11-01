import { executeQuery } from '@/lib/database/mysql';
import { TwoFactorAuth } from './two-factor';
import crypto from 'crypto';

export interface SessionData {
  id: string;
  userId: string;
  isAuthenticated: boolean;
  twoFactorVerified: boolean;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
}

export class SessionManager {
  private static sessions: Map<string, SessionData> = new Map();
  private static usedTokens: Set<string> = new Set();

  // Session oluştur
  static async createSession(
    userId: string, 
    ipAddress: string, 
    userAgent: string,
    validityMinutes: number = 30
  ): Promise<string> {
    try {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + (validityMinutes * 60 * 1000));

      const sessionData: SessionData = {
        id: sessionId,
        userId,
        isAuthenticated: false,
        twoFactorVerified: false,
        expiresAt,
        ipAddress,
        userAgent,
        createdAt: new Date()
      };

      // Veritabanına kaydet
      await executeQuery(
        `INSERT INTO admin_sessions (id, user_id, expires_at, ip_address, user_agent, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [sessionId, userId, expiresAt, ipAddress, userAgent]
      );

      // Memory'de sakla
      this.sessions.set(sessionId, sessionData);

      // Expired session'ları temizle
      this.cleanupExpiredSessions();

      return sessionId;
    } catch (error) {
      console.error('Session creation failed:', error);
      throw new Error('Session creation failed');
    }
  }

  // Session doğrula
  static async validateSession(sessionId: string): Promise<SessionData | null> {
    try {
      // Memory'den kontrol et
      let session = this.sessions.get(sessionId);
      
      if (!session) {
        // Veritabanından yükle
        const [rows] = await executeQuery(
          'SELECT * FROM admin_sessions WHERE id = ? AND expires_at > NOW()',
          [sessionId]
        );

        if (rows.length === 0) {
          return null;
        }

        const dbSession = rows[0];
        session = {
          id: dbSession.id,
          userId: dbSession.user_id,
          isAuthenticated: dbSession.is_authenticated || false,
          twoFactorVerified: dbSession.two_factor_verified || false,
          expiresAt: new Date(dbSession.expires_at),
          ipAddress: dbSession.ip_address,
          userAgent: dbSession.user_agent,
          createdAt: new Date(dbSession.created_at)
        };

        this.sessions.set(sessionId, session);
      }

      // Expire kontrolü
      if (session.expiresAt < new Date()) {
        this.sessions.delete(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  }

  // Session güncelle
  static async updateSession(
    sessionId: string, 
    updates: Partial<Pick<SessionData, 'isAuthenticated' | 'twoFactorVerified'>>
  ): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return false;

      // Memory'yi güncelle
      Object.assign(session, updates);

      // Veritabanını güncelle
      const updateFields = [];
      const updateValues = [];

      if (updates.isAuthenticated !== undefined) {
        updateFields.push('is_authenticated = ?');
        updateValues.push(updates.isAuthenticated);
      }

      if (updates.twoFactorVerified !== undefined) {
        updateFields.push('two_factor_verified = ?');
        updateValues.push(updates.twoFactorVerified);
      }

      if (updateFields.length > 0) {
        updateValues.push(sessionId);
        await executeQuery(
          `UPDATE admin_sessions SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      return true;
    } catch (error) {
      console.error('Session update failed:', error);
      return false;
    }
  }

  // Session sil
  static async destroySession(sessionId: string): Promise<boolean> {
    try {
      // Memory'den sil
      this.sessions.delete(sessionId);

      // Veritabanından sil
      await executeQuery('DELETE FROM admin_sessions WHERE id = ?', [sessionId]);

      return true;
    } catch (error) {
      console.error('Session destruction failed:', error);
      return false;
    }
  }

  // Kullanıcı bilgilerini al
  static async getUserById(userId: string): Promise<AdminUser | null> {
    try {
      const [rows] = await executeQuery(
        'SELECT id, email, name, two_factor_enabled, two_factor_secret, two_factor_backup_codes FROM admins WHERE id = ?',
        [userId]
      );

      if (rows.length === 0) return null;

      const user = rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        twoFactorEnabled: user.two_factor_enabled || false,
        twoFactorSecret: user.two_factor_secret,
        twoFactorBackupCodes: user.two_factor_backup_codes ? JSON.parse(user.two_factor_backup_codes) : []
      };
    } catch (error) {
      console.error('User fetch failed:', error);
      return null;
    }
  }

  // 2FA doğrulama
  static async verifyTwoFactor(
    sessionId: string, 
    token: string, 
    backupCode?: string
  ): Promise<boolean> {
    try {
      const session = await this.validateSession(sessionId);
      if (!session) return false;

      const user = await this.getUserById(session.userId);
      if (!user || !user.twoFactorEnabled) return false;

      let isValid = false;

      if (backupCode && user.twoFactorBackupCodes) {
        // Backup kod ile doğrula
        const result = TwoFactorAuth.verifyBackupCode(user.twoFactorBackupCodes, backupCode);
        isValid = result.isValid;

        if (isValid) {
          // Backup kodu güncelle
          await executeQuery(
            'UPDATE admins SET two_factor_backup_codes = ? WHERE id = ?',
            [JSON.stringify(result.remainingCodes), user.id]
          );
        }
      } else if (user.twoFactorSecret) {
        // TOTP token ile doğrula
        isValid = TwoFactorAuth.verifyToken(user.twoFactorSecret, token);

        // Replay attack koruması
        if (isValid) {
          const tokenKey = `${sessionId}:${token}`;
          if (TwoFactorAuth.isTokenUsed(token, this.usedTokens)) {
            return false;
          }
          TwoFactorAuth.markTokenAsUsed(token, this.usedTokens);
        }
      }

      if (isValid) {
        await this.updateSession(sessionId, { twoFactorVerified: true });
      }

      return isValid;
    } catch (error) {
      console.error('2FA verification failed:', error);
      return false;
    }
  }

  // Tüm kullanıcı session'larını sil (logout all devices)
  static async destroyAllUserSessions(userId: string): Promise<boolean> {
    try {
      // Memory'den sil
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.userId === userId) {
          this.sessions.delete(sessionId);
        }
      }

      // Veritabanından sil
      await executeQuery('DELETE FROM admin_sessions WHERE user_id = ?', [userId]);

      return true;
    } catch (error) {
      console.error('Destroy all sessions failed:', error);
      return false;
    }
  }

  // Expired session'ları temizle
  private static cleanupExpiredSessions(): void {
    const now = new Date();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Session istatistikleri
  static getSessionStats(): {
    activeSessions: number;
    totalSessions: number;
    expiredSessions: number;
  } {
    const now = new Date();
    let activeSessions = 0;
    let expiredSessions = 0;

    for (const session of this.sessions.values()) {
      if (session.expiresAt < now) {
        expiredSessions++;
      } else {
        activeSessions++;
      }
    }

    return {
      activeSessions,
      totalSessions: this.sessions.size,
      expiredSessions
    };
  }

  // Güvenlik audit
  static async auditSession(sessionId: string, ipAddress: string, userAgent: string): Promise<boolean> {
    try {
      const session = await this.validateSession(sessionId);
      if (!session) return false;

      // IP adresi değişikliği kontrolü
      if (session.ipAddress !== ipAddress) {
        console.warn(`Session ${sessionId} IP address changed: ${session.ipAddress} -> ${ipAddress}`);
        // Güvenlik için session'ı sonlandır
        await this.destroySession(sessionId);
        return false;
      }

      // User agent değişikliği kontrolü (daha esnek)
      if (session.userAgent !== userAgent) {
        console.warn(`Session ${sessionId} user agent changed`);
        // Kritik değil, sadece log
      }

      return true;
    } catch (error) {
      console.error('Session audit failed:', error);
      return false;
    }
  }
}

export const sessionManager = SessionManager;
