'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../../../components/Footer';
import { getIdFromSlug, createSlug, createChapterSlug, createBookSlug } from '@/lib/utils';
import { loadBooks, loadBookContent, Book, BookContent } from '@/lib/dataManager';

interface BookDetailProps {
  bookId: string;
}

export default function BookDetail({ bookId }: BookDetailProps) {
  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCounts, setCommentCounts] = useState<{[key: string]: number}>({});
  const [chapterComments, setChapterComments] = useState<{[key: string]: any[]}>({});
  const [bookLikes, setBookLikes] = useState<{count: number; isLiked: boolean}>({count: 0, isLiked: false});
  const [chapterLikes, setChapterLikes] = useState<{[key: string]: {count: number; isLiked: boolean}}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [newCommentName, setNewCommentName] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

  useEffect(() => {
    // Kullanıcı ID'sini oluştur
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', userId);
    }
    setCurrentUserId(userId);
    
    loadBookData();
  }, [bookId]);

  useEffect(() => {
    if (currentUserId && book) {
      loadBookLikes();
      loadComments();
    }
  }, [currentUserId, book]);

  useEffect(() => {
    if (currentUserId && chapters.length > 0) {
      loadChapterLikes();
    }
  }, [currentUserId, chapters]);

  const loadBookData = async () => {
    try {
      setLoading(true);
      setError(null);

      // API'den kitap verilerini yükle
      console.log('Kitap yükleniyor, bookId:', bookId);
      
      // Önce ID ile deneyelim
      let response = await fetch(`/api/books/${bookId}`);
      let result = await response.json();
      
      // ID ile bulunamadıysa ve sayısal değilse, tüm kitapları getirip slug ile eşleşeni bulalım
      if (!result.success && isNaN(Number(bookId))) {
        console.log('ID ile bulunamadı, slug ile deneniyor:', bookId);
        const booksResponse = await fetch('/api/books');
        const booksResult = await booksResponse.json();
        
        if (booksResult.success && Array.isArray(booksResult.data)) {
          const bookBySlug = booksResult.data.find((b: any) => 
            b.slug === bookId || createSlug(b.title) === bookId
          );
          
          if (bookBySlug) {
            console.log('Slug ile kitap bulundu:', bookBySlug.title);
            result = { success: true, data: bookBySlug };
          }
        }
      }

      if (result.success && result.data) {
        setBook(result.data);
        
        // Bölümleri ayrı endpoint'ten yükle
        if (result.data.id) {
          try {
            const chaptersResponse = await fetch(`/api/chapters?bookId=${result.data.id}`);
            const chaptersResult = await chaptersResponse.json();
            
            if (chaptersResult.success && chaptersResult.data) {
              // Bölümleri order_number ile sırala
              const sortedChapters = chaptersResult.data.sort((a: any, b: any) => 
                (a.order_number || 0) - (b.order_number || 0)
              );
              setChapters(sortedChapters);
              // Bölüm yorum sayılarını yükle
              loadCommentCounts(sortedChapters);
            }
          } catch (chaptersError) {
            console.error('Chapters loading error:', chaptersError);
            setChapters([]);
          }
        }
        
        // Kitap görüntülenme sayısını artır
        incrementViewCount(result.data.id);
      } else {
        setError('Kitap bulunamadı');
      }

    } catch (error) {
      console.error('Error loading book data:', error);
      // Fallback: localStorage'dan yükle
      try {
        const [booksData, contentData] = await Promise.all([
          loadBooks(),
          loadBookContent(bookId)
        ]);

        const foundBook = Array.isArray(booksData) ? booksData.find((b: any) => b.slug === bookId || b.id == bookId) : null;
        
        if (foundBook) {
          setBook(foundBook);
          // Bölümleri order_number ile sırala
          const chapters = contentData?.chapters || [];
          const sortedChapters = chapters.sort((a: any, b: any) => 
            (a.order_number || 0) - (b.order_number || 0)
          );
          setChapters(sortedChapters);
        } else {
          setError('Kitap bulunamadı');
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setError('Kitap yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      if (!book?.id) return;
      
      const response = await fetch(`/api/comments?bookId=${book.id}&limit=50`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setComments(result.data.map((comment: any) => ({
          id: comment.id,
          name: comment.user_name || 'Anonim',
          content: comment.content,
          created_at: comment.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const loadCommentCounts = async (chaptersData?: any[]) => {
    try {
      const targetChapters = chaptersData || chapters;
      const counts: {[key: string]: number} = {};
      const allChapterComments: {[key: string]: any[]} = {};
      
      console.log('📊 Loading comment counts for chapters:', targetChapters.map(c => c.id));
      
      for (const chapter of targetChapters) {
        try {
          const response = await fetch(`/api/comments?chapterId=${chapter.id}&limit=50`);
          const result = await response.json();
          
          console.log(`📝 Chapter ${chapter.id} comments:`, result);
          
          if (result.success && result.pagination) {
            counts[chapter.id] = result.pagination.total || 0;
          } else {
            counts[chapter.id] = 0;
          }
          
          // Bölüm yorumlarını da kaydet
          if (result.success && result.data) {
            allChapterComments[chapter.id] = result.data;
          } else {
            allChapterComments[chapter.id] = [];
          }
        } catch (error) {
          console.error(`Error loading comments for chapter ${chapter.id}:`, error);
          counts[chapter.id] = 0;
          allChapterComments[chapter.id] = [];
        }
      }
      
      console.log('✅ Comment counts:', counts);
      setCommentCounts(counts);
      setChapterComments(allChapterComments);
    } catch (error) {
      console.error('Error loading comment counts:', error);
    }
  };

  const loadBookLikes = async () => {
    try {
      if (!book?.id || !currentUserId) return;
      
      const response = await fetch(`/api/likes?bookId=${book.id}&userId=${currentUserId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setBookLikes({
          count: result.data.likeCount || 0,
          isLiked: result.data.isLiked || false
        });
      }
    } catch (error) {
      console.error('Error loading book likes:', error);
      setBookLikes({count: 0, isLiked: false});
    }
  };

  const loadChapterLikes = async () => {
    try {
      if (!currentUserId || chapters.length === 0) return;
      
      const likes: {[key: string]: {count: number; isLiked: boolean}} = {};
      
      console.log('❤️ Loading chapter likes for:', chapters.map(c => c.id));
      
      for (const chapter of chapters) {
        try {
          const response = await fetch(`/api/likes?chapterId=${chapter.id}&userId=${currentUserId}`);
          const result = await response.json();
          
          console.log(`❤️ Chapter ${chapter.id} likes:`, result);
          
          if (result.success && result.data) {
            likes[chapter.id] = {
              count: result.data.likeCount || 0,
              isLiked: result.data.isLiked || false
            };
          } else {
            likes[chapter.id] = {count: 0, isLiked: false};
          }
        } catch (error) {
          console.error(`Error loading likes for chapter ${chapter.id}:`, error);
          likes[chapter.id] = {count: 0, isLiked: false};
        }
      }
      
      console.log('✅ Chapter likes:', likes);
      setChapterLikes(likes);
    } catch (error) {
      console.error('Error loading chapter likes:', error);
    }
  };

  const handleLike = async (itemId: string, isBook: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId) {
      alert('Beğenmek için lütfen sayfayı yenileyin.');
      return;
    }
    
    // Mevcut beğeni durumunu al
    const isCurrentlyLiked = isBook ? bookLikes.isLiked : chapterLikes[itemId]?.isLiked;
    const action = isCurrentlyLiked ? 'unlike' : 'like';
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(isBook ? { bookId: itemId } : { chapterId: itemId }),
          action: action
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update like state
        if (isBook) {
          setBookLikes({
            count: result.data.totalLikes,
            isLiked: result.data.isLiked
          });
        } else {
          setChapterLikes(prev => ({
            ...prev,
            [itemId]: {
              count: result.data.totalLikes,
              isLiked: result.data.isLiked
            }
          }));
        }
      } else {
        throw new Error(result.error || 'Beğeni işlemi başarısız');
      }
    } catch (error) {
      console.error('Error handling like:', error);
      alert('Beğeni işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  const incrementViewCount = async (bookId: number) => {
    try {
      // Görüntülenme sayısını artır (session başına 1 kez)
      const viewedBooks = sessionStorage.getItem('viewed_books');
      const viewedList = viewedBooks ? JSON.parse(viewedBooks) : [];
      
      if (!viewedList.includes(bookId)) {
        // API ile views artır
        await fetch(`/api/books/${bookId}/views`, {
          method: 'POST'
        });
        
        // Session'a ekle
        viewedList.push(bookId);
        sessionStorage.setItem('viewed_books', JSON.stringify(viewedList));
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newCommentName.trim() || !book) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id.toString(),
          userName: newCommentName.trim(),
          content: newComment.trim(),
          userId: currentUserId
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add new comment to the list
        const newCommentData = {
          id: result.data.id,
          name: newCommentName.trim(),
          content: newComment.trim(),
          created_at: new Date().toISOString()
        };
        
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        setNewCommentName('');
        
        // Update comment count
        loadCommentCounts();
      } else {
        throw new Error(result.error || 'Yorum gönderilemedi');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Yorum gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Kitap yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <div className="text-6xl text-orange-500 mb-4">📚</div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Kitap Bulunamadı</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Aradığınız kitap bulunamadı veya kaldırılmış olabilir.
              </p>
              <Link 
                href="/kitaplar"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Kitaplara Dön
              </Link>
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
          {/* Kitap Detayları */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="md:flex">
              {/* Kitap Kapağı */}
              <div className="md:w-1/3">
                <div className="aspect-[3/4] md:aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={book.cover_image_url || book.cover_image || '/images/book-placeholder.jpg'}
                    alt={book.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y3ZjhmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5LaXRhcCBLYXBhxJ8xPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
              </div>

              {/* Kitap Bilgileri */}
              <div className="md:w-2/3 p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                    <i className="ri-book-line mr-1"></i>
                    {book.category || 'Genel'}
                  </span>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <i className="ri-eye-line mr-1"></i>
                    {(book.views || 0).toLocaleString('tr-TR')} görüntüleme
                  </div>
                </div>

                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                  {book.title}
                </h1>

                <div className="flex items-center text-gray-600 dark:text-gray-300 mb-6">
                  <i className="ri-quill-pen-line mr-2"></i>
                  <span className="text-lg">{book.author || 'Tolga Demir'}</span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                  {book.description || 'Açıklama mevcut değil.'}
                </p>

                {/* Beğeni Butonu */}
                <div className="flex items-center space-x-4 mb-6">
                  <button
                    onClick={(e) => handleLike(book.id.toString(), true, e)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      bookLikes.isLiked
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <i className={`ri-heart-${bookLikes.isLiked ? 'fill' : 'line'} mr-2`}></i>
                    {bookLikes.count} beğeni
                  </button>
                </div>

                {/* Satın Alma Linkleri */}
                {(book.amazon_link || book.bkm_link || book.dr_link || book.idefix_link) && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Satın Al</h3>
                    <div className="flex flex-wrap gap-3">
                      {book.amazon_link && (
                        <a
                          href={book.amazon_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          <i className="ri-amazon-line mr-2"></i>
                          Amazon
                        </a>
                      )}
                      {book.dr_link && (
                        <a
                          href={book.dr_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          <i className="ri-store-line mr-2"></i>
                          Tamadres
                        </a>
                      )}
                      {book.idefix_link && (
                        <a
                          href={book.idefix_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          <i className="ri-book-line mr-2"></i>
                          BKM Kitap
                        </a>
                      )}
                      {book.bkm_link && (
                        <a
                          href={book.bkm_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                          <i className="ri-book-line mr-2"></i>
                          BKM Kitap (Eski)
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bölümler */}
          {chapters.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Bölümler ({chapters.length})
                </h2>
                
                {/* Hızlı Erişim Dropdown (5+ bölüm varsa) */}
                {chapters.length >= 5 && (
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const selectedChapter = chapters.find(c => c.id.toString() === e.target.value);
                        if (selectedChapter) {
                          window.location.href = `/kitaplar/${book.slug || book.id}/bolum/${selectedChapter.id}`;
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Hızlı Erişim</option>
                      {chapters.map((chapter: any, index: number) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter.order_number || index + 1}. {chapter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* Bölümler Listesi - İlk 10 göster, geri kalanı accordion */}
              <div className="space-y-4">
                {chapters.slice(0, 10).map((chapter: any, index: number) => (
                  <div key={chapter.id} className="space-y-2">
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">
                        {chapter.order_number || index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {chapter.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id);
                            }}
                            className="flex items-center hover:text-orange-500"
                          >
                            <i className="ri-message-3-line mr-1"></i>
                            {commentCounts[chapter.id] || 0} yorum
                          </button>
                          <button
                            onClick={(e) => handleLike(chapter.id.toString(), false, e)}
                            className={`flex items-center ${
                              chapterLikes[chapter.id]?.isLiked
                                ? 'text-red-500'
                                : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                            }`}
                          >
                            <i className={`ri-heart-${chapterLikes[chapter.id]?.isLiked ? 'fill' : 'line'} mr-1`}></i>
                            {chapterLikes[chapter.id]?.count || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/kitaplar/${book.slug || book.id}/bolum/${chapter.id}`}
                      className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <i className="ri-book-open-line mr-2"></i>
                      Oku
                    </Link>
                  </div>
                  
                  {/* Bölüm Yorumları - Açılır/Kapanır */}
                  {expandedChapter === chapter.id && chapterComments[chapter.id] && (
                    <div className="mt-4 pl-12 space-y-3 border-l-2 border-orange-200 dark:border-orange-900">
                      {chapterComments[chapter.id].length > 0 ? (
                        chapterComments[chapter.id].map((comment: any) => (
                          <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                {comment.user_name || 'Anonim'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Henüz yorum yok</p>
                      )}
                    </div>
                  )}
                  </div>
                ))}
                
                {/* 10'dan fazla bölüm varsa "Tümünü Göster" butonu */}
                {chapters.length > 10 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer px-4 py-3 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-lg text-orange-600 dark:text-orange-400 font-medium hover:from-orange-100 hover:to-pink-100 dark:hover:from-orange-900/30 dark:hover:to-pink-900/30 transition-colors text-center">
                      <i className="ri-arrow-down-s-line mr-2"></i>
                      {chapters.length - 10} Bölüm Daha Göster
                    </summary>
                    <div className="space-y-4 mt-4">
                      {chapters.slice(10).map((chapter: any, index: number) => (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">
                              {chapter.order_number || (index + 11)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 dark:text-white">
                                {chapter.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>
                                  <i className="ri-message-3-line mr-1"></i>
                                  {commentCounts[chapter.id] || 0} yorum
                                </span>
                                <button
                                  onClick={(e) => handleLike(chapter.id.toString(), false, e)}
                                  className={`flex items-center ${
                                    chapterLikes[chapter.id]?.isLiked
                                      ? 'text-red-500'
                                      : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                                  }`}
                                >
                                  <i className={`ri-heart-${chapterLikes[chapter.id]?.isLiked ? 'fill' : 'line'} mr-1`}></i>
                                  {chapterLikes[chapter.id]?.count || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/kitaplar/${book.slug || book.id}/bolum/${chapter.id}`}
                            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <i className="ri-book-open-line mr-2"></i>
                            Oku
                          </Link>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Yorumlar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Yorumlar ({comments.length})
            </h2>

            {/* Yorum Formu */}
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newCommentName}
                  onChange={(e) => setNewCommentName(e.target.value)}
                  placeholder="İsminiz"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isSubmittingComment}
                  required
                />
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Yorumunuzu yazın..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isSubmittingComment}
                    required
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || !newCommentName.trim() || isSubmittingComment}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComment ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              </div>
            </form>

            {/* Yorum Listesi */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl text-gray-400 dark:text-gray-600 mb-4">💬</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Henüz yorum yapılmamış. İlk yorumu siz yapın!
                  </p>
                </div>
              ) : (
                comments.map((comment: any) => (
                  <div key={comment.id} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
                        {comment.name?.[0] || 'A'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {comment.name || 'Anonim'}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {comment.created_at ? 
                            new Date(comment.created_at).toLocaleDateString('tr-TR') : 
                            'Tarih bilinmiyor'
                          }
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}