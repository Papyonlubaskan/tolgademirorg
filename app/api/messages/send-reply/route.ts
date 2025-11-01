
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { sendEmail, getContactReplyTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { recipientEmail, recipientName, subject, replyText, originalMessage } = await request.json();

    if (!recipientEmail || !replyText) {
      return errorResponse('Email ve cevap metni gerekli', 400);
    }

    // E-posta şablonunu hazırla
    const emailHtml = getContactReplyTemplate({
      userName: recipientName || 'Değerli Okuyucum',
      userMessage: originalMessage || '',
      replyMessage: replyText,
    });

    // Maili gönder
    const result = await sendEmail({
      to: recipientEmail,
      subject: subject || 'İletişim Formunuz Hakkında',
      html: emailHtml,
      from: 'Tolga Demir <tolgademir@okandemir.org>',
      replyTo: 'tolgademir@okandemir.org',
    });

    if (!result.success) {
      throw new Error(String(result.error));
    }

    console.log('✅ Mail gönderildi:', result.messageId);

    return successResponse({ 
      message: 'Email başarıyla gönderildi',
      sentTo: recipientEmail,
      messageId: result.messageId
    });

  } catch (error: any) {
    console.error('Email send error:', error);
    return errorResponse(`Email gönderilemedi: ${error.message}`, 500);
  }
}

