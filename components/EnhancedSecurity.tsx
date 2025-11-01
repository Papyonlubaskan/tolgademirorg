'use client';

import { useEffect } from 'react';

export default function EnhancedSecurity() {
  useEffect(() => {
    // Console log'ları tamamen devre dışı bırak
    if (typeof window !== 'undefined') {
      const noop = () => {};
      
      // Tüm console fonksiyonlarını override et
      (window.console as any) = {
        log: noop,
        info: noop,
        warn: noop,
        error: noop,
        debug: noop,
        trace: noop,
        table: noop,
        group: noop,
        groupEnd: noop,
        groupCollapsed: noop,
        time: noop,
        timeEnd: noop,
        timeLog: noop,
        count: noop,
        countReset: noop,
        clear: noop,
        dir: noop,
        dirxml: noop,
        assert: noop,
        profile: noop,
        profileEnd: noop,
        timeStamp: noop,
        markTimeline: noop,
        timeline: noop,
        timelineEnd: noop
      };

      // Console objesini readonly yapmaya çalışma - bu hata veriyor
      // Sadece fonksiyonları override etmek yeterli

      // F12 ve Developer Tools'u zorla kapatma girişimi
      let devtools = false;
      const threshold = 160;
      
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools) {
            devtools = true;
            // Developer tools açıldığında sayfayı yenile
            window.location.reload();
          }
        } else {
          devtools = false;
        }
      }, 500);

      // Sağ tık ve kaynak kod görüntülemeyi engelle
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });

      // F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S tuşlarını engelle
      document.addEventListener('keydown', (e) => {
        // F12
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+Shift+I (Developer Tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+A (Select All)
        if (e.ctrlKey && e.key === 'a') {
          e.preventDefault();
          return false;
        }
        
        // Ctrl+Shift+C (Element Inspector)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
          e.preventDefault();
          return false;
        }
      });

      // Text selection'ı kısıtla
      document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
      });

      // Drag and drop'u engelle
      document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      });

      // Print screen'i engelle
      document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          return false;
        }
      });

      // CSS ile text selection'ı engelle
      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
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
