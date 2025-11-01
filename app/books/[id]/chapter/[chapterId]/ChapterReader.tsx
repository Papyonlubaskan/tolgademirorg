
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface ChapterReaderProps {
  bookId: string;
  chapterId: string;
}

export default function ChapterReader({ bookId, chapterId }: ChapterReaderProps) {
  const [chapter, setChapter] = useState<any>(null);
  const [book, setBook] = useState<any>(null);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lineComments, setLineComments] = useState<{ [key: number]: any[] }>({});
  const [newComment, setNewComment] = useState('');
  const [newCommentName, setNewCommentName] = useState('');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [chapterComment, setChapterComment] = useState('');
  const [chapterCommentName, setChapterCommentName] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [lineCommentLoading, setLineCommentLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showMyCommentsOnly, setShowMyCommentsOnly] = useState(false);
  const [showMyLineCommentsOnly, setShowMyLineCommentsOnly] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingLineComment, setEditingLineComment] = useState<any>(null);
  const [editLineCommentText, setEditLineCommentText] = useState('');
  // Beğeni state'leri
  const [chapterLikes, setChapterLikes] = useState({ total: 0, isLiked: false });
  const [lineLikes, setLineLikes] = useState<{[key: number]: { total: number, isLiked: boolean }}>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // ... existing useEffect and state management code ...
  useEffect(() => {
    // Kullanıcı ID'sini oluştur (localStorage'dan al veya yeni oluştur)
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', userId);
    }
    setCurrentUserId(userId);
    
    loadChapterData();
    loadComments();
    loadLineComments();
  }, [bookId, chapterId]);

  useEffect(() => {
    if (currentUserId && chapter) {
      loadChapterLikes();
      loadLineLikes();
    }
  }, [currentUserId, chapter]);

  const loadChapterData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading chapter data for:', { bookId, chapterId });

      // Güncellenmiş API endpoint'ini kullan - önce kitap bilgilerini yükle
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
      
      if (!foundBook) {
        throw new Error('Kitap bulunamadı');
      }

      setBook(foundBook);
      console.log('Book loaded:', foundBook.title);

      // Bölümleri yükle - doğru API endpoint'ini kullan
      try {
        // Önce tüm bölümleri yükle
        const chaptersResponse = await fetch(`/api/chapters?bookId=${bookId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!chaptersResponse.ok) {
          console.error('Chapters API error:', chaptersResponse.status, chaptersResponse.statusText);
          throw new Error('Bölümler yüklenemedi');
        }

        const chaptersResult = await chaptersResponse.json();
        console.log('Chapters API response:', chaptersResult);
        
        if (!chaptersResult.success) {
          throw new Error(chaptersResult.error || 'Bölümler alınamadı');
        }

        const chapters = chaptersResult.data || [];
        
        console.log('Chapters loaded:', chapters.length);
        setAllChapters(chapters);
        
        // Şimdi spesifik bölümü yükle
        const chapterResponse = await fetch(`/api/chapters/${chapterId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!chapterResponse.ok) {
          console.error('Chapter API error:', chapterResponse.status, chapterResponse.statusText);
          throw new Error('Bölüm yüklenemedi');
        }
        
        const chapterResult = await chapterResponse.json();
        console.log('Chapter API response:', chapterResult);
        
        if (!chapterResult.success || !chapterResult.data) {
          console.error('Chapter not found. Available chapters:', chapters.map((c: any) => ({ id: c.id, title: c.title })));
          throw new Error('Bölüm bulunamadı');
        }
        
        const foundChapter = chapterResult.data;

        setChapter(foundChapter);
        console.log('Chapter loaded:', foundChapter.title);
      } catch (chaptersError) {
        console.error('Chapters loading error:', chaptersError);
        throw new Error('Bölümler yüklenirken hata oluştu');
      }

    } catch (error) {
      console.error('Error loading chapter data:', error);
      setError(error instanceof Error ? error.message : 'Bölüm yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      // Sadece bu bölüm için yapılan yorumları yükle
      const response = await fetch(`/api/books`, {
        headers: {
          },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComments(result.data || []);
          console.log('Chapter comments loaded:', result.data?.length || 0);
        } else {
          console.error('Chapter comments error:', result.error);
          setComments([]);
        }
      } else {
        console.error('Chapter comments API error:', response.status, response.statusText);
        setComments([]);
      }
    } catch (error) {
      console.error('Comments loading error:', error);
      setComments([]);
    }
  };

  const loadLineComments = async () => {
    try {
      console.log('Loading line comments for chapter:', chapterId);
      
      const response = await fetch(`/api/books`, {
        headers: {
          },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Line comments loaded:', result.total || 0);
          setLineComments(result.data || {});
        } else {
          console.error('Line comments load error:', result.error);
          setLineComments({});
        }
      } else {
        console.error('Line comments API error:', response.status, response.statusText);
        setLineComments({});
      }
    } catch (error) {
      console.error('Line comments loading error:', error);
      setLineComments({});
    }
  };

  // ... existing helper functions and like management code ...
  const loadChapterLikes = async () => {
    try {
      const response = await fetch(`/api/books`, {
        headers: {
          },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChapterLikes({
            total: result.data.totalLikes || 0,
            isLiked: result.data.isLiked || false
          });
        }
      }
    } catch (error) {
      console.error('Error loading chapter likes:', error);
    }
  };

  const loadLineLikes = async () => {
    if (!chapter?.content) return;
    
    try {
      const lines = chapter.content.split('\n').filter((line: string) => line.trim());
      const likes: {[key: number]: { total: number, isLiked: boolean }} = {};
      
      await Promise.all(
        lines.map(async (_: any, lineIndex: number) => {
          try {
            const response = await fetch(`/api/books`, {
              headers: {
                },
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                likes[lineIndex] = {
                  total: result.data.totalLikes || 0,
                  isLiked: result.data.isLiked || false
                };
              }
            }
          } catch (error) {
            console.error(`Error loading likes for line ${lineIndex}:`, error);
            likes[lineIndex] = { total: 0, isLiked: false };
          }
        })
      );
      
      setLineLikes(likes);
    } catch (error) {
      console.error('Error loading line likes:', error);
    }
  };

  const handleChapterLike = async () => {
    if (!currentUserId) return;
    
    const isCurrentlyLiked = chapterLikes.isLiked;
    const currentCount = chapterLikes.total;
    
    // Optimistic update
    setChapterLikes({
      total: isCurrentlyLiked ? currentCount - 1 : currentCount + 1,
      isLiked: !isCurrentlyLiked
    });
    
    try {
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const url = isCurrentlyLiked 
        ? `/api/books`
        : `/api/books`;
      
      const body = isCurrentlyLiked ? undefined : JSON.stringify({
        type: 'chapter',
        targetId: chapterId,
        bookId: bookId,
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
      await loadChapterLikes();
      
    } catch (error) {
      console.error('Chapter like işlemi hatası:', error);
      
      // Hata durumunda geri al
      setChapterLikes({
        total: currentCount,
        isLiked: isCurrentlyLiked
      });
      
      alert('Beğeni işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  const handleLineLike = async (lineIndex: number, lineText: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId) return;
    
    const currentLike = lineLikes[lineIndex] || { total: 0, isLiked: false };
    const isCurrentlyLiked = currentLike.isLiked;
    const currentCount = currentLike.total;
    
    // Optimistic update
    setLineLikes(prev => ({
      ...prev,
      [lineIndex]: {
        total: isCurrentlyLiked ? currentCount - 1 : currentCount + 1,
        isLiked: !isCurrentlyLiked
      }
    }));
    
    try {
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const url = isCurrentlyLiked 
        ? `/api/books`
        : `/api/books`;
      
      const body = isCurrentlyLiked ? undefined : JSON.stringify({
        type: 'line',
        targetId: chapterId,
        bookId: bookId,
        lineNumber: lineIndex,
        lineText: lineText.substring(0, 100), // İlk 100 karakter
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
      await loadLineLikes();
      
    } catch (error) {
      console.error('Line like işlemi hatası:', error);
      
      // Hata durumunda geri al
      setLineLikes(prev => ({
        ...prev,
        [lineIndex]: { total: currentCount, isLiked: isCurrentlyLiked }
      }));
      
      alert('Beğeni işlemi başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  const toggleComments = (lineIndex: number) => {
    if (selectedLine === lineIndex && showSidebar) {
      setShowSidebar(false);
      setSelectedLine(null);
      setActiveLine(null);
    } else {
      setActiveLine(lineIndex);
      setSelectedLine(lineIndex);
      setShowSidebar(true);
    }
  };

  const addLineComment = async () => {
    if (!newComment.trim() || !newCommentName.trim() || selectedLine === null) return;
    
    setLineCommentLoading(true);
    
    try {
      const lines = chapter.content ? chapter.content.split('\n').filter((line: string) => line.trim()) : [];
      const selectedLineText = lines[selectedLine] || '';
      
      console.log('Adding line comment:', {
        chapterId,
        bookId,
        lineNumber: selectedLine,
        lineText: selectedLineText.substring(0, 100),
        name: newCommentName.trim(),
        comment: newComment.trim(),
        userId: currentUserId
      });
      
      const response = await fetch(`/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: chapterId,
          bookId: bookId,
          lineNumber: selectedLine,
          lineText: selectedLineText,
          name: newCommentName.trim(),
          comment: newComment.trim(),
          rating: 5,
          userId: currentUserId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Line comment added successfully:', result.data);
          
          // Satır yorumlarını güncelle
          setLineComments(prev => {
            const updated = { ...prev };
            if (!updated[selectedLine]) {
              updated[selectedLine] = [];
            }
            updated[selectedLine] = [result.data, ...updated[selectedLine]];
            return updated;
          });
          
          // Form temizle
          setNewComment('');
          setNewCommentName('');
          
        } else {
          throw new Error(result.error || 'Satır yorumu eklenirken hata oluştu');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`API hatası: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Line comment add error:', error);
      alert('Satır yorumu eklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLineCommentLoading(false);
    }
  };

  const addChapterComment = async () => {
    if (!chapterComment.trim() || !chapterCommentName.trim()) return;
    
    setCommentLoading(true);
    
    try {
      console.log('Adding chapter comment:', {
        bookId,
        chapterId,
        name: chapterCommentName.trim(),
        comment: chapterComment.trim(),
        userId: currentUserId
      });
      
      const response = await fetch(`/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: bookId,
          chapterId: chapterId,
          type: 'chapter',
          name: chapterCommentName.trim(),
          comment: chapterComment.trim(),
          rating: 5,
          userId: currentUserId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Chapter comment added successfully:', result.data);
          
          // Yorumu listeye ekle
          setComments(prevComments => [result.data, ...prevComments]);
          
          // Form temizle
          setChapterComment('');
          setChapterCommentName('');
          
        } else {
          throw new Error(result.error || 'Bölüm yorumu eklenirken hata oluştu');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`API hatası: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Chapter comment add error:', error);
      alert('Bölüm yorumu eklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setCommentLoading(false);
    }
  };

  const deleteLineComment = async (commentId: string, lineNumber: number) => {
    if (!window.confirm('Bu satır yorumunu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/books`, {
        method: 'DELETE',
        headers: {
          }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Satır yorumlarından kaldır
          setLineComments(prev => {
            const updated = { ...prev };
            if (updated[lineNumber]) {
              updated[lineNumber] = updated[lineNumber].filter(comment => comment.id !== commentId);
              if (updated[lineNumber].length === 0) {
                delete updated[lineNumber];
              }
            }
            return updated;
          });
          
          console.log('Line comment deleted successfully');
        } else {
          throw new Error(result.error || 'Satır yorumu silinirken hata oluştu');
        }
      } else {
        throw new Error('API hatası: ' + response.status);
      }
    } catch (error) {
      console.error('Line comment delete error:', error);
      alert('Satır yorumu silinirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const editLineComment = async (commentId: string, newText: string, lineNumber: number) => {
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
          // Satır yorumlarını güncelle
          setLineComments(prev => {
            const updated = { ...prev };
            if (updated[lineNumber]) {
              updated[lineNumber] = updated[lineNumber].map(comment => 
                comment.id === commentId 
                  ? { ...comment, comment: newText.trim() }
                  : comment
              );
            }
            return updated;
          });
          setEditingLineComment(null);
          setEditLineCommentText('');
        } else {
          throw new Error(result.error || 'Satır yorumu güncellenirken hata oluştu');
        }
      } else {
        throw new Error('API hatası: ' + response.status);
      }
    } catch (error) {
      console.error('Line comment edit error:', error);
      alert('Satır yorumu güncellenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
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
      console.error('Comment edit error:', error);
      alert('Yorum güncellenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
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
      console.error('Comment delete error:', error);
      alert('Yorum silinirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const startEditingLineComment = (comment: any) => {
    setEditingLineComment(comment);
    setEditLineCommentText(comment.comment);
  };

  const cancelEditingLineComment = () => {
    setEditingLineComment(null);
    setEditLineCommentText('');
  };

  const startEditingComment = (comment: any) => {
    setEditingComment(comment);
    setEditCommentText(comment.comment);
  };

  const cancelEditingComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  // Filtrelenmiş yorumları al - Bölüm yorumları için
  const getFilteredChapterComments = (commentsArray: any[]) => {
    if (!showMyCommentsOnly) return commentsArray;
    return commentsArray.filter(comment => comment.userId === currentUserId);
  };

  // Filtrelenmiş satır yorumları al
  const getFilteredLineComments = (lineNumber: number) => {
    const comments = lineComments[lineNumber] || [];
    if (!showMyLineCommentsOnly) return comments;
    return comments.filter(comment => comment.userId === currentUserId);
  };

  // Satır için toplam yorum sayısını al (filtreleme durumuna göre)
  const getLineCommentCount = (lineNumber: number) => {
    const comments = lineComments[lineNumber] || [];
    if (showMyLineCommentsOnly) {
      return comments.filter(comment => comment.userId === currentUserId).length;
    }
    return comments.length;
  };

  // Navigasyon fonksiyonları
  const getCurrentChapterIndex = () => {
    return allChapters.findIndex(ch => ch.id.toString() === chapterId.toString());
  };

  const getPreviousChapter = () => {
    const currentIndex = getCurrentChapterIndex();
    if (currentIndex > 0) {
      return allChapters[currentIndex - 1];
    }
    return null;
  };

  const getNextChapter = () => {
    const currentIndex = getCurrentChapterIndex();
    if (currentIndex >= 0 && currentIndex < allChapters.length - 1) {
      return allChapters[currentIndex + 1];
    }
    return null;
  };

  // ... existing render logic ...

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 dark:border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Bölüm yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Hata</h2>
            <p>{error}</p>
          </div>
          <Link href={`/books/${bookId}`} className="text-orange-600 hover:underline">
            Kitaba geri dön
          </Link>
        </div>
      </div>
    );
  }

  if (!chapter || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Bölüm bulunamadı</h1>
          <Link href={`/books/${bookId}`} className="text-orange-600 dark:text-orange-400 hover:underline">
            Kitaba geri dön
          </Link>
        </div>
      </div>
    );
  }

  const lines = chapter.content ? chapter.content.split('\n').filter((line: string) => line.trim()) : [];
  const previousChapter = getPreviousChapter();
  const nextChapter = getNextChapter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link 
              href={`/kitaplar/${bookId}`} 
              className="inline-flex items-center text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              {book.title} - Kitaba Geri Dön
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="bg-orange-600 text-white p-6 text-center">
              <h1 className="text-2xl font-bold">{chapter.title}</h1>
              <p className="text-orange-100 mt-2">{book.title}</p>
              
              {/* Bölüm Beğenme Butonu */}
              <div className="mt-4">
                <button
                  onClick={handleChapterLike}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    chapterLikes.isLiked
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <i className={`${chapterLikes.isLiked ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
                  <span>{chapterLikes.isLiked ? 'Beğenildi' : 'Beğen'}</span>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                    {chapterLikes.total}
                  </span>
                </button>
              </div>
            </div>
            
            <div className="p-8" ref={contentRef}>
              {lines.length > 0 ? (
                <div className="prose prose-lg max-w-none">
                  {lines.map((line: string, index: number) => {
                    const commentCount = getLineCommentCount(index);
                    const isSelected = selectedLine === index && showSidebar;
                    const lineLike = lineLikes[index] || { total: 0, isLiked: false };
                    
                    return (
                      <div key={index} className="relative mb-6 group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <p 
                              className={`leading-relaxed text-gray-800 cursor-pointer p-3 rounded transition-colors ${
                                isSelected ? 'bg-orange-100 border-l-4 border-orange-500' : 'hover:bg-orange-50'
                              }`}
                              onClick={() => toggleComments(index)}
                            >
                              {line.trim()}
                            </p>
                          </div>
                          
                          {/* Sağ Taraf - Beğeni ve Yorum Butonları */}
                          <div className="flex-shrink-0 ml-3 mt-3 flex items-center space-x-2">
                            {/* Satır Beğenme Butonu */}
                            <button
                              onClick={(e) => handleLineLike(index, line, e)}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-200 ${
                                lineLike.isLiked
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                              } ${lineLike.total > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                              <i className={`${lineLike.isLiked ? 'ri-heart-fill' : 'ri-heart-line'} text-xs`}></i>
                              <span className="text-xs font-medium">{lineLike.total || ''}</span>
                            </button>
                            
                            {/* Yorum Sayısı Göstergesi - Sadece yorum varsa göster */}
                            {commentCount > 0 && (
                              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md hover:bg-orange-600 transition-colors cursor-pointer"
                                   onClick={() => toggleComments(index)}>
                                {commentCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="ri-file-text-line text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">İçerik Bulunamadı</h3>
                  <p className="text-gray-400">Bu bölümün içeriği henüz eklenmemiş.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bölüm Hakkında Yorumlar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Bu Bölüm Hakkında Yorumlar ({getFilteredChapterComments(comments).length})
              </h3>
              
              {/* Bölüm Yorum Filtresi */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <span className="text-sm text-gray-600">Sadece Benim Yorumlarım</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showMyCommentsOnly}
                    onChange={(e) => setShowMyCommentsOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${showMyCommentsOnly ? 'bg-orange-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${showMyCommentsOnly ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                  </div>
                </div>
              </label>
            </div>

            <div className="bg-orange-50 rounded-xl p-6 mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Bölüm Hakkında Yorumunuzu Paylaşın</h4>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="İsminiz"
                  value={chapterCommentName}
                  onChange={(e) => setChapterCommentName(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  disabled={commentLoading}
                />
                <textarea
                  placeholder="Bu bölüm hakkında düşüncelerinizi paylaşın..."
                  value={chapterComment}
                  onChange={(e) => setChapterComment(e.target.value)}
                  maxLength={500}
                  className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-500 text-sm"
                  disabled={commentLoading}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {chapterComment.length}/500
                  </span>
                  <button
                    onClick={addChapterComment}
                    disabled={!chapterComment.trim() || !chapterCommentName.trim() || commentLoading}
                    className="px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {commentLoading ? 'Kaydediliyor...' : 'Yorum Yap'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {getFilteredChapterComments(comments).map((comment, index) => (
                <div key={comment.id || index} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-semibold text-lg">{comment.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-800">{comment.name}</h4>
                          {comment.userId === currentUserId && (
                            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">Sen</span>
                          )}
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
                        
                        {/* Düzenleme ve Silme Butonları - Sadece kendi yorumları için */}
                        {comment.userId === currentUserId && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditingComment(comment)}
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
                        )}
                      </div>
                      
                      {/* Yorum İçeriği veya Düzenleme Formu */}
                      {editingComment?.id === comment.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            maxLength={500}
                            className=" w-full p-3 border border-gray-200 rounded-lg resize-none focus-outline-none focus:border-orange-500 text-sm"
                            rows={3}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {editCommentText.length}/500
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={cancelEditingComment}
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
                        <p className="text-gray-600 leading-relaxed">{comment.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredChapterComments(comments).length === 0 && (
              <div className="text-center py-8">
                <i className="ri-chat-3-line text-4xl text-gray-300 mb-4"></i>
                <h4 className="text-lg font-semibold text-gray-500 mb-2">
                  {showMyCommentsOnly ? 'Henüz Yorum Yapmadınız' : 'Henüz Yorum Yok'}
                </h4>
                <p className="text-gray-400">
                  {showMyCommentsOnly ? 'Bu bölüm hakkında yorum yaparak başlayın!' : 'Bu bölüm hakkında ilk yorumu siz yapın!'}
                </p>
              </div>
            )}
          </div>

          {/* Navigasyon - Güncellenmiş */}
          <div className="flex justify-between items-center">
            {/* Önceki Bölüm */}
            {previousChapter ? (
              <Link
                href={`/books/${bookId}/chapter/${previousChapter?.slug || previousChapter?.id}`}
                className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer whitespace-nowrap shadow-md"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Önceki Bölüm
              </Link>
            ) : (
              <Link
                href={`/books/${bookId}`}
                className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer whitespace-nowrap shadow-md"
              >
                <i className="ri-book-line mr-2"></i>
                Bölümler
              </Link>
            )}
            
            {/* Orta Kısım - Bölüm Bilgisi */}
            <div className="text-center px-4">
              <p className="text-xs text-gray-400 font-medium">
                {allChapters.length} bölümden {getCurrentChapterIndex() + 1}.
              </p>
            </div>

            {/* Sonraki Bölüm */}
            {nextChapter ? (
              <Link
                href={`/books/${bookId}/chapter/${nextChapter?.slug || nextChapter?.id}`}
                className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer whitespace-nowrap shadow-md"
              >
                Sonraki Bölüm
                <i className="ri-arrow-right-line ml-2"></i>
              </Link>
            ) : (
              <div className="flex items-center px-6 py-3 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed whitespace-nowrap">
                Son Bölüm
                <i className="ri-check-line ml-2"></i>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Satır Yorumları Paneli */}
      {showSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {activeLine !== null ? `${activeLine + 1}. Satır Yorumları` : 'Yorumlar'}
                </h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              {/* Satır Yorum Filtresi */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sadece Benim Yorumlarım</span>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showMyLineCommentsOnly}
                      onChange={(e) => setShowMyLineCommentsOnly(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${showMyLineCommentsOnly ? 'bg-orange-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${showMyLineCommentsOnly ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="p-6">
              {activeLine !== null && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Seçilen satır:</p>
                    <div className="bg-white border border-orange-200 rounded-xl p-4 shadow-sm">
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {lines[activeLine]?.trim()}
                      </p>
                    </div>
                  </div>

                  {/* Yorum Ekleme Formu */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Bu Satır Hakkında Yorum Yap</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="İsminiz"
                        value={newCommentName}
                        onChange={(e) => setNewCommentName(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                        disabled={lineCommentLoading}
                      />
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Bu satır hakkında düşüncelerinizi paylaşın..."
                        maxLength={500}
                        className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-500 text-sm"
                        disabled={lineCommentLoading}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {newComment.length}/500
                        </span>
                        <button
                          onClick={addLineComment}
                          disabled={!newComment.trim() || !newCommentName.trim() || lineCommentLoading}
                          className="px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap flex items-center"
                        >
                          {lineCommentLoading ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Kaydediliyor...
                            </>
                          ) : (
                            'Gönder'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mevcut Yorumlar */}
                  {getFilteredLineComments(activeLine).length > 0 && (
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-semibold text-gray-800 mb-4">
                        {showMyLineCommentsOnly ? 'Benim Yorumlarım' : 'Mevcut Yorumlar'} ({getFilteredLineComments(activeLine).length})
                      </h4>
                      <div className="space-y-4">
                        {getFilteredLineComments(activeLine).map((comment, index) => (
                          <div key={comment.id || index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-orange-600 font-semibold text-sm">{comment.name[0]}</span>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h5 className="font-semibold text-gray-800 text-sm">{comment.name}</h5>
                                    {comment.userId === currentUserId && (
                                      <span className="bg-orange-100 text-orange-600 text-xs px-1 py-0.5 rounded-full">Sen</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">{comment.time}</span>
                                </div>
                              </div>
                              
                              {/* Düzenleme ve Silme Butonları - Sadece kendi yorumları için */}
                              {comment.userId === currentUserId && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => startEditingLineComment(comment)}
                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 cursor-pointer"
                                    title="Yorumu Düzenle"
                                  >
                                    <i className="ri-edit-line text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => deleteLineComment(comment.id, activeLine)}
                                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 cursor-pointer"
                                    title="Yorumu Sil"
                                  >
                                    <i className="ri-delete-bin-line text-xs"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Yorum İçeriği veya Düzenleme Formu */}
                            {editingLineComment?.id === comment.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editLineCommentText}
                                  onChange={(e) => setEditLineCommentText(e.target.value)}
                                  maxLength={500}
                                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-orange-500 text-sm"
                                  rows={3}
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {editLineCommentText.length}/500
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={cancelEditingLineComment}
                                      className="px-3 py-1 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors cursor-pointer text-xs whitespace-nowrap"
                                    >
                                      İptal
                                    </button>
                                    <button
                                      onClick={() => editLineComment(comment.id, editLineCommentText, activeLine)}
                                      disabled={!editLineCommentText.trim() || editLineCommentText.trim() === comment.comment}
                                      className="px-3 py-1 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs whitespace-nowrap"
                                    >
                                      Kaydet
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-gray-600 text-sm leading-relaxed mb-2">{comment.comment}</p>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <i
                                      key={i}
                                      className={`ri-star-${i < comment.rating ? 'fill' : 'line'} text-xs ${
                                        i < comment.rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    ></i>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeLine !== null && getFilteredLineComments(activeLine).length === 0 && (
                    <div className="border-t border-gray-200 pt-6">
                      <div className="text-center py-6">
                        <i className="ri-chat-3-line text-3xl text-gray-300 mb-3"></i>
                        <h4 className="text-sm font-semibold text-gray-500 mb-2">
                          {showMyLineCommentsOnly ? 'Bu Satırda Henüz Yorum Yapmadınız' : 'Henüz Bu Satırda Yorum Yok'}
                        </h4>
                        <p className="text-gray-400 text-xs">
                          {showMyLineCommentsOnly ? 'Bu satır hakkında yorum yaparak başlayın!' : 'Bu satır hakkında ilk yorumu siz yapın!'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
