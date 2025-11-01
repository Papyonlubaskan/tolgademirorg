'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getIdFromSlug, createSlug, createChapterSlug } from '@/lib/utils';
import CommentSystem from '@/components/CommentSystem';

interface ChapterReaderProps {
  bookId: string;
  chapterId: string;
}

export default function ChapterReader({ bookId, chapterId }: ChapterReaderProps) {
  const [book, setBook] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChapterData();
  }, [bookId, chapterId]);

  const loadChapterData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Kitap detayını getir
      const bookResponse = await fetch(`/api/books/${bookId}`);
      if (!bookResponse.ok) {
        throw new Error('Kitap bulunamadı');
      }
      const bookData = await bookResponse.json();
      if (!bookData.success || !bookData.data) {
        throw new Error('Kitap bulunamadı');
      }
      setBook(bookData.data);

      // Bölüm detayını getir (slug veya ID ile)
      const chapterResponse = await fetch(`/api/chapters/${chapterId}`);
      if (!chapterResponse.ok) {
        throw new Error('Bölüm bulunamadı');
      }
      const chapterData = await chapterResponse.json();
      if (!chapterData.success || !chapterData.data) {
        throw new Error('Bölüm bulunamadı');
      }
      setChapter(chapterData.data);

      // Tüm bölümleri getir (düzeltildi: doğru endpoint)
      const chaptersResponse = await fetch(`/api/chapters?bookId=${bookData.data.id}`);
      if (chaptersResponse.ok) {
        const chaptersResult = await chaptersResponse.json();
        if (chaptersResult.success && chaptersResult.data) {
          setChapters(chaptersResult.data);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading chapter data:', error);
      setError('Bölüm yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      contentRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const resetFontSize = () => {
    setFontSize(16);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Bölüm yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <div className="text-6xl text-orange-500 mb-4">📖</div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Bölüm Bulunamadı</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Aradığınız bölüm bulunamadı veya kaldırılmış olabilir.
              </p>
              <Link 
                href={`/kitaplar/${createSlug(book?.title || '')}`}
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Kitaba Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/kitaplar/${createSlug(book.title)}`}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                <span className="hidden sm:inline">Kitaba Dön</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate max-w-xs sm:max-w-md">
                  {book.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bölüm {chapter.order_number || 1}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={decreaseFontSize}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                title="Yazı boyutunu küçült"
              >
                <i className="ri-text-decrease"></i>
              </button>
              <button
                onClick={resetFontSize}
                className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                title="Yazı boyutunu sıfırla"
              >
                {fontSize}px
              </button>
              <button
                onClick={increaseFontSize}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                title="Yazı boyutunu büyüt"
              >
                <i className="ri-text-increase"></i>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
              >
                <i className={isFullscreen ? "ri-fullscreen-exit-line" : "ri-fullscreen-line"}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div 
          ref={contentRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 prose prose-lg max-w-none dark:prose-invert overflow-y-auto"
          style={{ fontSize: `${fontSize}px`, maxHeight: isFullscreen ? '100vh' : 'none' }}
        >
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">
            {chapter.title}
          </h1>
          
          <div 
            className="text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: chapter.content || '<p>İçerik mevcut değil.</p>' 
            }}
          />
        </div>

        {/* Navigation */}
        {chapters.length > 0 && (
          <div className="mt-8 flex justify-between">
            <div className="flex-1">
              {/* Previous Chapter */}
              {(() => {
                const prevChapter = chapters.find(c => c.order_number === chapter.order_number - 1);
                return prevChapter ? (
                  <Link
                    href={`/kitaplar/${createSlug(book.title)}/chapter/${prevChapter.slug || prevChapter.id}`}
                    className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <i className="ri-arrow-left-line mr-2"></i>
                    Önceki Bölüm
                  </Link>
                ) : null;
              })()}
            </div>

            <div className="flex-1 text-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Bölüm {chapter.order_number} / {chapters.length}
              </span>
            </div>

            <div className="flex-1 text-right">
              {/* Next Chapter */}
              {(() => {
                const nextChapter = chapters.find(c => c.order_number === chapter.order_number + 1);
                return nextChapter ? (
                  <Link
                    href={`/kitaplar/${createSlug(book.title)}/chapter/${nextChapter.slug || nextChapter.id}`}
                    className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Sonraki Bölüm
                    <i className="ri-arrow-right-line ml-2"></i>
                  </Link>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* Comment System */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <CommentSystem chapterId={chapter.id?.toString()} />
        </div>
      </div>
    </div>
  );
}