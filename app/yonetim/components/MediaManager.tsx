
'use client';

import { useState, useEffect } from 'react';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface MediaFile {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  upload_date: string;
  alt_text: string;
  description: string;
  is_public: boolean;
  usage_count: number;
}

interface Backup {
  name: string;
  createdAt: string;
  files: number | string;
  options: {
    includeData: boolean;
    includeImages: boolean;
  };
  size: number;
}

export default function MediaManager() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'media' | 'backups'>('media');

  const [editData, setEditData] = useState({
    alt_text: '',
    description: '',
    is_public: true
  });

  useEffect(() => {
    if (activeTab === 'media') {
      loadMediaFiles();
    } else {
      loadBackups();
    }
  }, [activeTab]);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };
  
  const loadBackups = async () => {
    try {
      setLoading(true);
      console.log('=== LOADING BACKUPS ===');
      
      const token = getAuthToken();
      const response = await fetch(`/api/admin/backup/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('Backups API Response Status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Backups API Response:', result);
        
        if (result.success && result.data) {
          setBackups(result.data);
          console.log('✅ Backups loaded successfully:', result.data.length, 'backups');
        } else {
          console.error('API returned invalid data structure:', result);
          setBackups([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Backups API error:', response.status, errorText);
        setBackups([]);
      }
    } catch (error) {
      console.error('=== LOAD BACKUPS ERROR ===');
      console.error('Error details:', error);
      setBackups([]);
    } finally {
      console.log('=== LOADING BACKUPS COMPLETE ===');
      setLoading(false);
    }
  };

  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      console.log('=== LOADING MEDIA FILES ===');
      
      const token = getAuthToken();
      const response = await fetch(`/api/admin/media/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('Media API Response Status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Media API Response:', result);
        
        if (result.success && result.data) {
          setMediaFiles(result.data);
          console.log('✅ Media files loaded successfully:', result.data.length, 'files');
        } else {
          console.error('API returned invalid data structure:', result);
          setMediaFiles([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Media API error:', response.status, errorText);
        setMediaFiles([]);
      }
    } catch (error) {
      console.error('=== LOAD MEDIA FILES ERROR ===');
      console.error('Error details:', error);
      setMediaFiles([]);
    } finally {
      console.log('=== LOADING COMPLETE ===');
      setLoading(false);
    }
  };

  const detectSiteMedia = async (): Promise<Partial<MediaFile>[]> => {
    const detectedMedia: Partial<MediaFile>[] = [];
    
    try {
      // Sitede kullanılan görselleri tespit et
      const imageUrls = [
        'https://readdy.ai/api/search-image?query=Turkish%20author%20writer%20elegant%20portrait%20professional%20background&width=400&height=500&seq=hero1&orientation=portrait',
        'https://readdy.ai/api/search-image?query=book%20cover%20design%20modern%20Turkish%20literature%20elegant%20simple&width=300&height=400&seq=book1&orientation=portrait',
        'https://readdy.ai/api/search-image?query=book%20cover%20design%20Turkish%20novel%20elegant%20modern%20minimalist&width=300&height=400&seq=book2&orientation=portrait',
        'https://readdy.ai/api/search-image?query=book%20cover%20design%20Turkish%20literature%20contemporary%20elegant&width=300&height=400&seq=book3&orientation=portrait',
        'https://readdy.ai/api/search-image?query=newsletter%20subscription%20reading%20books%20Turkish%20elegant%20modern%20background&width=600&height=300&seq=newsletter1&orientation=landscape'
      ];

      imageUrls.forEach((url, index) => {
        detectedMedia.push({
          filename: `site-image-${index + 1}.jpg`,
          file_path: url,
          file_size: 150000, // Tahmini boyut
          file_type: 'image/jpeg',
          uploaded_by: 'system',
          upload_date: new Date().toISOString(),
          alt_text: `Site görseli ${index + 1}`,
          description: `Otomatik tespit edilen site görseli`,
          is_public: true,
          usage_count: 1
        });
      });

      console.log('Auto-detected media files:', detectedMedia.length);
      
    } catch (error) {
      console.error('Error detecting site media:', error);
    }

    return detectedMedia;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    try {
      for (const file of Array.from(files)) {
        // Dosya boyutu kontrolü (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          showMessage(`${file.name} dosyası çok büyük (max 5MB)`, 'error');
          continue;
        }

        // Dosya türü kontrolü
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && file.type !== 'application/pdf') {
          showMessage(`${file.name} desteklenmeyen dosya türü`, 'error');
          continue;
        }

        // Base64'e çevir
        const base64 = await fileToBase64(file);
        
        const mediaData = {
          filename: file.name,
          file_data: base64,
          file_size: file.size,
          file_type: file.type,
          alt_text: '',
          description: '',
          is_public: true
        };

        console.log('Uploading file:', file.name);

        const response = await fetch(`/api/books`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            },
          body: JSON.stringify(mediaData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload error:', response.status, errorText);
          showMessage(`${file.name} yüklenirken hata oluştu`, 'error');
          continue;
        }

        const result = await response.json();
        if (result.success) {
          console.log('✅ File uploaded successfully:', file.name);
        } else {
          console.error('Upload failed:', result.error);
          showMessage(`${file.name} yükleme hatası: ${result.error}`, 'error');
        }
      }

      showMessage('Dosya(lar) başarıyla yüklendi!', 'success');
      await loadMediaFiles();
      setShowUploadForm(false);

    } catch (error) {
      console.error('File upload error:', error);
      showMessage('Dosya yükleme hatası: ' + (error instanceof Error ? error.message : String(error)), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleEdit = (file: MediaFile) => {
    setEditingFile(file);
    setEditData({
      alt_text: file.alt_text || '',
      description: file.description || '',
      is_public: file.is_public !== false
    });
  };

  const handleUpdate = async () => {
    if (!editingFile) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/books`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        showMessage('Medya bilgileri güncellendi!', 'success');
        await loadMediaFiles();
        setEditingFile(null);
      } else {
        throw new Error(result.error || 'Güncelleme hatası');
      }
    } catch (error) {
      console.error('Update error:', error);
      showMessage('Güncelleme sırasında hata oluştu!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu medya dosyasını silmek istediğinizden emin misiniz?')) return;

    try {
      // Medya dosyasını bul
      const file = mediaFiles.find(file => file.id === id);
      if (!file || !file.file_path) {
        showMessage('Silinecek dosya bulunamadı!', 'error');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`/api/admin/media/delete?path=${encodeURIComponent(file.file_path)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete API error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        showMessage('Medya dosyası silindi!', 'success');
        await loadMediaFiles();
      } else {
        throw new Error(result.error || 'Silme hatası');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('Silme sırasında hata oluştu!', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`${selectedFiles.length} dosyayı silmek istediğinizden emin misiniz?`)) return;

    try {
      await Promise.all(selectedFiles.map(id => handleDelete(id)));
      setSelectedFiles([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    showMessage('URL panoya kopyalandı!', 'success');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'ri-image-line';
    if (fileType.startsWith('video/')) return 'ri-video-line';
    if (fileType === 'application/pdf') return 'ri-file-pdf-line';
    return 'ri-file-line';
  };

  const filteredFiles = mediaFiles.filter(file => {
    // Güvenli kontrol - file ve özellikleri undefined olabilir
    if (!file || !file.file_type || !file.filename) return false;
    if (filterType !== 'all' && !file.file_type.startsWith(filterType)) return false;
    if (searchTerm && !file.filename.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !file.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

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
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' 
            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
        }`}>
          <div className="flex items-center">
            <i className={`${messageType === 'error' ? 'ri-error-warning-line' : 'ri-check-circle-line'} mr-2`}></i>
            {message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Medya Yönetimi</h2>
          <p className="text-gray-600 dark:text-gray-300">Sitede kullanılan medya dosyalarını ve yedekleri yönetin</p>
        </div>
        {activeTab === 'media' ? (
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-upload-line mr-2"></i>
            Dosya Yükle
          </button>
        ) : null}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('media')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'media'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-image-line mr-2"></i>
            Medya Dosyaları
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'backups'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="ri-database-2-line mr-2"></i>
            Sistem Yedekleri
          </button>
        </nav>
      </div>

      {activeTab === 'media' ? (
        <>
          {/* Media Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Dosya</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{mediaFiles.length}</p>
                </div>
                <i className="ri-folder-line text-2xl text-blue-500"></i>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Görsel</p>
                  <p className="text-2xl font-bold text-green-600">
                    {mediaFiles.filter(file => file && file.file_type && file.file_type.startsWith('image/')).length}
                  </p>
                </div>
                <i className="ri-image-line text-2xl text-green-500"></i>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Video</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {mediaFiles.filter(file => file && file.file_type && file.file_type.startsWith('video/')).length}
                  </p>
                </div>
                <i className="ri-video-line text-2xl text-purple-500"></i>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Boyut</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatFileSize(mediaFiles.reduce((total, file) => total + file.file_size, 0))}
                  </p>
                </div>
                <i className="ri-hard-drive-line text-2xl text-orange-500"></i>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Backup Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Yedek</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{backups.length}</p>
                </div>
                <i className="ri-database-2-line text-2xl text-blue-500"></i>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Son Yedekleme</p>
                  <p className="text-xl font-bold text-green-600">
                    {backups.length > 0 
                      ? new Date(backups[0].createdAt).toLocaleDateString('tr-TR') 
                      : 'Yedek yok'}
                  </p>
                </div>
                <i className="ri-time-line text-2xl text-green-500"></i>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Toplam Boyut</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatFileSize(backups.reduce((total, backup) => total + (backup.size || 0), 0))}
                  </p>
                </div>
                <i className="ri-hard-drive-line text-2xl text-orange-500"></i>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'media' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tür:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 pr-8"
                >
                  <option value="all">Tümü</option>
                  <option value="image">Görsel</option>
                  <option value="video">Video</option>
                  <option value="application">Belge</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Dosya ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (selectedFiles.length === filteredFiles.length) {
                    setSelectedFiles([]);
                  } else {
                    setSelectedFiles(filteredFiles.map(f => f.id));
                  }
                }}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className={`${selectedFiles.length === filteredFiles.length && filteredFiles.length > 0 ? 'ri-checkbox-line' : 'ri-checkbox-blank-line'} mr-1`}></i>
                {selectedFiles.length === filteredFiles.length && filteredFiles.length > 0 ? 'Seçimi Kaldır' : 'Hepsini Seç'}
              </button>
              
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-delete-bin-line mr-1"></i>
                  Seçilenleri Sil ({selectedFiles.length})
                </button>
              )}

              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <i className="ri-grid-line"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <i className="ri-list-check"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dosya Yükle</h3>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <i className="ri-upload-cloud-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600 mb-4">Dosyaları sürükleyip bırakın veya seçin</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Desteklenen formatlar: JPG, PNG, GIF, MP4, PDF (Max 5MB)
                </p>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-gray-600">Yükleniyor...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Medya Düzenle</h3>
              <button
                onClick={() => setEditingFile(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Alt Metin</label>
                <input
                  type="text"
                  value={editData.alt_text}
                  onChange={(e) => setEditData({ ...editData, alt_text: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Açıklama</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={editData.is_public}
                  onChange={(e) => setEditData({ ...editData, is_public: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Herkese açık
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'media' ? (
        <>
          {/* Media Files */}
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-folder-line text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-lg">
                {searchTerm || filterType !== 'all' ? 'Arama kriterlerine uygun dosya bulunamadı' : 'Henüz medya dosyası yüklenmemiş'}
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  İlk Dosyanızı Yükleyin
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file, index) => (
                <div key={file.id || `file-${index}`} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square relative">
                    {file.file_type && file.file_type.startsWith('image/') ? (
                      <img
                        src={file.file_path}
                        alt={file.alt_text || file.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                        <i className={`${getFileIcon(file.file_type)} text-4xl text-gray-400`}></i>
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles([...selectedFiles, file.id]);
                          } else {
                            setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                          }
                        }}
                        className="rounded"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate" title={file.filename}>
                      {file.filename}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatFileSize(file.file_size)}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => copyToClipboard(file.file_path)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                      >
                        <i className="ri-link mr-1"></i>Kopyala
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(file)}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <i className="ri-edit-line text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFiles.map((file, index) => (
                  <div key={file.id || `list-file-${index}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles([...selectedFiles, file.id]);
                          } else {
                            setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                          }
                        }}
                        className="rounded"
                      />
                      
                      <div className="w-12 h-12 flex-shrink-0">
                        {file.file_type && file.file_type.startsWith('image/') ? (
                          <img
                            src={file.file_path}
                            alt={file.alt_text || file.filename}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <i className={`${getFileIcon(file.file_type)} text-xl text-gray-400`}></i>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 dark:text-gray-100 truncate">{file.filename}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{new Date(file.upload_date).toLocaleDateString('tr-TR')}</span>
                          <span>Kullanım: {file.usage_count || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(file.file_path)}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-800/30 text-blue-700 dark:text-blue-300 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-link mr-1"></i>Kopyala
                        </button>
                        <button
                          onClick={() => handleEdit(file)}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-edit-line mr-1"></i>Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded text-sm transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-delete-bin-line mr-1"></i>Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Backups List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            {backups.length === 0 ? (
              <div className="text-center py-12">
                <i className="ri-database-2-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Henüz yedek bulunmuyor</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Dashboard'daki "Yedek Oluştur" butonunu kullanarak ilk yedeğinizi oluşturabilirsiniz.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {backups.map((backup, index) => (
                  <div key={backup.name || `backup-${index}`} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-lg text-gray-800 dark:text-gray-100">{backup.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <span className="flex items-center">
                            <i className="ri-time-line mr-1"></i>
                            {new Date(backup.createdAt).toLocaleString('tr-TR')}
                          </span>
                          <span className="flex items-center">
                            <i className="ri-file-list-line mr-1"></i>
                            {typeof backup.files === 'number' ? `${backup.files} dosya` : backup.files}
                          </span>
                          <span className="flex items-center">
                            <i className="ri-hard-drive-line mr-1"></i>
                            {formatFileSize(backup.size)}
                          </span>
                          <span className="flex items-center">
                            <i className="ri-database-2-line mr-1"></i>
                            {backup.options?.includeData ? 'Veri' : ''}
                            {backup.options?.includeData && backup.options?.includeImages ? ' + ' : ''}
                            {backup.options?.includeImages ? 'Görsel' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={async () => {
                            if (confirm(`"${backup.name}" yedeğini geri yüklemek istediğinize emin misiniz? Bu işlem mevcut verilerin üzerine yazacaktır.`)) {
                              try {
                                setIsLoading(true);
                                const token = getAuthToken();
                                const response = await fetch('/api/admin/backup/restore', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ backupName: backup.name })
                                });
                                
                                if (response.ok) {
                                  const result = await response.json();
                                  if (result.success) {
                                    showMessage('Yedek başarıyla geri yüklendi!', 'success');
                                  } else {
                                    showMessage(`Hata: ${result.error || 'Yedek geri yüklenemedi'}`, 'error');
                                  }
                                } else {
                                  showMessage('Yedek geri yükleme başarısız oldu.', 'error');
                                }
                              } catch (error) {
                                console.error('Yedek geri yükleme hatası:', error);
                                showMessage('Yedek geri yüklenirken bir hata oluştu.', 'error');
                              } finally {
                                setIsLoading(false);
                              }
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap"
                          disabled={isLoading}
                        >
                          <i className="ri-restart-line mr-1"></i>
                          Geri Yükle
                        </button>
                        
                        <button
                          onClick={async () => {
                            if (confirm(`"${backup.name}" yedeğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
                              try {
                                setIsLoading(true);
                                const token = getAuthToken();
                                const response = await fetch(`/api/admin/backup/delete?name=${encodeURIComponent(backup.name)}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                
                                if (response.ok) {
                                  const result = await response.json();
                                  if (result.success) {
                                    showMessage('Yedek başarıyla silindi!', 'success');
                                    loadBackups();
                                  } else {
                                    showMessage(`Hata: ${result.error || 'Yedek silinemedi'}`, 'error');
                                  }
                                } else {
                                  const errorText = await response.text();
                                  console.error('Backup delete API error:', response.status, errorText);
                                  showMessage(`Yedek silme başarısız oldu: ${response.status}`, 'error');
                                }
                              } catch (error) {
                                console.error('Yedek silme hatası:', error);
                                showMessage('Yedek silinirken bir hata oluştu.', 'error');
                              } finally {
                                setIsLoading(false);
                              }
                            }
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap"
                          disabled={isLoading}
                        >
                          <i className="ri-delete-bin-line mr-1"></i>
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
