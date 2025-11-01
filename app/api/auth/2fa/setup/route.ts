import { NextRequest, NextResponse } from 'next/server';
import { TwoFactorAuth } from '@/lib/auth/two-factor';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';

// POST: 2FA kurulumu başlat
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID required' 
      }, { status: 400 });
    }

    // Kullanıcıyı veritabanından kontrol et
    const user = await executeQuery(
      'SELECT id, email, name FROM admins WHERE id = ?',
      [userId]
    );

    if (!user || user.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // 2FA kurulumu
    const setup = await TwoFactorAuth.setupTwoFactor(user[0].name);

    // Secret'ı geçici olarak veritabanında sakla (doğrulama sonrası kalıcı olacak)
    await executeQuery(
      'UPDATE admins SET two_factor_secret = ?, two_factor_backup_codes = ? WHERE id = ?',
      [setup.secret, JSON.stringify(setup.backupCodes), userId]
    );

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: setup.qrCodeUrl,
        backupCodes: setup.backupCodes
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '2FA setup failed' 
    }, { status: 500 });
  }
}

// PUT: 2FA kurulumunu doğrula ve etkinleştir
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { userId, token } = await request.json();
    
    if (!userId || !token) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and token required' 
      }, { status: 400 });
    }

    // Kullanıcının secret'ını al
    const user = await executeQuery(
      'SELECT two_factor_secret FROM admins WHERE id = ?',
      [userId]
    );

    if (!user || user.length === 0 || !user[0].two_factor_secret) {
      return NextResponse.json({ 
        success: false, 
        error: '2FA not set up' 
      }, { status: 400 });
    }

    // Token'ı doğrula
    const isValid = TwoFactorAuth.verifyToken(user[0].two_factor_secret, token);
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 400 });
    }

    // 2FA'yı etkinleştir
    await executeQuery(
      'UPDATE admins SET two_factor_enabled = 1 WHERE id = ?',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully'
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '2FA verification failed' 
    }, { status: 500 });
  }
}
