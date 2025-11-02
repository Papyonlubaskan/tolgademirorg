import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { promises as fs } from 'fs';
import path from 'path';

// GET: Görseli serve et (önce dosya sisteminden, yoksa veritabanından)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const filename = (await params).filename;

    // Önce dosya sisteminden dene (hızlı)
    const filepath = path.join(process.cwd(), 'public', 'uploads', 'images', filename);
    
    try {
      const fileBuffer = await fs.readFile(filepath);
      
      // Dosya bulundu, serve et
      const contentType = getContentType(filename);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // 1 yıl cache
        },
      });
    } catch (fsError) {
      console.log(`📁 Dosya sisteminde bulunamadı: ${filename}, veritabanından deneniyor...`);
    }

    // Dosya sisteminde yoksa veritabanından al
    const result = await executeQuery(
      'SELECT file_data, file_type FROM media_files WHERE filename = ? LIMIT 1',
      [filename]
    );

    if (!result || result.length === 0) {
      console.error(`❌ Görsel bulunamadı (ne dosya sisteminde ne veritabanında): ${filename}`);
      return new NextResponse('Image not found', { status: 404 });
    }

    const media = result[0];
    const fileBuffer = media.file_data as Buffer;

    // Görseli dosya sistemine de geri yaz (cache amaçlı)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(filepath, fileBuffer);
      console.log(`✅ Görsel veritabanından dosya sistemine geri yüklendi: ${filename}`);
    } catch (writeError) {
      console.warn(`⚠️ Dosya sistemine yazılamadı (sorun değil):`, writeError);
    }

    // Görseli serve et
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': media.file_type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Source': 'database', // Debug için
      },
    });

  } catch (error) {
    console.error('Media serve error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Content type helper
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

