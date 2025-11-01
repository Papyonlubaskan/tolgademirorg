
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../../../components/Footer';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface BookDetailProps {
  bookId: string;
}

export default function BookDetail({ bookId }: BookDetailProps) {
  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newCommentName, setNewCommentName] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [chapterComments, setChapterComments] = useState<{[key: string]: number}>({});
  const [bookLikes, setBookLikes] = useState({ total: 0, isLiked: false });
  const [chapterLikes, setChapterLikes] = useState<{[key: string]: { total: number, isLiked: boolean }}>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Kullanıcı ID'sini oluştur
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', userId);
    }
    setCurrentUserId(userId);
    
    loadBookData();
    loadComments();
  }, [bookId]);

  useEffect(() => {
    if (currentUserId && book) {
      loadBookLikes();
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

      console.log('Loading book data for bookId:', bookId);

      // Güncellenmiş API endpoint'ini kullan
      const booksResponse = await fetch(`/api/books`, {
        headers: {
          },
      });

      if (!booksResponse.ok) {
        console.error('Books API error:', booksResponse.status, booksResponse.statusText);
        throw new Error('Kitap bilgileri yüklenemedi');
      }

      const booksResult = await booksResponse.json();
      console.log('Books API response:', booksResult);
      
      if (!booksResult.success) {
        throw new Error(booksResult.error || 'Kitap bilgileri alınamadı');
      }

      const books = booksResult.data || [];
      const foundBook = books.find((b: any) => b.id.toString() === bookId.toString());
      
      if (foundBook) {
        setBook(foundBook);
        console.log('Book found:', foundBook.title);
        
        // Bölümleri ayrı endpoint'ten yükle
        try {
          const chaptersResponse = await fetch(`/api/chapters?bookId=${foundBook.id}`);
          const chaptersResult = await chaptersResponse.json();
          
          if (chaptersResult.success && chaptersResult.data) {
            const chaptersData = chaptersResult.data;
            setChapters(chaptersData);
            console.log(`Chapters loaded: ${chaptersData.length} chapters`);
            
            // Bölüm yorum sayılarını yükle
            await loadChapterCommentCounts(chaptersData);
          } else {
            console.error('Chapters API error:', chaptersResult.error);
            setChapters([]);
          }
        } catch (chaptersError) {
          console.error('Chapters loading error:', chaptersError);
          setChapters([]);
        }
      } else {
        throw new Error('Kitap bulunamadı');
      }
    } catch (error) {
      console.error('Error loading book data:', error);
      setError(error instanceof Error ? error.message : 'Kitap yüklenirken hata oluştu');
      
      // Fallback kitap verisi
      setBook({
        id: bookId,
        title: "Kitap Yükleniyor...",
        description: "Kitap bilgileri yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.",
        cover_image_url: `https://readdy.ai/api/search-image?query=Book%20cover%20with%20elegant%20design%2C%20professional%20typography%2C%20warm%20colors%2C%20minimalist%20style&width=400&height=600&seq=fallback${bookId}&orientation=portrait`,
        author: "Tolga Demir",
        category: "Genel",
        views: 0,
        publish_date: new Date().toISOString(),
        amazon_link: "",
        dr_link: "",
        idefix_link: "",
        status: "published"
      });
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      
      // Güncellenmiş endpoint ile kitap yorumlarını yükle
      const response = await fetch(`/api/books`, {
        headers: {
          },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Kitap yorumları yüklendi:', result.data?.length || 0);
          setComments(result.data || []);
        } else {
          console.error('Yorumlar yüklenirken hata:', result.error);
          setComments([]);
        }
      } else {
        console.error('Comments API hatası:', response.status, response.statusText);
        setComments([]);
      }
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Bölüm yorum sayılarını yükle - hata durumları için güvenli hale getir
  const loadChapterCommentCounts = async (chaptersData: any[]) => {
    try {
      const commentCounts: {[key: string]: number} = {};
      
      await Promise.allSettled(
        chaptersData.map(async (chapter: any) => {
          try {
            let totalComments = 0;
            
            // Bölüm yorumlarını al
            try {
              const chapterCommentsResponse = await fetch(`/api/books`, {
                headers: {
                  },
              });

              if (chapterCommentsResponse.ok) {
                const chapterResult = await chapterCommentsResponse.json();
                if (chapterResult.success) {
                  totalComments += chapterResult.data?.length || 0;
                }
              }
            } catch (chapterError) {
              console.error(`Chapter comments error for ${chapter.id}:`, chapterError);
            }

            // Satır yorumlarını al
            try {
              const lineCommentsResponse = await fetch(`/api/books`, {
                headers: {
                  },
              });

              if (lineCommentsResponse.ok) {
                const lineResult = await lineCommentsResponse.json();
                if (lineResult.success) {
                  totalComments += lineResult.total || 0;
                }
              }
            } catch (lineError) {
              console.error(`Line comments error for ${chapter.id}:`, lineError);
            }

            commentCounts[chapter.id] = totalComments;
            
          } catch (error) {
            console.error(`Error loading comments for chapter ${chapter.id}:`, error);
            commentCounts[chapter.id] = 0;
          }
        })
      );
      
      setChapterComments(commentCounts);
    } catch (error) {
      console.error('Error loading chapter comment counts:', error);
      setChapterComments({});
    }
  };

  const addComment = async () => {
    if (newComment.trim() && newCommentName.trim()) {
      setCommentLoading(true);
      
      try {
        // API'ye kitap yorumu gönder
        const response = await fetch(`/api/books`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookId: bookId,
            name: newCommentName.trim(),
            comment: newComment.trim(),
            rating: 5,
            userId: localStorage.getItem('user_id') || 'user_' + Date.now(),
            isChapterComment: false // Kitap yorumu olduğunu belirt
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Yeni yorumu listeye ekle (en üste)
            setComments(prevComments => [result.data, ...prevComments]);
            
            // Form temizle
            setNewComment('');
            setNewCommentName('');
            
            console.log('Kitap yorumu başarıyla eklendi ve kaydedildi!');
          } else {
            throw new Error(result.error || 'Yorum eklenirken hata oluştu');
          }
        } else {
          throw new Error('API hatası: ' + response.status);
        }
        
      } catch (error) {
        console.error('Yorum eklenirken hata:', error);
        alert('Yorum eklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setCommentLoading(false);
      }
    }
  };

  const editComment = async (commentId: string, newText: string) => {
    if (!newText.trim()) return;
    
    try {
      const response = await fetch(`/api/books`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: newText.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Yorumu listede güncelle
          setComments(prevComments => 
            prevComments.map(comment => 
              comment.id === commentId 
                ? { ...comment, comment: newText.trim() }
                : comment
            )
          );
          setEditingComment(null);
          setEditCommentText('');
        } else {
          throw new Error(result.error || 'Yorum güncellenirken hata oluştu');
        }
      } else {
        throw new Error('API hatası: ' + response.status);
      }
    } catch (error) {
      console.error('Yorum güncellenirken hata:', error);
      alert('Yorum güncellenirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/books`, {
        method: 'DELETE',
        headers: {
          }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Yorumu listeden kaldır
          setComments(prevComments => 
            prevComments.filter(comment => comment.id !== commentId)
          );
        } else {
          throw new Error(result.error || 'Yorum silinirken hata oluştu');
        }
      } else {
        throw new Error('API hatası: ' + response.status);
      }
    } catch (error) {
      console.error('Yorum silinirken hata:', error);
      alert('Yorum silinirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const startEditing = (comment: any) => {
    setEditingComment(comment);
    setEditCommentText(comment.comment);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const loadBookLikes = async () => {
    try {
      const response = await fetch(`/api/likes?bookId=${bookId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBookLikes({
            total: result.data.totalLikes || 0,
            isLiked: result.data.isLiked || false
          });
        }
      }
    } catch (error) {
      console.error('Error loading book likes:', error);
    }
  };

  const loadChapterLikes = async () => {
    try {
      const likes: {[key: string]: { total: number, isLiked: boolean }} = {};
      
      await Promise.all(
        chapters.map(async (chapter: any) => {
          try {
            const response = await fetch(`/api/likes?chapterId=${chapter.id}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                likes[chapter.id] = {
                  total: result.data.totalLikes || 0,
                  isLiked: result.data.isLiked || false
                };
              }
            }
          } catch (error) {
            console.error(`Error loading likes for chapter ${chapter.id}:`, error);
            likes[chapter.id] = { total: 0, isLiked: false };
          }
        })
      );
      
      setChapterLikes(likes);
    } catch (error) {
      console.error('Error loading chapter likes:', error);
    }
  };

  const handleBookLike = async () => {
    if (!currentUserId) return;
    
    const isCurrentlyLiked = bookLikes.isLiked;
    const currentCount = bookLikes.total;
    
    // Optimistic update
    setBookLikes({
      total: isCurrentlyLiked ? currentCount - 1 : currentCount + 1,
      isLiked: !isCurrentlyLiked
    });
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: bookId,
          action: isCurrentlyLiked ? 'unlike' : 'like'
        })
      });

      if (!response.ok) {
        throw new Error('Beğeni işlemi başarısız');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Beğeni işlemi başarısız');
      }
      
      // API'den dönen güncel veriyi kullan (backend'den kesin sonucu al)
      setBookLikes({
        total: result.data.totalLikes || 0,
        isLiked: result.data.isLiked || false
      });
      
    } catch (error) {
      console.error('Book like işlemi hatası:', error);
      
      // Hata durumunda geri al
      setBookLikes({
        total: currentCount,
        isLiked: isCurrentlyLiked
      });
      
      alert('Beğeni işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  const handleChapterLike = async (chapterId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId) return;
    
    const currentLike = chapterLikes[chapterId] || { total: 0, isLiked: false };
    const isCurrentlyLiked = currentLike.isLiked;
    const currentCount = currentLike.total;
    
    // Optimistic update
    setChapterLikes(prev => ({
      ...prev,
      [chapterId]: {
        total: isCurrentlyLiked ? currentCount - 1 : currentCount + 1,
        isLiked: !isCurrentlyLiked
      }
    }));
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: chapterId,
          action: isCurrentlyLiked ? 'unlike' : 'like'
        })
      });

      if (!response.ok) {
        throw new Error('Beğeni işlemi başarısız');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Beğeni işlemi başarısız');
      }
      
      // API'den dönen güncel veriyi kullan (backend'den kesin sonucu al)
      setChapterLikes(prev => ({
        ...prev,
        [chapterId]: {
          total: result.data.totalLikes || 0,
          isLiked: result.data.isLiked || false
        }
      }));
      
    } catch (error) {
      console.error('Chapter like işlemi hatası:', error);
      
      // Hata durumunda geri al
      setChapterLikes(prev => ({
        ...prev,
        [chapterId]: { total: currentCount, isLiked: isCurrentlyLiked }
      }));
      
      alert('Beğeni işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 dark:border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Kitap yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Kitap bulunamadı</h1>
          <Link href="/books" className="text-orange-600 dark:text-orange-400 hover:underline">
            Kitaplar sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <Link
              href="/books"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Kitaplara Geri Dön
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden sticky top-24">
                <img
                  src={book.cover_image_url || book.cover_image}
                  alt={book.title}
                  className="w-full h-96 object-cover object-top"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
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
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{book.title}</h1>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <i className="ri-book-line mr-1"></i>
                      {chapters.length} Bölüm
                    </span>
                    <span className="flex items-center">
                      <i className="ri-calendar-line mr-1"></i>
                      <span suppressHydrationWarning={true}>
                        {book.publish_date ? new Date(book.publish_date).toLocaleDateString('tr-TR') : 'Tarih yok'}
                      </span>
                    </span>
                    <span className="flex items-center">
                      <i className="ri-chat-3-line mr-1"></i>
                      {commentsLoading ? '...' : comments.length} Yorum
                    </span>
                  </div>

                  {/* Kitap Beğenme Butonu */}
                  <div className="mb-4">
                    <button
                      onClick={handleBookLike}
                      className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-full font-semibold transition-all duration-200 ${
                        bookLikes.isLiked
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                      }`}
                    >
                      <i className={`${bookLikes.isLiked ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
                      <span>{bookLikes.isLiked ? 'Beğenildi' : 'Beğen'}</span>
                      <span className="bg-white px-2 py-1 rounded-full text-xs font-bold">
                        {bookLikes.total}
                      </span>
                    </button>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{book.description}</p>
                  
                  {book.content && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Kitap Hakkında</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{book.content}</p>
                    </div>
                  )}

                  {(book.amazon_link || book.dr_link || book.idefix_link) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Satın Al</h3>
                      <div className="space-y-2">
                        {book.amazon_link && (
                          <a
                            href={book.amazon_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors cursor-pointer whitespace-nowrap"
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
                            className="flex items-center justify-center w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-book-line mr-2"></i>
                            D&R
                          </a>
                        )}
                        {book.idefix_link && (
                          <a
                            href={book.idefix_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-book-line mr-2"></i>
                            İdefix
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Bölümler</h2>
                  
                  {/* Hızlı Erişim Dropdown (5+ bölüm varsa) */}
                  {chapters && chapters.length >= 5 && (
                    <select
                      onChange={(e) => {
                        const selectedChapter = chapters.find((c: any) => c.id.toString() === e.target.value);
                        if (selectedChapter) {
                          window.location.href = `/kitaplar/${book.slug || book.id}/bolum/${selectedChapter.slug || selectedChapter.id}`;
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Hızlı Erişim</option>
                      {chapters && chapters.map((chapter: any, index: number) => (
                        <option key={chapter.id} value={chapter.id}>
                          {chapter?.chapter_number || chapter?.order_number || index + 1}. {chapter?.title || 'Bölüm ' + (index + 1)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                  {chapters && chapters.length > 0 ? (
                  <div className="space-y-4">
                    {chapters && chapters.slice(0, 10).map((chapter: any) => (
                      <div key={chapter.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-4">
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{chapter?.title || 'Başlıksız Bölüm'}</h3>
                              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                                <span className="flex items-center">
                                  <i className="ri-file-text-line mr-1"></i>
                                  Bölüm {chapter?.chapter_number || chapter?.order_number || '?'}
                                </span>
                                {chapter.content && (
                                  <span className="flex items-center">
                                    <i className="ri-character-recognition-line mr-1"></i>
                                    {chapter?.content?.length || 0} karakter
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <i className="ri-chat-3-line mr-1"></i>
                                  {chapter && chapter.id && chapterComments[chapter.id] || 0} Yorum
                                </span>
                              </div>

                              {/* Bölüm Beğeni Butonu */}
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={(e) => chapter && chapter.id && handleChapterLike(chapter.id, e)}
                                  className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-all duration-200 ${
                                    chapter && chapter.id && chapterLikes[chapter.id]?.isLiked
                                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                                  }`}
                                >
                                  <i className={`${chapter && chapter.id && chapterLikes[chapter.id]?.isLiked ? 'ri-heart-fill' : 'ri-heart-line'} text-sm`}></i>
                                  <span className="text-xs font-medium">{chapter && chapter.id && chapterLikes[chapter.id]?.total || 0}</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Oku Butonu - Sağ tarafta */}
                            <div className="flex-shrink-0">
                              <Link
                                href={`/kitaplar/${bookId}/bolum/${chapter?.slug || chapter?.id}`}
                                className="bg-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Oku
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* 10'dan fazla bölüm varsa "Tümünü Göster" butonu */}
                    {chapters && chapters.length > 10 && (
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
                                  {chapter?.order_number || chapter?.chapter_number || index + 11}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-800 dark:text-white">{chapter?.title || 'Başlıksız Bölüm'}</h4>
                                </div>
                              </div>
                              <Link
                                href={`/kitaplar/${bookId}/bolum/${chapter?.slug || chapter?.id}`}
                                className="inline-flex items-center px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
                              >
                                <span>Oku</span>
                                <i className="ri-arrow-right-s-line ml-1"></i>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <i className="ri-file-text-line text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">Henüz Bölüm Yok</h3>
                    <p className="text-gray-400">Bu kitaba henüz bölüm eklenmemiş.</p>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Kitap Hakkında Yorumlar ({commentsLoading ? '...' : comments.length})
                </h3>

                <div className="bg-orange-50 rounded-xl p-6 mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Yorumunuzu Paylaşın</h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="İsminiz"
                      value={newCommentName}
                      onChange={(e) => setNewCommentName(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                      disabled={commentLoading}
                    />
                    <textarea
                      placeholder="Bu kitap hakkında düşüncelerinizi paylaşın..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      maxLength={500}
                      className="w-full h-32 p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg resize-none focus:outline-none focus:border-orange-500 text-sm"
                      disabled={commentLoading}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {newComment.length}/500
                      </span>
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim() || !newCommentName.trim() || commentLoading}
                        className="px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap flex items-center"
                      >
                        {commentLoading ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Kaydediliyor...
                          </>
                        ) : (
                          'Yorum Yap'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {commentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Yorumlar yükleniyor...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {comments.map((comment, index) => (
                      <div key={comment.id || index} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-b-0">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-600 font-semibold text-lg">{comment.name[0]}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-800 dark:text-white">{comment.name}</h4>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <i
                                      key={i}
                                      className={`ri-star-${i < comment.rating ? 'fill' : 'line'} text-sm ${
                                        i < comment.rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    ></i>
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500">{comment.time}</span>
                              </div>
                              
                              {/* Düzenleme ve Silme Butonları */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => startEditing(comment)}
                                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 cursor-pointer"
                                  title="Yorumu Düzenle"
                                >
                                  <i className="ri-edit-line text-sm"></i>
                                </button>
                                <button
                                  onClick={() => deleteComment(comment.id)}
                                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 cursor-pointer"
                                  title="Yorumu Sil"
                                >
                                  <i className="ri-delete-bin-line text-sm"></i>
                                </button>
                              </div>
                            </div>
                            
                            {/* Yorum İçeriği veya Düzenleme Formu */}
                            {editingComment?.id === comment.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  maxLength={500}
                                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-500 text-sm"
                                  rows={3}
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {editCommentText.length}/500
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={cancelEditing}
                                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors cursor-pointer text-sm whitespace-nowrap"
                                    >
                                      İptal
                                    </button>
                                    <button
                                      onClick={() => editComment(comment.id, editCommentText)}
                                      disabled={!editCommentText.trim() || editCommentText.trim() === comment.comment}
                                      className="px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                                    >
                                      Kaydet
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{comment.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!commentsLoading && comments.length === 0 && (
                  <div className="text-center py-8">
                    <i className="ri-chat-3-line text-4xl text-gray-300 mb-4"></i>
                    <h4 className="text-lg font-semibold text-gray-500 mb-2">Henüz Yorum Yok</h4>
                    <p className="text-gray-400">Bu kitap hakkında ilk yorumu siz yapın!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
