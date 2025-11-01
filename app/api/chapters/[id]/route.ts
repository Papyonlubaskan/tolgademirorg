import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { Validator } from '@/lib/validations';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse, paginatedResponse, rateLimitResponse } from '@/lib/api-response';

// GET: Belirli bir bölümü getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const chapterId = (await params).id;
    
    // MySQL'den bölümü çek (ID veya slug ile)
    const isNumeric = /^\d+$/.test(chapterId);
    const query = isNumeric 
      ? 'SELECT * FROM chapters WHERE id = ? LIMIT 1'
      : 'SELECT * FROM chapters WHERE slug = ? LIMIT 1';
    const chapters = await executeQuery(query, [chapterId]);
    const chapter = chapters[0];

    if (!chapter) {
      return errorResponse('Bölüm bulunamadı', 404);
    }

    return NextResponse.json({
      success: true,
      data: chapter
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return errorResponse('Failed to fetch chapter', 500);
  }
}

// PUT: Bölümü güncelle (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const chapterId = (await params).id;
    const updateData = await request.json();

    // MySQL'de bölümü güncelle
    const updateQuery = `
      UPDATE chapters 
      SET title = ?, content = ?, order_number = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await executeQuery(updateQuery, [
      updateData.title || '',
      updateData.content || '',
      updateData.order_number || updateData.order || 1,
      chapterId
    ]);

    return NextResponse.json({
      success: true,
      message: 'Chapter updated successfully',
      data: { id: chapterId, ...updateData }
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    return errorResponse('Failed to update chapter', 500);
  }
}

// DELETE: Bölümü sil (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const chapterId = (await params).id;

    // MySQL'den bölümü sil
    const deleteQuery = 'DELETE FROM chapters WHERE id = ?';
    await executeQuery(deleteQuery, [chapterId]);

    return NextResponse.json({
      success: true,
      message: 'Chapter deleted successfully'
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return errorResponse('Failed to delete chapter', 500);
  }
}
