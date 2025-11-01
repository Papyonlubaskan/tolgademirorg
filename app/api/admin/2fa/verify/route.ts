import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { executeQuery } from '@/lib/database/mysql';

export async function POST(request: NextRequest) {
  try {
    // Admin token kontrolü
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const { secret, code } = await request.json();

    if (!secret || !code) {
      return NextResponse.json(
        { success: false, error: 'Secret ve kod gerekli' },
        { status: 400 }
      );
    }

    // TOTP kodunu doğrula
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2 // 60 saniye window (± 2 steps)
    });

    if (verified) {
      // Secret'i veritabanına kaydet
      try {
        // Admin kullanıcısının ID'sini token'dan al (basitleştirilmiş versiyon)
        // Gerçek uygulamada JWT'den decode edilmeli
        const adminId = 1; // Demo için

        // 2FA secret'i kaydet veya güncelle
        await executeQuery(
          `INSERT INTO admin_users (id, two_factor_secret, two_factor_enabled) 
           VALUES (?, ?, true)
           ON DUPLICATE KEY UPDATE 
           two_factor_secret = VALUES(two_factor_secret),
           two_factor_enabled = true`,
          [adminId, secret]
        );

        return NextResponse.json({
          success: true,
          message: '2FA başarıyla kuruldu'
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Veritabanı hatası olsa bile doğrulama başarılı
        return NextResponse.json({
          success: true,
          message: '2FA doğrulandı (DB kayıt hatası)'
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Geçersiz doğrulama kodu' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Doğrulama sırasında hata oluştu' },
      { status: 500 }
    );
  }
}

