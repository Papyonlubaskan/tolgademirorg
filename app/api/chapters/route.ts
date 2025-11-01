import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { Validator } from '@/lib/validations';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse, paginatedResponse, rateLimitResponse } from '@/lib/api-response';

// GET: Kitaba ait tüm bölümleri listele
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
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
    const bookId = searchParams.get('bookId');
    
    let query = 'SELECT * FROM chapters ORDER BY order_number ASC';
    let params: any[] = [];
    
    if (bookId) {
      query = 'SELECT * FROM chapters WHERE book_id = ? ORDER BY order_number ASC';
      params = [bookId];
    }

    // MySQL'den bölümleri çek
    const chapters = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: chapters,
      total: chapters.length
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return errorResponse('Failed to fetch chapters', 500);
  }
}

// POST: Yeni bölüm ekle (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    // Admin authentication check
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const chapterData = await request.json();
    
    if (!chapterData.book_id || !chapterData.title) {
      return errorResponse('Book ID and title are required', 400);
    }

    // Input validation
    const sanitizedTitle = chapterData.title.trim();
    
    // Türkçe karakterleri dönüştürerek slug oluştur
    const sanitizedSlug = chapterData.slug || sanitizedTitle
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '');

    // MySQL'e bölüm ekle
    const insertQuery = `
      INSERT INTO chapters (book_id, title, slug, content, order_number, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(insertQuery, [
      chapterData.book_id,
      sanitizedTitle,
      sanitizedSlug,
      chapterData.content || '',
      chapterData.order_number || 1,
      chapterData.status || 'published'
    ]);

    const newChapterId = (result as any).insertId;

    // Newsletter bildirim gönder (yayınlanmış bölümler için)
    if (chapterData.status === 'published') {
      try {
        // Kitap bilgisini al
        const books = await executeQuery('SELECT title FROM books WHERE id = ?', [chapterData.book_id]) as any[];
        const bookTitle = books[0]?.title || 'Kitap';
        
        // Internal API call - doğrudan veritabanına kaydet
        await executeQuery(`
          INSERT INTO newsletter_notifications (type, title, message, book_id, chapter_id, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [
          'new-chapter',
          sanitizedTitle,
          `"${bookTitle}" kitabına yeni bölüm eklendi: "${sanitizedTitle}"`,
          chapterData.book_id,
          newChapterId
        ]).catch(err => console.log('⚠️ Newsletter bildirim kaydedilemedi:', err));
      } catch (e) {
        console.log('⚠️ Newsletter bildirim gönderilemedi:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Chapter created successfully',
      data: { id: newChapterId, ...chapterData }
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return errorResponse('Failed to create chapter', 500);
  }
}
