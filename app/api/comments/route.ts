import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { Validator } from '@/lib/validations';
import { successResponse, paginatedResponse, errorResponse, rateLimitResponse, validationErrorResponse } from '@/lib/api-response';
import { SpamDetector } from '@/lib/spam-detector';
import { CommentRateLimiter } from '@/lib/comment-rate-limiter';

// GET: Yorumları listele
export async function GET(request: NextRequest) {
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

    // Cache headers ekle
    const response = new NextResponse();
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300'); // 1 dk browser, 5 dk CDN

    const { searchParams } = new URL(request.url);
    let bookId = searchParams.get('bookId');
    let chapterId = searchParams.get('chapterId');
    const type = searchParams.get('type'); // 'line' veya normal
    const status = searchParams.get('status'); // 'approved', 'pending', 'rejected', 'spam'
    const userId = searchParams.get('userId'); // Yorum sahibinin ID'si (gizli yorumları görmek için)
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Admin paneli için tüm yorumları listele (bookId veya chapterId yoksa)
    if (!bookId && !chapterId) {
      // Toplam sayı
      let countQuery = 'SELECT COUNT(*) as total FROM comments WHERE 1=1';
      let countParams: any[] = [];
      
      if (status && status !== 'all') {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const countResult = await executeQuery(countQuery, countParams);
      const total = countResult[0]?.total || 0;
      
      // Yorumları çek - kitap ve bölüm bilgileriyle birlikte + IP adresi
      let query = `
        SELECT c.*, 
               b.title as book_title,
               ch.title as chapter_title,
               c.user_ip
        FROM comments c
        LEFT JOIN books b ON c.book_id = b.id
        LEFT JOIN chapters ch ON c.chapter_id = ch.id
        WHERE 1=1
      `;
      let queryParams: any[] = [];
      
      if (status && status !== 'all') {
        query += ' AND c.status = ?';
        queryParams.push(status);
      }
      
      query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      const comments = await executeQuery(query, queryParams);
      
      return paginatedResponse(comments, total, limit, offset, {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      });
    }

    // Slug ise ID'ye çevir
    if (bookId && !/^\d+$/.test(bookId)) {
      const books = await executeQuery('SELECT id FROM books WHERE slug = ?', [bookId]) as any[];
      if (books.length === 0) {
        return errorResponse('Book not found', 404);
      }
      bookId = books[0].id.toString();
    }

    if (chapterId && !/^\d+$/.test(chapterId)) {
      const chapters = await executeQuery('SELECT id FROM chapters WHERE slug = ?', [chapterId]) as any[];
      if (chapters.length === 0) {
        return errorResponse('Chapter not found', 404);
      }
      chapterId = chapters[0].id.toString();
    }

    // Toplam sayıyı al
    let countQuery = 'SELECT COUNT(*) as total FROM comments WHERE ';
    let queryParams: any[] = [];
    
    if (chapterId) {
      if (type === 'line') {
        countQuery += 'chapter_id = ? AND line_number IS NOT NULL';
      } else {
        countQuery += 'chapter_id = ? AND line_number IS NULL';
      }
      queryParams.push(chapterId);
    } else {
      countQuery += 'book_id = ? AND chapter_id IS NULL AND line_number IS NULL';
      queryParams.push(bookId);
    }
    
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0]?.total || 0;

    // Yorumları çek (gizli yorumları filtrele - sadece yorum sahibi görsün)
    let query = 'SELECT * FROM comments WHERE ';
    
    if (chapterId) {
      if (type === 'line') {
        query += 'chapter_id = ? AND line_number IS NOT NULL';
        // Gizli yorumları filtrele (admin değilse ve yorum sahibi değilse)
        if (userId) {
          query += ' AND (is_hidden = 0 OR user_id = ?)';
          queryParams = [chapterId, userId, limit, offset];
        } else {
          query += ' AND is_hidden = 0';
          queryParams = [chapterId, limit, offset];
        }
        query += ' ORDER BY line_number ASC, created_at DESC LIMIT ? OFFSET ?';
      } else {
        query += 'chapter_id = ? AND line_number IS NULL';
        // Gizli yorumları filtrele
        if (userId) {
          query += ' AND (is_hidden = 0 OR user_id = ?)';
          queryParams = [chapterId, userId, limit, offset];
        } else {
          query += ' AND is_hidden = 0';
          queryParams = [chapterId, limit, offset];
        }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      }
    } else {
      query += 'book_id = ? AND chapter_id IS NULL AND line_number IS NULL';
      // Gizli yorumları filtrele
      if (userId) {
        query += ' AND (is_hidden = 0 OR user_id = ?)';
        queryParams = [bookId, userId, limit, offset];
      } else {
        query += ' AND is_hidden = 0';
        queryParams = [bookId, limit, offset];
      }
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    }
    
    const comments = await executeQuery(query, queryParams);

    return paginatedResponse(comments, total, limit, offset, {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString()
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return errorResponse('Failed to fetch comments');
  }
}

// POST: Yorum ekle
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

    let { bookId, chapterId, userName, userEmail, userId, content, lineNumber, parentId } = await request.json();
    
    if ((!bookId && !chapterId) || !content) {
      return validationErrorResponse(['BookId or chapterId and content are required']);
    }

    // Slug ise ID'ye çevir
    if (bookId && !/^\d+$/.test(bookId.toString())) {
      const books = await executeQuery('SELECT id FROM books WHERE slug = ?', [bookId]) as any[];
      if (books.length === 0) {
        return errorResponse('Book not found', 404);
      }
      bookId = books[0].id;
    }

    if (chapterId && !/^\d+$/.test(chapterId.toString())) {
      const chapters = await executeQuery('SELECT id FROM chapters WHERE slug = ?', [chapterId]) as any[];
      if (chapters.length === 0) {
        return errorResponse('Chapter not found', 404);
      }
      chapterId = chapters[0].id;
    }

    // Input validation
    const sanitizedContent = Validator.sanitizeInput(content);
    const sanitizedUserName = userName ? Validator.sanitizeInput(userName) : 'Anonim';
    const sanitizedEmail = userEmail ? Validator.sanitizeInput(userEmail) : '';
    
    // 1. Rate limiting kontrolü (IP bazlı akıllı kontrol)
    const rateLimitCheck = CommentRateLimiter.canComment(clientIP, sanitizedContent);
    if (!rateLimitCheck.allowed) {
      console.log('⏱️ Rate limit aşıldı:', {
        ip: clientIP,
        reason: rateLimitCheck.reason,
        waitTime: rateLimitCheck.waitTime
      });
      
      return NextResponse.json({
        success: false,
        error: rateLimitCheck.reason || 'Çok fazla yorum yazıyorsunuz'
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitCheck.waitTime?.toString() || '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + (rateLimitCheck.waitTime || 60) * 1000).toString()
        }
      });
    }
    
    // 2. Spam tespiti
    const spamCheck = SpamDetector.checkSpam(sanitizedContent, sanitizedUserName, sanitizedEmail);
    const commentStatus = SpamDetector.determineStatus(spamCheck);
    
    // Spam logla
    if (spamCheck.isSpam) {
      console.log('🚫 Spam yorum tespit edildi:', {
        ip: clientIP,
        score: spamCheck.score,
        reasons: spamCheck.reasons,
        content: sanitizedContent.substring(0, 50) + '...'
      });
    }
    
    if (sanitizedContent.length < 3 || sanitizedContent.length > 1000) {
      return validationErrorResponse(['Comment must be between 3 and 1000 characters']);
    }

    // Browser fingerprint oluştur
    const { IPBanDetector } = await import('@/lib/ip-ban-detector');
    const fingerprint = IPBanDetector.createFingerprint(request.headers);
    const subnet = IPBanDetector.getSubnet(clientIP);
    
    // IP ban kontrolü (IP, subnet veya fingerprint)
    const bannedCheck = await executeQuery(
      'SELECT id, reason FROM banned_ips WHERE ip_address = ? OR subnet = ? OR fingerprint = ?',
      [clientIP, subnet, fingerprint]
    );
    
    if (bannedCheck && bannedCheck.length > 0) {
      return errorResponse(`Bu IP adresi yasaklanmıştır. Sebep: ${bannedCheck[0].reason || 'Belirtilmemiş'}`, 403);
    }
    
    // Şüpheli aktivite skoru hesapla
    const suspicionScore = await IPBanDetector.calculateSuspicionScore(clientIP, fingerprint, executeQuery);
    const banDecision = IPBanDetector.shouldBan(suspicionScore);
    
    // Otomatik ban (score >= 70)
    if (banDecision.autoBan) {
      await executeQuery(
        'INSERT INTO banned_ips (ip_address, subnet, fingerprint, reason, auto_banned, suspicion_score, banned_by, created_at) VALUES (?, ?, ?, ?, 1, ?, ?, NOW())',
        [clientIP, subnet, fingerprint, `Otomatik ban - Şüpheli aktivite skoru: ${suspicionScore}`, suspicionScore, 'system']
      );
      return errorResponse('Şüpheli aktivite tespit edildi. IP adresiniz otomatik olarak yasaklandı.', 403);
    }

    // Yorum ekle - spam tespiti + IP + fingerprint + parent_id
    const insertQuery = `
      INSERT INTO comments (book_id, chapter_id, user_name, user_email, user_id, user_ip, user_fingerprint, content, line_number, parent_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await executeQuery(insertQuery, [
      bookId || null,
      chapterId || null,
      sanitizedUserName,
      sanitizedEmail,
      userId || null,
      clientIP, // IP adresini kaydet
      fingerprint, // Fingerprint kaydet
      sanitizedContent,
      lineNumber !== undefined ? lineNumber : null,
      parentId || null, // Parent comment ID
      commentStatus // 'approved', 'pending', veya 'spam'
    ]);

    const commentId = (result as any).insertId;

    return successResponse(
      { id: commentId, bookId, chapterId, content: sanitizedContent, user_name: sanitizedUserName },
      'Comment added successfully',
      {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    );
  } catch (error) {
    console.error('Error adding comment:', error);
    return errorResponse('Failed to add comment');
  }
}
