import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: İletişim mesajlarını getir
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM contact_messages';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const messages = await executeQuery(query, params);

    return successResponse(messages, 'Messages retrieved successfully');
  } catch (error) {
    console.error('Messages fetch error:', error);
    return errorResponse('Mesajlar yüklenirken hata oluştu', 500);
  }
}

// PUT: Mesaj durumunu güncelle
export async function PUT(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { id, status, priority, reply } = await request.json();

    if (!id) {
      return errorResponse('Mesaj ID gerekli', 400);
    }

    // Eğer reply varsa, cevap gönder ve durumu güncelle
    if (reply && reply.trim()) {
      // Önce mesajı al (email için)
      const getMessage = 'SELECT email, name, subject FROM contact_messages WHERE id = ?';
      const messageData = await executeQuery(getMessage, [id]) as any[];
      
      if (messageData.length === 0) {
        return errorResponse('Mesaj bulunamadı', 404);
      }

      const message = messageData[0];
      
      // Cevabı ve durumu güncelle
      const updateQuery = `
        UPDATE contact_messages 
        SET status = 'replied', reply_message = ?, replied_at = NOW(), updated_at = NOW() 
        WHERE id = ?
      `;
      
      await executeQuery(updateQuery, [reply.trim(), id]);

      // Email gönder (opsiyonel - email service varsa)
      try {
        const { emailService } = await import('@/lib/email');
        await emailService.sendContactReply(
          message.email,
          message.name,
          message.subject,
          reply.trim()
        );
        console.log('✅ Cevap email\'i gönderildi:', message.email);
      } catch (emailError) {
        console.log('⚠️ Email servisi çalışmıyor (opsiyonel):', emailError);
      }

      return successResponse({ id, status: 'replied', reply }, 'Cevap başarıyla gönderildi');
    }

    // Sadece status/priority güncelleme
    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }

    if (updates.length === 0) {
      return errorResponse('Güncellenecek alan bulunamadı', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);
    const query = `UPDATE contact_messages SET ${updates.join(', ')} WHERE id = ?`;

    await executeQuery(query, params);

    return successResponse({ id, status, priority }, 'Mesaj başarıyla güncellendi');
  } catch (error) {
    console.error('Message update error:', error);
    return errorResponse('Mesaj güncellenirken hata oluştu', 500);
  }
}

// DELETE: Mesajı sil
export async function DELETE(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Mesaj ID gerekli', 400);
    }

    await executeQuery('DELETE FROM contact_messages WHERE id = ?', [id]);

    return successResponse({ id }, 'Mesaj başarıyla silindi');
  } catch (error) {
    console.error('Message delete error:', error);
    return errorResponse('Mesaj silinirken hata oluştu', 500);
  }
}
