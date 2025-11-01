import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: Admin dashboard istatistikleri
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Toplam kitaplar
    const booksResult = await executeQuery(
      'SELECT COUNT(*) as total FROM books',
      []
    ) as any[];
    const totalBooks = booksResult[0]?.total || 0;

    const publishedBooksResult = await executeQuery(
      "SELECT COUNT(*) as total FROM books WHERE status = 'published'",
      []
    ) as any[];
    const publishedBooks = publishedBooksResult[0]?.total || 0;

    // Toplam bölümler
    const chaptersResult = await executeQuery(
      'SELECT COUNT(*) as total FROM chapters',
      []
    ) as any[];
    const totalChapters = chaptersResult[0]?.total || 0;

    // Toplam yorumlar
    const commentsResult = await executeQuery(
      'SELECT COUNT(*) as total FROM comments',
      []
    ) as any[];
    const totalComments = commentsResult[0]?.total || 0;

    const pendingCommentsResult = await executeQuery(
      "SELECT COUNT(*) as total FROM comments WHERE status = 'pending'",
      []
    ) as any[];
    const pendingComments = pendingCommentsResult[0]?.total || 0;

    // Toplam beğeniler
    const likesResult = await executeQuery(
      'SELECT COUNT(*) as total FROM likes',
      []
    ) as any[];
    const totalLikes = likesResult[0]?.total || 0;

    // Toplam mesajlar
    const messagesResult = await executeQuery(
      'SELECT COUNT(*) as total FROM contact_messages',
      []
    ) as any[];
    const totalMessages = messagesResult[0]?.total || 0;

    const unreadMessagesResult = await executeQuery(
      "SELECT COUNT(*) as total FROM contact_messages WHERE status = 'unread'",
      []
    ) as any[];
    const unreadMessages = unreadMessagesResult[0]?.total || 0;

    // Newsletter aboneleri
    const newsletterResult = await executeQuery(
      "SELECT COUNT(*) as total FROM newsletter_subscribers WHERE status = 'active'",
      []
    ) as any[];
    const newsletterSubscribers = newsletterResult[0]?.total || 0;

    // Son 7 gün analytics
    const recentViewsResult = await executeQuery(
      'SELECT SUM(views) as total FROM books WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      []
    ) as any[];
    const recentViews = recentViewsResult[0]?.total || 0;

    return successResponse({
      books: {
        total: totalBooks,
        published: publishedBooks,
        draft: totalBooks - publishedBooks
      },
      chapters: {
        total: totalChapters
      },
      comments: {
        total: totalComments,
        pending: pendingComments,
        approved: totalComments - pendingComments
      },
      likes: {
        total: totalLikes
      },
      messages: {
        total: totalMessages,
        unread: unreadMessages,
        read: totalMessages - unreadMessages
      },
      newsletter: {
        activeSubscribers: newsletterSubscribers
      },
      analytics: {
        recentViews
      }
    }, 'Stats retrieved successfully');

  } catch (error) {
    console.error('Admin stats error:', error);
    return errorResponse('Failed to fetch stats', 500);
  }
}

