import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { Validator } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tolgademir-super-secret-jwt-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Input validation
    const sanitizedEmail = Validator.sanitizeInput(email);
    const emailValidation = Validator.validateEmail(sanitizedEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: emailValidation.errors.join(', ') || 'Invalid email format' 
      }, { status: 400 });
    }

    // Admin kullanıcıları - Environment variables ve Database
    let admin: any = null;
    let isPasswordValid = false;

    try {
      // Önce database'den dene
      const query = 'SELECT * FROM admins WHERE email = ? LIMIT 1';
      const result = await executeQuery(query, [sanitizedEmail]);
      
      if (result && result.length > 0) {
        admin = result[0];
        isPasswordValid = await bcrypt.compare(password, admin.password_hash);
      }
    } catch (dbError) {
      console.log('Database error, falling back to environment variables');
    }

    // Database'de yoksa veya hata varsa, environment variables'dan kontrol et
    if (!admin || !isPasswordValid) {
      // Environment variables'dan admin bilgilerini al
      const envAdminEmail = process.env.ADMIN_EMAIL;
      const envAdminPassword = process.env.ADMIN_PASSWORD;
      const envAdminUsername = process.env.ADMIN_USERNAME || 'admin';
      
      if (envAdminEmail && envAdminPassword && sanitizedEmail === envAdminEmail && password === envAdminPassword) {
        admin = {
          id: '1',
          email: envAdminEmail,
          username: envAdminUsername,
          name: envAdminUsername
        };
        isPasswordValid = true;
      }
    }

    // Kimlik doğrulama başarısız
    if (!admin || !isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        username: admin.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // Session kaydet (optional - database yoksa çalışmayabilir)
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const sessionQuery = `
        INSERT INTO admin_sessions (admin_id, token, expires_at, created_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())
      `;
      
      await executeQuery(sessionQuery, [
        admin.id,
        sessionToken
      ]);
    } catch (sessionError) {
      console.log('Session kaydetme başarısız (database yok olabilir), devam ediliyor...');
    }

    // Kullanıcı bilgilerini döndür (şifre olmadan)
    const user = {
      id: admin.id,
      email: admin.email,
      username: admin.username
    };

    return NextResponse.json({
      success: true,
      token,
      sessionId: sessionToken,
      user
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Login failed' 
    }, { status: 500 });
  }
}
