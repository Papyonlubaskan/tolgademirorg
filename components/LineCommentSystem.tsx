'use client';

import { useState, useEffect, useRef } from 'react';

interface LineComment {
  id: number;
  lineNumber: number;
  content: string;
  userName: string;
  createdAt: string;
  replies?: LineComment[];
}

interface LineCommentSystemProps {
  text: string;
  targetType: 'book' | 'chapter';
  targetId: string | number;
  className?: string;
}

export default function LineCommentSystem({ 
  text, 
  targetType, 
  targetId, 
  className = '' 
}: LineCommentSystemProps) {
  const [comments, setComments] = useState<LineComment[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [targetType, targetId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?type=${targetType}_line&targetId=${targetId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Group comments by line number
          const commentsByLine = result.data.reduce((acc: { [key: number]: LineComment[] }, comment: any) => {
            const lineNum = parseInt(comment.line_number || '0');
            if (!acc[lineNum]) {
              acc[lineNum] = [];
            }
            acc[lineNum].push({
              id: comment.id,
              lineNumber: lineNum,
              content: comment.content,
              userName: comment.user_name,
              createdAt: comment.created_at
            });
            return acc;
          }, {});

          setComments(Object.values(commentsByLine).flat() as LineComment[]);
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineClick = (lineNumber: number) => {
    setSelectedLine(selectedLine === lineNumber ? null : lineNumber);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !userName.trim() || selectedLine === null) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: `${targetType}_line`,
          targetId,
          lineNumber: selectedLine,
          content: newComment.trim(),
          userName: userName.trim()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Add new comment to state
          const newCommentObj: LineComment = {
            id: result.data.id,
            lineNumber: selectedLine,
            content: newComment.trim(),
            userName: userName.trim(),
            createdAt: new Date().toISOString()
          };
          
          setComments(prev => [...prev, newCommentObj]);
          setNewComment('');
          setSelectedLine(null);
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCommentsForLine = (lineNumber: number): LineComment[] => {
    return comments.filter(comment => comment.lineNumber === lineNumber);
  };

  const renderTextWithComments = () => {
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const lineComments = getCommentsForLine(lineNumber);
      const hasComments = lineComments.length > 0;
      const isSelected = selectedLine === lineNumber;

      return (
        <div
          key={index}
          className={`relative group ${hasComments ? 'border-l-4 border-orange-400 pl-2' : ''} ${
            isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : ''
          }`}
        >
          {/* Line number and clickable area */}
          <div
            className={`flex cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
              isSelected ? 'bg-orange-100 dark:bg-orange-800/30' : ''
            }`}
            onClick={() => handleLineClick(lineNumber)}
          >
            <div className="w-12 text-right text-sm text-gray-500 dark:text-gray-400 pr-2 select-none">
              {lineNumber}
            </div>
            <div className="flex-1 font-mono text-sm leading-relaxed">
              {line || '\u00A0'}
            </div>
            {hasComments && (
              <div className="w-8 text-center">
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-orange-500 rounded-full">
                  {lineComments.length}
                </span>
              </div>
            )}
          </div>

          {/* Comments for this line */}
          {isSelected && (
            <div className="ml-14 mt-2 space-y-3">
              {/* Existing comments */}
              {lineComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {comment.userName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
              ))}

              {/* New comment form */}
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Adınız"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder={`Satır ${lineNumber} için yorum yazın...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLine(null)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim() || !userName.trim()}
                    className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Yorum Ekle'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex">
              <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Satır Yorumları:</strong> Herhangi bir satıra tıklayarak o satır hakkında yorum yapabilirsiniz.
        </p>
      </div>
      
      <div ref={textRef} className="font-mono text-sm leading-relaxed">
        {renderTextWithComments()}
      </div>
    </div>
  );
}
