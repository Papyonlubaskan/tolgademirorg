import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // Get analytics data
    const [
      totalBooks,
      totalChapters,
      totalComments,
      totalLikes,
      recentBooks,
      popularBooks
    ] = await Promise.all([
      executeQuery('SELECT COUNT(*) as count FROM books WHERE status = "published"'),
      executeQuery('SELECT COUNT(*) as count FROM chapters'),
      executeQuery('SELECT COUNT(*) as count FROM comments'),
      executeQuery('SELECT COUNT(*) as count FROM likes'),
      executeQuery(`
        SELECT id, title, slug, views, created_at 
        FROM books 
        WHERE status = "published" 
        ORDER BY created_at DESC 
        LIMIT 5
      `),
      executeQuery(`
        SELECT b.id, b.title, b.slug, b.views, COUNT(l.id) as like_count
        FROM books b
        LEFT JOIN likes l ON l.book_id = b.id
        WHERE b.status = "published"
        GROUP BY b.id, b.title, b.slug, b.views
        ORDER BY like_count DESC, b.views DESC
        LIMIT 5
      `)
    ]);

    const analytics = {
      overview: {
        totalBooks: totalBooks[0].count,
        totalChapters: totalChapters[0].count,
        totalComments: totalComments[0].count,
        totalLikes: totalLikes[0].count
      },
      recentBooks,
      popularBooks
    };

    return successResponse(analytics, 'Analitik verileri başarıyla yüklendi');

  } catch (error) {
    console.error('Analytics error:', error);
    return errorResponse('Analitik verileri yüklenirken hata oluştu', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    if (!type || !data) {
      return errorResponse('Tip ve veri gerekli', 400);
    }

    // Store analytics data
    switch (type) {
      case 'page_view':
        await executeQuery(`
          INSERT INTO analytics_events (event_type, page_url, user_agent, ip_address, created_at)
          VALUES ('page_view', ?, ?, ?, NOW())
        `, [data.url, data.userAgent, request.headers.get('x-forwarded-for') || 'unknown']);
        break;

      case 'performance':
        await executeQuery(`
          INSERT INTO analytics_performance (
            page_url, page_load_time, first_contentful_paint, 
            largest_contentful_paint, first_input_delay, 
            cumulative_layout_shift, viewport_width, viewport_height,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          data.url,
          data.metrics.pageLoadTime || null,
          data.metrics.firstContentfulPaint || null,
          data.metrics.largestContentfulPaint || null,
          data.metrics.firstInputDelay || null,
          data.metrics.cumulativeLayoutShift || null,
          data.viewport?.width || null,
          data.viewport?.height || null
        ]);
        break;

      case 'book_view':
        await executeQuery(`
          INSERT INTO analytics_events (event_type, book_id, page_url, created_at)
          VALUES ('book_view', ?, ?, NOW())
        `, [data.bookId, data.url]);
        
        // Update book view count
        await executeQuery(`
          UPDATE books SET views = views + 1 WHERE id = ?
        `, [data.bookId]);
        break;

      default:
        return errorResponse('Bilinmeyen analitik olay tipi', 400);
    }

    return successResponse({ success: true }, 'Analitik verileri başarıyla kaydedildi');

  } catch (error) {
    console.error('Analytics storage error:', error);
    return errorResponse('Analitik verileri kaydedilirken hata oluştu', 500);
  }
}