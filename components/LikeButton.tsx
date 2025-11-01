'use client';

import { useState, useEffect } from 'react';

interface LikeButtonProps {
  bookId?: string;
  chapterId?: string;
  initialLikes?: number;
  initialIsLiked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function LikeButton({ 
  bookId,
  chapterId,
  initialLikes = 0, 
  initialIsLiked = false,
  size = 'md'
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ((bookId || chapterId) && initialLikes === 0) {
      loadLikeStatus();
    }
  }, [bookId, chapterId]);

  const loadLikeStatus = async () => {
    if (!bookId && !chapterId) return;
    
    try {
      const params = new URLSearchParams();
      if (bookId) params.set('bookId', bookId);
      if (chapterId) params.set('chapterId', chapterId);
      
      const response = await fetch(`/api/likes?${params.toString()}`);
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setLikes(data.data.likeCount || 0);
        setIsLiked(data.data.isLiked || false);
      }
    } catch (error) {
      console.error('Error loading like status:', error);
    }
  };

  const handleLike = async () => {
    if (loading) return;

    const wasLiked = isLiked;
    const previousCount = likes;
    
    // Optimistic update - anında UI'ı güncelle
    const newLiked = !isLiked;
    const newCount = newLiked ? likes + 1 : Math.max(0, likes - 1);
    
    setIsLiked(newLiked);
    setLikes(newCount);
    setLoading(true);

    try {
      const body: any = { action: newLiked ? 'like' : 'unlike' };
      if (bookId) body.bookId = bookId;
      if (chapterId) body.chapterId = chapterId;
      
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Sunucudan gelen gerçek değerle güncelle
        setLikes(data.data.totalLikes || 0);
        setIsLiked(data.data.isLiked || false);
      } else {
        // Hata olursa eski değere geri dön
        setIsLiked(wasLiked);
        setLikes(previousCount);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Hata olursa eski değere geri dön
      setIsLiked(wasLiked);
      setLikes(previousCount);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`
        flex items-center space-x-2 rounded-lg font-medium transition-all duration-200
        ${sizeClasses[size]}
        ${isLiked 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
      `}
    >
      <i className={`ri-heart-${isLiked ? 'fill' : 'line'} ${iconSizes[size]} ${isLiked ? 'text-red-500' : ''}`}></i>
      <span>{likes}</span>
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
    </button>
  );
}