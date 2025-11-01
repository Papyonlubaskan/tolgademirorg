import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { executeQuery } from '@/lib/database/mysql';

export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // 1. Database Response Time
    const dbStart = Date.now();
    try {
      await executeQuery('SELECT 1', []);
      results.tests.database = {
        status: 'success',
        responseTime: Date.now() - dbStart,
        message: 'Veritabanı bağlantısı hızlı'
      };
    } catch (error) {
      results.tests.database = {
        status: 'error',
        responseTime: Date.now() - dbStart,
        message: 'Veritabanı bağlantı sorunu'
      };
    }

    // 2. Books Query Performance
    const booksStart = Date.now();
    try {
      await executeQuery('SELECT COUNT(*) as total FROM books', []);
      results.tests.booksQuery = {
        status: 'success',
        responseTime: Date.now() - booksStart,
        message: 'Kitap sorguları hızlı'
      };
    } catch (error) {
      results.tests.booksQuery = {
        status: 'error',
        responseTime: Date.now() - booksStart,
        message: 'Kitap sorgu hatası'
      };
    }

    // 3. Comments Query Performance
    const commentsStart = Date.now();
    try {
      await executeQuery('SELECT COUNT(*) as total FROM comments', []);
      results.tests.commentsQuery = {
        status: 'success',
        responseTime: Date.now() - commentsStart,
        message: 'Yorum sorguları hızlı'
      };
    } catch (error) {
      results.tests.commentsQuery = {
        status: 'error',
        responseTime: Date.now() - commentsStart,
        message: 'Yorum sorgu hatası'
      };
    }

    // 4. Overall Performance Score
    const successTests = Object.values(results.tests).filter((test: any) => test.status === 'success');
    const totalTime = successTests.reduce((sum: any, test: any) => Number(sum) + (Number(test.responseTime) || 0), 0);
    const avgResponseTime = successTests.length > 0 ? Number(totalTime) / Number(successTests.length) : 0;

    let performanceScore = 100;
    if (avgResponseTime > 1000) performanceScore = 50;
    else if (avgResponseTime > 500) performanceScore = 70;
    else if (avgResponseTime > 100) performanceScore = 85;

    results.overallScore = performanceScore;
    results.averageResponseTime = Math.round(avgResponseTime);
    results.message = `Performans skoru: ${performanceScore}/100. Ortalama yanıt süresi: ${Math.round(avgResponseTime)}ms`;

    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Performance test error:', error);
    return NextResponse.json(
      { success: false, error: 'Performans testi hatası' },
      { status: 500 }
    );
  }
}

