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

    // Request body'den yedek adını al
    const body = await request.json();
    const { backupName } = body;

    if (!backupName) {
      return NextResponse.json(
        { success: false, error: 'Yedek adı belirtilmedi' },
        { status: 400 }
      );
    }

    // Yedeği geri yükle
    const success = await backupManager.restoreBackup(backupName);

    if (success) {
      return NextResponse.json({
        success: true,
        data: {
          message: `${backupName} yedeği başarıyla geri yüklendi`,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Yedek geri yükleme başarısız oldu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Backup restore error:', error);
    return NextResponse.json(
      { success: false, error: 'Yedek geri yükleme hatası' },
      { status: 500 }
    );
  }
}

