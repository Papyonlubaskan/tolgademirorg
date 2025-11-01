import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { successResponse, errorResponse, rateLimitResponse } from '@/lib/api-response';

// GET: Kullanıcının okuma geçmişini getir
export async function GET(request: NextRequest) {
  console.log('📚 Reading history API çağrıldı');
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return rateLimitResponse({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      // UserID yoksa boş sonuç döndür
      return successResponse({
        history: [],
        total: 0
      });
    }

    // Reading history tablosunu kontrol et
    try {
      const tableCheckQuery = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'reading_history'
      `;
      const tableExists = await executeQuery(tableCheckQuery);
      
      if (tableExists[0]?.count === 0) {
        // Tablo yoksa boş array döndür
        return successResponse([], 'Reading history table does not exist yet');
      }
      
      // Tablo varsa sadece bu kullanıcının verilerini getir
      const query = `
        SELECT 
          rh.*,
          b.title as book_title,
          b.slug as book_slug,
          b.cover_image,
          c.title as chapter_title,
          c.slug as chapter_slug
        FROM reading_history rh
        LEFT JOIN books b ON rh.book_id = b.id
        LEFT JOIN chapters c ON rh.chapter_id = c.id
        WHERE rh.user_id = ?
        ORDER BY rh.last_read_at DESC
        LIMIT 10
      `;

      const history = await executeQuery(query, [userId]);
      
      // Sadece bu kullanıcının verilerini döndür
      return successResponse(history, 'Reading history retrieved');
      
    } catch (error) {
      // Hata durumunda boş array döndür
      console.error('Reading history error:', error);
      return successResponse([], 'Reading history not available');
    }
  } catch (error) {
    console.error('Error fetching reading history:', error);
    return errorResponse('Failed to fetch reading history');
  }
}

// POST: Okuma geçmişini güncelle
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return rateLimitResponse({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      });
    }

    const { userId, bookId, chapterId, lineNumber, progressPercentage } = await request.json();

    if (!userId || !bookId) {
      return errorResponse('User ID and Book ID are required', 400);
    }

    // Mevcut kaydı kontrol et
    const checkQuery = 'SELECT id FROM reading_history WHERE user_id = ? AND book_id = ?';
    const existing = await executeQuery(checkQuery, [userId, bookId]);

    if (existing && existing.length > 0) {
      // Güncelle
      const updateQuery = `
        UPDATE reading_history 
        SET chapter_id = ?, line_number = ?, progress_percentage = ?, last_read_at = NOW()
        WHERE user_id = ? AND book_id = ?
      `;
      await executeQuery(updateQuery, [chapterId, lineNumber, progressPercentage, userId, bookId]);
    } else {
      // Yeni kayıt oluştur
      const insertQuery = `
        INSERT INTO reading_history (user_id, book_id, chapter_id, line_number, progress_percentage)
        VALUES (?, ?, ?, ?, ?)
      `;
      await executeQuery(insertQuery, [userId, bookId, chapterId, lineNumber, progressPercentage]);
    }

    return successResponse({ message: 'Reading history updated' }, 'Reading progress saved');
  } catch (error) {
    console.error('Error updating reading history:', error);
    return errorResponse('Failed to update reading history');
  }
}
