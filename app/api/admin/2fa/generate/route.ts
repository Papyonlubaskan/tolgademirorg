import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

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

    // Secret key oluştur
    const secret = speakeasy.generateSecret({
      name: 'Tolga Demir Admin',
      issuer: 'Tolga Demir',
      length: 32
    });

    // QR kod oluştur (Base64 data URL)
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url || '');

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeDataURL,
      otpauth: secret.otpauth_url
    });

  } catch (error) {
    console.error('2FA generate error:', error);
    return NextResponse.json(
      { success: false, error: 'QR kod oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}

