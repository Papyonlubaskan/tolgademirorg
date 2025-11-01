'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: number;
  content: string;
  user_name: string;
  user_email: string;
  user_ip?: string;
  user_fingerprint?: string;
  book_id?: number;
  chapter_id?: number;
  line_number?: number;
  status: 'approved' | 'pending' | 'rejected';
  is_hidden?: boolean;
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  updated_at: string;
  book_title?: string;
  chapter_title?: string;
  admin_reply?: string;
  admin_reply_by?: string;
  admin_reply_at?: string;
}

interface BookChapter {
  id: number;
  title: string;
  chapters?: { id: number; title: string; }[];
}

interface BannedIP {
  id: number;
  ip_address: string;
  subnet?: string;
  fingerprint?: string;
  reason?: string;
  auto_banned: boolean;
  suspicion_score: number;
  banned_by?: string;
  created_at: string;
}

export default function CommentsManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [books, setBooks] = useState<BookChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
  const [showBannedIPsModal, setShowBannedIPsModal] = useState(false);
  const [adminReply, setAdminReply] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    type: 'all', // all, book, chapter, line
    bookId: '',
    search: ''
  });

  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('admin_token') || '';
  };

  useEffect(() => {
    loadComments();
    loadBooks();
    loadBannedIPs();
  }, [filter]);

  const loadBooks = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/books?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Her kitap için bölümleri de yükle
          const booksWithChapters = await Promise.all(
            result.data.map(async (book: any) => {
              try {
                const chapterResponse = await fetch(`/api/chapters?bookId=${book.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (chapterResponse.ok) {
                  const chapterResult = await chapterResponse.json();
                  return {
                    ...book,
                    chapters: chapterResult.success ? chapterResult.data : []
                  };
                }
              } catch (error) {
                console.error('Chapter load error:', error);
              }
              return { ...book, chapters: [] };
            })
          );
          setBooks(booksWithChapters);
        }
      }
    } catch (error) {
      console.error('Books loading error:', error);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // API endpoint'i filtrelerine göre ayarla
      let endpoint = '/api/comments?limit=100';
      
      // Status filtresini API'ye gönder
      if (filter.status !== 'all') {
        endpoint += `&status=${filter.status}`;
      }
      
      if (filter.bookId) {
        endpoint += `&bookId=${filter.bookId}`;
      }
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          let filteredComments = result.data;
          
          // Status filtresi
          if (filter.status !== 'all') {
            filteredComments = filteredComments.filter((comment: Comment) => comment.status === filter.status);
          }
          
          // Priority filtresi
          if (filter.priority !== 'all') {
            filteredComments = filteredComments.filter((comment: Comment) => comment.priority === filter.priority);
          }
          
          // Type filtresi
          if (filter.type !== 'all') {
            if (filter.type === 'book') {
              filteredComments = filteredComments.filter((comment: Comment) => !comment.chapter_id && !comment.line_number);
            } else if (filter.type === 'chapter') {
              filteredComments = filteredComments.filter((comment: Comment) => comment.chapter_id && !comment.line_number);
            } else if (filter.type === 'line') {
              filteredComments = filteredComments.filter((comment: Comment) => comment.line_number !== null);
            }
          }
          
          // Arama filtresi
          if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            filteredComments = filteredComments.filter((comment: Comment) => 
              comment.content.toLowerCase().includes(searchTerm) ||
              comment.user_name.toLowerCase().includes(searchTerm) ||
              comment.user_email.toLowerCase().includes(searchTerm)
            );
          }
          
          setComments(filteredComments);
        }
      }
    } catch (error) {
      console.error('Comments loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCommentStatus = async (commentId: number, status: string, priority?: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, priority })
      });
      
      if (response.ok) {
        // Seçili yorumu güncelle
        if (selectedComment) {
          setSelectedComment({
            ...selectedComment,
            status: status as any,
            priority: priority as any || selectedComment.priority
          });
        }
        await loadComments();
        alert('Yorum güncellendi');
      } else {
        alert('Yorum durumu güncellenemedi!');
      }
    } catch (error) {
      console.error('Comment update error:', error);
      alert('Yorum durumu güncellenirken hata oluştu!');
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!window.confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (response.ok) {
        await loadComments();
        setSelectedComment(null);
        alert('Yorum başarıyla silindi!');
      } else {
        const result = await response.json();
        alert(result.error || 'Yorum silinemedi!');
      }
    } catch (error) {
      console.error('Comment delete error:', error);
      alert('Yorum silinirken hata oluştu!');
    }
  };

  const loadBannedIPs = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/ban-ip', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBannedIPs(result.data);
        }
      }
    } catch (error) {
      console.error('Load banned IPs error:', error);
    }
  };

  const banIP = async (ipAddress: string) => {
    const reason = prompt('IP ban nedeni (opsiyonel):');
    if (reason === null) return; // İptal edildi
    
    try {
      const token = getAuthToken();
      const response = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ipAddress,
          reason: reason || 'Spam/Kötüye kullanım'
        })
      });
      
      if (response.ok) {
        alert(`IP ${ipAddress} başarıyla yasaklandı!`);
        setSelectedComment(null);
        loadBannedIPs(); // Listeyi güncelle
      } else {
        const result = await response.json();
        alert(result.error || 'IP yasaklanamadı!');
      }
    } catch (error) {
      console.error('IP ban error:', error);
      alert('IP yasaklanırken hata oluştu!');
    }
  };

  const unbanIP = async (ipId: number, ipAddress: string) => {
    if (!confirm(`${ipAddress} IP yasağını kaldırmak istediğinizden emin misiniz?`)) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/ban-ip?ip=${ipAddress}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert(`IP ${ipAddress} yasağı kaldırıldı!`);
        loadBannedIPs();
      } else {
        const result = await response.json();
        alert(result.error || 'IP yasağı kaldırılamadı!');
      }
    } catch (error) {
      console.error('Unban IP error:', error);
      alert('IP yasağı kaldırılırken hata oluştu!');
    }
  };

  const toggleHideComment = async (commentId: number, currentHiddenStatus: boolean) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_hidden: !currentHiddenStatus
        })
      });
      
      if (response.ok) {
        alert(`Yorum ${!currentHiddenStatus ? 'gizlendi' : 'görünür yapıldı'}!`);
        loadComments();
        setSelectedComment(null);
      } else {
        alert('İşlem başarısız!');
      }
    } catch (error) {
      console.error('Toggle hide comment error:', error);
      alert('Yorum gizlenirken hata oluştu!');
    }
  };

  const submitAdminReply = async () => {
    if (!selectedComment || !adminReply.trim()) {
      alert('Lütfen bir yanıt yazın!');
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/comments/${selectedComment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          admin_reply: adminReply
        })
      });
      
      if (response.ok) {
        alert('Yanıt başarıyla gönderildi!');
        setAdminReply('');
        loadComments();
      } else {
        alert('Yanıt gönderilemedi!');
      }
    } catch (error) {
      console.error('Admin reply error:', error);
      alert('Yanıt gönderilirken hata oluştu!');
    }
  };

  const goToComment = (comment: Comment) => {
    let url = '';
    
    // Kitap yorumu
    if (comment.book_id && !comment.chapter_id) {
      url = `/kitaplar/${comment.book_id}#comments`;
    }
    // Bölüm yorumu (satır olmayan)
    else if (comment.chapter_id && !comment.line_number) {
      url = `/kitaplar/${comment.book_id}/bolum/${comment.chapter_id}#comments`;
    }
    // Satır yorumu
    else if (comment.chapter_id && comment.line_number !== null) {
      url = `/kitaplar/${comment.book_id}/bolum/${comment.chapter_id}?line=${comment.line_number}&commentId=${comment.id}`;
    }
    
    if (url) {
      // Yeni sekmede aç ve yorum panelini otomatik aç
      const newWindow = window.open(url, '_blank');
      
      // Yorum panelini açmak için postMessage gönder
      if (newWindow) {
        newWindow.addEventListener('load', () => {
          // Origin kontrolü ile güvenli postMessage
          try {
            newWindow.postMessage({
              type: 'OPEN_COMMENT',
              commentId: comment.id,
              lineNumber: comment.line_number
            }, window.location.origin);
          } catch (error) {
            console.error('PostMessage error:', error);
          }
        });
      }
    }
  };

  const getCommentType = (comment: Comment) => {
    if (comment.line_number !== null && comment.line_number !== undefined) return '📝 Satır Yorumu';
    if (comment.chapter_id) return '📖 Bölüm Yorumu';
    return '📚 Kitap Yorumu';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
      pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
      rejected: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
      spam: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
    };
    const labels = {
      approved: 'Onaylandı',
      pending: 'Beklemede',
      rejected: 'Reddedildi',
      spam: 'Spam'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      normal: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
      high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
    };
    const labels = {
      low: 'Düşük',
      normal: 'Normal',
      high: 'Yüksek'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">İçerik Yorumları</h1>
          <p className="text-gray-600 dark:text-gray-400">Kitap, bölüm ve satır yorumlarını yönetin</p>
        </div>
        <button
          onClick={() => setShowBannedIPsModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          title="Yasaklı IP adreslerini görüntüle ve yönet"
        >
          <i className="ri-shield-cross-line"></i>
          <span>Yasaklı IP'ler ({bannedIPs.length})</span>
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tümü</option>
              <option value="approved">Onaylandı</option>
              <option value="pending">Beklemede</option>
              <option value="rejected">Reddedildi</option>
              <option value="spam">Spam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Öncelik</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({...filter, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tümü</option>
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tip</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({...filter, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tümü</option>
              <option value="book">Kitap</option>
              <option value="chapter">Bölüm</option>
              <option value="line">Satır</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kitap</label>
            <select
              value={filter.bookId}
              onChange={(e) => setFilter({...filter, bookId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tüm Kitaplar</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>{book.title}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arama</label>
            <input
              type="text"
              placeholder="Yorum içeriği, kullanıcı adı veya email..."
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yorum Listesi */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Yorumlar ({comments.length})
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
              ) : comments.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Yorum bulunamadı</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        selectedComment?.id === comment.id ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                      }`}
                      onClick={() => setSelectedComment(comment)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            {getCommentType(comment)}
                          </span>
                          {comment.line_number !== null && comment.line_number !== undefined && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                              Satır {comment.line_number + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {comment.is_hidden && (
                            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                              <i className="ri-eye-off-line mr-1"></i>
                              Gizli
                            </span>
                          )}
                          {getStatusBadge(comment.status)}
                          {getPriorityBadge(comment.priority)}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {comment.user_name} - {comment.user_email}
                      </div>
                      {comment.user_ip && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <div className="flex items-center space-x-1">
                            <i className="ri-global-line"></i>
                            <span>IP: {comment.user_ip}</span>
                          </div>
                          {comment.user_fingerprint && (
                            <div className="flex items-center space-x-1 mt-0.5">
                              <i className="ri-fingerprint-line"></i>
                              <span className="text-xs">FP: {comment.user_fingerprint.substring(0, 10)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {comment.content}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(comment.created_at).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Yorum Detayı */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yorum Detayı</h3>
            </div>
            <div className="p-4">
              {selectedComment ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tip
                    </label>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      {getCommentType(selectedComment)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kullanıcı
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {selectedComment.user_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedComment.user_email}
                    </div>
                    {selectedComment.user_ip && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-2">
                        <i className="ri-global-line"></i>
                        <span>IP: {selectedComment.user_ip}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      İçerik
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {selectedComment.content}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tarih
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedComment.created_at).toLocaleString('tr-TR')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Durum
                      </label>
                      <select
                        value={selectedComment.status}
                        onChange={(e) => updateCommentStatus(selectedComment.id, e.target.value, selectedComment.priority)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="approved">Onayla</option>
                        <option value="pending">Beklemede</option>
                        <option value="rejected">Reddet</option>
                        <option value="spam">Spam</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Öncelik
                      </label>
                      <select
                        value={selectedComment.priority}
                        onChange={(e) => updateCommentStatus(selectedComment.id, selectedComment.status, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="low">Düşük</option>
                        <option value="normal">Normal</option>
                        <option value="high">Yüksek</option>
                      </select>
                    </div>
                  </div>

                  {/* Admin Yanıt Alanı */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admin Yanıtı
                    </label>
                    {selectedComment.admin_reply ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mb-3">
                        <div className="text-sm text-gray-900 dark:text-white mb-1">
                          {selectedComment.admin_reply}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Yanıtlayan: {selectedComment.admin_reply_by || 'Admin'} - {selectedComment.admin_reply_at ? new Date(selectedComment.admin_reply_at).toLocaleString('tr-TR') : ''}
                        </div>
                      </div>
                    ) : null}
                    <textarea
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="Yoruma yanıt yazın..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-2"
                    />
                    <button
                      onClick={submitAdminReply}
                      disabled={!adminReply.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="ri-reply-line mr-2"></i>
                      Yanıt Gönder
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <button
                      onClick={() => goToComment(selectedComment)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-medium"
                    >
                      <i className="ri-external-link-line mr-2"></i>
                      Yoruma Git
                    </button>

                    <button
                      onClick={() => toggleHideComment(selectedComment.id, selectedComment.is_hidden || false)}
                      className={`w-full px-4 py-2 text-white rounded hover:opacity-90 transition-colors font-medium ${
                        selectedComment.is_hidden 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      <i className={`ri-${selectedComment.is_hidden ? 'eye' : 'eye-off'}-line mr-2`}></i>
                      {selectedComment.is_hidden ? 'Yorumu Göster' : 'Yorumu Gizle'}
                    </button>
                    
                    <button
                      onClick={() => deleteComment(selectedComment.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
                    >
                      <i className="ri-delete-bin-line mr-2"></i>
                      Yorumu Sil
                    </button>
                    
                    {selectedComment.user_ip && (
                      <button
                        onClick={() => banIP(selectedComment.user_ip!)}
                        className="w-full px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors font-medium"
                      >
                        <i className="ri-forbid-line mr-2"></i>
                        IP Ban ({selectedComment.user_ip})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Bir yorum seçin
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Yasaklı IP'ler Modal */}
      {showBannedIPsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                <i className="ri-shield-cross-line mr-2"></i>
                Yasaklı IP Adresleri
              </h2>
              <button
                onClick={() => setShowBannedIPsModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {bannedIPs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <i className="ri-shield-check-line text-6xl mb-4"></i>
                  <p className="text-lg">Yasaklı IP adresi bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bannedIPs.map((bannedIP) => (
                    <div
                      key={bannedIP.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg font-mono font-semibold text-red-600 dark:text-red-400">
                              {bannedIP.ip_address}
                            </span>
                            {bannedIP.auto_banned && (
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 text-xs rounded-full">
                                Otomatik
                              </span>
                            )}
                            {bannedIP.suspicion_score > 0 && (
                              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                                Risk: {bannedIP.suspicion_score}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {bannedIP.subnet && (
                              <div className="text-gray-600 dark:text-gray-400">
                                <i className="ri-router-line mr-1"></i>
                                <span className="font-medium">Subnet:</span> {bannedIP.subnet}
                              </div>
                            )}
                            {bannedIP.fingerprint && (
                              <div className="text-gray-600 dark:text-gray-400">
                                <i className="ri-fingerprint-line mr-1"></i>
                                <span className="font-medium">Fingerprint:</span> {bannedIP.fingerprint.substring(0, 20)}...
                              </div>
                            )}
                            {bannedIP.reason && (
                              <div className="text-gray-600 dark:text-gray-400 col-span-2">
                                <i className="ri-information-line mr-1"></i>
                                <span className="font-medium">Sebep:</span> {bannedIP.reason}
                              </div>
                            )}
                            <div className="text-gray-600 dark:text-gray-400">
                              <i className="ri-user-line mr-1"></i>
                              <span className="font-medium">Yasaklayan:</span> {bannedIP.banned_by || 'Sistem'}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              <i className="ri-time-line mr-1"></i>
                              <span className="font-medium">Tarih:</span> {new Date(bannedIP.created_at).toLocaleString('tr-TR')}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => unbanIP(bannedIP.id, bannedIP.ip_address)}
                          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <i className="ri-shield-check-line"></i>
                          <span>Yasağı Kaldır</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowBannedIPsModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
