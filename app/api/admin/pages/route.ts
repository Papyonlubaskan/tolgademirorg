import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: Tüm sayfaları listele
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // Veritabanından sayfalar
    let dbPages = [];
    try {
      dbPages = await executeQuery(
        'SELECT * FROM pages ORDER BY created_at DESC'
      );
    } catch (error) {
      console.log('Pages table does not exist, returning file-based pages');
    }

    // Mevcut sayfa dosyaları - settings'ten yüklenecek
    const existingPages = [
      {
        id: 'page_home',
        title: 'Ana Sayfa',
        slug: '',
        content: '',
        meta_title: 'Tolga Demir - Türk Edebiyatı Yazarı',
        meta_description: 'Yazar Tolga Demir\'nın resmi web sitesi',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        page_type: 'home'
      },
      {
        id: 'page_hakkimda',
        title: 'Hakkımda',
        slug: 'hakkimda',
        content: '',
        meta_title: 'Hakkımda - Tolga Demir',
        meta_description: 'Yazar Tolga Demir hakkında bilgi',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        page_type: 'about'
      },
      {
        id: 'page_iletisim',
        title: 'İletişim',
        slug: 'iletisim',
        content: '',
        meta_title: 'İletişim - Tolga Demir',
        meta_description: 'Tolga Demir ile iletişime geçin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        page_type: 'contact'
      },
      {
        id: 'page_kitaplar',
        title: 'Kitaplarım',
        slug: 'kitaplar',
        content: '',
        meta_title: 'Kitaplar - Tolga Demir',
        meta_description: 'Tolga Demir\'nın tüm kitapları',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        page_type: 'books'
      },
      {
        id: 'page_gizlilik',
        title: 'Gizlilik Politikası',
        slug: 'gizlilik-politikasi',
        content: '',
        meta_title: 'Gizlilik Politikası',
        meta_description: 'Gizlilik politikası ve veri koruma',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        page_type: 'legal'
      },
      {
        id: 'page_kvkk',
        title: 'KVKK Aydınlatma Metni',
        slug: 'kvkk',
        content: '',
        meta_title: 'KVKK Aydınlatma Metni',
        meta_description: 'Kişisel verilerin korunması',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        page_type: 'legal'
      },
      {
        id: 'page_terms',
        title: 'Kullanım Koşulları',
        slug: 'kullanim-kosullari',
        content: 'Kullanım koşulları',
        meta_title: 'Kullanım Koşulları',
        meta_description: 'Site kullanım koşulları',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        page_type: 'legal'
      }
    ];

    // Her sayfa için settings'ten içerik yükle
    const pagesWithContent = await Promise.all(existingPages.map(async (page) => {
      try {
        const settingsKey = `page_${page.id}`;
        const pageSettings = await executeQuery(
          'SELECT setting_value as value FROM site_settings WHERE setting_key = ?',
          [settingsKey]
        );
        
        if (pageSettings.length > 0) {
          const savedData = JSON.parse(pageSettings[0].value || '{}');
          return { ...page, ...savedData };
        }
      } catch (error) {
        // Settings yoksa varsayılan döndür
      }
      return page;
    }));

    // DB sayfalar + Mevcut dosya sayfaları
    const allPages = [...dbPages, ...pagesWithContent];

    return successResponse(allPages);
  } catch (error) {
    console.error('Pages list error:', error);
    return errorResponse('Sayfalar yüklenemedi', 500);
  }
}

// POST: Yeni sayfa oluştur
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { title, slug, content, meta_title, meta_description, is_active } = await request.json();

    if (!title || !slug) {
      return errorResponse('Başlık ve slug gereklidir', 400);
    }

    const insertQuery = `
      INSERT INTO pages (title, slug, content, meta_title, meta_description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await executeQuery(insertQuery, [
      title,
      slug,
      content || '',
      meta_title || title,
      meta_description || '',
      is_active ? 1 : 0
    ]);

    return successResponse({ message: 'Sayfa oluşturuldu' });
  } catch (error: any) {
    console.error('Page create error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse('Bu slug zaten kullanılıyor', 400);
    }
    return errorResponse('Sayfa oluşturulamadı', 500);
  }
}

