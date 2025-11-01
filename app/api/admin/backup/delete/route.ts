import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup';
import { requireAdmin } from '@/lib/middleware/admin-auth';

export async function DELETE(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // URL'den yedek adını al
    const url = new URL(request.url);
    const backupName = url.searchParams.get('name');

    if (!backupName) {
      return NextResponse.json(
        { success: false, error: 'Yedek adı belirtilmedi' },
        { status: 400 }
      );
    }

    // Yedeği sil
    const success = await backupManager.deleteBackup(backupName);

    if (success) {
      return NextResponse.json({
        success: true,
        data: {
          message: `${backupName} yedeği başarıyla silindi`,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Yedek silme başarısız oldu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Backup delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Yedek silme hatası' },
      { status: 500 }
    );
  }
}