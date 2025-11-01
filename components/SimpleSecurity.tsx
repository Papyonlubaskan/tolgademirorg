'use client';

import { useEffect } from 'react';

export default function SimpleSecurity() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Console log'ları devre dışı bırak (basit yöntem)
      const noop = () => {};
      
      // Sadece temel console fonksiyonlarını override et
      if (window.console) {
        window.console.log = noop;
        window.console.info = noop;
        window.console.warn = noop;
        window.console.error = noop;
        window.console.debug = noop;
      }

      // Sağ tık engelle
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });

      // F12 tuşunu engelle
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
          e.preventDefault();
          return false;
        }
      });

      // Text selection'ı kısıtla
      document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
      });

      // CSS ile text selection'ı engelle
      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        input, textarea {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return null;
}
