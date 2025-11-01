
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [footerSettings, setFooterSettings] = useState({
    site_name: 'Tolga Demir',
    copyright_text: '2025 Tolga Demir. Tüm hakları saklıdır.',
    about_text: 'Hikayelerin büyülü dünyasında okurlarımla buluşuyorum.',
    popular_books_title: 'Popüler Kitaplar',
    newsletter_title: 'Haber Bülteni',
    newsletter_description: 'Yeni kitaplar, bölüm güncellemeleri ve özel içeriklerden ilk siz haberdar olun!',
    newsletter_button_text: 'Abone Ol',
    social_links: {
      instagram: 'https://www.instagram.com/tolgademir1914/?utm_source=ig_web_button_share_sheet',
      twitter: '',
      facebook: '',
      youtube: '',
      spotify: '',
      whatsapp: 'https://whatsapp.com/channel/0029VbC6iaFJUM2YHVSaFP0e',
      email: 'tolgatolgademir86@gmail.com'
    },
    legal_links: [
      { label: 'Gizlilik Politikası', url: '/gizlilik-politikasi' },
      { label: 'Kullanım Koşulları', url: '/kullanim-kosullari' },
      { label: 'KVKK Aydınlatma Metni', url: '/kvkk' }
    ]
  });
  const [navigationLinks, setNavigationLinks] = useState([
    { label: 'Ana Sayfa', url: '/' },
    { label: 'Kitaplarım', url: '/kitaplar' },
    { label: 'Hakkımda', url: '/hakkimda' },
    { label: 'İletişim', url: '/iletisim' }
  ]);

  useEffect(() => {
    loadFooterSettings();
    loadHeaderSettings();
  }, []);

  const loadFooterSettings = async () => {
    try {
      const response = await fetch('/api/settings?key=footer_settings');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.value) {
          const settings = JSON.parse(result.data.value);
          setFooterSettings(prev => ({ ...prev, ...settings }));
        }
      }
    } catch (error) {
      console.error('Footer settings load error:', error);
    }
  };

  const loadHeaderSettings = async () => {
    try {
      const response = await fetch('/api/settings?key=header_settings');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.value) {
          const settings = JSON.parse(result.data.value);
          if (settings.menu_items && settings.menu_items.length > 0) {
            setNavigationLinks(settings.menu_items.sort((a: any, b: any) => a.order - b.order));
          }
        }
      }
    } catch (error) {
      console.error('Header settings load error:', error);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      // Form verilerini localStorage'a kaydet (gerçek projede API'ye gönderilir)
      const subscribers = JSON.parse(localStorage.getItem('subscribers') || '[]');
      if (!subscribers.includes(email)) {
        subscribers.push({
          email: email,
          date: new Date().toISOString(),
          active: true
        });
        localStorage.setItem('subscribers', JSON.stringify(subscribers));
      }
      
      setIsSubscribed(true);
      setShowMessage(true);
      setEmail('');
      
      // Mesajı 3 saniye sonra gizle
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-12 transition-colors">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent text-2xl italic" style={{fontFamily: 'Times New Roman, serif'}}>
              {footerSettings.site_name || 'Tolga Demir'}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {footerSettings.about_text || 'Hikayelerin büyülü dünyasında okurlarımla buluşuyorum.'}
            </p>
            <div className="flex justify-center space-x-6">
              {footerSettings.social_links.instagram && (
                <a href={footerSettings.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <i className="ri-instagram-fill text-xl"></i>
                </a>
              )}
              {footerSettings.social_links.twitter && (
                <a href={footerSettings.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <i className="ri-twitter-fill text-xl"></i>
                </a>
              )}
              {footerSettings.social_links.facebook && (
                <a href={footerSettings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <i className="ri-facebook-fill text-xl"></i>
                </a>
              )}
              {footerSettings.social_links.youtube && (
                <a href={footerSettings.social_links.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <i className="ri-youtube-fill text-xl"></i>
                </a>
              )}
              {footerSettings.social_links.email && (
                <a href={`mailto:${footerSettings.social_links.email}`} className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <i className="ri-mail-fill text-xl"></i>
                </a>
              )}
              {footerSettings.social_links.whatsapp && (
                <a href={footerSettings.social_links.whatsapp} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  <i className="ri-whatsapp-fill text-xl"></i>
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Navigasyon</h4>
            <ul className="space-y-2">
              {navigationLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.url} className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {footerSettings.popular_books_title || 'Popüler Kitaplar'}
            </h4>
            <ul className="space-y-2">
              <li><span className="text-gray-600 dark:text-gray-400">Kitaplar yakında...</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {footerSettings.newsletter_title || 'Haber Bülteni'}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {footerSettings.newsletter_description || 'Yeni kitaplar, bölüm güncellemeleri ve özel içeriklerden ilk siz haberdar olun!'}
            </p>
            
            {showMessage && (
              <div className="bg-green-100 dark:bg-green-800 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-200 px-3 py-2 rounded-lg mb-3 text-sm">
                Başarıyla abone oldunuz! Güncellemelerimizi e-postanızdan takip edebilirsiniz.
              </div>
            )}
            
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button 
                type="submit"
                className="w-full bg-orange-600 dark:bg-orange-700 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors cursor-pointer text-sm whitespace-nowrap flex items-center justify-center"
              >
                <i className="ri-notification-line mr-2"></i>
                {footerSettings.newsletter_button_text || 'Abone Ol'}
              </button>
            </form>
            
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              İstediğiniz zaman abonelikten çıkabilirsiniz.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
            {(footerSettings.legal_links || []).map((link, index) => (
              <Link 
                key={index}
                href={link.url} 
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {footerSettings.copyright_text || '2025 Tolga Demir. Tüm hakları saklıdır.'}
            </p>
            <div className="mt-4">
              <a 
                href="https://okandemir.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-sm"
              >
                <span>Designed by</span>
                <span className="font-semibold">O Copyright© Dijital Pazarlama & Yazılım</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
