'use client';

import { useState, useEffect } from 'react';
import { Validator } from '@/lib/validations';
import ImageUploader from './ImageUploader';

interface Book {
  id: number;
  title: string;
  description: string;
  author: string;
  category?: string;
  cover_image?: string;
  status: 'published' | 'draft' | 'archived';
  publish_date?: string;
  amazon_link?: string;
  dr_link?: string;
  idefix_link?: string;
}

interface BookFormData {
  id?: string;
  title: string;
  description: string;
  author: string;
  category: string;
  cover_image_url: string;
  status: 'published' | 'draft' | 'archived';
  publish_date: string;
  amazon_link?: string;
  dr_link?: string;
  idefix_link?: string;
}

export default function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    description: '',
    author: 'Tolga Demir',
    category: 'Roman',
    cover_image_url: '',
    status: 'published',
    publish_date: new Date().toISOString().split('T')[0],
    amazon_link: '',
    dr_link: '',
    idefix_link: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadBooksData();
  }, []);

  const loadBooksData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/books?limit=100');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBooks(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    const titleValidation = Validator.validateName(formData.title, 'Kitap başlığı');
    if (!titleValidation.isValid) {
      newErrors.push(...titleValidation.errors);
    }

    if (!formData.description.trim()) {
      newErrors.push('Kitap açıklaması gereklidir');
    } else if (formData.description.length > 2000) {
      newErrors.push('Kitap açıklaması çok uzun');
    }

    const authorValidation = Validator.validateName(formData.author, 'Yazar adı');
    if (!authorValidation.isValid) {
      newErrors.push(...authorValidation.errors);
    }

    if (formData.cover_image_url) {
      const urlValidation = Validator.validateUrl(formData.cover_image_url);
      if (!urlValidation.isValid) {
        newErrors.push(...urlValidation.errors);
      }
    }

    if (formData.amazon_link) {
      const urlValidation = Validator.validateUrl(formData.amazon_link);
      if (!urlValidation.isValid) {
        newErrors.push('Geçerli Amazon linki giriniz');
      }
    }

    if (formData.dr_link) {
      const urlValidation = Validator.validateUrl(formData.dr_link);
      if (!urlValidation.isValid) {
        newErrors.push('Geçerli DR linki giriniz');
      }
    }

    if (formData.idefix_link) {
      const urlValidation = Validator.validateUrl(formData.idefix_link);
      if (!urlValidation.isValid) {
        newErrors.push('Geçerli İdefix linki giriniz');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const bookData = {
        title: Validator.sanitizeInput(formData.title),
        description: Validator.sanitizeInput(formData.description),
        author: Validator.sanitizeInput(formData.author),
        category: Validator.sanitizeInput(formData.category),
        cover_image: Validator.sanitizeInput(formData.cover_image_url), // cover_image_url yerine cover_image
        status: formData.status,
        publish_date: formData.publish_date,
        amazon_link: formData.amazon_link ? Validator.sanitizeInput(formData.amazon_link) : undefined,
        dr_link: formData.dr_link ? Validator.sanitizeInput(formData.dr_link) : undefined,
        idefix_link: formData.idefix_link ? Validator.sanitizeInput(formData.idefix_link) : undefined
      };

      const token = sessionStorage.getItem('admin_token');
      
      let response;
      if (editingBook) {
        // Update existing book
        response = await fetch(`/api/books/${editingBook.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookData)
        });
      } else {
        // Add new book
        response = await fetch('/api/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookData)
        });
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh books list
        await loadBooksData();
        setSuccessMessage(editingBook ? 'Kitap başarıyla güncellendi!' : 'Kitap başarıyla eklendi!');
      } else {
        throw new Error(result.error || 'İşlem başarısız');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        author: 'Tolga Demir',
        category: 'Roman',
        cover_image_url: '',
        status: 'published',
        publish_date: new Date().toISOString().split('T')[0],
        amazon_link: '',
        dr_link: '',
        idefix_link: ''
      });
      setEditingBook(null);
      setShowForm(false);
      setErrors([]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving book:', error);
      setErrors(['Kitap kaydedilirken hata oluştu']);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      id: book.id.toString(),
      title: book.title,
      description: book.description,
      author: book.author,
      category: (book as any).category || '',
      cover_image_url: (book as any).cover_image_url || book.cover_image || '',
      status: book.status,
      publish_date: book.publish_date || '',
      amazon_link: (book as any).amazon_link || '',
      dr_link: (book as any).dr_link || '',
      idefix_link: (book as any).idefix_link || ''
    });
    setShowForm(true);
    setErrors([]);
  };

  const handleDelete = (bookId: string) => {
    if (confirm('Bu kitabı silmek istediğinizden emin misiniz?')) {
      const updatedBooks = books.filter(book => book.id.toString() !== bookId);
      setBooks(updatedBooks);
      setSuccessMessage('Kitap başarıyla silindi!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBook(null);
    setFormData({
      title: '',
      description: '',
      author: 'Tolga Demir',
      category: 'Roman',
      cover_image_url: '',
      status: 'published',
      publish_date: new Date().toISOString().split('T')[0],
      amazon_link: '',
      dr_link: '',
      idefix_link: ''
    });
    setErrors([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Kitaplar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kitap Yönetimi</h2>
          <p className="text-gray-600 dark:text-gray-400">Kitaplarınızı yönetin ve düzenleyin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Yeni Kitap Ekle
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingBook ? 'Kitabı Düzenle' : 'Yeni Kitap Ekle'}
          </h3>
          
          {errors.length > 0 && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kitap Başlığı *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yazar *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Roman">Roman</option>
                  <option value="Hikaye">Hikaye</option>
                  <option value="Deneme">Deneme</option>
                  <option value="Şiir">Şiir</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durum
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="published">Yayında</option>
                  <option value="draft">Taslak</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yayın Tarihi
                </label>
                <input
                  type="date"
                  value={formData.publish_date}
                  onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <ImageUploader
                label="Kapak Resmi"
                value={formData.cover_image_url}
                onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kitap Açıklaması *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amazon Linki
                </label>
                <input
                  type="url"
                  value={formData.amazon_link}
                  onChange={(e) => setFormData({ ...formData, amazon_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DR Linki
                </label>
                <input
                  type="url"
                  value={formData.dr_link}
                  onChange={(e) => setFormData({ ...formData, dr_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  İdefix Linki
                </label>
                <input
                  type="url"
                  value={formData.idefix_link}
                  onChange={(e) => setFormData({ ...formData, idefix_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingBook ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Books List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kitaplar ({books.length})
          </h3>
          
          {books.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-book-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600 dark:text-gray-400">Henüz kitap eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-4">
              {books.map((book) => (
                <div key={book.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {((book as any).cover_image_url || book.cover_image) && (
                      <img
                        src={(book as any).cover_image_url || book.cover_image}
                        alt={book.title}
                        className="w-20 h-28 object-cover rounded-lg shadow-sm"
                        style={{ minWidth: '80px', minHeight: '112px' }}
                        onError={(e) => {
                          // Resim yüklenemezse placeholder göster
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    )}
                    {(!((book as any).cover_image_url || book.cover_image)) && (
                      <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center">
                        <i className="ri-image-line text-gray-400 text-2xl"></i>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{book.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{book.author} • {(book as any).category || 'Kategori Yok'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Durum: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          book.status === 'published' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {book.status === 'published' ? 'Yayında' : 'Taslak'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(book)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2"
                      title="Düzenle"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(book.id.toString())}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2"
                      title="Sil"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
