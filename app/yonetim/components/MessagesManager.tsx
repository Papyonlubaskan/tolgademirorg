
'use client';

import { useState, useEffect } from 'react';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: 'unread' | 'read' | 'replied';
  priority: 'normal' | 'high' | 'low';
  reply_message?: string;
  replied_at?: string;
}


export default function MessagesManager() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setMessages(result.data);
        } else {
          setMessages([]);
        }
      } else {
        console.error('Mesajlar yüklenemedi');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };


  const filteredMessages = messages.filter((message: Message) => {
    if (filter === 'all') return true;
    return message.status === filter;
  });


  const unreadCount = messages.filter((msg: Message) => msg.status === 'unread').length;

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      try {
        const response = await fetch(`/api/messages`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ id: message.id, status: 'read' }),
        });

        if (response.ok) {
          await loadMessages();
        } else {
          // Fallback to local update
          setMessages(messages.map((msg: Message) => 
            msg.id === message.id ? { ...msg, status: 'read' } : msg
          ));
        }
      } catch (error) {
        console.error('Error updating message status:', error);
        // Fallback to local update
        setMessages(messages.map((msg: Message) => 
          msg.id === message.id ? { ...msg, status: 'read' } : msg
        ));
      }
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsReplying(true);
    try {
      // Cevabı database'e kaydet
      const response = await fetch(`/api/messages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ 
          id: selectedMessage.id, 
          reply: replyText.trim(),
          status: 'replied'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadMessages();
          setReplyText('');
          setSelectedMessage(null);
          alert(`✅ Cevap kaydedildi!\n\n💡 Manuel mail gönderimi:\n📧 Alıcı: ${selectedMessage.email}\n📨 Konu: Re: ${selectedMessage.subject}\n\nCevabınız sisteme kaydedildi. Maili manuel olarak tolgademir@okandemir.org adresinden gönderebilirsiniz.`);
        } else {
          throw new Error(result.error || 'Cevap kaydedilemedi');
        }
      } else {
        throw new Error('Database güncelleme hatası');
      }
    } catch (error: any) {
      console.error('Error saving reply:', error);
      alert(`❌ Cevap kaydedilirken hata oluştu!\n\n${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadMessages();
        setSelectedMessage(null);
        alert('Mesaj başarıyla silindi!');
      } else {
        alert('Mesaj silinemedi!');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Mesaj silinirken hata oluştu!');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'read': return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      case 'replied': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mesaj Yönetimi</h1>
          <p className="text-gray-700 dark:text-gray-300">İletişim mesajlarını yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} okunmamış mesaj
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex px-6">
            <div className="py-4 px-2 border-b-2 border-orange-500 font-medium text-sm text-orange-600">
              <i className="ri-mail-line mr-2"></i>
              İletişim Mesajları ({messages.length})
            </div>
          </nav>
        </div>

        <div className="p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Messages List */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {/* Filter Tabs */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      {[
                        { key: 'all', label: 'Tümü' },
                        { key: 'unread', label: 'Okunmamış' },
                        { key: 'read', label: 'Okundu' },
                        { key: 'replied', label: 'Yanıtlanan' }
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setFilter(tab.key)}
                          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            filter === tab.key
                              ? 'bg-white dark:bg-gray-900 text-orange-600 shadow-sm'
                              : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Yükleniyor...</p>
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <i className="ri-mail-line text-3xl mb-2"></i>
                        <p>Mesaj bulunamadı</p>
                      </div>
                    ) : (
                      filteredMessages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`group relative border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            selectedMessage?.id === message.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleMessageClick(message)}
                            className="w-full p-4 text-left cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">{message.name}</span>
                                {message.priority === 'high' && (
                                  <i className="ri-flag-line text-xs text-red-500"></i>
                                )}
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                                {message.status === 'unread' ? 'Okunmamış' :
                                 message.status === 'replied' ? 'Yanıtlandı' : 'Okundu'}
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">{message.subject}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{message.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(message.created_at).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(message.id);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                            title="Mesajı Sil"
                          >
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Message Detail */}
              <div className="lg:col-span-2">
                {selectedMessage ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    {/* Message Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {selectedMessage.subject}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-700 dark:text-gray-300">
                            <span><strong>Kimden:</strong> {selectedMessage.name}</span>
                            <span><strong>E-posta:</strong> {selectedMessage.email}</span>
                            <span><strong>Tarih:</strong> {new Date(selectedMessage.created_at).toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMessage.status)}`}>
                            {selectedMessage.status === 'unread' ? 'Okunmamış' :
                             selectedMessage.status === 'replied' ? 'Yanıtlandı' : 'Okundu'}
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(selectedMessage.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <i className="ri-delete-line"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="p-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedMessage.message}</p>
                      </div>

                      {/* Previous Reply (if exists) */}
                      {selectedMessage.reply_message && (
                        <div className="mb-6">
                          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center">
                                <i className="ri-reply-line mr-2"></i>
                                Gönderilen Cevap
                              </h4>
                              {selectedMessage.replied_at && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  {new Date(selectedMessage.replied_at).toLocaleString('tr-TR')}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedMessage.reply_message}</p>
                          </div>
                        </div>
                      )}

                      {/* Reply Section */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Yanıt Gönder</h4>
                        <div className="space-y-4">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                            placeholder="Yanıtınızı yazın..."
                          />
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Yanıt <strong>{selectedMessage.email}</strong> adresine email ile gönderilecek
                            </div>
                            <button
                              onClick={handleReply}
                              disabled={!replyText.trim() || isReplying}
                              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center"
                            >
                              {isReplying ? (
                                <>
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                  Gönderiliyor...
                                </>
                              ) : (
                                <>
                                  <i className="ri-send-plane-line mr-2"></i>
                                  Yanıtla
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center h-96">
                    <div className="text-center text-gray-500">
                      <i className="ri-mail-line text-6xl mb-4 text-gray-300"></i>
                      <p className="text-lg">Mesaj Seçin</p>
                      <p className="text-sm">Görüntülemek için soldaki listeden bir mesaj seçin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
