import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { successResponse, errorResponse } from '@/lib/api-response';
import { twoFactorAuth } from '@/lib/auth/2fa';
import { apiRateLimiter } from '@/lib/rateLimiter';

// POST: Verify 2FA token during login
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
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { username, token, backupCode } = await request.json();

    if (!username || (!token && !backupCode)) {
      return errorResponse('Username and token or backup code required', 400);
    }

    // Get admin data
    const adminData = await executeQuery(
      'SELECT id, username, email, password_hash, two_factor_enabled, two_factor_secret, two_factor_backup_codes FROM admins WHERE username = ? OR email = ?',
      [username, username]
    );

    if (adminData.length === 0) {
      return errorResponse('Invalid credentials', 401);
    }

    const admin = adminData[0];

    if (!admin.two_factor_enabled) {
      return errorResponse('2FA is not enabled for this account', 400);
    }

    let isValid2FA = false;

    // Verify token or backup code
    if (token) {
      if (!admin.two_factor_secret) {
        return errorResponse('2FA secret not found', 500);
      }
      
      isValid2FA = twoFactorAuth.verifyToken(admin.two_factor_secret, token);
    } else if (backupCode) {
      if (!admin.two_factor_backup_codes) {
        return errorResponse('Backup codes not found', 500);
      }

      const backupCodes = JSON.parse(admin.two_factor_backup_codes);
      isValid2FA = twoFactorAuth.verifyBackupCode(backupCodes, backupCode);

      // If backup code was used, update the database
      if (isValid2FA) {
        await executeQuery(
          'UPDATE admins SET two_factor_backup_codes = ? WHERE id = ?',
          [JSON.stringify(backupCodes), admin.id]
        );
      }
    }

    if (!isValid2FA) {
      return errorResponse('Invalid 2FA token or backup code', 401);
    }

    // Generate JWT token for successful 2FA verification
    const jwt = require('jsonwebtoken');
    const tokenPayload = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      type: 'admin'
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: '24h'
    });

    // Create session
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    await executeQuery(
      'INSERT INTO admin_sessions (session_id, admin_id, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW())',
      [sessionId, admin.id]
    );

    return successResponse({
      accessToken,
      sessionId,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      },
      twoFactorVerified: true
    }, '2FA verification successful');

  } catch (error) {
    console.error('2FA verification error:', error);
    return errorResponse('2FA verification failed', 500);
  }
}

// GET: Get remaining backup codes
export async function GET(request: NextRequest) {
  try {
    // Admin authentication
    const { requireAdmin } = require('@/lib/middleware/admin-auth');
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return errorResponse('Unauthorized', 401);
    }

    const adminId = authResult.user.id;

    // Get backup codes
    const adminData = await executeQuery(
      'SELECT two_factor_backup_codes FROM admins WHERE id = ?',
      [adminId]
    );

    if (adminData.length === 0) {
      return errorResponse('Admin not found', 404);
    }

    const backupCodes = adminData[0].two_factor_backup_codes ? 
      JSON.parse(adminData[0].two_factor_backup_codes) : [];

    return successResponse({
      backupCodes,
      remaining: backupCodes.length
    }, 'Backup codes retrieved');

  } catch (error) {
    console.error('Backup codes retrieval error:', error);
    return errorResponse('Failed to get backup codes', 500);
  }
}
