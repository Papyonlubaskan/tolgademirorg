'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getIdFromSlug, createSlug, createChapterSlug } from '@/lib/utils';

interface BolumReaderProps {
  bookId: string;
  bolumId: string;
}

export default function BolumReader({ bookId, bolumId }: BolumReaderProps) {
  const [book, setBook] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Satır yorumları ve beğeniler için state'ler
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
  const [replyingToComment, setReplyingToComment] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replyName, setReplyName] = useState('');
  const [chapterLikes, setChapterLikes] = useState({ total: 0, isLiked: false });
  const [lineLikes, setLineLikes] = useState<{[key: number]: { total: number, isLiked: boolean }}>({});
  const [lineLikesLoaded, setLineLikesLoaded] = useState(false);


  useEffect(() => {
    // Kullanıcı ID'sini oluştur (sessionStorage kullan - kitaplar sayfası ile tutarlı)
    let userId = sessionStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('user_id', userId);
    }
    setCurrentUserId(userId);
    
    loadChapterData();
  }, [bookId, bolumId]);

  useEffect(() => {
    // URL'den commentId parametresini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const commentId = urlParams.get('commentId');
    const lineNumber = urlParams.get('line');
    
    if (commentId && lineNumber) {
      // Yorum panelini aç
      setShowSidebar(true);
      setSelectedLine(parseInt(lineNumber));
      setActiveLine(parseInt(lineNumber));
      
      // O satırın yorumlarını yükle
      setTimeout(() => {
        loadLineComments(parseInt(lineNumber));
      }, 1000);
    }

    // Admin panelinden gelen yorum açma mesajını dinle
    const handleMessage = (event: MessageEvent) => {
      // Sadece kendi origin'den gelen mesajları işle
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data && event.data.type === 'OPEN_COMMENT') {
        const { commentId, lineNumber } = event.data;
        
        // Yorum panelini aç
        setShowSidebar(true);
        
        // Eğer satır yorumu ise, o satırı seç
        if (lineNumber !== null && lineNumber !== undefined) {
          setSelectedLine(lineNumber);
          setActiveLine(lineNumber);
          
          // O satırın yorumlarını yükle
          loadLineComments(lineNumber);
        }
        
        // Belirli yorumu vurgula ve scroll et
        setTimeout(() => {
          const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
          if (commentElement) {
            // Yorumu görünür alana getir
            commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Vurgulama efekti
            commentElement.classList.add('ring-2', 'ring-yellow-400', 'bg-yellow-50', 'dark:bg-yellow-900/30');
            
            // 3 saniye sonra vurgulamayı kaldır
            setTimeout(() => {
              commentElement.classList.remove('ring-2', 'ring-yellow-400', 'bg-yellow-50', 'dark:bg-yellow-900/30');
            }, 3000);
          } else {
            // Eğer yorum bulunamazsa, yorumları yeniden yükle
            if (lineNumber !== null && lineNumber !== undefined) {
              loadLineComments(lineNumber);
            }
          }
        }, 1000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (currentUserId && chapter) {
      loadComments();
      loadLineComments();
      loadChapterLikes();
      loadLineLikes();
    }
  }, [currentUserId, chapter]);

  const loadChapterData = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        console.log('Kitap yükleniyor, bookId:', bookId);
        
        // Önce ID ile deneyelim
        let bookResponse = await fetch(`/api/books/${bookId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        let bookData = await bookResponse.json();
        
        // ID ile bulunamadıysa ve sayısal değilse, tüm kitapları getirip slug ile eşleşeni bulalım
        if (!bookData.success && isNaN(Number(bookId))) {
          console.log('ID ile bulunamadı, slug ile deneniyor:', bookId);
          const booksResponse = await fetch('/api/books');
          const booksResult = await booksResponse.json();
          
          if (booksResult.success && Array.isArray(booksResult.data)) {
            const bookBySlug = booksResult.data.find((b: any) => 
              b.slug === bookId || createSlug(b.title) === bookId
            );
            
            if (bookBySlug) {
              console.log('Slug ile kitap bulundu:', bookBySlug.title);
              bookData = { success: true, data: bookBySlug };
            }
          }
        }
        
        if (!bookData.success || !bookData.data) {
          console.error('Kitap bulunamadı, bookId:', bookId);
          throw new Error('Kitap bulunamadı');
        }
        
        setBook(bookData.data);
        console.log('Book loaded:', bookData.data.title);

        // Tüm bölümleri getir
        const chaptersResponse = await fetch(`/api/chapters?bookId=${bookData.data.id}`, {
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
          throw new Error('Bölümler alınamadı');
        }
        
        const chapters = chaptersResult.data || [];
        console.log('Chapters loaded:', chapters.length);
        // Bölümleri order_number ile sırala
        const sortedChapters = chapters.sort((a: any, b: any) => 
          (a.order_number || 0) - (b.order_number || 0)
        );
        setChapters(sortedChapters);
        
        // Bölüm detayını getir (slug veya ID ile)
        console.log('Bölüm yükleniyor, bolumId:', bolumId);
        
        // Önce doğrudan API ile deneyelim
        let chapterResponse = await fetch(`/api/chapters/${bolumId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        let chapterData;
        let foundChapter;
        
        if (chapterResponse.ok) {
          chapterData = await chapterResponse.json();
          console.log('Chapter API response:', chapterData);
          
          if (chapterData.success && chapterData.data) {
            foundChapter = chapterData.data;
          }
        }
        
        // API ile bulunamadıysa, tüm bölümler içinde arayalım
        // ÖNEMLİ: chapters dizisi zaten bu kitaba ait (bookId ile filtrelenmiş)
        if (!foundChapter && chapters.length > 0) {
          console.log('API ile bulunamadı, bölümler içinde arıyoruz:', bolumId);
          console.log('Bu kitaba ait bölümler:', chapters.map((c: any) => ({ id: c.id, book_id: c.book_id, title: c.title, slug: c.slug })));
          
          // ID, slug veya başlık ile eşleşme arayalım
          // chapters dizisi zaten doğru kitabın bölümleri olduğu için book_id kontrolüne gerek yok
          foundChapter = chapters.find((c: any) => 
            c.id.toString() === bolumId || 
            c.slug === bolumId || 
            createSlug(c.title) === bolumId ||
            c.title.toLowerCase() === bolumId.toLowerCase()
          );
          
          if (foundChapter) {
            console.log('Bölüm yerel olarak bulundu:', foundChapter.title, 'book_id:', foundChapter.book_id);
          }
        }
        
        // Hala bulunamadıysa kitap sayfasına yönlendir
        if (!foundChapter) {
          console.warn('⚠️ Bölüm bulunamadı (silindi olabilir), kitap sayfasına yönlendiriliyor...');
          
          // Kullanıcıyı kitap sayfasına yönlendir
          if (typeof window !== 'undefined') {
            window.location.href = `/kitaplar/${bookId}`;
          }
          return;
        }
        setChapter(foundChapter);
        console.log('Chapter loaded:', foundChapter.title);
      } catch (fetchError) {
        console.error('Data loading error:', fetchError);
        // Veri yükleme hatası - kitap sayfasına yönlendir
        if (typeof window !== 'undefined') {
          window.location.href = `/kitaplar/${bookId}`;
        }
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading chapter data:', error);
      // Kritik hata - kitap sayfasına yönlendir
      if (typeof window !== 'undefined') {
        window.location.href = `/kitaplar/${bookId}`;
      }
      setError('Bölüm bulunamadı, kitap sayfasına yönlendiriliyorsunuz...');
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

  // Fullscreen değişikliklerini dinle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const resetFontSize = () => {
    setFontSize(16);
  };

  // Yorumları yükle
  const loadComments = async () => {
    if (!chapter) return;
    
    try {
      const response = await fetch(`/api/comments?chapterId=${chapter.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComments(result.data || []);
        }
      }
    } catch (error) {
      console.error('Comments loading error:', error);
    }
  };

  // Satır yorumlarını yükle  
  const loadLineComments = async (lineNumber?: number) => {
    if (!chapter) return;
    
    try {
      const response = await fetch(`/api/comments?chapterId=${chapter.id}&type=line`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const grouped = (result.data || []).reduce((acc: any, comment: any) => {
            const lineNum = parseInt(comment.line_number); // Orijinal satır numarasını kullan
            if (!acc[lineNum]) acc[lineNum] = [];
            acc[lineNum].push(comment);
            return acc;
          }, {});
          setLineComments(grouped);
        }
      }
    } catch (error) {
      console.error('Line comments loading error:', error);
    }
  };

  // Bölüm beğenilerini yükle
  const loadChapterLikes = async () => {
    if (!chapter) return;
    
    try {
      const response = await fetch(`/api/likes?chapterId=${chapter.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChapterLikes({
            total: result.data.totalLikes || result.data.likeCount || 0,
            isLiked: result.data.isLiked || false
          });
        }
      }
    } catch (error) {
      console.error('Error loading chapter likes:', error);
    }
  };

  // Satır beğenilerini yükle
  const loadLineLikes = async () => {
    // localStorage'dan yükle
    if (!chapter?.id) return;
    const cacheKey = `lineLikes_chapter_${chapter.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setLineLikes(JSON.parse(cached));
        setLineLikesLoaded(true);
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }
  };
  
  // Tek bir satırın beğenisini yükle
  const loadSingleLineLike = async (lineIndex: number) => {
    if (!chapter?.id) return;
    
    // Zaten yüklenmişse tekrar yükleme
    if (lineLikes[lineIndex] !== undefined) return;
    
    try {
      const response = await fetch(`/api/likes?chapterId=${chapter.id}&lineNumber=${lineIndex}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const newLikeData = {
            total: result.data.totalLikes || result.data.likeCount || 0,
            isLiked: result.data.isLiked || false
          };
          
          setLineLikes(prev => {
            const updated = {
              ...prev,
              [lineIndex]: newLikeData
            };
            // localStorage'a kaydet
            const cacheKey = `lineLikes_chapter_${chapter.id}`;
            localStorage.setItem(cacheKey, JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (error) {
      console.error(`Error loading like for line ${lineIndex}:`, error);
    }
  };

  // Bölüm beğen
  const handleChapterLike = async () => {
    if (!currentUserId || !chapter) return;
    
    const isCurrentlyLiked = chapterLikes.isLiked;
    const currentCount = chapterLikes.total;
    
    setChapterLikes({
      total: isCurrentlyLiked ? currentCount - 1 : currentCount + 1,
      isLiked: !isCurrentlyLiked
    });
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          action: isCurrentlyLiked ? 'unlike' : 'like'
        })
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      setChapterLikes({
        total: result.data.totalLikes || result.data.likeCount || 0,
        isLiked: result.data.isLiked || false
      });
    } catch (error) {
      console.error('Chapter like error:', error);
      setChapterLikes({ total: currentCount, isLiked: isCurrentlyLiked });
      alert('Beğeni işlemi başarısız oldu.');
    }
  };

  // Satır beğen
  const handleLineLike = async (lineIndex: number, lineText: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUserId || !chapter) return;
    
    // İlk tıklamada beğeni bilgisini yükle (lazy load)
    if (lineLikes[lineIndex] === undefined) {
      await loadSingleLineLike(lineIndex);
      return; // İlk tıklamada sadece yükle, beğenme
    }
    
    const currentLike = lineLikes[lineIndex];
    const isCurrentlyLiked = currentLike.isLiked;
    const currentCount = currentLike.total;
    
    // Optimistik update - anında görünüm değiştir
    const newLikeState = {
      ...lineLikes,
      [lineIndex]: {
        total: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
        isLiked: !isCurrentlyLiked
      }
    };
    
    setLineLikes(newLikeState);
    
    // localStorage'a kaydet
    const cacheKey = `lineLikes_chapter_${chapter.id}`;
    localStorage.setItem(cacheKey, JSON.stringify(newLikeState));
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          lineNumber: lineIndex,
          userId: currentUserId,
          action: isCurrentlyLiked ? 'unlike' : 'like'
        })
      });
      
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error);
      
      // Sunucudan gelen gerçek değerle güncelle ve kaydet
      const serverLikeState = {
        ...lineLikes,
        [lineIndex]: {
          total: result.data.totalLikes || result.data.likeCount || 0,
          isLiked: result.data.isLiked || false
        }
      };
      
      setLineLikes(serverLikeState);
      localStorage.setItem(cacheKey, JSON.stringify(serverLikeState));
      
    } catch (error) {
      console.error('Line like error:', error);
      // Hata olursa eski değere geri dön
      const revertedState = {
        ...lineLikes,
        [lineIndex]: { total: currentCount, isLiked: isCurrentlyLiked }
      };
      setLineLikes(revertedState);
      localStorage.setItem(cacheKey, JSON.stringify(revertedState));
    }
  };

  // Yorumları aç/kapat
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

  // Satır yorumu ekle
  const addLineComment = async () => {
    if (!newComment.trim() || !newCommentName.trim() || selectedLine === null || !chapter || !book) return;
    
    setLineCommentLoading(true);
    
    try {
      const lines = chapter.content ? chapter.content.split('\n') : [];
      const selectedLineText = lines[selectedLine]?.trimEnd() || '';
      
      const response = await fetch(`/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          bookId: book.id,
          lineNumber: selectedLine,
          userName: newCommentName.trim(),
          content: newComment.trim(),
          userId: currentUserId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLineComments(prev => {
            const updated = { ...prev };
            if (!updated[selectedLine]) updated[selectedLine] = [];
            updated[selectedLine] = [result.data, ...updated[selectedLine]];
            return updated;
          });
          setNewComment('');
          setNewCommentName('');
        }
      }
    } catch (error) {
      console.error('Line comment error:', error);
      alert('Yorum eklenemedi.');
    } finally {
      setLineCommentLoading(false);
    }
  };

  // Yorum yanıtı gönder
  const sendReply = async (parentCommentId: number) => {
    if (!replyText.trim() || !replyName.trim() || !chapter || !book) return;
    
    try {
      const response = await fetch(`/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chapter.id,
          bookId: book.id,
          lineNumber: activeLine,
          userName: replyName.trim(),
          content: replyText.trim(),
          userId: currentUserId,
          parentId: parentCommentId // Yanıt için parent ID
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Yanıtı yorum listesine ekle
          setLineComments(prev => {
            const updated = { ...prev };
            if (!updated[activeLine]) updated[activeLine] = [];
            updated[activeLine] = [result.data, ...updated[activeLine]];
            return updated;
          });
          setReplyText('');
          setReplyName('');
          setReplyingToComment(null);
        }
      }
    } catch (error) {
      console.error('Reply error:', error);
      alert('Yanıt gönderilemedi.');
    }
  };

  // Bölüm yorumu ekle
  const addChapterComment = async () => {
    if (!chapterComment.trim() || !chapterCommentName.trim() || !chapter || !book) return;
    
    setCommentLoading(true);
    
    try {
      const response = await fetch(`/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          chapterId: chapter.id,
          userName: chapterCommentName.trim(),
          content: chapterComment.trim(),
          userId: currentUserId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComments(prev => [result.data, ...prev]);
          setChapterComment('');
          setChapterCommentName('');
        }
      }
    } catch (error) {
      console.error('Chapter comment error:', error);
      alert('Yorum eklenemedi.');
    } finally {
      setCommentLoading(false);
    }
  };

  // Satır yorumu sil
  const deleteLineComment = async (commentId: string, lineNumber: number) => {
    if (!window.confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLineComments(prev => {
            const updated = { ...prev };
            if (updated[lineNumber]) {
              updated[lineNumber] = updated[lineNumber].filter(c => c.id !== commentId);
              if (updated[lineNumber].length === 0) delete updated[lineNumber];
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Yorum silinemedi.');
    }
  };

  // Satır yorumu düzenle
  const editLineComment = async (commentId: string, newText: string, lineNumber: number) => {
    if (!newText.trim()) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newText.trim(), userId: currentUserId })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLineComments(prev => {
            const updated = { ...prev };
            if (updated[lineNumber]) {
              updated[lineNumber] = updated[lineNumber].map(c => 
                c.id === commentId ? { ...c, content: newText.trim() } : c
              );
            }
            return updated;
          });
          setEditingLineComment(null);
          setEditLineCommentText('');
        }
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Yorum düzenlenemedi.');
    }
  };

  // Bölüm yorumu düzenle
  const editComment = async (commentId: string, newText: string) => {
    if (!newText.trim()) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newText.trim(), userId: currentUserId })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComments(prev => prev.map(c => 
            c.id === commentId ? { ...c, content: newText.trim() } : c
          ));
          setEditingComment(null);
          setEditCommentText('');
        }
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Yorum düzenlenemedi.');
    }
  };

  // Bölüm yorumu sil
  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComments(prev => prev.filter(c => c.id !== commentId));
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Yorum silinemedi.');
    }
  };

  const startEditingLineComment = (comment: any) => {
    setEditingLineComment(comment);
    setEditLineCommentText(comment.content);
  };

  const cancelEditingLineComment = () => {
    setEditingLineComment(null);
    setEditLineCommentText('');
  };

  const startEditingComment = (comment: any) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const getFilteredChapterComments = (commentsArray: any[]) => {
    if (!showMyCommentsOnly) return commentsArray;
    return commentsArray.filter(c => c.user_id === currentUserId);
  };

  const getFilteredLineComments = (lineNumber: number) => {
    const comments = lineComments[lineNumber] || [];
    if (!showMyLineCommentsOnly) return comments;
    return comments.filter(c => c.user_id === currentUserId);
  };

  const getLineCommentCount = (lineNumber: number) => {
    const comments = lineComments[lineNumber] || [];
    if (showMyLineCommentsOnly) {
      return comments.filter(c => c.user_id === currentUserId).length;
    }
    return comments.length;
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
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={decreaseFontSize}
                className="px-2 sm:px-3 py-1 sm:py-2 text-sm text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors font-medium"
                title="Yazı boyutunu küçült"
              >
                AA-
              </button>
              <button
                onClick={resetFontSize}
                className="px-2 sm:px-3 py-1 sm:py-2 text-sm text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors font-medium"
                title="Yazı boyutunu sıfırla"
              >
                {fontSize}px
              </button>
              <button
                onClick={increaseFontSize}
                className="px-2 sm:px-3 py-1 sm:py-2 text-sm text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors font-medium"
                title="Yazı boyutunu büyüt"
              >
                AA+
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
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div 
          ref={contentRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden relative"
          style={{ 
            fontSize: `${fontSize}px`,
            minHeight: isFullscreen ? '100vh' : 'auto',
            overflowY: isFullscreen ? 'auto' : 'visible'
          }}
        >
          {/* Tam Ekran Kontrolleri */}
          {isFullscreen && (
            <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 p-2 flex items-center space-x-1">
              <button
                onClick={decreaseFontSize}
                className="px-2 py-1 text-sm text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 rounded transition-colors font-medium"
                title="Yazı boyutunu küçült"
              >
                AA-
              </button>
              <button
                onClick={resetFontSize}
                className="px-2 py-1 text-xs text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 rounded transition-colors font-medium"
                title="Yazı boyutunu sıfırla"
              >
                {fontSize}px
              </button>
              <button
                onClick={increaseFontSize}
                className="px-2 py-1 text-sm text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 rounded transition-colors font-medium"
                title="Yazı boyutunu büyüt"
              >
                AA+
              </button>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={toggleFullscreen}
                className="px-2 py-1 text-gray-800 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                title="Tam ekrandan çık"
              >
                <i className="ri-fullscreen-exit-line text-lg"></i>
              </button>
            </div>
          )}
          <div className="bg-orange-600 text-white p-4 sm:p-6 text-center -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-6 rounded-t-2xl">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{chapter.title}</h1>
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
          
          {/* Satır bazlı içerik */}
          {chapter.content ? (
            <div 
              className={`prose max-w-none dark:prose-invert break-words ${
                fontSize >= 20 ? 'prose-xl' : 
                fontSize >= 18 ? 'prose-lg' : 
                'prose-base'
              }`}
              style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
            >
              {chapter.content.split('\n').map((line: string, arrayIndex: number) => {
                // Satır numarası 1'den başlasın (0 ile bölüm beğenisi karışmasın)
                const lineNumber = arrayIndex + 1;
                
                // Boş satırları atla
                if (!line.trim()) return null;
                
                const commentCount = getLineCommentCount(lineNumber);
                const isSelected = selectedLine === lineNumber && showSidebar;
                const lineLike = lineLikes[lineNumber] || { total: 0, isLiked: false };
                
                return (
                  <div key={lineNumber} className="relative mb-6 group">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p 
                          className={`leading-relaxed text-gray-800 dark:text-gray-200 cursor-pointer p-2 sm:p-3 rounded transition-colors break-words overflow-hidden ${
                            isSelected ? 'bg-orange-100 dark:bg-orange-900/20 border-l-4 border-orange-500' : 'hover:bg-orange-50 dark:hover:bg-orange-900/10'
                          }`}
                          style={{ 
                            fontSize: `${fontSize}px`, 
                            wordWrap: 'break-word', 
                            overflowWrap: 'break-word',
                            maxWidth: '100%',
                            minWidth: '0',
                            whiteSpace: 'pre-wrap' // Paragraf girintilerini koru
                          }}
                          onClick={() => toggleComments(lineNumber)}
                          dangerouslySetInnerHTML={{ __html: line.trimEnd() }}
                        />
                      </div>
                      
                      {/* Sağ Taraf - Küçük Beğeni ve Yorum Simgeleri */}
                      <div className="flex-shrink-0 flex items-center space-x-1 mt-1">
                        {/* Küçük Beğeni Simgesi */}
                        <button
                          onClick={(e) => handleLineLike(lineNumber, line, e)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-200 text-xs ${
                            lineLike.isLiked
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400'
                          }`}
                          title={`${lineLike.total || 0} beğeni`}
                        >
                          <i className={`${lineLike.isLiked ? 'ri-heart-fill' : 'ri-heart-line'} text-xs`}></i>
                          {lineLike.total > 0 && <span className="text-xs font-medium">{lineLike.total}</span>}
                        </button>
                        
                        {/* Küçük Yorum Simgesi */}
                        <button
                          onClick={() => toggleComments(lineNumber)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-200 text-xs ${
                            commentCount > 0 
                              ? 'text-orange-500 dark:text-orange-400' 
                              : 'text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400'
                          }`}
                          title={`${commentCount || 0} yorum`}
                        >
                          <i className="ri-chat-3-line text-xs"></i>
                          {commentCount > 0 && <span className="text-xs font-medium">{commentCount}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="ri-file-text-line text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">İçerik Bulunamadı</h3>
              <p className="text-gray-400 dark:text-gray-500">Bu bölümün içeriği henüz eklenmemiş.</p>
            </div>
          )}
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
                    href={`/kitaplar/${createSlug(book.title)}/bolum/${prevChapter.slug || prevChapter.id}`}
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
                    href={`/kitaplar/${createSlug(book.title)}/bolum/${nextChapter.slug || nextChapter.id}`}
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

        {/* Bölüm Hakkında Yorumlar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              Bu Bölüm Hakkında Yorumlar ({getFilteredChapterComments(comments).length})
            </h3>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sadece Benim Yorumlarım</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showMyCommentsOnly}
                  onChange={(e) => setShowMyCommentsOnly(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${showMyCommentsOnly ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${showMyCommentsOnly ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                </div>
              </div>
            </label>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 mb-8">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Bölüm Hakkında Yorumunuzu Paylaşın</h4>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="İsminiz"
                value={chapterCommentName}
                onChange={(e) => setChapterCommentName(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                disabled={commentLoading}
              />
              <textarea
                placeholder="Bu bölüm hakkında düşüncelerinizi paylaşın..."
                value={chapterComment}
                onChange={(e) => setChapterComment(e.target.value)}
                maxLength={500}
                className="w-full h-32 p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                disabled={commentLoading}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {chapterComment.length}/500
                </span>
                <button
                  onClick={addChapterComment}
                  disabled={!chapterComment.trim() || !chapterCommentName.trim() || commentLoading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {commentLoading ? 'Kaydediliyor...' : 'Yorum Yap'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {getFilteredChapterComments(comments).map((comment, index) => (
              <div key={comment.id || index} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 dark:text-orange-400 font-semibold text-lg">{comment.user_name?.[0] || 'A'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{comment.user_name}</h4>
                        {comment.user_id === currentUserId && (
                          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2 py-1 rounded-full">Sen</span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {comment.created_at ? new Date(comment.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Bilinmeyen tarih'}
                        </span>
                      </div>
                      
                      {comment.user_id === currentUserId && !comment.is_hidden && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditingComment(comment)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all duration-200"
                            title="Yorumu Düzenle"
                          >
                            <i className="ri-edit-line text-sm"></i>
                          </button>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all duration-200"
                            title="Yorumu Sil"
                          >
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        </div>
                      )}
                      {comment.user_id === currentUserId && comment.is_hidden && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                          (Bu yorum gizlendi - düzenlenemez)
                        </span>
                      )}
                    </div>
                    
                    {editingComment?.id === comment.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          maxLength={500}
                          className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                          rows={3}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {editCommentText.length}/500
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={cancelEditingComment}
                              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                              İptal
                            </button>
                            <button
                              onClick={() => editComment(comment.id, editCommentText)}
                              disabled={!editCommentText.trim() || editCommentText.trim() === comment.content}
                              className="px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getFilteredChapterComments(comments).length === 0 && (
            <div className="text-center py-8">
              <i className="ri-chat-3-line text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <h4 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                {showMyCommentsOnly ? 'Henüz Yorum Yapmadınız' : 'Henüz Yorum Yok'}
              </h4>
              <p className="text-gray-400 dark:text-gray-500">
                {showMyCommentsOnly ? 'Bu bölüm hakkında yorum yaparak başlayın!' : 'Bu bölüm hakkında ilk yorumu siz yapın!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Satır Yorumları Paneli */}
      {showSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {activeLine !== null ? `${activeLine + 1}. Satır Yorumları` : 'Yorumlar'}
                </h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sadece Benim Yorumlarım</span>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showMyLineCommentsOnly}
                      onChange={(e) => setShowMyLineCommentsOnly(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${showMyLineCommentsOnly ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Seçilen satır:</p>
                    <div className="bg-white dark:bg-gray-700 border border-orange-200 dark:border-orange-800 rounded-xl p-4 shadow-sm max-w-full overflow-hidden">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm break-words" style={{ whiteSpace: 'pre-wrap' }}>
                        {(() => {
                          // Orijinal satır numarasını kullan, filter yapma
                          const line = chapter.content.split('\n')[activeLine]?.trimEnd() || '';
                          // HTML tag'lerini kaldır, sadece metin göster
                          return line.replace(/<[^>]*>/g, '');
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Yorum Ekleme Formu */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Bu Satır Hakkında Yorum Yap</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="İsminiz"
                        value={newCommentName}
                        onChange={(e) => setNewCommentName(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                        disabled={lineCommentLoading}
                      />
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Bu satır hakkında düşüncelerinizi paylaşın..."
                        maxLength={500}
                        className="w-full h-32 p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                        disabled={lineCommentLoading}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {newComment.length}/500
                        </span>
                        <button
                          onClick={addLineComment}
                          disabled={!newComment.trim() || !newCommentName.trim() || lineCommentLoading}
                          className="px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
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
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                        {showMyLineCommentsOnly ? 'Benim Yorumlarım' : 'Mevcut Yorumlar'} ({getFilteredLineComments(activeLine).length})
                      </h4>
                      <div className="space-y-4">
                        {getFilteredLineComments(activeLine).map((comment, index) => (
                          <div key={comment.id || index} data-comment-id={comment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">{comment.user_name?.[0] || 'A'}</span>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h5 className="font-semibold text-gray-800 dark:text-white text-sm">{comment.user_name}</h5>
                                    {comment.user_id === currentUserId && (
                                      <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-1 py-0.5 rounded-full">Sen</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {comment.created_at ? new Date(comment.created_at).toLocaleDateString('tr-TR', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'Bilinmeyen tarih'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {/* Yanıt Butonu */}
                                <button
                                  onClick={() => setReplyingToComment(replyingToComment?.id === comment.id ? null : comment)}
                                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-all duration-200"
                                  title="Yanıtla"
                                >
                                  <i className="ri-reply-line text-xs"></i>
                                </button>
                                
                                {comment.user_id === currentUserId && !comment.is_hidden && (
                                  <>
                                    <button
                                      onClick={() => startEditingLineComment(comment)}
                                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all duration-200"
                                      title="Yorumu Düzenle"
                                    >
                                      <i className="ri-edit-line text-xs"></i>
                                    </button>
                                    <button
                                      onClick={() => deleteLineComment(comment.id, activeLine)}
                                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all duration-200"
                                      title="Yorumu Sil"
                                    >
                                      <i className="ri-delete-bin-line text-xs"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                              {comment.user_id === currentUserId && comment.is_hidden && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                  (Gizli)
                                </span>
                              )}
                            </div>
                            
                            {editingLineComment?.id === comment.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editLineCommentText}
                                  onChange={(e) => setEditLineCommentText(e.target.value)}
                                  maxLength={500}
                                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                                  rows={3}
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {editLineCommentText.length}/500
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={cancelEditingLineComment}
                                      className="px-3 py-1 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs"
                                    >
                                      İptal
                                    </button>
                                    <button
                                      onClick={() => editLineComment(comment.id, editLineCommentText, activeLine)}
                                      disabled={!editLineCommentText.trim() || editLineCommentText.trim() === comment.content}
                                      className="px-3 py-1 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                    >
                                      Kaydet
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                                
                                {/* Admin Yanıtı */}
                                {comment.admin_reply && (
                                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                    <div className="flex items-start space-x-2">
                                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                                        <i className="ri-admin-line text-blue-600 dark:text-blue-400 text-xs"></i>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                            {comment.admin_reply_by || 'Admin'}
                                          </span>
                                          <span className="text-blue-500 dark:text-blue-400 text-xs">
                                            Yanıt
                                          </span>
                                        </div>
                                        <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                                          {comment.admin_reply}
                                        </p>
                                        {comment.admin_reply_at && (
                                          <span className="text-blue-500 dark:text-blue-400 text-xs">
                                            {new Date(comment.admin_reply_at).toLocaleDateString('tr-TR', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Yanıt Formu */}
                            {replyingToComment?.id === comment.id && (
                              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <i className="ri-reply-line text-green-600 dark:text-green-400"></i>
                                    <span className="text-green-700 dark:text-green-300 text-sm font-medium">
                                      {comment.user_name} yorumuna yanıt veriyorsunuz
                                    </span>
                                  </div>
                                  
                                  <input
                                    type="text"
                                    value={replyName}
                                    onChange={(e) => setReplyName(e.target.value)}
                                    placeholder="İsminiz"
                                    className="w-full px-3 py-2 border border-green-200 dark:border-green-700 rounded-lg focus:outline-none focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
                                  />
                                  
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Yanıtınızı yazın..."
                                    maxLength={500}
                                    rows={3}
                                    className="w-full p-3 border border-green-200 dark:border-green-700 rounded-lg resize-none focus:outline-none focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
                                  />
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-green-600 dark:text-green-400">
                                      {replyText.length}/500
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => {
                                          setReplyingToComment(null);
                                          setReplyText('');
                                          setReplyName('');
                                        }}
                                        className="px-3 py-1 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs"
                                      >
                                        İptal
                                      </button>
                                      <button
                                        onClick={() => sendReply(comment.id)}
                                        disabled={!replyText.trim() || !replyName.trim()}
                                        className="px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                      >
                                        Yanıt Gönder
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeLine !== null && getFilteredLineComments(activeLine).length === 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div className="text-center py-6">
                        <i className="ri-chat-3-line text-3xl text-gray-300 dark:text-gray-600 mb-3"></i>
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          {showMyLineCommentsOnly ? 'Bu Satırda Henüz Yorum Yapmadınız' : 'Henüz Bu Satırda Yorum Yok'}
                        </h4>
                        <p className="text-gray-400 dark:text-gray-500 text-xs">
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