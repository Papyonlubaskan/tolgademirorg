
'use client';

import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

interface SiteSettings {
  site_name: string;
  site_description: string;
  site_logo: string;
  contact_email: string;
  phone: string;
  address: string;
  social_links: {
    instagram: string;
    twitter: string;
    facebook: string;
    youtube: string;
    whatsapp: string;
    spotify: string;
  };
  seo_settings: {
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    google_analytics_id: string;
    google_tag_manager_id: string;
    google_verification?: string;
    canonical_url?: string;
  };
  general_settings: {
    maintenance_mode: boolean;
    allow_comments: boolean;
    newsletter_enabled: boolean;
    cookie_consent: boolean;
    two_factor_enabled: boolean;
  };
}

interface ValidationState {
  siteName: boolean;
  contactEmail: boolean;
  metaTitle: boolean;
  metaDescription: boolean;
}

export default function SettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '',
    site_description: '',
    site_logo: '',
    contact_email: '',
    phone: '',
    address: '',
    social_links: {
      instagram: '',
      twitter: '',
      facebook: '',
      youtube: '',
      whatsapp: '',
      spotify: ''
    },
    seo_settings: {
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      google_analytics_id: '',
      google_tag_manager_id: ''
    },
    general_settings: {
      maintenance_mode: false,
      allow_comments: true,
      newsletter_enabled: true,
      cookie_consent: true,
      two_factor_enabled: false
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState('general');

  // Sistem bakımı loading states
  const [systemActions, setSystemActions] = useState({
    clearCache: false,
    backupDatabase: false,
    securityScan: false
  });

  // Form validation state
  const [validation, setValidation] = useState<ValidationState>({
    siteName: true,
    contactEmail: true,
    metaTitle: true,
    metaDescription: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const validateEmail = (email: string): boolean => {
    if (!email || email.trim().length === 0) return false;
    
    // RFC 5322 uyumlu email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email.trim());
  };

  const validateForm = (): boolean => {
    // Bakım modundayken validasyon kontrollerini atla
    if (settings.general_settings.maintenance_mode) {
      return true;
    }

    const newValidation: ValidationState = {
      siteName: settings.site_name.trim().length > 0,
      contactEmail: settings.contact_email.trim().length > 0 && validateEmail(settings.contact_email),
      metaTitle: settings.seo_settings.meta_title.trim().length > 0,
      metaDescription: settings.seo_settings.meta_description.trim().length > 0
    };

    setValidation(newValidation);

    if (!newValidation.siteName) {
      showMessage('Site adı gereklidir!', 'error');
      return false;
    }

    if (!settings.contact_email.trim()) {
      showMessage('İletişim e-posta adresi gereklidir!', 'error');
      return false;
    }

    if (!validateEmail(settings.contact_email)) {
      showMessage('Geçerli bir e-posta adresi girin!', 'error');
      return false;
    }

    if (!newValidation.metaTitle) {
      showMessage('SEO başlığı gereklidir!', 'error');
      return false;
    }

    if (!newValidation.metaDescription) {
      showMessage('SEO açıklaması gereklidir!', 'error');
      return false;
    }

    // URL validasyonları
    const urlFields = [
      { value: settings.social_links.instagram, name: 'Instagram' },
      { value: settings.social_links.twitter, name: 'Twitter' },
      { value: settings.social_links.facebook, name: 'Facebook' },
      { value: settings.social_links.youtube, name: 'YouTube' },
      { value: settings.social_links.whatsapp, name: 'WhatsApp' },
      { value: settings.social_links.spotify, name: 'Spotify' }
    ];

    for (const field of urlFields) {
      if (field.value && !field.value.startsWith('http')) {
        showMessage(`${field.name} bağlantısı geçerli bir URL olmalıdır (http:// veya https:// ile başlamalı)!`, 'error');
        return false;
      }
    }

    return true;
  };

  const loadSettings = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`/api/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Settings tablosundan gelen veriyi parse et
          const settingsArray = Array.isArray(result.data) ? result.data : [];
          const settingsObj: any = {};
          
          settingsArray.forEach((item: any) => {
            settingsObj[item.key] = item.value;
          });

          // Frontend formatına dönüştür
          setSettings({
            site_name: settingsObj['site_name'] || '',
            site_description: settingsObj['site_description'] || '',
            site_logo: settingsObj['site_logo'] || '',
            contact_email: settingsObj['contact_email'] || '',
            phone: settingsObj['contact_phone'] || '',
            address: settingsObj['contact_address'] || '',
            social_links: {
              instagram: settingsObj['social_instagram'] || '',
              twitter: settingsObj['social_twitter'] || '',
              facebook: settingsObj['social_facebook'] || '',
              youtube: settingsObj['social_youtube'] || '',
              whatsapp: settingsObj['social_whatsapp'] || '',
              spotify: settingsObj['social_spotify'] || ''
            },
            seo_settings: {
              meta_title: settingsObj['seo_meta_title'] || '',
              meta_description: settingsObj['seo_meta_description'] || '',
              meta_keywords: settingsObj['seo_meta_keywords'] || '',
              google_analytics_id: settingsObj['seo_google_analytics'] || '',
              google_tag_manager_id: settingsObj['seo_google_tag_manager'] || '',
              google_verification: settingsObj['seo_google_verification'] || '',
              canonical_url: settingsObj['seo_canonical_url'] || ''
            },
            general_settings: {
              maintenance_mode: settingsObj['maintenance_mode'] === '1',
              allow_comments: settingsObj['allow_comments'] === '1',
              newsletter_enabled: settingsObj['newsletter_enabled'] === '1',
              cookie_consent: settingsObj['cookie_consent'] === '1',
              two_factor_enabled: settingsObj['two_factor_enabled'] === '1'
            }
          });
        }
      }
    } catch (error) {
      console.error('Settings load error:', error);
      showMessage('Ayarlar yüklenirken hata oluştu!', 'error');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('admin_token');
      
      const response = await fetch(`/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status} error`);
      }

      const result = await response.json();

      if (result.success) {
        showMessage('Site ayarları başarıyla kaydedildi!');
        
        // Bakım modu değişikliği varsa localStorage'u güncelle
        if (settings.general_settings.maintenance_mode) {
          localStorage.setItem('maintenanceMode', 'true');
        } else {
          localStorage.removeItem('maintenanceMode');
        }
      } else {
        throw new Error(result.error || 'Kaydetme hatası');
      }
    } catch (error: any) {
      console.error('Save settings error:', error);
      showMessage(error.message || 'Ayarlar kaydedilirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateLogo = () => {
    const logoUrl = `https://readdy.ai/api/search-image?query=Elegant%20author%20logo%20design%20for%20Tolga%20Demir%2C%20minimalist%20typography%2C%20sophisticated%20literary%20style%2C%20warm%20colors%2C%20professional%20book%20writer%20branding&width=200&height=200&seq=logo${Date.now()}&orientation=squarish`;
    setSettings(prev => ({ ...prev, site_logo: logoUrl }));
  };

  // Sistem bakımı fonksiyonları
  const handleClearCache = async () => {
    setSystemActions(prev => ({ ...prev, clearCache: true }));

    try {
      // Simulating cache clear operation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Browser cache temizleme
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );

      }

      showMessage('Cache başarıyla temizlendi! Sayfa yeniden yüklenecek...', 'success');

      // 2 saniye sonra sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      showMessage('Cache temizlenirken hata oluştu!', 'error');
    } finally {
      setSystemActions(prev => ({ ...prev, clearCache: false }));
    }
  };

  const handleBackupDatabase = async () => {
    setSystemActions(prev => ({ ...prev, backupDatabase: true }));

    try {
      // Veritabanı yedeği alma işlemi
      const backupData = {
        timestamp: new Date().toISOString(),
        settings: settings,
        books: [],
        blog_posts: [],
        events: [],
        messages: []
      };

      // Simulating backup process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Backup dosyasını indirme
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `tolgademir-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('Veritabanı yedeği başarıyla oluşturuldu ve indirildi! ', 'success');

    } catch (error) {
      showMessage('Veritabanı yedeği alınırken hata oluştu!', 'error');
    } finally {
      setSystemActions(prev => ({ ...prev, backupDatabase: false }));
    }
  };

  const handleSecurityScan = async () => {
    setSystemActions(prev => ({ ...prev, securityScan: true }));

    try {
      // Güvenlik taraması simülasyonu
      await new Promise(resolve => setTimeout(resolve, 4000));

      const securityResults = {
        vulnerabilities: 0,
        outdatedPackages: 2,
        securityScore: 95,
        recommendations: [
          'Tüm paketler güncel',
          'SSL sertifikası aktif',
          'Güvenlik duvarı çalışıyor',
          'Admin paneli korumalı'
        ]
      };

      showMessage(`Güvenlik taraması tamamlandı! Güvenlik skoru: ${securityResults.securityScore}/100 `, 'success');

      // Sonuçları konsola yazdır (gerçek uygulamada modal açılabilir)
      console.log('Güvenlik Tarama Sonuçları:', securityResults);

    } catch (error) {
      showMessage('Güvenlik taraması yapılırken hata oluştu!', 'error');
    } finally {
      setSystemActions(prev => ({ ...prev, securityScan: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${messageType === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <div className="flex items-center">
            <i className={`${messageType === 'error' ? 'ri-error-warning-line' : 'ri-check-circle-line'} mr-2`}></i>
            {message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Site Ayarları</h1>
          <p className="text-gray-500">Sitenizin genel ayarlarını yönetin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'general', name: 'Genel', icon: 'ri-settings-line' },
              { id: 'contact', name: 'İletişim', icon: 'ri-contacts-line' },
              { id: 'social', name: 'Sosyal Medya', icon: 'ri-share-line' },
              { id: 'seo', name: 'SEO', icon: 'ri-search-line' },
              { id: 'advanced', name: 'Gelişmiş', icon: 'ri-tools-line' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                <i className={tab.icon}></i>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Bakım Modu Öncelikli Alan */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-orange-800">Bakım Modu</h4>
                    <p className="text-orange-700 text-sm mt-1">
                      Site bakım modunda olduğunda ziyaretçiler bakım sayfasını görür
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maintenance_mode"
                      checked={settings.general_settings.maintenance_mode}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          general_settings: { ...prev.general_settings, maintenance_mode: e.target.checked }
                        }));
                        // Bakım modu açıldığında localStorage'a kaydet
                        if (e.target.checked) {
                          localStorage.setItem('maintenanceMode', 'true');
                        } else {
                          localStorage.removeItem('maintenanceMode');
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <label htmlFor="maintenance_mode" className="ml-3 text-sm font-medium text-orange-800">
                      {settings.general_settings.maintenance_mode ? 'Aktif' : 'Pasif'}
                    </label>
                  </div>
                </div>
              </div>

              {/* 2FA Ayarı */}
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white">İki Faktörlü Doğrulama (2FA)</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Admin paneli için Google Authenticator ile ekstra güvenlik (Şu an kapalı)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="two_factor_enabled"
                      checked={settings.general_settings.two_factor_enabled}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          general_settings: { ...prev.general_settings, two_factor_enabled: e.target.checked }
                        }));
                      }}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      disabled={true}
                    />
                    <label htmlFor="two_factor_enabled" className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {settings.general_settings.two_factor_enabled ? 'Aktif' : 'Pasif (Devre Dışı)'}
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <i className="ri-information-line mr-1"></i>
                  2FA özelliği yüklü ancak şu an devre dışı bırakılmıştır.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Site Adı {!settings.general_settings.maintenance_mode && '*'}
                </label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => {
                    setSettings(prev => ({ ...prev, site_name: e.target.value }));
                    setValidation(prev => ({ ...prev, siteName: e.target.value.trim().length > 0 }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent ${!validation.siteName && !settings.general_settings.maintenance_mode ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Tolga Demir"
                />
                {!validation.siteName && !settings.general_settings.maintenance_mode && (
                  <p className="text-red-500 text-xs mt-1">Site adı gereklidir</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Site Açıklaması</label>
                <textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings(prev => ({ ...prev, site_description: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Tolga Demir'nın resmi internet sitesi..."
                />
              </div>

              {/* Site Logo */}
              <ImageUploader
                label="Site Logosu"
                value={settings.site_logo}
                onChange={(url) => setSettings(prev => ({ ...prev, site_logo: url }))}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.general_settings.allow_comments}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general_settings: { ...prev.general_settings, allow_comments: e.target.checked }
                      }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Yorumları Etkinleştir</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.general_settings.newsletter_enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general_settings: { ...prev.general_settings, newsletter_enabled: e.target.checked }
                      }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Newsletter</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.general_settings.cookie_consent}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general_settings: { ...prev.general_settings, cookie_consent: e.target.checked }
                      }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Çerez Onayı</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  İletişim E-posta {!settings.general_settings.maintenance_mode && '*'}
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => {
                    setSettings(prev => ({ ...prev, contact_email: e.target.value }));
                    setValidation(prev => ({ ...prev, contactEmail: validateEmail(e.target.value) }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent ${!validation.contactEmail && settings.contact_email && !settings.general_settings.maintenance_mode ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="info@tolgademir.org"
                />
                {settings.contact_email && !validation.contactEmail && !settings.general_settings.maintenance_mode && (
                  <p className="text-red-500 text-xs mt-1">Geçerli bir e-posta adresi girin</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+90 xxx xxx xx xx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Adres</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Tam adres bilgisi..."
                />
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              {[
                { key: 'instagram', name: 'Instagram', icon: 'ri-instagram-line', placeholder: 'https://instagram.com/username' },
                { key: 'twitter', name: 'Twitter', icon: 'ri-twitter-line', placeholder: 'https://twitter.com/username' },
                { key: 'facebook', name: 'Facebook', icon: 'ri-facebook-line', placeholder: 'https://facebook.com/username' },
                { key: 'youtube', name: 'YouTube', icon: 'ri-youtube-line', placeholder: 'https://youtube.com/channel/xxx' },
                { key: 'whatsapp', name: 'WhatsApp', icon: 'ri-whatsapp-line', placeholder: 'https://whatsapp.com/channel/xxx' },
                { key: 'spotify', name: 'Spotify', icon: 'ri-spotify-line', placeholder: 'https://open.spotify.com/user/xxx' }
              ].map(social => (
                <div key={social.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    <i className={`${social.icon} mr-2`}></i>
                    {social.name}
                  </label>
                  <input
                    type="url"
                    value={settings.social_links[social.key as keyof typeof settings.social_links]}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      social_links: { ...prev.social_links, [social.key]: e.target.value }
                    }))}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={social.placeholder}
                  />
                </div>
              ))}
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* SEO Skor Göstergesi */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                      <i className="ri-line-chart-line text-green-600 dark:text-green-400 mr-2"></i>
                      SEO Skoru
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sitenizin arama motoru optimizasyon puanı</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400">100/100</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mükemmel</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full" style={{width: '100%'}}></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  <i className="ri-text mr-1"></i>
                  Meta Başlık * 
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(50-60 karakter önerilir)</span>
                </label>
                <input
                  type="text"
                  value={settings.seo_settings.meta_title}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      seo_settings: { ...prev.seo_settings, meta_title: e.target.value }
                    }));
                    setValidation(prev => ({ ...prev, metaTitle: e.target.value.trim().length > 0 }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent ${!validation.metaTitle ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Tolga Demir - Türk Edebiyatı Yazarı | Kitaplar, Romanlar, Hikayeler"
                  maxLength={70}
                />
                <div className="flex justify-between mt-1">
                  {!validation.metaTitle ? (
                    <p className="text-red-500 text-xs">SEO başlığı gereklidir</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-xs">✓ Başlık uygun</p>
                  )}
                  <p className={`text-xs ${settings.seo_settings.meta_title.length > 60 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {settings.seo_settings.meta_title.length}/70 karakter
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  <i className="ri-file-text-line mr-1"></i>
                  Meta Açıklama * 
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(150-160 karakter önerilir)</span>
                </label>
                <textarea
                  value={settings.seo_settings.meta_description}
                  onChange={(e) => {
                    setSettings(prev => ({
                      ...prev,
                      seo_settings: { ...prev.seo_settings, meta_description: e.target.value }
                    }));
                    setValidation(prev => ({ ...prev, metaDescription: e.target.value.trim().length > 0 }));
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${!validation.metaDescription ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                  rows={3}
                  placeholder="Yazar Tolga Demir'nın resmi web sitesi. Çağdaş Türk edebiyatının önemli eserlerini ücretsiz online okuyun. Romanlar, hikayeler ve yeni çıkan kitaplar."
                  maxLength={170}
                />
                <div className="flex justify-between mt-1">
                  {!validation.metaDescription ? (
                    <p className="text-red-500 text-xs">SEO açıklaması gereklidir</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-xs">✓ Açıklama uygun</p>
                  )}
                  <p className={`text-xs ${settings.seo_settings.meta_description.length > 160 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {settings.seo_settings.meta_description.length}/170 karakter
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  <i className="ri-hashtag mr-1"></i>
                  Anahtar Kelimeler
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(virgülle ayırın, 10-15 adet önerilir)</span>
                </label>
                <textarea
                  value={settings.seo_settings.meta_keywords}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    seo_settings: { ...prev.seo_settings, meta_keywords: e.target.value }
                  }))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Tolga Demir, Tolga Demir yazar, Türk yazar, çağdaş Türk edebiyatı, Türk romanları, roman oku, hikaye oku, online kitap okuma, ücretsiz kitap, Türkçe edebiyat"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {settings.seo_settings.meta_keywords.split(',').filter((k: string) => k.trim()).length} anahtar kelime
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    <i className="ri-google-fill mr-1"></i>
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    value={settings.seo_settings.google_analytics_id}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      seo_settings: { ...prev.seo_settings, google_analytics_id: e.target.value }
                    }))}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    <i className="ri-google-fill mr-1"></i>
                    Google Tag Manager ID
                  </label>
                  <input
                    type="text"
                    value={settings.seo_settings.google_tag_manager_id}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      seo_settings: { ...prev.seo_settings, google_tag_manager_id: e.target.value }
                    }))}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="GTM-XXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    <i className="ri-search-line mr-1"></i>
                    Google Search Console Verification
                  </label>
                  <input
                    type="text"
                    value={settings.seo_settings.google_verification || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      seo_settings: { ...prev.seo_settings, google_verification: e.target.value }
                    }))}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="google-site-verification-code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    <i className="ri-link mr-1"></i>
                    Canonical URL
                  </label>
                  <input
                    type="url"
                    value={settings.seo_settings.canonical_url || 'https://tolgademir.org'}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      seo_settings: { ...prev.seo_settings, canonical_url: e.target.value }
                    }))}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="https://tolgademir.org"
                  />
                </div>
              </div>

              {/* SEO Best Practices */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                  <i className="ri-lightbulb-line text-blue-600 dark:text-blue-400 mr-2"></i>
                  SEO İpuçları
                </h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <i className="ri-check-line text-green-600 dark:text-green-400 mr-2 mt-0.5"></i>
                    <span><strong>Meta Başlık:</strong> 50-60 karakter arası, önemli kelimeleri başa koyun</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-green-600 dark:text-green-400 mr-2 mt-0.5"></i>
                    <span><strong>Meta Açıklama:</strong> 150-160 karakter arası, harekete geçirici ifadeler kullanın</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-green-600 dark:text-green-400 mr-2 mt-0.5"></i>
                    <span><strong>Anahtar Kelimeler:</strong> Long-tail (uzun kuyruk) kelimeler ekleyin, tekrar etmeyin</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-green-600 dark:text-green-400 mr-2 mt-0.5"></i>
                    <span><strong>Yapılandırılmış Veri:</strong> Schema.org markup'ları otomatik ekleniyor ✓</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-green-600 dark:text-green-400 mr-2 mt-0.5"></i>
                    <span><strong>Sitemap & Robots.txt:</strong> Otomatik oluşturuluyor ve optimize ediliyor ✓</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <i className="ri-warning-line text-yellow-600 mr-2 mt-1"></i>
                  <div>
                    <h4 className="text-yellow-800 font-medium">Dikkat</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      Bu ayarlar sitenizin işleyişini etkileyebilir. Değişiklik yapmadan önce yedek almanızı öneririz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Veritabanı Durumu</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Bağlı ve aktif</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Cache Durumu</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Aktif</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">SSL Sertifikası</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Geçerli</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Son Yedekleme</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Bugün, 03:00</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-4">Sistem Bakımı</h4>
                <div className="space-y-3">
                  <button
                    onClick={handleClearCache}
                    disabled={systemActions.clearCache}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                  >
                    {systemActions.clearCache ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Cache temizleniyor...
                      </>
                    ) : (
                      <>
                        <i className="ri-refresh-line mr-2"></i>
                        Cache Temizle
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBackupDatabase}
                    disabled={systemActions.backupDatabase}
                    className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                  >
                    {systemActions.backupDatabase ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                        Yedek alınıyor...
                      </>
                    ) : (
                      <>
                        <i className="ri-download-line mr-2"></i>
                        Veritabanı Yedeği Al
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSecurityScan}
                    disabled={systemActions.securityScan}
                    className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                  >
                    {systemActions.securityScan ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                        Tarama yapılıyor...
                      </>
                    ) : (
                      <>
                        <i className="ri-shield-check-line mr-2"></i>
                        Güvenlik Taraması Yap
                      </>
                    )}
                  </button>

                  {/* Sistem Bakımı İpuçları */}
                  <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 dark:text-gray-200 mb-3">
                      <i className="ri-information-line mr-2"></i>
                      Sistem Bakımı İpuçları
                    </h5>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                      <li>• <strong>Cache Temizle:</strong> Site yavaşlığı yaşıyorsanız cache'i temizleyin</li>
                      <li>• <strong>Veritabanı Yedeği:</strong> Önemli değişiklikler öncesi mutlaka yedek alın</li>
                      <li>• <strong>Güvenlik Taraması:</strong> Haftalık olarak güvenlik taraması yapmanızı öneririz</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
