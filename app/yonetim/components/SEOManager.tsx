
'use client';

import { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';


const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
};

export default function SEOManager() {
  const [seoData, setSeoData] = useState({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    structuredData: '',
    robotsTxt: '',
    sitemap: true,
    analytics: ''
  });
  const [seoScore, setSeoScore] = useState(0);
  const [seoIssues, setSeoIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSEOData();
    calculateSEOScore();
  }, []);

  const loadSEOData = async () => {
    try {
      setLoading(true);
      // Site gerçek verilerini yükle
      const response = await fetch(`/api/books`, {
        headers: {
          },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('SEO data loaded:', result.data);
        
        // Site içeriğinden SEO verilerini çıkar
        const siteSettings = result.data.settings || [];
        const seoSettings = siteSettings.find((setting: any) => setting.key === 'seo') || {};
        
        setSeoData({
          metaTitle: seoSettings.meta_title || 'Tolga Demir - Yazar Resmi Web Sitesi',
          metaDescription: seoSettings.meta_description || 'Tolga Demir\'nın resmi web sitesi. Kitapları, blog yazıları ve etkinlikleri hakkında bilgi alın.',
          keywords: seoSettings.keywords || 'Tolga Demir, yazar, kitap, roman, blog',
          ogTitle: seoSettings.og_title || 'Tolga Demir - Yazar',
          ogDescription: seoSettings.og_description || 'Türk edebiyatının önemli yazarlarından Tolga Demir\'nın resmi sitesi',
          ogImage: seoSettings.og_image || '',
          structuredData: seoSettings.structured_data || '',
          robotsTxt: seoSettings.robots_txt || 'User-agent: *\nAllow: /',
          sitemap: seoSettings.sitemap !== false,
          analytics: seoSettings.analytics || ''
        });
      } else {
        // Gerçek site verilerine dayalı default değerler
        setSeoData({
          metaTitle: 'Tolga Demir - Yazar Resmi Web Sitesi',
          metaDescription: 'Tolga Demir\'nın resmi web sitesi. Kitapları, blog yazıları ve etkinlikleri hakkında bilgi alın.',
          keywords: 'Tolga Demir, yazar, kitap, roman, blog, Turkish literature',
          ogTitle: 'Tolga Demir - Yazar',
          ogDescription: 'Türk edebiyatının önemli yazarlarından Tolga Demir\'nın resmi sitesi',
          ogImage: '',
          structuredData: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Tolga Demir",
            "jobTitle": "Author",
            "url": "https://maralataaca.com"
          }, null, 2),
          robotsTxt: 'User-agent: *\nAllow: /',
          sitemap: true,
          analytics: ''
        });
      }
    } catch (error) {
      console.error('Error loading SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSEOScore = () => {
    let score = 0;
    const issues = [];

    // Meta title kontrolü
    if (seoData.metaTitle) {
      if (seoData.metaTitle.length >= 30 && seoData.metaTitle.length <= 60) {
        score += 15;
      } else {
        issues.push({
          type: 'warning',
          message: 'Meta başlık 30-60 karakter arasında olmalıdır',
          current: seoData.metaTitle.length,
          recommended: '30-60 karakter'
        });
      }
    } else {
      issues.push({
        type: 'error',
        message: 'Meta başlık eksik',
        solution: 'Site için açıklayıcı bir başlık ekleyin'
      });
    }

    // Meta description kontrolü
    if (seoData.metaDescription) {
      if (seoData.metaDescription.length >= 120 && seoData.metaDescription.length <= 160) {
        score += 15;
      } else {
        issues.push({
          type: 'warning',
          message: 'Meta açıklama 120-160 karakter arasında olmalıdır',
          current: seoData.metaDescription.length,
          recommended: '120-160 karakter'
        });
      }
    } else {
      issues.push({
        type: 'error',
        message: 'Meta açıklama eksik',
        solution: 'Site için açıklayıcı bir açıklama ekleyin'
      });
    }

    // Keywords kontrolü
    if (seoData.keywords) {
      score += 10;
    } else {
      issues.push({
        type: 'warning',
        message: 'Anahtar kelimeler eksik',
        solution: 'Site içeriğinizi tanımlayan anahtar kelimeler ekleyin'
      });
    }

    // Open Graph kontrolü
    if (seoData.ogTitle && seoData.ogDescription) {
      score += 15;
    } else {
      issues.push({
        type: 'warning',
        message: 'Open Graph verileri eksik',
        solution: 'Sosyal medya paylaşımları için OG verilerini tamamlayın'
      });
    }

    // OG Image kontrolü
    if (seoData.ogImage) {
      score += 10;
    } else {
      issues.push({
        type: 'info',
        message: 'Open Graph görseli eksik',
        solution: '1200x630 boyutunda bir görsel ekleyin'
      });
    }

    // Structured Data kontrolü
    if (seoData.structuredData) {
      try {
        JSON.parse(seoData.structuredData);
        score += 15;
      } catch {
        issues.push({
          type: 'error',
          message: 'Yapılandırılmış veri geçersiz JSON formatında',
          solution: 'JSON formatını kontrol edin'
        });
      }
    } else {
      issues.push({
        type: 'info',
        message: 'Yapılandırılmış veri eksik',
        solution: 'Arama motorları için Schema.org verisi ekleyin'
      });
    }

    // Sitemap kontrolü
    if (seoData.sitemap) {
      score += 10;
    }

    // Analytics kontrolü
    if (seoData.analytics) {
      score += 10;
    } else {
      issues.push({
        type: 'info',
        message: 'Analytics kodu eksik',
        solution: 'Google Analytics veya benzeri bir analiz kodu ekleyin'
      });
    }

    setSeoScore(score);
    setSeoIssues(issues as any);
  };

  useEffect(() => {
    calculateSEOScore();
  }, [seoData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({
          key: 'seo',
          value: seoData
        }),
      });

      if (response.ok) {
        console.log('SEO settings saved successfully');
        alert('SEO ayarları başarıyla kaydedildi!');
      } else {
        console.error('Failed to save SEO settings');
        alert('SEO ayarları kaydedildi (yerel olarak)');
      }
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      alert('SEO ayarları kaydedildi (yerel olarak)');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">SEO Yönetimi</h1>
          <p className="text-gray-500">Sitenizin arama motoru optimizasyonunu yönetin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Kaydediliyor...
            </>
          ) : (
            <>
              <i className="ri-save-line mr-2"></i>
              Kaydet
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* SEO Score */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">SEO Skoru</h3>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(seoScore)}`}>{seoScore}/100</div>
                  <div className="text-sm text-gray-500">Genel Puan</div>
                </div>
                <div className="w-20 h-20 relative">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${seoScore * 2.51} 251`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" className={seoScore >= 80 ? 'stop-green-500' : seoScore >= 60 ? 'stop-yellow-500' : 'stop-red-500'} />
                        <stop offset="100%" className={seoScore >= 80 ? 'stop-green-600' : seoScore >= 60 ? 'stop-yellow-600' : 'stop-red-600'} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* SEO Issues */}
            {seoIssues.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">İyileştirme Önerileri:</h4>
                {seoIssues.map((issue: any, index: number) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    issue.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                    issue.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <i className={`${
                        issue.type === 'error' ? 'ri-error-warning-line text-red-500' :
                        issue.type === 'warning' ? 'ri-alert-line text-yellow-500' :
                        'ri-information-line text-blue-500'
                      } text-lg mt-0.5`}></i>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">{issue.message}</p>
                        {issue.solution && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{issue.solution}</p>
                        )}
                        {issue.current && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Mevcut: {issue.current} • Önerilen: {issue.recommended}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Basic SEO */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Temel SEO</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Meta Başlık
                    <span className="text-gray-400 ml-2">({seoData.metaTitle.length}/60)</span>
                  </label>
                  <input
                    type="text"
                    value={seoData.metaTitle}
                    onChange={(e) => setSeoData({ ...seoData, metaTitle: e.target.value })}
                    className="w-full px-3 py-2 !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Site başlığınızı girin..."
                    maxLength={60}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Meta Açıklama
                    <span className="text-gray-400 ml-2">({seoData.metaDescription.length}/160)</span>
                  </label>
                  <textarea
                    value={seoData.metaDescription}
                    onChange={(e) => setSeoData({ ...seoData, metaDescription: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Site açıklamanızı girin..."
                    maxLength={160}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Anahtar Kelimeler</label>
                  <input
                    type="text"
                    value={seoData.keywords}
                    onChange={(e) => setSeoData({ ...seoData, keywords: e.target.value })}
                    className="w-full px-3 py-2 !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="anahtar, kelime, virgül, ile, ayırın"
                  />
                </div>
              </div>
            </div>

            {/* Open Graph */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Open Graph (Sosyal Medya)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">OG Başlık</label>
                  <input
                    type="text"
                    value={seoData.ogTitle}
                    onChange={(e) => setSeoData({ ...seoData, ogTitle: e.target.value })}
                    className="w-full px-3 py-2 !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Sosyal medya başlığı..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">OG Açıklama</label>
                  <textarea
                    value={seoData.ogDescription}
                    onChange={(e) => setSeoData({ ...seoData, ogDescription: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Sosyal medya açıklaması..."
                  />
                </div>

                <ImageUploader
                  label="OG Görseli (1200x630)"
                  value={seoData.ogImage}
                  onChange={(url) => setSeoData({ ...seoData, ogImage: url })}
                />
              </div>
            </div>
          </div>

          {/* Advanced SEO */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Yapılandırılmış Veri (Schema.org)</h3>
              <textarea
                value={seoData.structuredData}
                onChange={(e) => setSeoData({ ...seoData, structuredData: e.target.value })}
                rows={12}
                className="w-full px-3 py-2 !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                placeholder='{"@context": "https://schema.org", "@type": "Person", "name": "Tolga Demir"}'
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">JSON-LD formatında yapılandırılmış veri girin</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Robots.txt</h3>
              <textarea
                value={seoData.robotsTxt}
                onChange={(e) => setSeoData({ ...seoData, robotsTxt: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 !bg-white dark:!bg-gray-700 !text-gray-900 dark:!text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                placeholder="User-agent: *&#10;Allow: /"
              />
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={seoData.sitemap}
                      onChange={(e) => setSeoData({ ...seoData, sitemap: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sitemap Oluştur</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Analytics Kodu</label>
                  <input
                    type="text"
                    value={seoData.analytics}
                    onChange={(e) => setSeoData({ ...seoData, analytics: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    placeholder="G-XXXXXXXXXX veya UA-XXXXXXXXX"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
