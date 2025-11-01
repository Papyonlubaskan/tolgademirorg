
'use client';

import { useState, useEffect } from 'react';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
}

export default function PagesManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft' as 'published' | 'draft'
  });

  useEffect(() => {
    loadPages();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadPages = async () => {
    try {
      setLoading(true);
      console.log('=== LOADING PAGES ===');
      
      const response = await fetch(`/api/books`, {
        headers: {
          },
      });

      console.log('Pages API Response Status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Pages API Response:', result);
        
        if (result.success && result.data) {
          // Mevcut sayfaları ekle
          const existingPages = result.data;
          
          // Sistemde mevcut olan sayfa slug'larını kontrol et
          const systemPages = [
            { slug: 'about', title: 'Hakkımda', status: 'published' },
            { slug: 'contact', title: 'İletişim', status: 'published' },
            { slug: 'books', title: 'Kitaplarım', status: 'published' },
            { slug: 'privacy-policy', title: 'Gizlilik Politikası', status: 'published' },
            { slug: 'terms', title: 'Kullanım Şartları', status: 'published' },
            { slug: 'kvkk', title: 'KVKK', status: 'published' }
          ];

          // Eksik sayfaları tespit et ve ekle
          const missingPages = systemPages.filter(systemPage => 
            !existingPages.some((page: Page) => page.slug === systemPage.slug)
          );

          console.log('Missing pages detected:', missingPages);
          
          // Eksik sayfaları API'ye ekle
          for (const missingPage of missingPages) {
            try {
              const createResponse = await fetch(`/api/books`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  },
                body: JSON.stringify({
                  title: missingPage.title,
                  slug: missingPage.slug,
                  content: `${missingPage.title} sayfası içeriği buraya gelecek.`,
                  meta_title: missingPage.title,
                  meta_description: `${missingPage.title} sayfası açıklaması`,
                  status: missingPage.status
                })
              });

              if (createResponse.ok) {
                const createResult = await createResponse.json();
                console.log(`✅ Created missing page: ${missingPage.title}`);
                existingPages.push(createResult.data);
              }
            } catch (error) {
              console.error(`Error creating page ${missingPage.title}:`, error);
            }
          }

          setPages(existingPages);
          console.log('✅ Pages loaded successfully:', existingPages.length, 'pages');
        } else {
          console.error('API returned invalid data structure:', result);
          setPages([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Pages API error:', response.status, errorText);
        setPages([]);
      }
    } catch (error) {
      console.error('=== LOAD PAGES ERROR ===');
      console.error('Error details:', error);
      setPages([]);
    } finally {
      console.log('=== LOADING COMPLETE ===');
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showMessage('Sayfa başlığı gereklidir!', 'error');
      return;
    }

    if (!formData.content.trim()) {
      showMessage('Sayfa içeriği gereklidir!', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Slug'ı otomatik oluştur eğer boşsa
      const slug = formData.slug || generateSlug(formData.title);

      const pageData = {
        title: formData.title,
        slug: slug,
        content: formData.content,
        meta_title: formData.metaTitle || formData.title,
        meta_description: formData.metaDescription,
        status: formData.status
      };

      console.log('=== SAVING PAGE ===');
      console.log('Page Data:', pageData);

      if (editingPage) {
        console.log('Updating existing page:', editingPage.id);
        
        const response = await fetch(`/api/books`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            },
          body: JSON.stringify(pageData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Page update error:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Page update response:', result);

        if (!result.success) {
          throw new Error(result.error || 'Page update error');
        }

        console.log('Page updated successfully!');
        showMessage('Sayfa başarıyla güncellendi!', 'success');
      } else {
        console.log('Adding new page');

        const response = await fetch(`/api/books`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            },
          body: JSON.stringify(pageData)
        });

        console.log('API Response Status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Response Error:', response.status, errorText);
          throw new Error(`Sayfa eklenirken hata oluştu: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('=== PAGE CREATE RESPONSE ===');
        console.log('API Response:', result);

        if (!result.success) {
          console.error('API returned success: false');
          console.error('Error details:', result.error);
          throw new Error(result.error || 'Sayfa ekleme hatası');
        }

        console.log('✅ Page added successfully!', result.data);
        showMessage(`Sayfa "${result.data.title}" başarıyla eklendi!`, 'success');
      }

      setShowForm(false);
      setEditingPage(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        status: 'draft'
      });
      
      console.log('🔄 Reloading pages data...');
      setTimeout(async () => {
        await loadPages();
      }, 500);

    } catch (error) {
      console.error('=== PAGE SAVE ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      
      showMessage('Sayfa kaydedilirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      metaTitle: page.meta_title || '',
      metaDescription: page.meta_description || '',
      status: page.status || 'draft'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, slug: string) => {
    // Sistem sayfalarının silinmesini engelle
    const systemSlugs = ['about', 'contact', 'books', 'privacy-policy', 'terms', 'kvkk'];
    if (systemSlugs.includes(slug)) {
      showMessage('Sistem sayfaları silinemez!', 'error');
      return;
    }

    if (!confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) return;

    try {
      console.log('Deleting page:', id);
      
      const response = await fetch(`/api/books`, {
        method: 'DELETE',
        headers: {
          }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete response error:', response.status, errorText);
        throw new Error(`Silme hatası: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Delete response:', result);

      if (result.success) {
        console.log('✅ Page deleted successfully!');
        showMessage('Sayfa başarıyla silindi!', 'success');
        
        setTimeout(async () => {
          await loadPages();
        }, 500);
      } else {
        throw new Error(result.error || 'Sayfa silme hatası');
      }
    } catch (error) {
      console.error('Page delete error:', error);
      showMessage('Sayfa silinirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  };

  const toggleStatus = async (page: Page) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';

    try {
      console.log('Toggling page status:', page.id, 'to', newStatus);
      
      const response = await fetch(`/api/books`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({ ...page, status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showMessage(`Sayfa ${newStatus === 'published' ? 'yayınlandı' : 'gizlendi'}!`);
        await loadPages();
      } else {
        throw new Error(result.error || 'Durum değiştirme hatası');
      }
    } catch (error) {
      console.error('Status toggle error:', error);
      showMessage('Durum değiştirilirken hata oluştu!', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          messageType === 'error' 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          <div className="flex items-center">
            <i className={`${messageType === 'error' ? 'ri-error-warning-line' : 'ri-check-circle-line'} mr-2`}></i>
            {message}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sayfa Yönetimi</h2>
          <p className="text-gray-600">Web sitesi sayfalarınızı yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          Yeni Sayfa Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Sayfa</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{pages.length}</p>
            </div>
            <i className="ri-pages-line text-2xl text-blue-500"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Yayında</p>
              <p className="text-2xl font-bold text-green-600">
                {pages.filter(page => page.status === 'published').length}
              </p>
            </div>
            <i className="ri-check-line text-2xl text-green-500"></i>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Taslak</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pages.filter(page => page.status === 'draft').length}
              </p>
            </div>
            <i className="ri-draft-line text-2xl text-yellow-500"></i>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingPage ? 'Sayfa Düzenle' : 'Yeni Sayfa Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPage(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Sayfa Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({ 
                        ...formData, 
                        title,
                        slug: formData.slug || generateSlug(title)
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Sayfa başlığını girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="sayfa-url-slug"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    URL: /{formData.slug || 'sayfa-url-slug'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Sayfa İçeriği *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={15}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Sayfa içeriğini yazın..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    SEO Başlık
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Arama motorları için başlık"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Durum
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-8"
                  >
                    <option value="draft">Taslak</option>
                    <option value="published">Yayınla</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  SEO Açıklama
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Arama motorları için açıklama"
                />
              </div>

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
                      {editingPage ? 'Güncelle' : 'Kaydet'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPage(null);
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div className="space-y-4">
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-pages-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Henüz sayfa eklenmemiş</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              İlk Sayfanızı Ekleyin
            </button>
          </div>
        ) : (
          pages.map((page) => (
            <div key={page.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{page.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      page.status === 'published'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {page.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{page.content?.substring(0, 200)}...</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      <i className="ri-link mr-1"></i>
                      /{page.slug}
                    </span>
                    <span>
                      <i className="ri-calendar-line mr-1"></i>
                      {new Date(page.created_at).toLocaleDateString('tr-TR')}
                    </span>
                    {page.updated_at && page.updated_at !== page.created_at && (
                      <span>
                        <i className="ri-edit-line mr-1"></i>
                        {new Date(page.updated_at).toLocaleDateString('tr-TR')} güncellendi
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(`/${page.slug}`, '_blank')}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-external-link-line mr-1"></i>
                    Görüntüle
                  </button>
                  
                  <button
                    onClick={() => toggleStatus(page)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap ${
                      page.status === 'published'
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {page.status === 'published' ? 'Gizle' : 'Yayınla'}
                  </button>

                  <button
                    onClick={() => handleEdit(page)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-edit-line mr-1"></i>
                    Düzenle
                  </button>

                  {!['about', 'contact', 'books', 'privacy-policy', 'terms', 'kvkk'].includes(page.slug) && (
                    <button
                      onClick={() => handleDelete(page.id, page.slug)}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line mr-1"></i>
                      Sil
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
