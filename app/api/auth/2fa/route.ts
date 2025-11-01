import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { twoFactorAuth, generate2FAQRCode } from '@/lib/auth/2fa';
import { apiRateLimiter } from '@/lib/rateLimiter';

// GET: Get 2FA status and setup QR code
export async function GET(request: NextRequest) {
  try {
    // Admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // Get admin ID from token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return errorResponse('No token provided', 401);
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'maralatmaca-super-secret-jwt-key-2024';
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const adminId = decoded.id;

    // Get admin 2FA status
    const adminData = await executeQuery(
      'SELECT username, email, two_factor_secret, two_factor_enabled FROM admins WHERE id = ?',
      [adminId]
    );

    if (adminData.length === 0) {
      return errorResponse('Admin not found', 404);
    }

    const admin = adminData[0];

    if (admin.two_factor_enabled) {
      return successResponse({
        enabled: true,
        hasSecret: !!admin.two_factor_secret
      }, '2FA is enabled');
    }

    // Generate new secret if not exists
    let secret = admin.two_factor_secret;
    let qrCodeDataUrl = null;

    if (!secret) {
      const { secret: newSecret, qrCodeUrl } = twoFactorAuth.generateSecret(
        admin.username,
        admin.email
      );
      
      // Save secret to database
      await executeQuery(
        'UPDATE admins SET two_factor_secret = ? WHERE id = ?',
        [newSecret, adminId]
      );
      
      secret = newSecret;
      qrCodeDataUrl = await generate2FAQRCode(qrCodeUrl);
    } else {
      // Generate QR code for existing secret
      const qrCodeUrl = `otpauth://totp/Tolga Demir:${admin.email}?secret=${secret}&issuer=Tolga Demir&algorithm=SHA1&digits=6&period=30`;
      qrCodeDataUrl = await generate2FAQRCode(qrCodeUrl);
    }

    return successResponse({
      enabled: false,
      hasSecret: !!secret,
      qrCode: qrCodeDataUrl,
      manualEntryKey: secret
    }, '2FA setup data');

  } catch (error) {
    console.error('2FA setup error:', error);
    return errorResponse('Failed to get 2FA setup data', 500);
  }
}

// POST: Enable 2FA with verification
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    // Admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // Get admin ID from token
    const authHeader = request.headers.get('authorization');
    const authToken = authHeader?.replace('Bearer ', '');
    if (!authToken) {
      return errorResponse('No token provided', 401);
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'maralatmaca-super-secret-jwt-key-2024';
    const decoded: any = jwt.verify(authToken, JWT_SECRET);
    const adminId = decoded.id;

    const { token, backupCodes } = await request.json();

    if (!token || typeof token !== 'string') {
      return errorResponse('Token is required', 400);
    }

    // Get admin data
    const adminData = await executeQuery(
      'SELECT username, email, two_factor_secret FROM admins WHERE id = ?',
      [adminId]
    );

    if (adminData.length === 0) {
      return errorResponse('Admin not found', 404);
    }

    const admin = adminData[0];

    if (!admin.two_factor_secret) {
      return errorResponse('2FA secret not found. Please setup 2FA first.', 400);
    }

    // Verify token
    const isValidToken = twoFactorAuth.verifyToken(admin.two_factor_secret, token);

    if (!isValidToken) {
      return errorResponse('Invalid token', 400);
    }

    // Generate backup codes if not provided
    let finalBackupCodes = backupCodes;
    if (!finalBackupCodes || !Array.isArray(finalBackupCodes)) {
      finalBackupCodes = twoFactorAuth.generateBackupCodes();
    }

    // Enable 2FA
    await executeQuery(
      'UPDATE admins SET two_factor_enabled = 1, two_factor_backup_codes = ? WHERE id = ?',
      [JSON.stringify(finalBackupCodes), adminId]
    );

    return successResponse({
      enabled: true,
      backupCodes: finalBackupCodes,
      message: '2FA enabled successfully'
    }, '2FA enabled');

  } catch (error) {
    console.error('2FA enable error:', error);
    return errorResponse('Failed to enable 2FA', 500);
  }
}

// PUT: Disable 2FA
export async function PUT(request: NextRequest) {
  try {
    // Admin authentication
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { password, token, adminId } = await request.json();

    if (!password || !adminId) {
      return errorResponse('Password and admin ID are required to disable 2FA', 400);
    }

    // Verify password first
    const adminData = await executeQuery(
      'SELECT password_hash FROM admins WHERE id = ?',
      [adminId]
    );

    if (adminData.length === 0) {
      return errorResponse('Admin not found', 404);
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, adminData[0].password_hash);

    if (!isValidPassword) {
      return errorResponse('Invalid password', 400);
    }

    // If token is provided, verify it
    if (token) {
      const admin2FAData = await executeQuery(
        'SELECT two_factor_secret FROM admins WHERE id = ?',
        [adminId]
      );

      if (admin2FAData.length > 0 && admin2FAData[0].two_factor_secret) {
        const isValidToken = twoFactorAuth.verifyToken(admin2FAData[0].two_factor_secret, token);
        if (!isValidToken) {
          return errorResponse('Invalid 2FA token', 400);
        }
      }
    }

    // Disable 2FA
    await executeQuery(
      'UPDATE admins SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = ?',
      [adminId]
    );

    return successResponse({
      enabled: false,
      message: '2FA disabled successfully'
    }, '2FA disabled');

  } catch (error) {
    console.error('2FA disable error:', error);
    return errorResponse('Failed to disable 2FA', 500);
  }
}
