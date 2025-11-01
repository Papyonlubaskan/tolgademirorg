import { MetadataRoute } from 'next';
import { executeQuery } from '@/lib/database/mysql';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tolgademir.org';
  
  // Static pages - SEO optimized
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kitaplar`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/hakkimda`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/iletisim`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gizlilik-politikasi`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kullanim-kosullari`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kvkk`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  // Dynamic pages - books (fallback to static if DB fails)
  let bookPages: MetadataRoute.Sitemap = [];
  try {
    const books = await executeQuery('SELECT id, slug, created_at, updated_at FROM books WHERE status = "published"');
    bookPages = books.map((book: any) => ({
      url: `${baseUrl}/kitaplar/${book.slug}`,
      lastModified: new Date(book.updated_at || book.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
    console.log(`✅ Sitemap: ${books.length} kitap eklendi`);
  } catch (error) {
    console.error('❌ Sitemap books error:', error);
    // Fallback: Add known books statically
    bookPages = [];
  }

  // Dynamic pages - chapters (fallback to static if DB fails)
  let chapterPages: MetadataRoute.Sitemap = [];
  try {
    const chapters = await executeQuery(
      `SELECT c.id, c.slug, c.updated_at, c.created_at, b.slug as book_slug 
       FROM chapters c 
       JOIN books b ON c.book_id = b.id 
       WHERE c.status = "published" AND b.status = "published" LIMIT 50`
    );
    chapterPages = chapters.map((chapter: any) => ({
      url: `${baseUrl}/kitaplar/${chapter.book_slug}/bolum/${chapter.slug}`,
      lastModified: new Date(chapter.updated_at || chapter.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }));
    console.log(`✅ Sitemap: ${chapters.length} bölüm eklendi`);
  } catch (error) {
    console.error('❌ Sitemap chapters error:', error);
    // Fallback: Add some sample chapters
    chapterPages = [
      {
        url: `${baseUrl}/kitaplar/yarala-sar/bolum/1`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      }
    ];
  }

  const allPages = [...staticPages, ...bookPages, ...chapterPages];
  console.log(`✅ Sitemap generated: ${allPages.length} total pages`);
  
  return allPages;
}
