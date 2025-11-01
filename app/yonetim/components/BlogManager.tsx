
'use client';

import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published';
  publish_date: string;
  read_time: string;
  views: number;
  image_url: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

interface BlogCategory {
  id: number;
  name: string;
  description: string;
}

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    status: 'draft' as 'draft' | 'published',
    publishDate: new Date().toISOString().split('T')[0],
    imageUrl: '',
    metaTitle: '',
    metaDescription: ''
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    console.log(`Blog Manager Message [${type}]:`, msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`/api/books`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setPosts(result.data || []);
      } else {
        console.error('Blog posts yükleme hatası:', result.error);
        showMessage('Blog yazıları yüklenirken hata oluştu!', 'error');
      }
    } catch (error) {
      console.error('Blog posts fetch error:', error);
      showMessage('Bağlantı hatası! Lütfen tekrar deneyin.', 'error');
      // Varsayılan veri sağla
      setPosts([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/books`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      } else {
        console.error('Kategoriler yükleme hatası:', result.error);
        showMessage('Kategoriler yüklenirken hata oluştu!', 'error');
      }
    } catch (error) {
      console.error('Categories fetch error:', error);
      showMessage('Kategori bağlantı hatası!', 'error');
      // Varsayılan kategoriler sağla
      setCategories([
        { id: 1, name: 'Genel', description: 'Genel blog yazıları' },
        { id: 2, name: 'Yazarlık', description: 'Yazarlık ve edebiyat hakkında' },
        { id: 3, name: 'Kitap İncelemeleri', description: 'Kitap incelemeleri' },
        { id: 4, name: 'Kişisel', description: 'Kişisel deneyimler' }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Blog form submit started...');
    
    if (!formData.title.trim()) {
      showMessage('Blog yazısı başlığı gereklidir!', 'error');
      return;
    }
    
    if (!formData.content.trim()) {
      showMessage('Blog yazısı içeriği gereklidir!', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const url = editingPost
        ? `/api/books`
        : `/api/books`;

      const method = editingPost ? 'PUT' : 'POST';

      console.log('Blog API call:', method, url);
      console.log('Blog data:', formData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(formData)
      });

      console.log('Blog API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Blog API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Blog API Response:', result);

      if (result.success) {
        showMessage(editingPost ? 'Blog yazısı başarıyla güncellendi!' : 'Blog yazısı başarıyla eklendi!');
        await loadPosts();
        resetForm();
      } else {
        throw new Error(result.error || 'Bilinmeyen hata');
      }
    } catch (error) {
      console.error('Blog form submit error:', error);
      showMessage('Kaydetme sırasında hata oluştu: ' + error, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Bu yazıyı silmek istediğinizden emin misiniz?')) return;

    setIsLoading(true);

    try {
      console.log('Deleting blog post:', postId);
      
      const response = await fetch(`/api/books`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete response:', result);
      
      if (result.success) {
        showMessage('Blog yazısı başarıyla silindi!');
        await loadPosts();
      } else {
        throw new Error(result.error || 'Silme hatası');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('Silme işlemi sırasında hata oluştu!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';

    setIsLoading(true);

    try {
      console.log('Toggling post status:', post.id, 'to', newStatus);
      
      const response = await fetch(`/api/books`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({ ...post, status: newStatus })
      });

      console.log('Status toggle response:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Status toggle result:', result);
      
      if (result.success) {
        showMessage(`Yazı ${newStatus === 'published' ? 'yayınlandı' : 'gizlendi'}!`);
        await loadPosts();
      } else {
        throw new Error(result.error || 'Durum değiştirme hatası');
      }
    } catch (error) {
      console.error('Status toggle error:', error);
      showMessage('Durum değiştirilirken hata oluştu!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      status: post.status,
      publishDate: post.publish_date,
      imageUrl: post.image_url,
      metaTitle: post.meta_title,
      metaDescription: post.meta_description
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      status: 'draft',
      publishDate: new Date().toISOString().split('T')[0],
      imageUrl: '',
      metaTitle: '',
      metaDescription: ''
    });
    setEditingPost(null);
    setShowAddForm(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(newCategory)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        showMessage('Kategori başarıyla eklendi!');
        setNewCategory({ name: '', description: '' });
        setShowCategoryForm(false);
        await loadCategories();
      } else {
        throw new Error(result.error || 'Kategori ekleme hatası');
      }
    } catch (error) {
      console.error('Add category error:', error);
      showMessage('Kategori eklenirken hata oluştu!', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/books`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        showMessage('Kategori başarıyla silindi!');
        await loadCategories();
      } else {
        throw new Error(result.error || 'Kategori silme hatası');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      showMessage('Kategori silinirken hata oluştu!', 'error');
    }
  };

  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description
    });
    setShowCategoryForm(true);
  };

  const generateImageUrl = (prompt: string) => {
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9\\s]/g, '').substring(0, 100);
    return `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28cleanPrompt%20%20%20%20blog%20post%20illustration%20modern%20clean%20design%20Turkish%20content%29%7D&width=400&height=250&seq=blog${Date.now()}&orientation=landscape`;
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCategory
        ? `/api/books`
        : `/api/books`;
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(newCategory)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        showMessage(editingCategory ? 'Kategori başarıyla güncellendi!' : 'Kategori başarıyla eklendi!');
        setNewCategory({ name: '', description: '' });
        setEditingCategory(null);
        setShowCategoryForm(false);
        await loadCategories();
      } else {
        throw new Error(result.error || 'Kategori kaydetme hatası');
      }
    } catch (error) {
      console.error('Save category error:', error);
      showMessage('Kategori kaydedilirken hata oluştu!', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Blog Yönetimi</h1>
          <p className="text-gray-500">Yazılarınızı yönetin ve düzenleyin</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center"
        >
          <i className="ri-add-line mr-2"></i>
          Yeni Yazı Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Yazı</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{posts.length}</p>
            </div>
            <i className="ri-article-line text-2xl text-green-500"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Yayında</p>
              <p className="text-2xl font-bold text-green-600">
                {posts.filter(post => post.status === 'published').length}
              </p>
            </div>
            <i className="ri-check-line text-2xl text-green-500"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Görüntüleme</p>
              <p className="text-2xl font-bold text-blue-600">
                {posts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
              </p>
            </div>
            <i className="ri-eye-line text-2xl text-blue-500"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Kategori</p>
              <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
            </div>
            <i className="ri-folder-line text-2xl text-purple-500"></i>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">Kategoriler</h3>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm hover:bg-orange-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line mr-1"></i>
            Yeni Kategori
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <div key={category.id} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm flex items-center group">
              <span>{category.name}</span>
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="w-4 h-4 flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded cursor-pointer"
                >
                  <i className="ri-edit-line text-xs"></i>
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="w-4 h-4 flex items-center justify-center text-red-600 hover:bg-red-100 rounded cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-xs"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-24 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <i className="ri-image-line text-xl"></i>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{post.title}</h3>
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">
                        {post.category}
                      </span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {post.status === 'published' ? 'Yayında' : 'Taslak'}
                      </div>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{post.excerpt}</p>

                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span> {new Date(post.publish_date).toLocaleDateString('tr-TR')}</span>
                      <span> {post.read_time}</span>
                      <span> {post.views.toLocaleString()} görüntüleme</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleStatus(post)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap ${
                        post.status === 'published'
                          ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                    >
                      {post.status === 'published' ? 'Gizle' : 'Yayınla'}
                    </button>

                    <button
                      onClick={() => handleEdit(post)}
                      className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-edit-line"></i>
                    </button>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-300 cursor-pointer"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Başlık</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Özet</label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                        required
                      >
                        <option value="">Seçiniz</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Durum</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                      >
                        <option value="draft">Taslak</option>
                        <option value="published">Yayınla</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Yayın Tarihi</label>
                    <input
                      type="date"
                      value={formData.publishDate}
                      onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <ImageUploader
                    label="Görsel"
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">İçerik</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={12}
                      required
                      placeholder="Yazınızın içeriğini buraya yazın..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">SEO Başlık</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Arama motorları için başlık"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">SEO Açıklama</label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Arama motorları için açıklama"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {isLoading ? 'Kaydediliyor...' : editingPost ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <form onSubmit={handleSaveCategory} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-300 cursor-pointer"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Kategori Adı</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Açıklama</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-5

0 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  {editingCategory ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
