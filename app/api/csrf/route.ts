import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// CSRF token oluştur ve döndür
export async function GET(request: NextRequest) {
  try {
    // CSRF token oluştur
    const token = randomBytes(32).toString('hex');
    
    const response = NextResponse.json({
      success: true,
      token
    }, {
      status: 200
    });

    // Token'ı cookie'ye kaydet
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 // 1 saat
    });

    return response;
  } catch (error) {
    console.error('CSRF token error:', error);
    return NextResponse.json({
      success: false,
      error: 'CSRF token oluşturulurken hata oluştu'
    }, { status: 500 });
  }
}

// CSRF token doğrula
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const cookieToken = request.cookies.get('csrf-token')?.value;

    if (!token || !cookieToken || token !== cookieToken) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Geçersiz CSRF token'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      valid: true
    });
  } catch (error) {
    console.error('CSRF validation error:', error);
    return NextResponse.json({
      success: false,
      error: 'CSRF doğrulama başarısız'
    }, { status: 500 });
  }
}
