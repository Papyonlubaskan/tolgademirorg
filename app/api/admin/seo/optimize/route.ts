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

    const optimizations: any[] = [];
    let totalOptimizations = 0;

    // 1. Kitapların meta description kontrolü ve optimizasyonu
    try {
      const books = await executeQuery(
        'SELECT id, title, description FROM books WHERE status = ?',
        ['published']
      );

      for (const book of books) {
        let updated = false;
        const updates: string[] = [];
        const params: any[] = [];

        // Meta description kontrolü (150-160 karakter arası ideal)
        if (!book.description || book.description.length < 120) {
          const authorInfo = 'Yazar Tolga Demir';
          const optimizedDesc = book.description 
            ? `${book.description} ${authorInfo} tarafından kaleme alınan bu eser, okuyucuları farklı bir dünyaya taşıyor.`.substring(0, 160)
            : `${book.title} - ${authorInfo} tarafından yazılmış etkileyici bir eser. Keşfetmek için okumaya başlayın!`;
          
          updates.push('description = ?');
          params.push(optimizedDesc);
          updated = true;
          
          optimizations.push({
            type: 'meta_description',
            target: `Kitap: ${book.title}`,
            action: 'Meta açıklama optimize edildi',
            before: book.description?.length || 0,
            after: optimizedDesc.length
          });
        }

        // Güncelleme varsa uygula
        if (updated) {
          params.push(book.id);
          await executeQuery(
            `UPDATE books SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
          totalOptimizations++;
        }
      }
    } catch (error) {
      console.error('Books SEO optimization error:', error);
    }

    // 2. Bölümlerin SEO kontrolü
    try {
      const chapters = await executeQuery(
        'SELECT id, title, content FROM chapters LIMIT 100',
        []
      );

      for (const chapter of chapters) {
        // Başlık kontrolü (60 karakter altı ideal)
        if (chapter.title && chapter.title.length > 60) {
          const optimizedTitle = chapter.title.substring(0, 57) + '...';
          
          await executeQuery(
            'UPDATE chapters SET title = ? WHERE id = ?',
            [optimizedTitle, chapter.id]
          );
          
          optimizations.push({
            type: 'chapter_title',
            target: `Bölüm: ${chapter.title}`,
            action: 'Başlık uzunluğu optimize edildi',
            before: chapter.title.length,
            after: optimizedTitle.length
          });
          
          totalOptimizations++;
        }
      }
    } catch (error) {
      console.error('Chapters SEO optimization error:', error);
    }

    // 3. Genel SEO önerileri
    const recommendations = [
      {
        title: 'Yazar Bilgileri',
        description: 'Tolga Demir - Türk edebiyatının önemli isimlerinden biri. Romanları ve hikayeleriyle okuyucuları derinden etkiliyor.',
        priority: 'high'
      },
      {
        title: 'Anahtar Kelimeler',
        description: 'Tolga Demir, Türk yazar, roman, hikaye, edebiyat, kitap, okuma, Türk edebiyatı',
        priority: 'high'
      },
      {
        title: 'Site Başlığı',
        description: 'Tolga Demir - Yazar | Kitaplar, Romanlar ve Hikayeler',
        priority: 'high'
      },
      {
        title: 'Canonical URL',
        description: 'Tüm sayfalarda canonical URL tanımlı',
        priority: 'medium'
      },
      {
        title: 'Open Graph',
        description: 'Sosyal medya paylaşımları için OG etiketleri eklenebilir',
        priority: 'medium'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        message: `SEO optimizasyonu tamamlandı! ${totalOptimizations} iyileştirme yapıldı.`,
        timestamp: new Date().toISOString(),
        totalOptimizations,
        optimizations,
        recommendations,
        authorInfo: {
          name: 'Tolga Demir',
          profession: 'Yazar',
          focus: 'Roman ve Hikaye',
          description: 'Türk edebiyatının değerli isimlerinden Tolga Demir, romanları ve hikayeleriyle okuyucuları farklı dünyalara taşıyor. Eserleri, derin psikolojik analizler ve etkileyici anlatımlarıyla dikkat çekiyor.'
        }
      }
    });
  } catch (error) {
    console.error('SEO optimization error:', error);
    return NextResponse.json(
      { success: false, error: 'SEO optimizasyonu hatası' },
      { status: 500 }
    );
  }
}

