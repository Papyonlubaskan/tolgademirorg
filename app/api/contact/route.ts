import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { Validator } from '@/lib/validations';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { successResponse, errorResponse } from '@/lib/api-response';
import { executeQuery } from '@/lib/database/mysql';

export async function POST(request: NextRequest) {
  console.log('🔥 CONTACT API BAŞLADI - DEBUG MODU');
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    console.log('📋 Rate limit kontrol:', { clientIP, allowed: rateLimit.allowed });
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { name, email, subject, message } = await request.json();
    console.log('📨 Form verisi alındı:', { name, email, subject, messageLength: message?.length });

    // Input validation
    const nameValidation = Validator.validateName(name, 'Ad Soyad');
    const emailValidation = Validator.validateEmail(email);
    const messageValidation = Validator.validateMessage(message);
    console.log('✅ Validasyon sonuçları:', { 
      name: nameValidation.isValid, 
      email: emailValidation.isValid, 
      message: messageValidation.isValid 
    });

    if (!nameValidation.isValid || !emailValidation.isValid || !messageValidation.isValid) {
      const errors = [
        ...nameValidation.errors,
        ...emailValidation.errors,
        ...messageValidation.errors
      ];
      return errorResponse(errors.join(', '), 400);
    }

    // Subject validation
    if (!subject || subject.trim().length < 3) {
      return errorResponse('Konu en az 3 karakter olmalıdır', 400);
    }

    if (subject.length > 200) {
      return errorResponse('Konu çok uzun', 400);
    }

    // Sanitize inputs
    const sanitizedData = {
      name: Validator.sanitizeInput(name),
      email: email.trim().toLowerCase(),
      subject: Validator.sanitizeInput(subject),
      message: Validator.sanitizeInput(message)
    };

    // Veritabanına kaydet
    console.log('💾 Veritabanı kaydı başlıyor...');
    try {
      const userIp = clientIP;
      
      console.log('📊 Kaydedilecek veri:', {
        name: sanitizedData.name,
        email: sanitizedData.email,
        subject: sanitizedData.subject,
        messageLength: sanitizedData.message.length,
        userIp
      });
      
      await executeQuery(
        `INSERT INTO contact_messages (name, email, subject, message, user_ip, status, priority)
         VALUES (?, ?, ?, ?, ?, 'unread', 'normal')`,
        [sanitizedData.name, sanitizedData.email, sanitizedData.subject, sanitizedData.message, userIp]
      );
      
      console.log('✅ İletişim mesajı veritabanına kaydedildi:', sanitizedData.email);
    } catch (dbError) {
      console.error('❌ Veritabanı kayıt hatası:', dbError);
      console.error('💥 Hata türü:', typeof dbError);
      console.error('💥 Hata mesajı:', (dbError as any)?.message);
      console.error('💥 Hata kodu:', (dbError as any)?.code);
      return errorResponse('Mesaj kaydedilemedi. Lütfen tekrar deneyin.', 500);
    }

    // Send email notification to admin
    try {
      await sendEmail({
        to: process.env.CONTACT_EMAIL || 'tolgademir@okandemir.org',
        subject: `Yeni İletişim Mesajı: ${sanitizedData.subject}`,
        html: `
          <h2>Yeni İletişim Formu Mesajı</h2>
          <p><strong>Gönderen:</strong> ${sanitizedData.name}</p>
          <p><strong>E-posta:</strong> ${sanitizedData.email}</p>
          <p><strong>Konu:</strong> ${sanitizedData.subject}</p>
          <p><strong>Mesaj:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #f97316;">
            ${sanitizedData.message.replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
            Bu mesajı yanıtlamak için admin panelinden veya doğrudan ${sanitizedData.email} adresine e-posta gönderebilirsiniz.
          </p>
        `,
        replyTo: sanitizedData.email,
      });
      console.log('✅ Admin bilgilendirme e-postası gönderildi');
    } catch (emailError) {
      console.log('⚠️ Admin e-postası gönderilemedi:', emailError);
      // Mesaj veritabanında, e-posta hatası kritik değil
    }

    // Always return success if database save succeeded
    return successResponse(
      { message: 'Mesajınız başarıyla alındı. En kısa sürede size dönüş yapacağız.' },
      'Mesaj başarıyla alındı',
      {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return errorResponse('Bir hata oluştu. Lütfen tekrar deneyin.', 500);
  }
}
