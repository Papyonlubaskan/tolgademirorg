import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST: Kitap görüntülenme sayısını artır (IP bazlı, her IP için 1 kez)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bookId = (await params).id;
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Bu IP daha önce bu kitabı görüntülediyse artırma
    const checkQuery = 'SELECT id FROM book_views WHERE book_id = ? AND ip_address = ?';
    const existing = await executeQuery(checkQuery, [bookId, clientIP]);
    
    if (existing && existing.length > 0) {
      // Zaten görüntülemiş
      const selectQuery = 'SELECT views FROM books WHERE id = ?';
      const result = await executeQuery(selectQuery, [bookId]);
      const views = result[0]?.views || 0;
      return successResponse({ views, alreadyViewed: true }, 'Already viewed');
    }
    
    // Görüntülenme kaydı ekle
    const insertQuery = 'INSERT INTO book_views (book_id, ip_address, viewed_at) VALUES (?, ?, NOW())';
    await executeQuery(insertQuery, [bookId, clientIP]);
    
    // Görüntülenme sayısını artır
    const updateQuery = 'UPDATE books SET views = views + 1 WHERE id = ?';
    await executeQuery(updateQuery, [bookId]);
    
    // Güncel görüntülenme sayısını getir
    const selectQuery = 'SELECT views FROM books WHERE id = ?';
    const result = await executeQuery(selectQuery, [bookId]);
    const views = result[0]?.views || 0;
    
    return successResponse({ views, alreadyViewed: false }, 'View count incremented');
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return errorResponse('Failed to increment view count');
  }
}

