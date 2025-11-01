'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: number;
  user_id?: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface CommentSystemProps {
  bookId?: string;
  chapterId?: string;
}

export default function CommentSystem({ bookId, chapterId }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    // Kullanıcı ID'sini oluştur veya al
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', userId);
    }
    setCurrentUserId(userId);

    loadComments();
  }, [bookId, chapterId]);

  const loadComments = async () => {
    if (!bookId && !chapterId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (bookId) params.set('bookId', bookId);
      if (chapterId) params.set('chapterId', chapterId);
      
      const response = await fetch(`/api/comments?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !userName.trim()) return;

    try {
      setSubmitting(true);
      const body: any = {
        userName: userName.trim(),
        content: newComment.trim(),
        userId: currentUserId,
      };
      if (bookId) body.bookId = bookId;
      if (chapterId) body.chapterId = chapterId;
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewComment('');
        // Kullanıcı adını hatırla
        localStorage.setItem('user_name', userName.trim());
        loadComments();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editText.trim()) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          content: editText.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingComment(null);
        setEditText('');
        loadComments();
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        loadComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Kullanıcı adını otomatik doldur
  useEffect(() => {
    const savedName = localStorage.getItem('user_name');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        Yorumlar ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={submitComment} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Adınız"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
        <div>
          <textarea
            placeholder="Yorumunuzu yazın..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
            rows={4}
            required
            minLength={3}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Gönderiliyor...' : 'Yorum Yap'}
        </button>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 dark:border-orange-400 mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Henüz yorum yapılmamış. İlk yorumu siz yapın!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {comment.user_name}
                  {comment.user_id === currentUserId && (
                    <span className="ml-2 text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 px-2 py-1 rounded">
                      Siz
                    </span>
                  )}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
              
              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm cursor-pointer"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg text-sm cursor-pointer"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  
                  {comment.user_id === currentUserId && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => startEditing(comment)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <i className="ri-edit-line"></i>
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer"
                      >
                        <i className="ri-delete-bin-line"></i>
                        Sil
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}