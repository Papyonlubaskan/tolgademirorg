import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { executeQuery } from '@/lib/database/mysql';

// GET: Tüm mesajları getir
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // Query parametrelerini al
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Query oluştur
    let query = 'SELECT * FROM contact_messages';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const messages = await executeQuery(query, params);

    return successResponse(
      messages || [],
      'Mesajlar başarıyla getirildi'
    );

  } catch (error) {
    console.error('Messages fetch error:', error);
    return errorResponse('Mesajlar getirilirken hata oluştu', 500);
  }
}

