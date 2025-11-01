import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Uploads dizinindeki dosyaları listele
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const mediaFiles: any[] = [];

    try {
      // Uploads dizinini kontrol et
      await fs.access(uploadsDir);
      
      // Alt dizinleri tara
      const subDirs = ['images', 'documents', 'videos', 'audio'];
      
      for (const subDir of subDirs) {
        const subDirPath = path.join(uploadsDir, subDir);
        
        try {
          await fs.access(subDirPath);
          const files = await fs.readdir(subDirPath);
          
          for (const file of files) {
            const filePath = path.join(subDirPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
              const fileExt = path.extname(file).toLowerCase();
              let fileType = 'unknown';
              
              if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(fileExt)) {
                fileType = 'image';
              } else if (['.pdf', '.doc', '.docx', '.txt'].includes(fileExt)) {
                fileType = 'document';
              } else if (['.mp4', '.avi', '.mov', '.webm'].includes(fileExt)) {
                fileType = 'video';
              } else if (['.mp3', '.wav', '.ogg'].includes(fileExt)) {
                fileType = 'audio';
              }
              
              mediaFiles.push({
                id: `${subDir}-${file}`,
                filename: file,
                file_path: `/uploads/${subDir}/${file}`,
                file_size: stats.size,
                file_type: fileType,
                uploaded_by: 'admin',
                upload_date: stats.birthtime.toISOString(),
                alt_text: file.replace(/\.[^/.]+$/, ''),
                description: '',
                is_public: true,
                usage_count: 0
              });
            }
          }
        } catch (error) {
          // Alt dizin yoksa devam et
          console.log(`${subDir} dizini bulunamadı, devam ediliyor...`);
        }
      }
      
      return NextResponse.json({
        success: true,
        data: mediaFiles
      });
    } catch (error) {
      console.error('Uploads dizini bulunamadı:', error);
      
      return NextResponse.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Media list error:', error);
    return NextResponse.json(
      { success: false, error: 'Medya listeleme hatası' },
      { status: 500 }
    );
  }
}

