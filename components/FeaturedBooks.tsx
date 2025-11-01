
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from './ImageWithFallback';

interface Book {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  author: string;
  category: string;
  views: number;
  publish_date: string;
  amazon_link?: string;
  dr_link?: string;
  idefix_link?: string;
}

export default function FeaturedBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [likeCounts, setLikeCounts] = useState<{[key: string]: number}>({});
  const [userLikes, setUserLikes] = useState<{[key: string]: boolean}>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // Kullanıcı ID'sini oluştur
    let userId = sessionStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('user_id', userId);
    }
    setCurrentUserId(userId);
    
    loadFeaturedBooks();
  }, []);

  useEffect(() => {
    if (currentUserId && books.length > 0) {
      loadLikes();
    }
  }, [currentUserId, books]);

  const loadFeaturedBooks = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      // API çağrısı için timeout ve error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 saniye timeout

      const response = await fetch('/api/books?status=published&limit=3&t=' + Date.now(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        cache: 'no-cache' // Her zaman fresh data al
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          // API'den gelen verileri validate et
          const validBooks = result.data.filter((book: any) => 
            book && 
            book.id && 
            book.title && 
            typeof book.title === 'string' &&
            book.title.trim().length > 0
          ).map((book: any) => ({
            id: book.id,
            title: book.title || 'Başlıksız Kitap',
            description: book.description || 'Açıklama mevcut değil.',
            cover_image: book.cover_image || '',
            author: book.author || 'Tolga Demir',
            category: book.category || 'Genel',
            views: typeof book.views === 'number' ? book.views : 0,
            publish_date: book.publish_date || new Date().toISOString(),
            amazon_link: book.amazon_link || '',
            dr_link: book.dr_link || '',
            idefix_link: book.idefix_link || ''
          }));

          if (validBooks.length > 0) {
            setBooks(validBooks);
            return;
          }
        }
      }

      // MySQL API başarısız - kitap gösterme
      console.warn('MySQL API response not successful, no books to display');
      setBooks([]);

    } catch (error) {
      console.warn('MySQL API fetch error, no books to display:', error);
      setHasError(true);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLikes = async () => {
    if (books.length === 0 || !currentUserId) return;
    
    try {
      const likesData: {[key: string]: number} = {};
      const userLikesData: {[key: string]: boolean} = {};
      
      await Promise.all(
        books.map(async (book: Book) => {
          try {
            const response = await fetch(`/api/likes?bookId=${book.id}`);
            const result = await response.json();
            
            if (result.success && result.data) {
              likesData[book.id] = result.data.likeCount || 0;
              userLikesData[book.id] = result.data.isLiked || false;
            }
          } catch (error) {
            console.error(`Error loading likes for book ${book.id}:`, error);
          }
        })
      );
      
      setLikeCounts(likesData);
      setUserLikes(userLikesData);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleLike = async (bookId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId) {
      alert('Beğenmek için lütfen sayfayı yenileyin.');
      return;
    }
    
    const isCurrentlyLiked = userLikes[bookId];
    const action = isCurrentlyLiked ? 'unlike' : 'like';
    const currentCount = likeCounts[bookId] || 0;
    
    // Optimistic update - anında UI'ı güncelle
    const newCount = action === 'like' ? currentCount + 1 : Math.max(0, currentCount - 1);
    setLikeCounts(prev => ({
      ...prev,
      [bookId]: newCount
    }));
    setUserLikes(prev => ({
      ...prev,
      [bookId]: action === 'like'
    }));
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: bookId.toString(),
          action: action
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Sunucudan gelen gerçek değerle güncelle
        setLikeCounts(prev => ({
          ...prev,
          [bookId]: result.data.totalLikes
        }));
        setUserLikes(prev => ({
          ...prev,
          [bookId]: result.data.isLiked
        }));
      } else {
        // Hata olursa eski değere geri dön
        setLikeCounts(prev => ({
          ...prev,
          [bookId]: currentCount
        }));
        setUserLikes(prev => ({
          ...prev,
          [bookId]: isCurrentlyLiked
        }));
        console.error('API hatası:', result.error);
      }
    } catch (error: any) {
      // Hata olursa eski değere geri dön
      setLikeCounts(prev => ({
        ...prev,
        [bookId]: currentCount
      }));
      setUserLikes(prev => ({
        ...prev,
        [bookId]: isCurrentlyLiked
      }));
      console.error('Like error:', error);
    }
  };

  const handleRetry = () => {
    loadFeaturedBooks();
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Öne Çıkan Kitaplar</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Ruhunuza dokunacak, hayata bakış açınızı değiştirecek eserler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gray-50 rounded-2xl p-6 animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-4"></div>
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Kitap yoksa section'ı gösterme
  if (!isLoading && books.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Öne Çıkan Kitaplar</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Ruhunuza dokunacak, hayata bakış açınızı değiştirecek eserler
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <div 
              key={book.id} 
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-400"
              data-product-shop
            >
              {/* Kitap Kapağı */}
              <div className="aspect-[3/4] overflow-hidden relative">
                <ImageWithFallback
                  src={book.cover_image}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                  priority={true}
                  quality={85}
                  fallbackTitle={book.title}
                />
              </div>

              {/* Kitap Bilgileri */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300">
                    <i className="ri-book-line mr-1"></i>
                    {book.category}
                  </span>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <i className="ri-eye-line mr-1"></i>
                    {(book.views || 0).toLocaleString('tr-TR')}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {book.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {book.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <i className="ri-quill-pen-line mr-2"></i>
                    <span>{book.author}</span>
                  </div>
                  <button
                    onClick={(e) => handleLike(book.id, e)}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      userLikes[book.id]
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    <i className={`ri-heart-${userLikes[book.id] ? 'fill' : 'line'} mr-1.5`}></i>
                    {likeCounts[book.id] || 0}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link 
                    href={`/kitaplar/${book.id}`}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 flex items-center justify-center whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-book-open-line mr-2"></i>
                    Kitabı Oku
                  </Link>

                  {/* Satın Alma Linkleri */}
                  {(book.amazon_link || book.dr_link || book.idefix_link) && (
                    <div className="flex space-x-2">
                      {book.amazon_link && (
                        <a
                          href={book.amazon_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-amazon-line mr-1"></i>
                          Amazon
                        </a>
                      )}
                      {book.dr_link && (
                        <a
                          href={book.dr_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-shopping-bag-line mr-1"></i>
                          D&R
                        </a>
                      )}
                      {book.idefix_link && (
                        <a
                          href={book.idefix_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-store-line mr-1"></i>
                          İdefix
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tüm Kitaplar Butonu */}
        <div className="text-center mt-12">
          <Link 
            href="/kitaplar"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:from-gray-900 hover:to-black transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap cursor-pointer"
          >
            <i className="ri-book-2-line mr-3 text-lg"></i>
            Tüm Kitapları Keşfet
            <i className="ri-arrow-right-line ml-3"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
