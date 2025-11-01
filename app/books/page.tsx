
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../../components/Footer';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<{[key: string]: number}>({});
  const [likeCounts, setLikeCounts] = useState<{[key: string]: number}>({});
  const [userLikes, setUserLikes] = useState<{[key: string]: boolean}>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // MySQL'den kullanıcı ID'sini al veya oluştur
    loadBooks();
    
    // 30 saniyede bir yenile
    const interval = setInterval(loadBooks, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (books.length > 0) {
      loadLikes();
    }
  }, [books]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      
      // MySQL API'den kitapları çek
      const response = await fetch('/api/books?limit=100');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const booksData = result.data;
          setBooks(booksData);
          
          // Her kitap için yorum sayısını yükle
          await loadCommentCounts(booksData);
        } else {
          setBooks([]);
        }
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error('Kitaplar yüklenirken hata:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCommentCounts = async (booksData: any[]) => {
    try {
      const counts: {[key: string]: number} = {};
      
      await Promise.all(
        booksData.map(async (book: any) => {
          try {
            const response = await fetch(`/api/books`, {
              headers: {
                },
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                counts[book.id] = result.data?.length || 0;
              }
            }
          } catch (error) {
            console.error(`Error loading comments for book ${book.id}:`, error);
            counts[book.id] = 0;
          }
        })
      );
      
      setCommentCounts(counts);
    } catch (error) {
      console.error('Error loading comment counts:', error);
    }
  };

  const loadLikes = async () => {
    try {
      const likes: {[key: string]: number} = {};
      const userLikeStatus: {[key: string]: boolean} = {};
      
      await Promise.all(
        books.map(async (book: any) => {
          try {
            const response = await fetch(`/api/likes?type=book&targetId=${book.id}`);

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                likes[book.id] = result.data.totalLikes || 0;
                userLikeStatus[book.id] = result.data.isLiked || false;
              }
            }
          } catch (error) {
            console.error(`Error loading likes for book ${book.id}:`, error);
            likes[book.id] = 0;
            userLikeStatus[book.id] = false;
          }
        })
      );
      
      setLikeCounts(likes);
      setUserLikes(userLikeStatus);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleLike = async (bookId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId) return;
    
    const isCurrentlyLiked = userLikes[bookId];
    const currentCount = likeCounts[bookId] || 0;
    
    // Optimistic update
    setUserLikes(prev => ({ ...prev, [bookId]: !isCurrentlyLiked }));
    setLikeCounts(prev => ({ 
      ...prev, 
      [bookId]: isCurrentlyLiked ? currentCount - 1 : currentCount + 1 
    }));
    
    try {
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const url = isCurrentlyLiked 
        ? `/api/books`
        : `/api/books`;
      
      const body = isCurrentlyLiked ? undefined : JSON.stringify({
        type: 'book',
        targetId: bookId,
        userId: currentUserId
      });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });

      if (!response.ok) {
        throw new Error('Beğeni işlemi başarısız');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Beğeni işlemi başarısız');
      }
      
      // Başarı durumunda güncel verileri yükle
      await loadLikes();
      
    } catch (error) {
      console.error('Like işlemi hatası:', error);
      
      // Hata durumunda geri al
      setUserLikes(prev => ({ ...prev, [bookId]: isCurrentlyLiked }));
      setLikeCounts(prev => ({ ...prev, [bookId]: currentCount }));
      
      alert('Beğeni işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="pt-20 pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 dark:border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Kitaplar yükleniyor...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Kitaplarım</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Kaleme aldığım hikayeler, duygular ve hayallerin birleştiği özel koleksiyonum. 
              Her kitap, farklı bir dünyaya açılan kapı.
            </p>
          </div>

          {books.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {books.map((book) => (
                <Link key={book.id} href={`/kitaplar/${book.id}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group">
                    <div className="relative">
                      <img
                        src={book.cover_image_url || book.cover_image}
                        alt={book.title}
                        className="w-full h-80 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            book.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {book.status === 'published' ? 'Yayında' : 'Taslak'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {book.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
                        {book.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center">
                          <i className="ri-calendar-line mr-1"></i>
                          <span suppressHydrationWarning={true}>
                            {book.publish_date ? new Date(book.publish_date).toLocaleDateString('tr-TR') : 'Tarih yok'}
                          </span>
                        </span>
                        <span className="flex items-center">
                          <i className="ri-chat-3-line mr-1"></i>
                          {commentCounts[book.id] || 0} Yorum
                        </span>
                      </div>

                      {/* Beğeni Butonu */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {book.author && (
                            <span className="text-xs text-gray-500">
                              <i className="ri-user-line mr-1"></i>
                              {book.author}
                            </span>
                          )}
                          {book.category && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                              {book.category}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => handleLike(book.id, e)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-all duration-200 ${
                            userLikes[book.id]
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                          }`}
                        >
                          <i className={`${userLikes[book.id] ? 'ri-heart-fill' : 'ri-heart-line'} text-sm`}></i>
                          <span className="text-xs font-medium">{likeCounts[book.id] || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <i className="ri-book-line text-6xl text-gray-300 mb-6"></i>
              <h3 className="text-2xl font-semibold text-gray-500 mb-4">Henüz Kitap Yok</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Yakında burada muhteşem hikayeler yer alacak. 
                İlk kitabımız için bizi takip etmeye devam edin!
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
