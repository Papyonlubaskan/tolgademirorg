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
    // Kullanici ID'sini olustur veya al
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
        // Kullanici adini hatirla
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
    if (!confirm('Bu yorumu silmek istediginizden emin misiniz?')) return;

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

  // Kullanici adini otomatik doldur
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
            placeholder="Adiniz"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>
        <div>
          <textarea
            placeholder="Yorumunuzu yazin..."
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
          {submitting ? 'Gonderiliyor...' : 'Yorum Yap'}
        </button>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Henuz yorum yapilmamis. Ilk yorumu siz yapin!</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{comment.user_name}</span>
                    <span className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
              
              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditComment(comment.id)}
                          className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={cancelEditing}
                          className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
                    >
                          Iptal
                    </button>
                  </div>
                </div>
              ) : (
                  <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  )}
                </div>
                  
                {comment.user_id === currentUserId && editingComment !== comment.id && (
                  <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEditing(comment)}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                      Duzenle
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Sil
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
