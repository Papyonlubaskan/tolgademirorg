import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { executeQuery } from '@/lib/database/mysql';

// DELETE: Mesajı sil
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const messageId = (await params).id;

    // Mesajın varlığını kontrol et
    const existing = await executeQuery('SELECT id FROM contact_messages WHERE id = ?', [messageId]);
    if (!existing || existing.length === 0) {
      return errorResponse('Mesaj bulunamadı', 404);
    }

    // Mesajı sil
    await executeQuery('DELETE FROM contact_messages WHERE id = ?', [messageId]);

    return successResponse({ id: messageId }, 'Mesaj başarıyla silindi');
  } catch (error) {
    console.error('Message delete error:', error);
    return errorResponse('Mesaj silinirken hata oluştu', 500);
  }
}

// PUT: Mesaj durumunu güncelle
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const messageId = (await params).id;
    const { status, priority, reply } = await request.json();

    // Mesajın varlığını kontrol et
    const existing = await executeQuery('SELECT * FROM contact_messages WHERE id = ?', [messageId]);
    if (!existing || existing.length === 0) {
      return errorResponse('Mesaj bulunamadı', 404);
    }

    const updates: string[] = [];
    const params_array: any[] = [];

    if (status) {
      updates.push('status = ?');
      params_array.push(status);
    }

    if (priority) {
      updates.push('priority = ?');
      params_array.push(priority);
    }

    if (reply) {
      updates.push('reply_message = ?', 'status = ?', 'replied_at = NOW()');
      params_array.push(reply, 'replied');
    }

    if (updates.length === 0) {
      return errorResponse('Güncellenecek alan bulunamadı', 400);
    }

    params_array.push(messageId);
    const updateQuery = `UPDATE contact_messages SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
    
    await executeQuery(updateQuery, params_array);

    // Güncellenen mesajı getir
    const updated = await executeQuery('SELECT * FROM contact_messages WHERE id = ?', [messageId]);

    return successResponse(updated[0], 'Mesaj başarıyla güncellendi');
  } catch (error) {
    console.error('Message update error:', error);
    return errorResponse('Mesaj güncellenirken hata oluştu', 500);
  }
}
