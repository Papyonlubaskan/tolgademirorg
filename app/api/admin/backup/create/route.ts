import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup';
import { requireAdmin } from '@/lib/middleware/admin-auth';

export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Request body'den seçenekleri al
    const body = await request.json();
    const options = {
      includeData: body.includeData !== false,
      includeImages: body.includeImages === true,
      backupName: body.backupName || `maralatmaca-${new Date().toISOString().replace(/[:.]/g, '-')}`
    };

    // Yedek oluştur
    const backupName = await backupManager.createBackup(options);
    
    // Eski yedekleri temizle (maksimum 3 yedek kalsın)
    await backupManager.cleanupOldBackups(3);

    return NextResponse.json({
      success: true,
      data: {
        backupName,
        timestamp: new Date().toISOString(),
        options
      }
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Yedek oluşturma hatası' },
      { status: 500 }
    );
  }
}

