import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { recipientEmail, recipientName, subject, replyText, originalMessage } = await request.json();

    if (!recipientEmail || !replyText) {
      return errorResponse('Email ve cevap metni gerekli', 400);
    }

    // SMTP transporter oluştur (okandemir.org ayarları)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'okandemir.org',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_SECURE === 'true', // true for SSL (port 465)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Timeout ayarları
      connectionTimeout: 15000, // 15 saniye
      greetingTimeout: 8000,    // 8 saniye
      socketTimeout: 15000,     // 15 saniye
      tls: {
        rejectUnauthorized: false, // Self-signed sertifika sorununu çözer
        minVersion: 'TLSv1.2'
      },
      debug: true, // SMTP debug log
      logger: true // Logger aktif
    });

    // Mail içeriği
    const mailOptions = {
      from: {
        name: 'Tolga Demir',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'maralatmaca@okandemir.org'
      },
      to: recipientEmail,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_USER,
      subject: subject || 'İletişim Formunuz Hakkında',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Tolga Demir</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Yazar & Hikaye Anlatıcı</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Merhaba <strong>${recipientName}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              İletişim formunuz için teşekkür ederim. Mesajınıza cevabım aşağıdadır:
            </p>
            
            <div style="background: #f9fafb; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #1f2937; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">${replyText}</p>
            </div>
            
            <div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>Orjinal Mesajınız:</strong>
              </p>
              <p style="color: #78350f; font-size: 14px; margin: 10px 0 0 0; font-style: italic;">
                "${originalMessage}"
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              Saygılarımla,<br>
              <strong style="color: #f97316;">Tolga Demir</strong><br>
              <span style="font-size: 12px;">Yazar</span>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                Bu mail <a href="https://tolgademir.org" style="color: #f97316; text-decoration: none;">tolgademir.org</a> üzerinden gönderilmiştir.
              </p>
              <div style="margin-top: 15px;">
                <a href="https://www.instagram.com/maral_atmaca" style="color: #f97316; text-decoration: none; margin: 0 10px;">Instagram</a>
                <a href="https://tolgademir.org/kitaplar" style="color: #f97316; text-decoration: none; margin: 0 10px;">Kitaplarım</a>
              </div>
            </div>
          </div>
        </div>
      `
    };

    // SMTP bağlantısını test et
    try {
      await transporter.verify();
      console.log('✅ SMTP bağlantısı başarılı');
    } catch (verifyError: any) {
      console.error('❌ SMTP bağlantı hatası:', verifyError);
      throw new Error(`SMTP bağlantısı başarısız: ${verifyError.message}`);
    }

    // Maili gönder
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Mail gönderildi:', info.messageId);

    return successResponse({ 
      message: 'Email başarıyla gönderildi',
      sentTo: recipientEmail,
      messageId: info.messageId
    });

  } catch (error: any) {
    console.error('Email send error:', error);
    return errorResponse(`Email gönderilemedi: ${error.message}`, 500);
  }
}

