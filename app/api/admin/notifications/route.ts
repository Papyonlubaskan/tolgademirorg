import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Son yorumlarÄ± bildirim olarak gÃ¶ster
    const commentsQuery = `
      SELECT 
        c.id,
        c.book_id,
        c.chapter_id,
        c.name as user_name,
        c.content,
        c.created_at,
        b.title as book_title
      FROM comments c
      LEFT JOIN books b ON c.book_id = b.id
      ORDER BY c.created_at DESC
      LIMIT ?
    `;
    const comments = await executeQuery(commentsQuery, [limit]);

    // Son beÄŸenileri bildirim olarak gÃ¶ster
    const likesQuery = `
      SELECT 
        l.id,
        l.book_id,
        l.created_at,
        b.title as book_title
      FROM likes l
      LEFT JOIN books b ON l.book_id = b.id
      ORDER BY l.created_at DESC
      LIMIT ?
    `;
    const likes = await executeQuery(likesQuery, [limit]);

    // Bildirimleri birleÅŸtir ve formatla
    const notifications = [
      ...comments.map((c: any) => ({
        id: `comment_${c.id}`,
        type: 'comment',
        title: 'Yeni Yorum',
        message: `${c.user_name || 'Anonim'}: "${(c.content || '').substring(0, 50)}${(c.content || '').length > 50 ? '...' : ''}"`,
        time: c.created_at,
        isRead: false,
        data: {
          commentId: c.id,
          bookId: c.book_id,
          chapterId: c.chapter_id,
          bookTitle: c.book_title
        }
      })),
      ...likes.map((l: any) => ({
        id: `like_${l.id}`,
        type: 'like',
        title: 'Yeni BeÄŸeni',
        message: `"${l.book_title || 'Bir iÃ§erik'}" beÄŸenildi`,
        time: l.created_at,
        isRead: false,
        data: {
          likeId: l.id,
          bookId: l.book_id,
          chapterId: l.chapter_id,
          bookTitle: l.book_title
        }
      }))
    ];

    // Zamana gÃ¶re sÄ±rala
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Limit uygula
    const limitedNotifications = notifications.slice(0, limit);

    // OkunmamÄ±ÅŸ sayÄ±sÄ±nÄ± hesapla
    const unreadCount = limitedNotifications.filter(n => !n.isRead).length;

    return successResponse({
      notifications: limitedNotifications,
      unreadCount,
      total: limitedNotifications.length
    }, 'Notifications retrieved successfully');

  } catch (error) {
    console.error('Notifications error:', error);
    return errorResponse('Failed to fetch notifications', 500);
  }
}

// PUT: Bildirimi okundu olarak iÅŸaretle
export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { notificationId, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      // TÃ¼m bildirimleri okundu iÅŸaretle (ÅŸimdilik sadece frontend'de state gÃ¼ncelleniyor)
      return successResponse({ 
        message: 'All notifications marked as read',
        success: true 
      });
    }

    if (notificationId) {
      // Belirli bildirimi okundu iÅŸaretle
      return successResponse({ 
        message: 'Notification marked as read',
        success: true,
        notificationId 
      });
    }

    return errorResponse('Invalid request', 400);

  } catch (error) {
    console.error('Mark notification read error:', error);
    return errorResponse('Failed to mark notification as read', 500);
  }
}

// DELETE: Bildirimleri sil
export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { notificationIds, deleteAll } = await request.json();

    if (deleteAll) {
      // TÃ¼m bildirimleri sil (ÅŸimdilik sadece frontend'de state gÃ¼ncellenecek)
      return successResponse({ 
        message: 'All notifications deleted',
        success: true,
        deletedAll: true
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return errorResponse('Invalid notification IDs', 400);
    }

    // Bildirimleri sil (ÅŸimdilik sadece frontend'de state gÃ¼ncellenecek)
    return successResponse({ 
      message: `${notificationIds.length} notification(s) deleted`,
      success: true,
      deletedCount: notificationIds.length
    });

  } catch (error) {
    console.error('Delete notifications error:', error);
    return errorResponse('Failed to delete notifications', 500);
  }
}
