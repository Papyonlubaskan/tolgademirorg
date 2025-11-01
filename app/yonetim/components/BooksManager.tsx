
'use client';

import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';

const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

export default function BooksManager() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [showChapters, setShowChapters] = useState<{ [key: string]: boolean }>({});
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    cover_image: '',
    publish_date: '',
    status: 'published' as string,
    amazon_link: '',
    dr_link: '',
    idefix_link: '',
    author: 'Tolga Demir',
    slug: ''
  });

  const [chapterFormData, setChapterFormData] = useState({
    title: '',
    content: '',
    order: 1
  });

  const [uploadingCover, setUploadingCover] = useState(false);

  /* -------------------------------------------------
   * Lifecycle
   * ------------------------------------------------- */
  useEffect(() => {
    loadBooks();
  }, []);

  /* -------------------------------------------------
   * UI helpers
   * ------------------------------------------------- */
  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  // Otomatik slug olu�turma
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-������������]/g, '')
      .replace(/[��]/g, 'g')
      .replace(/[��]/g, 'u')
      .replace(/[��]/g, 's')
      .replace(/[��]/g, 'i')
      .replace(/[��]/g, 'o')
      .replace(/[��]/g, 'c')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      cover_image: '',
      publish_date: '',
      status: 'published' as string,
      amazon_link: '',
      dr_link: '',
      idefix_link: '',
      author: 'Tolga Demir',
      slug: ''
    });
    setEditingBook(null);
    setShowForm(false);
  };

  const resetChapterForm = () => {
    setChapterFormData({
      title: '',
      content: '',
      order: 1
    });
    setEditingChapter(null);
    setShowChapterForm(false);
  };

  const handleEdit = async (book: any) => {
    // Kitab�n g�ncel b�l�mlerini y�kle
    let bookWithChapters = { ...book };
    try {
      const chaptersResponse = await fetch(`/api/chapters?bookId=${book.id}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      
      if (chaptersResponse.ok) {
        const chaptersResult = await chaptersResponse.json();
        if (chaptersResult.success && Array.isArray(chaptersResult.data)) {
          bookWithChapters.chapters = chaptersResult.data;
        }
      }
    } catch (error) {
      console.error('B�l�mler y�klenirken hata:', error);
      bookWithChapters.chapters = [];
    }

    setEditingBook(bookWithChapters);
    setFormData({
      title: book.title || '',
      slug: book.slug || '',
      description: book.description || '',
      content: book.content || '',
      cover_image: book.cover_image || '',
      publish_date: book.publish_date || '',
      status: book.status || 'draft',
      amazon_link: book.amazon_link || '',
      dr_link: book.dr_link || '',
      idefix_link: book.idefix_link || '',
      author: book.author || 'Tolga Demir'
    });
    setShowForm(true);
  };

  /* -------------------------------------------------
   * API calls
   * ------------------------------------------------- */
  const loadBooks = async () => {
    try {
      setLoading(true);
      
      const token = getAuthToken();
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/books?limit=100`, {
        headers
      });

      if (!response.ok) {
        console.error('? Books API request failed:', response.status);
        setBooks([]);
        return;
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        console.error('? Invalid books API response format:', result);
        setBooks([]);
        return;
      }

      const booksData = result.data;

      // Load chapters for each book
      const booksWithChapters = await Promise.all(
        booksData.map(async (book: any) => {
          try {
            const chaptersResponse = await fetch(
              `/api/chapters?bookId=${book.id}`,
              {
                headers: {
                  Authorization: `Bearer ${getAuthToken()}`
                }
              }
            );

            if (!chaptersResponse.ok) {
              console.error(`? Chapters API error for ${book.title}:`, chaptersResponse.status);
              return { ...book, chapters: [] };
            }

            const chaptersResult = await chaptersResponse.json();

            if (chaptersResult.success && Array.isArray(chaptersResult.data)) {
              return { ...book, chapters: chaptersResult.data };
            }

            console.warn(`?? No chapters data for ${book.title}`);
            return { ...book, chapters: [] };
          } catch (e) {
            console.error(`? Chapter loading error for ${book.title}:`, e);
            return { ...book, chapters: [] };
          }
        })
      );

      setBooks(booksWithChapters);
    } catch (e) {
      console.error('? Books loading error:', e);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Sadece yeni kitap eklerken title zorunlu
    if (!editingBook && !formData.title.trim()) {
      showMessage('Kitap ba�l��� gereklidir!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const url = editingBook
        ? `/api/books/${editingBook.id}`
        : `/api/books`;

      const method = editingBook ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(editingBook ? 'G�ncelleme hatas�' : 'Ekleme hatas�');
      }

      const result = await response.json();
      
      if (!editingBook) {
        // Yeni kitap eklendi - otomatik d�zenleme moduna ge�
        showMessage('Kitap ba�ar�yla eklendi! �imdi b�l�m ekleyebilirsiniz.', 'success');
        await loadBooks();
        
        // Yeni eklenen kitab� bul ve d�zenleme moduna ge�
        if (result.success && result.data) {
          const newBook = result.data;
          // B�l�mleri y�kle
          try {
            const chaptersResponse = await fetch(`/api/chapters?bookId=${newBook.id}`, {
              headers: { Authorization: `Bearer ${getAuthToken()}` }
            });
            if (chaptersResponse.ok) {
              const chaptersResult = await chaptersResponse.json();
              if (chaptersResult.success) {
                newBook.chapters = chaptersResult.data;
              }
            }
          } catch (error) {
            console.error('B�l�mler y�klenirken hata:', error);
            newBook.chapters = [];
          }
          
          setEditingBook(newBook);
          setFormData({
            title: newBook.title || '',
            slug: newBook.slug || '',
            description: newBook.description || '',
            content: newBook.content || '',
            cover_image: newBook.cover_image || '',
            publish_date: newBook.publish_date || '',
            status: newBook.status || 'draft',
            amazon_link: newBook.amazon_link || '',
            dr_link: newBook.dr_link || '',
            idefix_link: newBook.idefix_link || '',
            author: newBook.author || 'Tolga Demir'
          });
          // Form a��k kals�n
        }
      } else {
        showMessage('Kitap ba�ar�yla g�ncellendi!', 'success');
        resetForm();
        await loadBooks();
      }
    } catch (e) {
      console.error('Save error:', e);
      showMessage('Kaydetme s�ras�nda hata olu�tu!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kitab� silmek istedi�inizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Silme hatas�');

      showMessage('Kitap ba�ar�yla silindi!', 'success');
      await loadBooks();
    } catch (e) {
      console.error('Delete error:', e);
      showMessage('Silme s�ras�nda hata olu�tu!', 'error');
    }
  };

  const toggleChapters = (bookId: string) => {
    setShowChapters(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };

  const handleAddChapter = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    const nextOrder = book?.chapters?.length ? book.chapters.length + 1 : 1;

    setEditingChapter({ bookId, chapterId: null });
    setChapterFormData({ title: '', content: '', order: nextOrder });
    setShowChapterForm(true);
  };

  const handleEditChapter = (bookId: string, chapter: any) => {
    setEditingChapter({ bookId, chapterId: chapter.id });
    setChapterFormData({
      title: chapter.title || '',
      content: chapter.content || '',
      order: chapter.order_number || chapter.order || chapter.chapter_number || 1
    });
    setShowChapterForm(true);
  };

  const validateChapterForm = () => {
    if (!chapterFormData.title.trim()) {
      showMessage('B�l�m ba�l��� gereklidir!', 'error');
      return false;
    }
    if (!chapterFormData.content.trim()) {
      showMessage('B�l�m i�eri�i gereklidir!', 'error');
      return false;
    }
    return true;
  };

  const handleSaveChapter = async () => {
    if (!validateChapterForm()) return;

    setIsLoading(true);
    try {
      const { bookId, chapterId } = editingChapter;

      const url = chapterId
        ? `/api/chapters/${chapterId}`
        : `/api/chapters`;

      const method = chapterId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          book_id: bookId,
          title: chapterFormData.title,
          content: chapterFormData.content,
          order_number: chapterFormData.order
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`HTTP ${response.status} - ${err}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'B�l�m i�lemi hatal�');
      }

      showMessage(chapterId ? 'B�l�m ba�ar�yla g�ncellendi!' : `B�l�m "${result.data.title}" eklendi!`, 'success');
      resetChapterForm();

      // EditingBook'u g�ncelle
      if (editingBook && editingBook.id === bookId) {
        const chaptersResponse = await fetch(`/api/chapters?bookId=${bookId}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        if (chaptersResponse.ok) {
          const chaptersResult = await chaptersResponse.json();
          if (chaptersResult.success) {
            setEditingBook({ ...editingBook, chapters: chaptersResult.data });
          }
        }
      }

      // Kitaplar listesini de g�ncelle
      await loadBooks();
    } catch (e: any) {
      console.error('Chapter save error:', e);
      showMessage('B�l�m kaydedilirken hata olu�tu: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChapter = async (bookId: string, chapterId: string) => {
    if (!confirm('Bu b�l�m� silmek istedi�inizden emin misiniz?')) return;

    try {
      const response = await fetch(
        `/api/chapters/${chapterId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getAuthToken()}`
          }
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Silme hatas�: ${response.status} - ${err}`);
      }

      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Silme hatas�');

      showMessage('B�l�m ba�ar�yla silindi!', 'success');

      // EditingBook'u g�ncelle
      if (editingBook && editingBook.id === bookId) {
        const chaptersResponse = await fetch(`/api/chapters?bookId=${bookId}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        if (chaptersResponse.ok) {
          const chaptersResult = await chaptersResponse.json();
          if (chaptersResult.success) {
            setEditingBook({ ...editingBook, chapters: chaptersResult.data });
          }
        }
      }

      // Kitaplar listesini de g�ncelle
      await loadBooks();
    } catch (e: any) {
      console.error('Chapter delete error:', e);
      showMessage('B�l�m silinirken hata olu�tu: ' + e.message, 'error');
    }
  };

  /* -------------------------------------------------
   * Cover upload
   * ------------------------------------------------- */
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('Dosya boyutu �ok b�y�k (max 5MB)', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showMessage('Sadece resim dosyalar� y�klenebilir', 'error');
      return;
    }

    setUploadingCover(true);
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `book_cover_${timestamp}_${randomId}.${ext}`;

      const base64 = await fileToBase64(file);

      const mediaData = {
        filename: cleanFileName,
        original_name: file.name,
        file_data: base64,
        file_size: file.size,
        file_type: file.type,
        alt_text: formData.title ? `${formData.title} kapak resmi` : 'Kitap kapak resmi',
        description: 'Kitap kapak g�rseli'
      };

      const response = await fetch(`/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(mediaData)
      });

      if (!response.ok) {
        const err = await response.text();
        let errorMsg = 'Kapak resmi y�klenirken hata olu�tu';
        try {
          const parsed = JSON.parse(err);
          errorMsg = parsed.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Kapak resmi y�kleme hatas�');

      const imageUrl = result.data.file_path || result.data.url;
      setFormData(prev => ({ ...prev, cover_image: imageUrl }));
      showMessage('Kapak resmi ba�ar�yla y�klendi!', 'success');
    } catch (e: any) {
      console.error('Cover upload error:', e);
      let userMsg = 'Kapak resmi y�klenirken hata olu�tu';
      if (e.message.includes('Bucket not found')) {
        userMsg = 'Dosya depolama sistemi hen�z haz�r de�il. L�tfen birka� saniye sonra tekrar deneyin.';
      } else if (e.message.includes('too large')) {
        userMsg = 'Dosya boyutu �ok b�y�k. L�tfen 5MB alt�nda bir resim se�in.';
      }
      showMessage(userMsg, 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = err => reject(err);
    });
  };

  /* -------------------------------------------------
   * UI Rendering
   * ------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            messageType === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}
        >
          <div className="flex items-center">
            <i className={`${messageType === 'error' ? 'ri-error-warning-line' : 'ri-check-circle-line'} mr-2`}></i>
            {message}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kitap Y�netimi</h2>
          <p className="text-gray-700 dark:text-gray-300">Kitaplar�n�z� ve b�l�mlerini y�netin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          Yeni Kitap Ekle
        </button>
      </div>

      {/* ---------- Book Form Modal ---------- */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingBook ? 'Kitap D�zenle' : 'Yeni Kitap Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBook(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                  Kitap Ba�l��� {!editingBook && '*'}
                </label>
                <input
                  type="text"
                  required={!editingBook}
                  value={formData.title}
                  onChange={e => {
                    const newTitle = e.target.value;
                    const newSlug = generateSlug(newTitle);
                    setFormData({ ...formData, title: newTitle, slug: newSlug });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Kitap ba�l���n� girin"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Yazar</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Yazar ad� (varsay�lan: Tolga Demir)"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                  URL Slug (otomatik olu�turulur)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="url-slug-otomatik-olusur"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  URL'de kullan�lacak slug. Ba�l�k yaz�ld���nda otomatik olu�turulur.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">A��klama</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Kitap a��klamas�"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">��erik</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Kitap i�eri�i veya �zeti"
                />
              </div>

              {/* Cover */}
              <ImageUploader
                label="Kapak Resmi"
                value={formData.cover_image}
                onChange={(url) => setFormData({ ...formData, cover_image: url })}
              />

              {/* Publish date, category & status */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Yay�n Tarihi</label>
                  <input
                    type="date"
                    value={formData.publish_date}
                    onChange={e => setFormData({ ...formData, publish_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Kategori</label>
                  <select
                    value={formData.category || 'Roman'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Genel">Genel</option>
                    <option value="Roman">Roman</option>
                    <option value="Hikaye">Hikaye</option>
                    <option value="Deneme">Deneme</option>
                    <option value="�iir">�iir</option>
                    <option value="�yk�">�yk�</option>
                    <option value="Makale">Makale</option>
                    <option value="Ele�tiri">Ele�tiri</option>
                    <option value="Senaryo">Senaryo</option>
                    <option value="Arkas� Yar�n">Arkas� Yar�n</option>
                    <option value="Dizi">Dizi</option>
                    <option value="Animasyon">Animasyon</option>
                    <option value="Komedi">Komedi</option>
                    <option value="Trajedi">Trajedi</option>
                    <option value="Trajikomik">Trajikomik</option>
                    <option value="K�sa Film">K�sa Film</option>
                    <option value="Kukla Tiyatrolar�">Kukla Tiyatrolar�</option>
                    <option value="Oyun Metinleri">Oyun Metinleri</option>
                    <option value="Ske�ler">Ske�ler</option>
                    <option value="Dram">Dram</option>
                    <option value="Drama">Drama</option>
                    <option value="Tan�t�m Filmi & Reklam">Tan�t�m Filmi & Reklam</option>
                    <option value="Tez">Tez</option>
                    <option value="Mektup">Mektup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Durum</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="draft">Taslak</option>
                    <option value="published">Yay�nda</option>
                    <option value="archived">Ar�ivlenmi�</option>
                  </select>
                </div>
              </div>

              {/* Sales links */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Sat�� Linkleri</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Amazon Link</label>
                  <input
                    type="url"
                    value={formData.amazon_link}
                    onChange={e => setFormData({ ...formData, amazon_link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://amazon.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Tamadres Link</label>
                  <input
                    type="url"
                    value={formData.dr_link}
                    onChange={e => setFormData({ ...formData, dr_link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://tamadres.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">BKM Kitap Link</label>
                  <input
                    type="url"
                    value={formData.idefix_link}
                    onChange={e => setFormData({ ...formData, idefix_link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://bkmkitap.com/..."
                  />
                </div>
              </div>

              {/* B�l�mler (Sadece d�zenleme modunda) */}
              {editingBook && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      B�l�mler ({editingBook.chapters?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleAddChapter(editingBook.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-add-line mr-2"></i>
                      B�l�m Ekle
                    </button>
                  </div>

                  {!editingBook.chapters || editingBook.chapters.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <i className="ri-article-line text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                      <p className="text-gray-600 dark:text-gray-400">Hen�z b�l�m eklenmemi�</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {editingBook.chapters
                        .sort((a: any, b: any) => (a.order_number || a.order || a.chapter_number || 0) - (b.order_number || b.order || b.chapter_number || 0))
                        .map((chapter: any) => (
                          <div key={chapter.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">{chapter.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                S�ra: {chapter.order_number || chapter.order || chapter.chapter_number} � ��erik: {chapter.content?.length || 0} karakter
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditChapter(editingBook.id, chapter)}
                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <i className="ri-edit-line mr-1"></i>
                                D�zenle
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteChapter(editingBook.id, chapter.id)}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <i className="ri-delete-bin-line mr-1"></i>
                                Sil
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line mr-2"></i>
                      {editingBook ? 'G�ncelle' : 'Kaydet'}
                    </>
                  )}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
                  �ptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Chapter Form Modal ---------- */}
      {showChapterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingChapter?.chapterId ? 'B�l�m D�zenle' : 'Yeni B�l�m Ekle'}
              </h3>
              <button onClick={resetChapterForm} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSaveChapter();
              }}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">B�l�m Ba�l��� *</label>
                <input
                  type="text"
                  required
                  value={chapterFormData.title}
                  onChange={e => setChapterFormData({ ...chapterFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="B�l�m ba�l���n� girin"
                />
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">S�ra Numaras�</label>
                <input
                  type="number"
                  min="1"
                  value={chapterFormData.order}
                  onChange={e => setChapterFormData({ ...chapterFormData, order: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Content */}
              <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                    B�l�m ��eri�i *
                    <span className="text-xs text-gray-500 ml-2">(Tab: girinti ekle, �ift Enter: yeni paragraf)</span>
                  </label>
                <textarea
                  required
                  value={chapterFormData.content}
                  onChange={e => setChapterFormData({ ...chapterFormData, content: e.target.value })}
                    onKeyDown={(e) => {
                      // Tab tu�u ile paragraf girinti ekle
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const textarea = e.currentTarget;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const currentValue = chapterFormData.content;
                        
                        // 5 bo�luk ekle (paragraf girintisi)
                        const newValue = currentValue.substring(0, start) + '     ' + currentValue.substring(end);
                        setChapterFormData({ ...chapterFormData, content: newValue });
                        
                        // Cursor'� girintinin sonuna ta��
                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + 5;
                        }, 0);
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      
                      console.log('?? Paste event tetiklendi');
                      console.log('?? Orijinal metin:', text);
                      
                      // 1. Temel karakter temizli�i
                      let cleanedText = text
                        .replace(/\r\n/g, '\n')  // Windows sat�r sonlar�
                        .replace(/\r/g, '\n')    // Mac sat�r sonlar�
                        .replace(/\u00A0/g, ' ') // Non-breaking space
                        .replace(/\uFEFF/g, '')  // BOM karakteri
                        .replace(/\u2013/g, '-') // En dash
                        .replace(/\u2014/g, '--') // Em dash
                        .replace(/\u2018/g, "'") // Left single quote
                        .replace(/\u2019/g, "'") // Right single quote
                        .replace(/\u201C/g, '"') // Left double quote
                        .replace(/\u201D/g, '"'); // Right double quote
                      
                      console.log('?? Temizlenmi� metin:', cleanedText);
                      
                      // 2. Geli�mi� paragraf alg�lama ve d�zenleme
                      // PDF'den kopyalanan paragraflar� daha iyi alg�la
                      
                      // �nce mevcut �ift sat�r sonlar�n� koru (PDF'den gelen paragraflar)
                      console.log('?? Orijinal �ift sat�r sonlar�:', (cleanedText.match(/\n\s*\n/g) || []).length);
                      
                      // C�mle sonlar� sonras� sat�r sonlar�n� i�aretle
                      cleanedText = cleanedText.replace(/([.!?])\s*\n/g, '$1\n\n');
                      
                      // B�y�k harfle ba�layan sat�rlar� daha agresif �ekilde paragraf yap
                      // �nceki sat�r c�mle sonu ile bitiyorsa ve yeni sat�r b�y�k harfle ba�l�yorsa paragraf
                      cleanedText = cleanedText.replace(/([.!?])\n([A-Z������])/g, '$1\n\n$2');
                      
                      // T�rnak i�areti ile ba�layan sat�rlar� yeni paragraf olarak i�aretle (diyalog)
                      cleanedText = cleanedText.replace(/\n(\s*[""''])/g, '\n\n$1');
                      
                      // �ok k�sa sat�rlar� (tek kelime) paragraf ba�� yapma - daha az agresif
                      cleanedText = cleanedText.replace(/\n\n([A-Z������][a-z������������]{1,2})\n/g, '\n$1\n');
                      
                      console.log('?? ��lenmi� �ift sat�r sonlar�:', (cleanedText.match(/\n\s*\n/g) || []).length);
                      
                      // 3. Paragraflar� ay�r (�ift sat�r sonu ile)
                      const paragraphs = cleanedText.split(/\n\s*\n/);
                      console.log('?? Paragraflar:', paragraphs.length);
                      
                      // 4. Her paragraf� i�le
                      const processedParagraphs = paragraphs.map((paragraph, index) => {
                        let cleanParagraph = paragraph.trim();
                        
                        console.log(`?? Paragraf ${index + 1}:`, cleanParagraph.substring(0, 50) + '...');
                        
                        // 5. Paragraf ba��nda girinti kontrol�
                        const indentMatch = cleanParagraph.match(/^(\s+)/);
                        const hasIndent = indentMatch && indentMatch[1].length > 0;
                        
                        // 6. C�mle ortas� sat�r sonlar�n� d�zelt (PDF'den gelen)
                        // Ama c�mle sonlar�n� koru
                        cleanParagraph = cleanParagraph.replace(/([a-z������������])\n([a-z������������])/g, '$1 $2');
                        
                        // 7. Birden fazla bo�lu�u tek bo�lu�a �evir
                        cleanParagraph = cleanParagraph.replace(/\s+/g, ' ');
                        
                        // 8. Girinti varsa koru (4 bo�luk)
                        if (hasIndent) {
                          cleanParagraph = '    ' + cleanParagraph.trim();
                        }
                        
                        return cleanParagraph;
                      });
                      
                      // 9. Paragraflar� birle�tir (�ift sat�r sonu ile)
                      cleanedText = processedParagraphs
                        .filter(p => p.length > 0) // Bo� paragraflar� kald�r
                        .join('\n\n');
                      
                      console.log('? ��lenmi� metin:', cleanedText.substring(0, 100) + '...');
                      
                      // 9. Ba��nda ve sonundaki gereksiz bo�luklar� temizle
                      cleanedText = cleanedText.trim();
                      
                      // 10. Cursor pozisyonuna yap��t�r
                      const textarea = e.currentTarget;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const currentValue = chapterFormData.content;
                      const newValue = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);
                      
                      setChapterFormData({ ...chapterFormData, content: newValue });
                      
                      // 11. Cursor ve scroll pozisyonunu ayarla
                      setTimeout(() => {
                        const newCursorPos = start + cleanedText.length;
                        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
                        
                        // Scroll'u en alta kayd�r
                        textarea.scrollTop = textarea.scrollHeight;
                        textarea.focus();
                      }, 0);
                    }}
                    rows={20}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                    placeholder="B�l�m i�eri�ini yaz�n veya yap��t�r�n...&#10;&#10;?? DEBUG MODE: Paste fonksiyonu aktif&#10;?? Geli�mi� paragraf alg�lama&#10;? PDF'den gelen paragraflar korunur&#10;? Console'da debug loglar� g�r�n"
                    style={{
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      lineHeight: '1.8'
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    ?? DEBUG: Paste fonksiyonu aktif. Geli�mi� paragraf alg�lama - PDF'den gelen paragraflar korunur. Console'da debug loglar� g�r�n.
                  </p>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line mr-2"></i>
                      {editingChapter?.chapterId ? 'G�ncelle' : 'Kaydet'}
                    </>
                  )}
                </button>
                <button type="button" onClick={resetChapterForm} className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
                  �ptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Books List ---------- */}
      <div className="grid grid-cols-1 gap-6">
        {books.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-book-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Hen�z kitap eklenmemi�</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              �lk Kitab�n�z� Ekleyin
            </button>
          </div>
        ) : (
          books.map(book => (
            <div key={book.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {book.cover_image && (
                    <img src={book.cover_image} alt={book.title} className="w-24 h-32 object-cover object-top rounded-lg" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{book.title}</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{book.description}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            <i className="ri-calendar-line mr-1"></i>
                            {book.publish_date ? new Date(book.publish_date).toLocaleDateString('tr-TR') : 'Tarih yok'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              book.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : book.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {book.status === 'published'
                              ? 'Yay�nda'
                              : book.status === 'draft'
                              ? 'Taslak'
                              : 'Ar�ivlenmi�'}
                          </span>
                          <span>
                            <i className="ri-file-text-line mr-1"></i>
                            {book.chapters?.length || 0} B�l�m
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleChapters(book.id)}
                          className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-list-check-2 mr-1"></i>
                          {showChapters[book.id] ? 'B�l�mleri Gizle' : 'B�l�mleri G�ster'}
                        </button>
                        <button
                          onClick={() => handleEdit(book)}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-edit-line mr-1"></i>
                          D�zenle
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-delete-bin-line mr-1"></i>
                          Sil
                        </button>
                      </div>
                    </div>

                    {/* Sales links */}
                    {(book.amazon_link || book.dr_link || book.idefix_link) && (
                      <div className="mt-4 flex items-center space-x-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Sat�� linkleri:</span>
                        {book.amazon_link && (
                          <a
                            href={book.amazon_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-800"
                          >
                            <i className="ri-amazon-line text-lg"></i>
                          </a>
                        )}
                        {book.dr_link && (
                          <a
                            href={book.dr_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <i className="ri-store-line text-lg"></i>
                          </a>
                        )}
                        {book.idefix_link && (
                          <a
                            href={book.idefix_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800"
                          >
                            <i className="ri-book-open-line text-lg"></i>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chapters section */}
              {showChapters[book.id] && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      B�l�mler ({book.chapters?.length || 0})
                    </h4>
                    <button
                      onClick={() => handleAddChapter(book.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-add-line mr-2"></i>
                      Yeni B�l�m Ekle
                    </button>
                  </div>

                  {!book.chapters || book.chapters.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="ri-article-line text-4xl text-gray-300 mb-3"></i>
                      <p className="text-gray-600">Bu kitaba hen�z b�l�m eklenmemi�</p>
                      <button
                        onClick={() => handleAddChapter(book.id)}
                        className="mt-3 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                      >
                        B�l�m Ekle
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {book.chapters
                        .sort(
                          (a: any, b: any) =>
                            (a.order || a.chapter_number || 0) - (b.order || b.chapter_number || 0)
                        )
                        .map((chapter: any) => (
                          <div key={chapter.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">{chapter.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                S�ra: {chapter.order_number || chapter.order || chapter.chapter_number} � ��erik:{' '}
                                {chapter.content?.length || 0} karakter
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditChapter(book.id, chapter)}
                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <i className="ri-edit-line mr-1"></i>
                                D�zenle
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(book.id, chapter.id)}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <i className="ri-delete-bin-line mr-1"></i>
                                Sil
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
