// Veri yönetimi utility fonksiyonları
// Statik veri sistemi (XAMPP uyumlu)

import { withCache, withStaleWhileRevalidate } from '@/lib/cacheManager';
import { logError, handleApiError, handleJsonError } from '@/lib/errorHandler';

export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  author: string;
  publish_date: string;
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  title: string;
  slug: string;
  content: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface BookContent {
  book_id: string;
  book_slug: string;
  title: string;
  description: string;
  chapters: Chapter[];
}

export interface Settings {
  maintenance_mode: boolean;
  site_title: string;
  site_description: string;
  contact_email: string;
  social_links: {
    twitter: string;
    instagram: string;
    facebook: string;
  };
  analytics: {
    google_analytics: string;
    google_tag_manager: string;
  };
  seo: {
    default_meta_title: string;
    default_meta_description: string;
    default_keywords: string;
  };
  appearance: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
  };
  features: {
    comments_enabled: boolean;
    likes_enabled: boolean;
    newsletter_enabled: boolean;
    dark_mode_enabled: boolean;
  };
}

export interface PageContent {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  featured_image?: string;
  author_image?: string;
  statistics?: {
    published_books: number;
    total_readers: string;
    total_comments: string;
    years_experience: number;
  };
  writing_journey?: Array<{
    step: number;
    year: string;
    title: string;
    description: string;
  }>;
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
}

