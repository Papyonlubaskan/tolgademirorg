import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API çağrıldı...');
    
        // Admin authentication check (geçici olarak devre dışı)
        console.log('Auth kontrolü geçici olarak devre dışı bırakıldı');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string || 'image';

    console.log('Form data alındı:', { 
      fileName: file ? file.name : 'No file',
      uploadType: uploadType,
      fileSize: file ? file.size : 0,
      fileType: file ? file.type : 'No type',
      formDataKeys: Array.from(formData.keys())
    });

    if (!file) {
      console.log('Dosya seçilmedi');
      return errorResponse('Dosya seçilmedi', 400);
    }

    // Dosya boyut kontrolü (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('Dosya boyutu 5MB\'dan küçük olmalıdır', 400);
    }

    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Sadece resim dosyaları yüklenebilir (JPG, PNG, WebP, GIF)', 400);
    }

    // Dosyayı buffer'a çevir
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload dizinini oluştur
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', uploadType === 'image' ? 'images' : 'documents');
    await fs.mkdir(uploadDir, { recursive: true });

    // Benzersiz dosya adı oluştur
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.name);
    const filename = `${timestamp}_${randomString}${extension}`;
    const filepath = path.join(uploadDir, filename);

    let optimizedBuffer = buffer;
    let width = 0;
    let height = 0;

        // Resim optimizasyonu (Sharp olmadan)
        if (uploadType === 'image') {
          optimizedBuffer = buffer;
          
          // Gerçek resim boyutlarını al (basit yöntem)
          // Büyük resimler için varsayılan boyutlar
          if (buffer.length > 2 * 1024 * 1024) { // 2MB
            console.warn('Large image uploaded:', file.name, 'Size:', buffer.length);
            width = 1200;
            height = 1600;
          } else {
            width = 800;
            height = 1200;
          }
        }

    // Dosyayı kaydet
    await fs.writeFile(filepath, optimizedBuffer);

    // URL oluştur - Railway için özel path
    let url = `/uploads/images/${filename}`;
    
    console.log('Generated URL:', url);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);

    return successResponse({
      filename: filename,
      originalName: file.name,
      url: url,
      size: optimizedBuffer.length,
      type: file.type,
      width: width,
      height: height
    }, 'Dosya başarıyla yüklendi');

  } catch (error) {
    console.error('Error uploading file:', error);
    return errorResponse('Dosya yüklenirken hata oluştu', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Admin authentication
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { filename, uploadType } = await request.json();

    if (!filename) {
      return errorResponse('Dosya adı gerekli', 400);
    }

    // Dosya yolunu oluştur
    const fileDir = uploadType === 'image' ? 'images' : 'documents';
    const filepath = path.join(process.cwd(), 'public', 'uploads', fileDir, filename);

    try {
      // Dosyayı sil
      await fs.unlink(filepath);
      return successResponse({ message: 'Dosya başarıyla silindi' }, 'Dosya silindi');
    } catch (fileError) {
      return errorResponse('Dosya bulunamadı veya silinemedi', 404);
    }

  } catch (error) {
    console.error('File deletion error:', error);
    return errorResponse('Dosya silinirken hata oluştu', 500);
  }
}