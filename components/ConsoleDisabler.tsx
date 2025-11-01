'use client';

import { useEffect } from 'react';

export default function ConsoleDisabler() {
  useEffect(() => {
    // Tüm console fonksiyonlarını override et
    const noop = () => {};
    
    // Console fonksiyonlarını boş fonksiyonlarla değiştir
    if (typeof window !== 'undefined') {
      (window.console as any) = {
        ...window.console,
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
        timeStamp: noop
      };
      
      // Console objesini readonly yapmaya çalışma - bu hata veriyor
      // Sadece fonksiyonları override etmek yeterli
    }
  }, []);

  return null; // Bu component hiçbir şey render etmez
}