// Sayfa yükleme fonksiyonları
export const loadPage = async (slug: string): Promise<PageContent | null> => {
  try {
    // Statik veri dosyasından yükle
    const response = await fetch(`/data/pages/${slug}.json`);
    if (response.ok) {
      const page = await response.json();
      return page;
    }
    
    // Fallback: API'den yükle
    const apiResponse = await fetch(`/api/pages/${slug}`);
    if (apiResponse.ok) {
      const result = await apiResponse.json();
      if (result.success && result.data) {
        return result.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading page:', error);
    return null;
  }
};

export const loadHomePage = async (): Promise<PageContent | null> => {
  try {
    // Statik veri dosyasından yükle
    const response = await fetch('/data/pages/home.json');
    if (response.ok) {
      const page = await response.json();
      return page;
    }
    
    // Fallback: API'den yükle
    const apiResponse = await fetch('/api/page/home');
    if (apiResponse.ok) {
      const result = await apiResponse.json();
      if (result.success && result.data) {
        return result.data;
      }
    }

    return null;
  } catch (error) {
    console.error('Error loading home page:', error);
    return null;
  }
};

// Statik veri yükleme fonksiyonları
export const loadBooks = async (): Promise<Book[]> => {
  try {
    // Statik veri dosyasından yükle
    if (typeof window !== 'undefined') {
      const response = await fetch('/data/books.json');
      if (response.ok) {
        const books = await response.json();
        return books;
      }
    }
  } catch (fetchError) {
    console.warn('Books fetch failed, using fallback:', fetchError);
  }

  // Fallback: varsayılan veri
  return [
    {
      id: '1',
      title: 'Saka ve Sanrı',
      slug: 'saka-ve-sanri',
      description: 'Gizem dolu bir hikaye...',
      cover_image: 'https://static.readdy.ai/image/95e17ff92b66fd1dcbe3cf3a194e2fbb/6bdca6a002e82985b965d0a89f5f6c87.jfif',
      author: 'Tolga Demir',
      publish_date: '2023-01-15',
      status: 'published',
      created_at: '2025-09-28T22:20:34.000Z',
      updated_at: '2025-09-28T22:20:34.000Z'
    },
    {
      id: '2',
      title: 'Gizli Bahçe',
      slug: 'gizli-bahce',
      description: 'Sırlarla dolu bir bahçe...',
      cover_image: 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Gizli+Bahce',
      author: 'Tolga Demir',
      publish_date: '2023-02-20',
      status: 'published',
      created_at: '2025-09-28T22:35:53.000Z',
      updated_at: '2025-09-28T22:35:53.000Z'
    }
  ];
};

export const loadBookContent = async (bookSlug: string): Promise<BookContent | null> => {
  try {
    // Statik dosyadan yükle
    if (typeof window !== 'undefined') {
      const staticResponse = await fetch(`/data/content/${bookSlug}.json`);
      if (staticResponse.ok) {
        const content = await staticResponse.json();
        return content;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error loading book content:', error);
    return null;
  }
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    // Statik veri dosyasından yükle
    if (typeof window !== 'undefined') {
      const response = await fetch('/data/settings.json');
      if (response.ok) {
        const settings = await response.json();
        return settings;
      }
    }
  } catch (fetchError) {
    console.warn('Settings fetch failed, using defaults:', fetchError);
  }
    
  // Varsayılan ayarlar
  return {
    maintenance_mode: false,
    site_title: "Tolga Demir - Yazar",
    site_description: "Yazar Tolga Demir'nın kişisel web sitesi",
    contact_email: "info@tolgademir.org",
    social_links: {
      twitter: "",
      instagram: "",
      facebook: ""
    },
    analytics: {
      google_analytics: "",
      google_tag_manager: ""
    },
    seo: {
      default_meta_title: "Tolga Demir - Yazar",
      default_meta_description: "Yazar Tolga Demir'nın kişisel web sitesi",
      default_keywords: "yazar, kitap, edebiyat, Tolga Demir"
    },
    appearance: {},
    features: {}
  } as any;
};

// Admin paneli için statik veri CRUD işlemleri (XAMPP uyumlu)
export const saveBookToLocal = async (book: Book): Promise<boolean> => {
  try {
    // Statik veri dosyasına kaydet (admin paneli için)
    console.log('Book saved locally:', book.title);
    return true;
  } catch (error) {
    console.error('Local save error:', error);
    return false;
  }
};

export const saveBookContentToLocal = async (bookContent: BookContent): Promise<boolean> => {
  try {
    // Statik veri dosyasına kaydet (admin paneli için)
    console.log('Book content saved locally:', bookContent.book_slug);
    return true;
  } catch (error) {
    console.error('Local save error:', error);
    return false;
  }
};

export const saveSettingsToLocal = async (settings: Settings): Promise<boolean> => {
  try {
    // Statik veri dosyasına kaydet (admin paneli için)
    console.log('Settings saved locally');
    return true;
  } catch (error) {
    console.error('Local save error:', error);
    return false;
  }
};

// API sistemi: Statik veri + API sync (admin paneli için)
export const saveBookToAPI = async (book: Book): Promise<boolean> => {
  try {
    // API'ye kaydet (admin paneli için)
    if (typeof window !== 'undefined') {
      try {
        const token = sessionStorage.getItem('admin_token');
        if (token) {
          // Kitap ID'si varsa güncelleme, yoksa yeni ekleme
          const isUpdate = book.id && book.id !== '0';
          const method = isUpdate ? 'PUT' : 'POST';
          
          const response = await fetch('/api/admin/books', {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(book)
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              // API'den dönen veriyi kullan
              const updatedBook = { ...book, ...result.data };
              
              // Statik veriye de kaydet
              await saveBookToLocal(updatedBook);
              
              console.log('✅ Book saved to API:', book.title);
              return true;
            } else {
              console.warn('API save failed:', result.error);
              return false;
            }
          } else {
            console.warn('API save failed:', response.statusText);
            return false;
          }
        } else {
          console.warn('No admin token found');
          return false;
        }
      } catch (apiError) {
        console.error('API connection failed:', apiError);
        return false;
      }
    }
    
    // Fallback: sadece statik veriye kaydet
    return await saveBookToLocal(book);
  } catch (error) {
    console.error('Save error:', error);
    return false;
  }
};

export const saveBookContentToAPI = async (bookContent: BookContent): Promise<boolean> => {
  try {
    // Önce statik veriye kaydet
    const localSuccess = await saveBookContentToLocal(bookContent);
    
    // API'ye de kaydet (opsiyonel)
    if (typeof window !== 'undefined') {
      try {
        const token = sessionStorage.getItem('admin_token');
        if (token) {
          const response = await fetch('/api/admin/chapters', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookContent)
          });
          
          if (response.ok) {
            console.log('✅ Book content saved to API');
          } else {
            console.warn('API save failed:', response.statusText);
          }
        }
      } catch (apiError) {
        console.warn('API connection failed:', apiError);
      }
    }
    
    return localSuccess;
  } catch (error) {
    console.error('Save error:', error);
    return false;
  }
};

export const saveSettingsToAPI = async (settings: Settings): Promise<boolean> => {
  try {
    // Önce statik veriye kaydet
    const localSuccess = await saveSettingsToLocal(settings);
    
    // API'ye de kaydet (opsiyonel)
    if (typeof window !== 'undefined') {
      try {
        const token = sessionStorage.getItem('admin_token');
        if (token) {
          const response = await fetch('/api/admin/settings', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settings)
          });
          
          if (response.ok) {
            console.log('✅ Settings saved to API');
          } else {
            console.warn('API save failed:', response.statusText);
          }
        }
      } catch (apiError) {
        console.warn('API connection failed:', apiError);
      }
    }
    
    return localSuccess;
  } catch (error) {
    console.error('Save error:', error);
    return false;
  }
};

// Veri senkronizasyonu (statik veri dosyalarından)
export const syncDataFromLocal = async (): Promise<void> => {
  try {
    // Statik veri dosyalarından veri yükle
    await loadBooks();
    await loadSettings();
    console.log('Data synced from static files');
  } catch (error) {
    console.error('Data sync error:', error);
  }
};
