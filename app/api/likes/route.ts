import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { likesRateLimiter } from '@/lib/rateLimiter';
import { Validator } from '@/lib/validations';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: Kullanıcının beğenilerini al
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = likesRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5000',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { searchParams } = new URL(request.url);
    let bookId = searchParams.get('bookId');
    let chapterId = searchParams.get('chapterId');
    const lineNumber = searchParams.get('lineNumber');
    const userId = searchParams.get('userId');
    
    console.log('👍 Likes API çağrıldı:', { bookId, chapterId, lineNumber, userId });
    
    // Slug ise ID'ye çevir
    if (bookId && !/^\d+$/.test(bookId)) {
      const books = await executeQuery('SELECT id FROM books WHERE slug = ?', [bookId]) as any[];
      if (books.length > 0) {
        bookId = books[0].id.toString();
      }
    }
    
    if (chapterId && !/^\d+$/.test(chapterId)) {
      const chapters = await executeQuery('SELECT id FROM chapters WHERE slug = ?', [chapterId]) as any[];
      if (chapters.length > 0) {
        chapterId = chapters[0].id.toString();
      }
    }
    
    if (!bookId && !chapterId) {
      // Parametre yoksa boş sonuç döndür (400 yerine)
      return successResponse({
        totalLikes: 0,
        likeCount: 0,
        isLiked: false
      });
    }

    // userId opsiyonel - yoksa IP kullan
    const effectiveUserId = userId || clientIP;

    // MySQL'den beğeni sayısını çek
    let likeCountQuery = 'SELECT COUNT(*) as totalLikes FROM likes WHERE ';
    let params: any[] = [];
    
    if (chapterId) {
      if (lineNumber !== null && lineNumber !== undefined) {
        likeCountQuery += 'chapter_id = ? AND line_number = ?';
        params.push(chapterId, parseInt(lineNumber));
      } else {
        likeCountQuery += 'chapter_id = ? AND line_number IS NULL';
        params.push(chapterId);
      }
    } else {
      likeCountQuery += 'book_id = ? AND line_number IS NULL';
      params.push(bookId);
    }
    
    const likeCountResult = await executeQuery(likeCountQuery, params);
    const totalLikes = likeCountResult[0]?.totalLikes || 0;

    // Kullanıcının beğenip beğenmediğini IP ile kontrol et
    const userIp = effectiveUserId;
    let isLiked = false;
    let userLikeQuery = 'SELECT COUNT(*) as isLiked FROM likes WHERE user_ip = ? AND ';
    
    if (chapterId) {
      if (lineNumber !== null && lineNumber !== undefined) {
        userLikeQuery += 'chapter_id = ? AND line_number = ?';
        params = [userIp, chapterId, parseInt(lineNumber)];
      } else {
        userLikeQuery += 'chapter_id = ? AND line_number IS NULL';
        params = [userIp, chapterId];
      }
    } else {
      userLikeQuery += 'book_id = ? AND line_number IS NULL';
      params = [userIp, bookId];
    }
    
    const userLikeResult = await executeQuery(userLikeQuery, params);
    isLiked = userLikeResult[0]?.isLiked > 0;

    return successResponse({
      totalLikes: totalLikes,
      likeCount: totalLikes, // Backward compatibility
      isLiked
    }, undefined, {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString()
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return errorResponse('Beğeniler yüklenirken hata oluştu', 500);
  }
}

// POST: Beğeni durumunu güncelle
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = likesRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5000',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    let { bookId, chapterId, action, lineNumber } = await request.json();
    
    if ((!bookId && !chapterId) || !action) {
      return errorResponse('Kitap ID veya bölüm ID ve aksiyon gerekli', 400);
    }
    
    if (!['like', 'unlike'].includes(action)) {
      return errorResponse('Geçersiz aksiyon', 400);
    }

    // Slug ise ID'ye çevir
    if (bookId && !/^\d+$/.test(bookId.toString())) {
      const books = await executeQuery('SELECT id FROM books WHERE slug = ?', [bookId]) as any[];
      if (books.length > 0) {
        bookId = books[0].id;
      }
    }
    
    if (chapterId && !/^\d+$/.test(chapterId.toString())) {
      const chapters = await executeQuery('SELECT id FROM chapters WHERE slug = ?', [chapterId]) as any[];
      if (chapters.length > 0) {
        chapterId = chapters[0].id;
      }
    }

    const liked = action === 'like';
    const userIp = clientIP;

    if (liked) {
      // Beğeni ekle
      const insertQuery = `
        INSERT INTO likes (book_id, chapter_id, line_number, user_ip, created_at) 
        VALUES (?, ?, ?, ?, NOW())
      `;
      const insertParams = [bookId || null, chapterId || null, lineNumber || null, userIp];
      
      try {
        await executeQuery(insertQuery, insertParams);
      } catch (err: any) {
        // Duplicate entry hatası (zaten beğenilmiş) - sessizce yoksay
        if (err.code !== 'ER_DUP_ENTRY') throw err;
      }
    } else {
      // Beğeniyi kaldır
      let deleteQuery = 'DELETE FROM likes WHERE user_ip = ? AND ';
      let params: any[] = [userIp];
      
      if (chapterId) {
        if (lineNumber !== null && lineNumber !== undefined) {
          deleteQuery += 'chapter_id = ? AND line_number = ?';
          params.push(chapterId, lineNumber);
        } else {
          deleteQuery += 'chapter_id = ? AND line_number IS NULL';
          params.push(chapterId);
        }
      } else {
        deleteQuery += 'book_id = ? AND line_number IS NULL';
        params.push(bookId);
      }
      
      await executeQuery(deleteQuery, params);
    }

    // Güncel beğeni sayısını hesapla
    let countQuery = 'SELECT COUNT(*) as totalLikes FROM likes WHERE ';
    let countParams: any[] = [];
    
    if (chapterId) {
      if (lineNumber !== null && lineNumber !== undefined) {
        countQuery += 'chapter_id = ? AND line_number = ?';
        countParams.push(chapterId, lineNumber);
      } else {
        countQuery += 'chapter_id = ? AND line_number IS NULL';
        countParams.push(chapterId);
      }
    } else {
      countQuery += 'book_id = ? AND line_number IS NULL';
      countParams.push(bookId);
    }
    
    const countResult = await executeQuery(countQuery, countParams);
    const totalLikes = countResult[0]?.totalLikes || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalLikes,
        isLiked: liked
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error updating like:', error);
    return errorResponse('Failed to update like', 500);
  }
}
