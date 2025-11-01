import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { sendEmail, getUpdateNotificationTemplate } from '@/lib/email';

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

    // Kitap bilgilerini al (eğer bookId varsa)
    let bookInfo: any = null;
    if (bookId) {
      const bookResult = await executeQuery(
        'SELECT title, cover_image, slug FROM books WHERE id = ?',
        [bookId]
      ) as any[];
      
      if (bookResult.length > 0) {
        bookInfo = bookResult[0];
      }
    }

    // Email servisi ile bildirim gönder
    try {
      for (const subscriber of subscribers) {
        try {
          const emailHtml = getUpdateNotificationTemplate({
            title: title,
            description: message,
            bookTitle: bookInfo?.title,
            bookCoverUrl: bookInfo?.cover_image,
            bookUrl: bookInfo ? `https://tolgademir.org/kitaplar/${bookInfo.slug}` : undefined,
          });

          await sendEmail({
            to: subscriber.email,
            subject: title,
            html: emailHtml,
          });
          
          sentCount++;
        } catch (emailError) {
          console.error(`Email gönderilemedi: ${subscriber.email}`, emailError);
          failedCount++;
        }
      }

      console.log(`✅ Newsletter bildirim gönderildi: ${sentCount}/${subscribers.length}`);
    } catch (emailServiceError) {
      console.error('⚠️ Email servisi hatası:', emailServiceError);
      return errorResponse('E-posta gönderimi sırasında hata oluştu', 500);
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

