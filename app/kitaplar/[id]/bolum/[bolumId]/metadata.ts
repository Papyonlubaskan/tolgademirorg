import { Metadata } from 'next';
import { generateMetaTags, generateStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo';

interface ChapterMetadataProps {
  book: {
    id: string;
    title: string;
    author: string;
  };
  chapter: {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    created_at: string;
    updated_at: string;
  };
}

export function generateChapterMetadata({ book, chapter }: ChapterMetadataProps): Metadata {
  const bookUrl = `https://tolgademir.org/kitaplar/${book.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`;
  const chapterUrl = `${bookUrl}/bolum/${chapter.id}`;
  
  return generateMetaTags({
    title: `${chapter.title} - ${book.title} - Tolga Demir`,
    description: chapter.excerpt || chapter.content.substring(0, 160) + '...',
    keywords: [chapter.title, book.title, book.author, 'Tolga Demir', 'bölüm', 'okuma'],
    url: chapterUrl,
    type: 'article',
    author: book.author,
    publishedTime: chapter.created_at,
    modifiedTime: chapter.updated_at,
    section: 'Kitap Bölümü',
    canonical: chapterUrl
  });
}

export function generateChapterStructuredData({ book, chapter }: ChapterMetadataProps) {
  const bookUrl = `https://tolgademir.org/kitaplar/${book.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`;
  const chapterUrl = `${bookUrl}/bolum/${chapter.id}`;
  
  return generateStructuredData({
    title: chapter.title,
    description: chapter.excerpt || chapter.content.substring(0, 160) + '...',
    url: chapterUrl,
    type: 'article',
    author: book.author,
    publishedTime: chapter.created_at,
    modifiedTime: chapter.updated_at,
    section: 'Kitap Bölümü'
  });
}

export function generateChapterBreadcrumbStructuredData({ book, chapter }: ChapterMetadataProps) {
  const bookUrl = `https://tolgademir.org/kitaplar/${book.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`;
  const chapterUrl = `${bookUrl}/bolum/${chapter.id}`;
  
  return generateBreadcrumbStructuredData([
    { name: 'Ana Sayfa', url: 'https://tolgademir.org' },
    { name: 'Kitaplar', url: 'https://tolgademir.org/kitaplar' },
    { name: book.title, url: bookUrl },
    { name: chapter.title, url: chapterUrl }
  ]);
}
