import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { requireAdmin } from '@/lib/auth';
import { successResponse, errorResponse, rateLimitResponse, notFoundResponse } from '@/lib/api-response';

// DELETE: Yorum sil (Admin veya yorum sahibi)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const commentId = (await params).id;

    // Admin kontrolü
    const adminCheck = await requireAdmin(request);
    const isAdmin = adminCheck?.success === true; // Safely check for true
    
    console.log('🔍 DELETE comment - Admin check:', { 
      adminCheck,
      isAdmin,
      commentId 
    });

    // Yorumu kontrol et
    const checkQuery = 'SELECT id, user_id FROM comments WHERE id = ?';
    const existing = await executeQuery(checkQuery, [commentId]);
    
    if (!existing || existing.length === 0) {
      return notFoundResponse('Comment not found');
    }

    // Admin ise tüm yorumları silebilir
    if (isAdmin) {
      console.log('✅ Admin - tüm yorumları silme yetkisi var');
      // Admin - direkt sil
    } else {
      console.log('⚠️ Normal kullanıcı - sadece kendi yorumunu silebilir');
      
      // userId kontrolü (opsiyonel - body'de gelebilir veya gelmeyebilir)
      let userId: string | undefined;
      try {
        const body = await request.json();
        userId = body.userId;
      } catch (error) {
        userId = undefined;
      }
      
      // Normal kullanıcı - sadece kendi yorumunu silebilir
      const comment = existing[0];
      if (!userId || comment.user_id !== userId) {
        return errorResponse('Yetkiniz yok: Sadece kendi yorumlarınızı silebilirsiniz', 403);
      }
    }

    // Yorumu sil
    const deleteQuery = 'DELETE FROM comments WHERE id = ?';
    await executeQuery(deleteQuery, [commentId]);

    return successResponse(
      null,
      'Comment deleted successfully',
      {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return errorResponse('Failed to delete comment');
  }
}

// PUT: Yorum düzenle veya durumunu güncelle (Admin veya yorum sahibi)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const commentId = (await params).id;
    
    // JSON parse error handling
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return errorResponse('Invalid JSON in request body', 400);
    }
    
    const { userId, content, status, is_hidden, priority, admin_reply } = requestData;
    
    // Admin kontrolü
    const adminCheck = await requireAdmin(request);
    const isAdmin = adminCheck?.success === true;

    // Yorumu kontrol et
    const checkQuery = 'SELECT id, user_id FROM comments WHERE id = ?';
    const existing = await executeQuery(checkQuery, [commentId]);
    
    if (!existing || existing.length === 0) {
      return notFoundResponse('Comment not found');
    }

    const comment = existing[0];

    // İçerik düzenleme (sadece yorum sahibi veya admin)
    if (content) {
      if (!isAdmin && comment.user_id !== userId) {
        return errorResponse('Yetkiniz yok: Sadece kendi yorumlarınızı düzenleyebilirsiniz', 403);
      }
      const updateQuery = 'UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?';
      await executeQuery(updateQuery, [content, commentId]);
      
      return successResponse(
        { id: commentId, content },
        'Comment updated successfully',
        {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      );
    }

    // Gizleme/Gösterme (sadece admin)
    if (is_hidden !== undefined) {
      if (!isAdmin) {
        return errorResponse('Yetkiniz yok: Sadece adminler yorumu gizleyebilir', 403);
      }
      
      const updateQuery = 'UPDATE comments SET is_hidden = ?, updated_at = NOW() WHERE id = ?';
      await executeQuery(updateQuery, [is_hidden ? 1 : 0, commentId]);
      
      return successResponse(
        { id: commentId, is_hidden },
        'Comment visibility updated',
        {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      );
    }

    // Admin yanıtı (sadece admin)
    if (admin_reply !== undefined) {
      if (!isAdmin) {
        return errorResponse('Yetkiniz yok: Sadece adminler yanıt verebilir', 403);
      }
      
      // Admin bilgisini al
      const adminInfo = adminCheck?.user;
      const adminUsername = adminInfo?.name || adminInfo?.email || 'Admin';
      
      const updateQuery = 'UPDATE comments SET admin_reply = ?, admin_reply_by = ?, admin_reply_at = NOW(), updated_at = NOW() WHERE id = ?';
      await executeQuery(updateQuery, [admin_reply, adminUsername, commentId]);
      
      return successResponse(
        { id: commentId, admin_reply, admin_reply_by: adminUsername },
        'Admin yanıtı gönderildi',
        {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      );
    }

    // Durum ve öncelik değiştirme (sadece admin)
    if ((status || priority) && !isAdmin) {
      return errorResponse('Unauthorized: Only admins can change comment status or priority', 403);
    }

    if (status || priority) {
      if (status && !['pending', 'approved', 'rejected', 'spam'].includes(status)) {
        return errorResponse('Invalid status', 400);
      }

      if (priority && !['low', 'normal', 'high'].includes(priority)) {
        return errorResponse('Invalid priority', 400);
      }

      // Yorumu güncelle
      const updates: string[] = [];
      const values: any[] = [];
      
      if (status) {
        updates.push('status = ?');
        values.push(status);
      }
      
      if (priority) {
        updates.push('priority = ?');
        values.push(priority);
      }
      
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(commentId);
        
        const updateQuery = `UPDATE comments SET ${updates.join(', ')} WHERE id = ?`;
        await executeQuery(updateQuery, values);
      }
    }

    return successResponse(
      { id: commentId, status, priority },
      'Comment updated successfully',
      {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    );
  } catch (error) {
    console.error('Error updating comment:', error);
    return errorResponse('Failed to update comment');
  }
}
