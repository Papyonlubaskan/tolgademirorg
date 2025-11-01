import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { Validator } from '@/lib/validations';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse, paginatedResponse, rateLimitResponse } from '@/lib/api-response';

// GET: Tüm kitapları listele
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Cache headers ekle
    const response = new NextResponse();
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5 dk browser, 10 dk CDN

    const search = searchParams.get('search');

    // MySQL'den kitapları çek - Basit query (MariaDB uyumlu)
    let query = `
      SELECT b.*, 
             (SELECT COUNT(*) FROM chapters WHERE book_id = b.id) as chapters_count
      FROM books b 
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filtreleme
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND category LIKE ?';
      params.push(`%${category}%`);
    }

    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Toplam sayıyı al (JOIN olmadan)
    const countParams: any[] = [];
    let countQuery = `SELECT COUNT(*) as total FROM books b WHERE 1=1`;
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (category) {
      countQuery += ' AND category LIKE ?';
      countParams.push(`%${category}%`);
    }
    
    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ? OR author LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    // ORDER BY ve LIMIT ekle
    query += ' ORDER BY b.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const booksResult = await executeQuery(query, params);
    const books = Array.isArray(booksResult) ? booksResult : [];
    
    const paginatedBooks = books;

    const responseData = {
      success: true,
      data: paginatedBooks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };

    const apiResponse = NextResponse.json(responseData);
    
    // Cache header'larını ekle
    apiResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    apiResponse.headers.set('Pragma', 'no-cache');
    apiResponse.headers.set('Expires', '0');
    
    return apiResponse;
  } catch (error: any) {
    console.error('❌ Books API Error:', {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return errorResponse(
      process.env.NODE_ENV === 'development' 
        ? `Failed to fetch books: ${error.message}`
        : 'Kitaplar yüklenirken bir hata oluştu',
      500
    );
  }
}

// POST: Yeni kitap ekle (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown';
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

    const bookData = await request.json();
    
    // Input validation
    const validation = Validator.validateBookData(bookData);
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    // MySQL'e kitap ekle
    // Generate unique slug from title
    const baseSlug = (bookData.slug || bookData.title)
      .toLowerCase()
      .replace(/[^a-z0-9\s-ğüşıöçĞÜŞİÖÇ]/g, '')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[şŞ]/g, 's')
      .replace(/[ıİ]/g, 'i')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await executeQuery('SELECT id FROM books WHERE slug = ?', [slug]);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    const insertQuery = `
      INSERT INTO books (title, slug, description, content, author, category, cover_image, status, publish_date, amazon_link, dr_link, idefix_link, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    // Tarihi MySQL formatına çevir (YYYY-MM-DD)
    let formattedDate = null;
    if (bookData.publish_date && bookData.publish_date.trim() !== '') {
      const dateObj = new Date(bookData.publish_date);
      formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    const result = await executeQuery(insertQuery, [
      bookData.title,
      slug,
      bookData.description || null,
      bookData.content || null,
      bookData.author || 'Tolga Demir',
      bookData.category || null,
      bookData.cover_image || bookData.cover_image_url || null,
      bookData.status || 'draft',
      formattedDate,
      bookData.amazon_link || null,
      bookData.dr_link || null,
      bookData.idefix_link || null
    ]);

    const newBookId = (result as any).insertId;

    // Newsletter bildirim gönder (yayınlanmış kitaplar için)
    if (bookData.status === 'published') {
      try {
        // Internal API call - fetch yerine doğrudan newsletter fonksiyonunu çağır
        await executeQuery(`
          INSERT INTO newsletter_notifications (type, title, message, book_id, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [
          'new-book',
          bookData.title,
          `Yeni kitap: "${bookData.title}" yayınlandı! Hemen okumaya başlayın.`,
          newBookId
        ]).catch(err => console.log('⚠️ Newsletter bildirim kaydedilemedi:', err));
      } catch (e) {
        console.log('⚠️ Newsletter bildirim gönderilemedi:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Book created successfully',
      data: { id: newBookId, ...bookData }
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error creating book:', error);
    return errorResponse('Failed to create book', 500);
  }
}
