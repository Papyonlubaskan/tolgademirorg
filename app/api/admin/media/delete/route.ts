import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // URL'den dosya yolunu al
    const url = new URL(request.url);
    const filePath = url.searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'Dosya yolu belirtilmedi' },
        { status: 400 }
      );
    }

    // Güvenlik kontrolü - yalnızca uploads veya backups dizinindeki dosyaların silinmesine izin ver
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith('/uploads/') && !normalizedPath.startsWith('/backups/')) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz dosya yolu' },
        { status: 403 }
      );
    }

    // Dosyanın tam yolunu oluştur
    const fullPath = path.join(process.cwd(), 'public', normalizedPath);

    try {
      // Dosya var mı kontrol et
      await fs.access(fullPath);
      
      // Dosyayı sil
      await fs.unlink(fullPath);
      
      return NextResponse.json({
        success: true,
        data: {
          message: `${normalizedPath} başarıyla silindi`,
          path: normalizedPath
        }
      });
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      
      return NextResponse.json(
        { success: false, error: 'Dosya bulunamadı veya silinemedi' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Media silme hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Medya silme işlemi başarısız oldu' },
      { status: 500 }
    );
  }
}
