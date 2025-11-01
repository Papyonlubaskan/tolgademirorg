import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: Detaylı istatistikler
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, all

    // Zaman aralığını belirle
    let dateFilter = '';
    if (period === '7d') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === '30d') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === '90d') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
    }

    // Toplam görüntülenme
    const viewsResult = await executeQuery(
      `SELECT SUM(views) as total FROM books WHERE 1=1 ${dateFilter}`,
      []
    ) as any[];
    const totalViews = viewsResult[0]?.total || 0;

    // Toplam beğeni
    const likesResult = await executeQuery(
      `SELECT COUNT(*) as total FROM likes WHERE 1=1 ${dateFilter}`,
      []
    ) as any[];
    const totalLikes = likesResult[0]?.total || 0;

    // Toplam yorum
    const commentsResult = await executeQuery(
      `SELECT COUNT(*) as total FROM comments WHERE 1=1 ${dateFilter}`,
      []
    ) as any[];
    const totalComments = commentsResult[0]?.total || 0;

    // En popüler kitaplar
    const popularBooks = await executeQuery(
      `SELECT b.id, b.title, b.slug, b.views, COUNT(l.id) as like_count
       FROM books b
       LEFT JOIN likes l ON l.book_id = b.id
       WHERE b.status = 'published'
       GROUP BY b.id, b.title, b.slug, b.views
       ORDER BY b.views DESC, like_count DESC
       LIMIT 10`,
      []
    );

    // Günlük trendler
    const dailyTrends = await executeQuery(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as events
       FROM analytics_events
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      []
    );

    return successResponse({
      overview: {
        totalViews,
        totalLikes,
        totalComments,
        period
      },
      popularBooks,
      dailyTrends
    }, 'Stats retrieved successfully');

  } catch (error) {
    console.error('Stats fetch error:', error);
    return errorResponse('Failed to fetch stats', 500);
  }
}

