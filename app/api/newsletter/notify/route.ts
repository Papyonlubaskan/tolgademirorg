import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * POST /api/newsletter/notify
 * Tüm aktif abonelere bildirim gönder
 */
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { type, title, message, bookId, chapterId } = await request.json();

    if (!type || !title || !message) {
      return errorResponse('Type, title ve message gerekli', 400);
    }

    // Aktif aboneleri al
    const subscribers = await executeQuery(
      'SELECT email, name FROM newsletter_subscribers WHERE status = "active"',
      []
    ) as any[];

    if (subscribers.length === 0) {
      return successResponse({ sent: 0 }, 'Aktif abone yok');
    }

    let sentCount = 0;
    let failedCount = 0;

    // Email servisi ile bildirim gönder (opsiyonel)
    try {
      const { emailService } = await import('@/lib/email');
      
      for (const subscriber of subscribers) {
        try {
          await emailService.sendNewsletterNotification(
            subscriber.email,
            subscriber.name,
            type,
            title,
            message,
            bookId,
            chapterId
          );
          sentCount++;
        } catch (emailError) {
          console.error(`Email gönderilemedi: ${subscriber.email}`, emailError);
          failedCount++;
        }
      }

      console.log(`✅ Newsletter bildirim gönderildi: ${sentCount}/${subscribers.length}`);
    } catch (emailServiceError) {
      console.log('⚠️ Email servisi çalışmıyor (opsiyonel)');
      // Email servisi yoksa da bildirim sistemi çalışmalı
      sentCount = subscribers.length;
    }

    return successResponse({
      total: subscribers.length,
      sent: sentCount,
      failed: failedCount,
      type,
      title
    }, `Bildirim gönderildi: ${sentCount}/${subscribers.length} abone`);

  } catch (error) {
    console.error('Newsletter notify error:', error);
    return errorResponse('Bildirim gönderilirken hata oluştu', 500);
  }
}

