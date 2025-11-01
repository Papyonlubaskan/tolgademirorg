
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<Array<{label: string; url: string}>>([
    { label: 'Ana Sayfa', url: '/' },
    { label: 'Kitaplarım', url: '/kitaplar' },
    { label: 'Hakkımda', url: '/hakkimda' },
    { label: 'İletişim', url: '/iletisim' }
  ]);
  const [siteName, setSiteName] = useState('Tolga Demir');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    loadHeaderSettings();
    
    // LocalStorage'dan tema tercihini yükle
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      applyDarkMode(true);
    } else {
      setDarkMode(false);
      applyDarkMode(false);
    }
  }, []);

  const loadHeaderSettings = async () => {
    try {
      const response = await fetch('/api/settings?key=header_settings');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.value) {
          const settings = JSON.parse(result.data.value);
          if (settings.site_name) setSiteName(settings.site_name);
          if (settings.menu_items && settings.menu_items.length > 0) {
            setMenuItems(settings.menu_items.sort((a: any, b: any) => a.order - b.order));
          }
        }
      }
    } catch (error) {
      // Sessizce göz ardı et - bakım modunda veya ilk yüklemede normal
    }
  };

  const applyDarkMode = (isDark: boolean) => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    applyDarkMode(newDarkMode);
    // Tema tercihini localStorage'a kaydet
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (!mounted) {
    return (
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-orange-100 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 cursor-pointer">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent" style={{ fontFamily: 'Times New Roman, serif' }}>
                  {siteName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 -mt-1 tracking-wider">YAZAR & HİKAYE ANLATICI</div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              {menuItems.map((item, index) => (
                <Link 
                  key={index}
                  href={item.url} 
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 cursor-pointer"
                >
                  {item.label}
                </Link>
              ))}
              <div className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400">
                <i className="ri-moon-line"></i>
              </div>
            </nav>
            <div className="flex items-center space-x-4 md:hidden">
              <div className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400">
                <i className="ri-moon-line"></i>
              </div>
              <div className="w-6 h-6 flex items-center justify-center cursor-pointer">
                <i className="ri-menu-line text-gray-700 dark:text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-orange-100 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 cursor-pointer group">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent group-hover:from-orange-700 group-hover:to-pink-700 transition-all duration-300" style={{ fontFamily: 'Times New Roman, serif' }}>
                {siteName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 -mt-1 tracking-wider font-medium">YAZAR & HİKAYE ANLATICI</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-10">
            {menuItems.map((item, index) => (
              <Link 
                key={index}
                href={item.url} 
                className="text-gray-800 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 cursor-pointer font-medium text-[15px] tracking-wide"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 cursor-pointer rounded-lg"
            >
              <i className={darkMode ? "ri-sun-line" : "ri-moon-line"}></i>
            </button>
          </nav>
          <div className="flex items-center space-x-4 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 cursor-pointer rounded-lg"
            >
              <i className={darkMode ? "ri-sun-line" : "ri-moon-line"}></i>
            </button>
            <button
              onClick={toggleMobileMenu}
              className="w-6 h-6 flex items-center justify-center cursor-pointer"
            >
              <i className={mobileMenuOpen ? "ri-close-line text-gray-700 dark:text-gray-300" : "ri-menu-line text-gray-700 dark:text-gray-300"}></i>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-2">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.url}
                  onClick={closeMobileMenu}
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 cursor-pointer py-2 px-4 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-800"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 px-4 mb-2">Yasal Sayfalar</div>
                <Link
                  href="/gizlilik-politikasi"
                  onClick={closeMobileMenu}
                  className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 cursor-pointer py-2 px-4 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-800 text-sm block"
                >
                  Gizlilik Politikası
                </Link>
                <Link
                  href="/kullanim-kosullari"
                  onClick={closeMobileMenu}
                  className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 cursor-pointer py-2 px-4 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-800 text-sm block"
                >
                  Kullanım Koşulları
                </Link>
                <Link
                  href="/kvkk"
                  onClick={closeMobileMenu}
                  className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300 cursor-pointer py-2 px-4 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-800 text-sm block"
                >
                  KVKK Aydınlatma Metni
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
