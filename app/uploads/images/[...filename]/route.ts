import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.filename.join('/');
    
    console.log('Static file request:', filename);
    
    // Güvenlik kontrolü - sadece images klasöründeki dosyalara erişim
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Dosya yolunu oluştur
    const fullPath = join(process.cwd(), 'public', 'uploads', 'images', filename);
    console.log('Full path:', fullPath);
    
    // Dosya var mı kontrol et
    if (!existsSync(fullPath)) {
      console.log('File not found:', fullPath);
      return new NextResponse('File not found', { status: 404 });
    }

    // Dosyayı oku
    const fileBuffer = await readFile(fullPath);
    console.log('File read successfully, size:', fileBuffer.length);
    
    // Content-Type belirle
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }

    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Static file serve error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
