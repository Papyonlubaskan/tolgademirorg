import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { type, title, message, icon } = await request.json();
    
    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Tür, başlık ve mesaj gerekli' },
        { status: 400 }
      );
    }

    // Bildirimi veritabanına kaydet
    const insertQuery = `
      INSERT INTO notifications (type, title, message, icon, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, NOW())
    `;
    
    const result = await executeQuery(insertQuery, [
      type,
      title,
      message,
      icon || 'ri-notification-line'
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: (result as any).insertId,
        type,
        title,
        message,
        icon
      },
      message: 'Bildirim oluşturuldu'
    });
  } catch (error) {
    console.error('Notification create error:', error);
    return NextResponse.json(
      { success: false, error: 'Bildirim oluşturulamadı' },
      { status: 500 }
    );
  }
}

