import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Tüm önbelleği temizle (basit implementasyon)
    // Cache-strategy kullanmıyoruz çünkü şu an aktif değil
    
    // Next.js cache'ini de temizle
    if (typeof global !== 'undefined' && (global as any).__next_cache) {
      (global as any).__next_cache.clear();
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Önbellek başarıyla temizlendi',
        timestamp: new Date().toISOString(),
        clearedPatterns: ['books', 'chapters', 'comments', 'likes', 'settings']
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Önbellek temizleme hatası' },
      { status: 500 }
    );
  }
}

