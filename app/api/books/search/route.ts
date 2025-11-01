import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { Validator } from '@/lib/validations';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Çok fazla istek' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query || query.trim().length < 2) {
      return errorResponse('Arama terimi en az 2 karakter olmalıdır', 400);
    }

    const sanitizedQuery = Validator.sanitizeInput(query);
    const searchTerm = `%${sanitizedQuery}%`;

    // MySQL full-text search veya LIKE ile arama
    const books = await executeQuery(
      `SELECT 
        id, title, slug, description, cover_image, author, category, 
        status, publish_date, views, created_at, updated_at
       FROM books
       WHERE status = 'published' 
         AND (
           title LIKE ? 
           OR description LIKE ? 
           OR author LIKE ?
           OR content LIKE ?
         )
       ORDER BY 
         CASE 
           WHEN title LIKE ? THEN 1
           WHEN author LIKE ? THEN 2
           WHEN description LIKE ? THEN 3
           ELSE 4
         END,
         views DESC,
         created_at DESC
       LIMIT ? OFFSET ?`,
      [
        searchTerm, searchTerm, searchTerm, searchTerm,  // WHERE clause
        searchTerm, searchTerm, searchTerm,  // ORDER BY priority
        limit, offset
      ]
    );

    // Toplam sonuç sayısını al
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total
       FROM books
       WHERE status = 'published' 
         AND (
           title LIKE ? 
           OR description LIKE ? 
           OR author LIKE ?
           OR content LIKE ?
         )`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    ) as any[];

    const total = countResult[0]?.total || 0;

    return successResponse(
      {
        books,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        query: sanitizedQuery
      },
      'Arama başarıyla tamamlandı',
      {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    );

  } catch (error) {
    console.error('Books search error:', error);
    return errorResponse('Arama sırasında bir hata oluştu', 500);
  }
}
