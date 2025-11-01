import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { successResponse, errorResponse, rateLimitResponse } from '@/lib/api-response';

// GET: Belirli bir kitabın bölümlerini getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return rateLimitResponse({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      });
    }

    const bookId = (await params).id;
    console.log('📚 Book chapters API çağrıldı, bookId:', bookId);
    
    // Input validation
    if (!bookId || bookId.length < 1) {
      return errorResponse('Invalid book ID', 400);
    }

    // MySQL'den bölümleri çek (ID veya slug ile)
    const isNumeric = /^\d+$/.test(bookId);
    const bookQuery = isNumeric 
      ? 'SELECT id FROM books WHERE id = ? LIMIT 1'
      : 'SELECT id FROM books WHERE slug = ? LIMIT 1';
    
    const books = await executeQuery(bookQuery, [bookId]);
    if (books.length === 0) {
      return errorResponse('Book not found', 404);
    }
    
    const actualBookId = books[0].id;
    
    const chaptersQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT cm.id) as comment_count,
        COUNT(DISTINCT l.id) as like_count
      FROM chapters c
      LEFT JOIN comments cm ON c.id = cm.chapter_id
      LEFT JOIN likes l ON c.id = l.chapter_id
      WHERE c.book_id = ? AND c.status = 'published'
      GROUP BY c.id
      ORDER BY c.order_number ASC, c.created_at ASC
    `;
    
    const chapters = await executeQuery(chaptersQuery, [actualBookId]);
    console.log('📚 Chapters found:', chapters.length);
    
    return successResponse(chapters, 'Chapters retrieved successfully', {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString()
    });
    
  } catch (error) {
    console.error('Error fetching book chapters:', error);
    return errorResponse('Failed to fetch chapters', 500);
  }
}
