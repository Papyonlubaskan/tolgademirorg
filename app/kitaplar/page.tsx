'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Footer from '../../components/Footer';
import BookFilters from '../../components/BookFilters';
import LikeButton from '../../components/LikeButton';
import ImageWithFallback from '../../components/ImageWithFallback';
import { createBookSlug, createSlug } from '@/lib/utils';

function BooksPageContent() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<{[key: string]: number}>({});
  const [likeCounts, setLikeCounts] = useState<{[key: string]: number}>({});
  const [userLikes, setUserLikes] = useState<{[key: string]: boolean}>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 6, // Daha az kitap yükle
    offset: 0,
    hasMore: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchParams = useSearchParams();

  useEffect(() => {
    // Kullanıcı ID'sini oluştur (sessionStorage kullan)
    let userId = sessionStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('user_id', userId);
    }
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    // URL parametreleri değiştiğinde kitapları yükle
    loadBooksData();
  }, [searchParams]);

  useEffect(() => {
    if (currentUserId) {
      loadLikes();
    }
  }, [currentUserId, books]);

  const loadBooksData = async () => {
    try {
      setLoading(true);
      
      // URL parametrelerini al
      const query = searchParams.get('q') || '';
      const category = searchParams.get('category') || '';
      const status = searchParams.get('status') || 'published';
      const sortBy = searchParams.get('sortBy') || 'created_at';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const dateRange = searchParams.get('dateRange') || '';
      const limit = searchParams.get('limit') || '12';
      const offset = searchParams.get('offset') || '0';
      
      setSearchQuery(query);
      
      // API parametrelerini oluştur
      const params = new URLSearchParams({
        status,
        sortBy,
        sortOrder,
        limit,
        offset
      });
      
      if (query) {
        params.set('q', query);
      }
      if (category) {
        params.set('category', category);
      }
      if (dateRange) {
        params.set('dateRange', dateRange);
      }
      
      // MySQL API'den kitapları çek
      const response = await fetch(`/api/books?${params.toString()}`);
      
      if (!response.ok) {
        setBooks([]);
        setLoading(false);
        return;
      }
      
      const result = await response.json();
      const booksData = result.success ? result.data : [];
      const filteredBooks = booksData;
      
      // Pagination bilgisini güncelle
      setPagination({
        total: result.pagination?.total || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.pagination?.hasMore || false
      });

      // Sıralama (API'de yapılıyor ama client-side fallback)
      filteredBooks.sort((a: any, b: any) => {
        switch (sortBy) {
          case 'title':
            return sortOrder === 'asc' 
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title);
          case 'created_at':
          default:
            return sortOrder === 'asc'
              ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
      
      // Pagination
      const offsetNum = parseInt(offset);
      const limitNum = parseInt(limit);
      const paginatedBooks = filteredBooks.slice(offsetNum, offsetNum + limitNum);
      
      setBooks(paginatedBooks);
      setPagination({
        total: filteredBooks.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < filteredBooks.length
      });
    } catch (error) {
      console.error('Error loading books:', error);
      // Fallback: Static sample data
      setBooks([
        {
          id: 1,
          title: "Gizli Bahçe",
          slug: "gizli-bahce",
          description: "Derin sırlarla dolu, mistik bir bahçenin hikayesi.",
          cover_image: "https://readdy.ai/api/search-image?query=Mystical%20secret%20garden%20book%20cover&width=400&height=600&seq=book1&orientation=portrait",
          author: "Tolga Demir",
          category: "Roman",
          status: "published"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadLikes = async () => {
    if (books.length === 0) return;
    
    try {
      // Her kitap için ayrı ayrı like bilgilerini al
      const likesData: {[key: string]: number} = {};
      const userLikesData: {[key: string]: boolean} = {};
      
      await Promise.all(
        books.map(async (book: any) => {
          try {
            const response = await fetch(`/api/likes?bookId=${book.id}`);
            const result = await response.json();
            
            if (result.success && result.data) {
              likesData[book.id] = result.data.likeCount || 0;
              userLikesData[book.id] = result.data.isLiked || false;
            }
          } catch (err) {
            console.error(`Like yüklenemedi (${book.id}):`, err);
          }
        })
      );
      
      setLikeCounts(likesData);
      setUserLikes(userLikesData);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleLike = async (bookId: string) => {
    if (!currentUserId) return;

    try {
      const isCurrentlyLiked = userLikes[bookId];
      
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: bookId,
          action: 'like'
        }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Local state'i güncelle
        setUserLikes(prev => ({
          ...prev,
          [bookId]: result.data.isLiked
        }));
        
        setLikeCounts(prev => ({
          ...prev,
          [bookId]: result.data.likeCount || 0
        }));
      } else {
        console.error('Like error:', result.error);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleFiltersChange = (filters: any) => {
    // Filtreler URL'de değiştiğinde otomatik olarak yüklenecek
    // loadBooksData() çağrısına gerek yok - useEffect zaten dinliyor
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="pt-20 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Kitaplar yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              Kitaplarım
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Yazdığım kitapları keşfedin ve favorilerinizi bulun
            </p>
            {searchQuery && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  "{searchQuery}" için {books.length} sonuç bulundu
                </p>
              </div>
            )}
          </div>

          {/* Filters */}
          <BookFilters onFiltersChange={handleFiltersChange} />

          {/* Books Grid */}
          {books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <Link href={`/kitaplar/${createSlug(book.title)}`}>
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <ImageWithFallback
                        src={book.cover_image}
                        alt={book.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        quality={75}
                        fallbackTitle={book.title}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div>
                    </div>
                  </Link>
                  
                  <div className="p-6">
                    <Link href={`/kitaplar/${createSlug(book.title)}`}>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {book.title}
                      </h3>
                    </Link>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
                      {book.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span>{book.author}</span>
                      <span>{book.chapters_count || 0} bölüm</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <i className="ri-eye-line mr-1"></i>
                          {book.views || 0}
                        </span>
                      </div>
                      
                      <LikeButton 
                        bookId={book.id.toString()}
                        initialLikes={likeCounts[book.id] || 0}
                        initialIsLiked={userLikes[book.id] || false}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl text-orange-500 mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kitap yok'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                {searchQuery 
                  ? 'Arama kriterlerinize uygun kitap bulunamadı. Farklı terimler deneyin.'
                  : 'Yakında yeni kitaplar eklenecek.'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => window.location.href = '/kitaplar'}
                  className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Filtreleri Temizle
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.hasMore && (
            <div className="text-center">
              <button
                onClick={() => {
                  const newOffset = pagination.offset + pagination.limit;
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('offset', newOffset.toString());
                  window.location.href = `/kitaplar?${params.toString()}`;
                }}
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Daha Fazla Yükle
                <i className="ri-arrow-down-line ml-2"></i>
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BooksPageContent />
    </Suspense>
  );
}