'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  keyboardNavigation: boolean;
  setReducedMotion: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setScreenReader: (value: boolean) => void;
  setKeyboardNavigation: (value: boolean) => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [screenReader, setScreenReader] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const savedReducedMotion = localStorage.getItem('a11y-reduced-motion') === 'true';
    const savedHighContrast = localStorage.getItem('a11y-high-contrast') === 'true';
    const savedFontSize = localStorage.getItem('a11y-font-size') as 'small' | 'medium' | 'large' || 'medium';
    const savedScreenReader = localStorage.getItem('a11y-screen-reader') === 'true';
    const savedKeyboardNavigation = localStorage.getItem('a11y-keyboard-navigation') === 'true';

    setReducedMotion(savedReducedMotion);
    setHighContrast(savedHighContrast);
    setFontSize(savedFontSize);
    setScreenReader(savedScreenReader);
    setKeyboardNavigation(savedKeyboardNavigation);

    // Detect screen reader
    const detectScreenReader = () => {
      const hasScreenReader = 
        !!window.speechSynthesis ||
        window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('JAWS') ||
        window.navigator.userAgent.includes('VoiceOver') ||
        window.navigator.userAgent.includes('TalkBack');
      
      setScreenReader(hasScreenReader);
    };

    detectScreenReader();

    // Listen for keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    // Apply accessibility preferences to document
    document.documentElement.setAttribute('data-reduced-motion', reducedMotion.toString());
    document.documentElement.setAttribute('data-high-contrast', highContrast.toString());
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-keyboard-navigation', keyboardNavigation.toString());

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--font-size-multiplier', fontSize === 'small' ? '0.875' : fontSize === 'large' ? '1.125' : '1');
    root.style.setProperty('--contrast-multiplier', highContrast ? '1.5' : '1');
  }, [reducedMotion, highContrast, fontSize, keyboardNavigation]);

  const announceToScreenReader = (message: string) => {
    if (screenReader) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  const value: AccessibilityContextType = {
    reducedMotion,
    highContrast,
    fontSize,
    screenReader,
    keyboardNavigation,
    setReducedMotion: (value) => {
      setReducedMotion(value);
      localStorage.setItem('a11y-reduced-motion', value.toString());
    },
    setHighContrast: (value) => {
      setHighContrast(value);
      localStorage.setItem('a11y-high-contrast', value.toString());
    },
    setFontSize: (size) => {
      setFontSize(size);
      localStorage.setItem('a11y-font-size', size);
    },
    setScreenReader: (value) => {
      setScreenReader(value);
      localStorage.setItem('a11y-screen-reader', value.toString());
    },
    setKeyboardNavigation: (value) => {
      setKeyboardNavigation(value);
      localStorage.setItem('a11y-keyboard-navigation', value.toString());
    },
    announceToScreenReader
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Accessibility toolbar component
export function AccessibilityToolbar() {
  const {
    reducedMotion,
    highContrast,
    fontSize,
    setReducedMotion,
    setHighContrast,
    setFontSize,
    announceToScreenReader
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (setting: string, value: any) => {
    switch (setting) {
      case 'reducedMotion':
        setReducedMotion(!reducedMotion);
        announceToScreenReader(reducedMotion ? 'Hareket azaltma kapatıldı' : 'Hareket azaltma açıldı');
        break;
      case 'highContrast':
        setHighContrast(!highContrast);
        announceToScreenReader(highContrast ? 'Yüksek kontrast kapatıldı' : 'Yüksek kontrast açıldı');
        break;
      case 'fontSize':
        setFontSize(value);
        announceToScreenReader(`Yazı boyutu ${value} olarak ayarlandı`);
        break;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        aria-label="Erişilebilirlik ayarları"
        aria-expanded={isOpen}
      >
        <i className="ri-accessibility-line text-lg"></i>
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-64">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Erişilebilirlik Ayarları
          </h3>
          
          <div className="space-y-3">
            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Hareket Azaltma
              </label>
              <button
                onClick={() => handleToggle('reducedMotion', null)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  reducedMotion ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={reducedMotion}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Yüksek Kontrast
              </label>
              <button
                onClick={() => handleToggle('highContrast', null)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  highContrast ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={highContrast}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
                Yazı Boyutu
              </label>
              <div className="flex space-x-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleToggle('fontSize', size)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      fontSize === size
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {size === 'small' ? 'Küçük' : size === 'medium' ? 'Orta' : 'Büyük'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Skip to content link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-orange-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      Ana içeriğe geç
    </a>
  );
}

// Screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
