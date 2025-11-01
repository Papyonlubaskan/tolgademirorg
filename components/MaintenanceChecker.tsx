
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function MaintenanceChecker({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout;
    let isCurrentlyChecking = false;
    let currentController: AbortController | null = null;

    const checkMaintenanceStatus = async () => {
      if (!mounted || isCurrentlyChecking) return;
      
      // Admin sayfalarını kontrol etme (/yonetim veya /admin)
      if (pathname && (pathname.startsWith('/yonetim') || pathname.startsWith('/admin'))) {
        if (mounted) {
          setIsChecking(false);
          setHasChecked(true);
        }
        return;
      }

      isCurrentlyChecking = true;

      try {
        // Önceki controller'ı iptal et
        if (currentController) {
          currentController.abort();
        }
        
        currentController = new AbortController();
        const timeoutId = setTimeout(() => {
          if (currentController && mounted) {
            currentController.abort();
          }
        }, 5000); // 5 saniye timeout

        const response = await fetch('/api/settings/maintenance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-store',
          signal: currentController.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          const apiMaintenanceMode = result.maintenanceMode || false;

          console.log('🔍 Bakım modu durumu:', {
            api: apiMaintenanceMode,
            currentPath: pathname,
            shouldRedirect: apiMaintenanceMode && pathname !== '/maintenance'
          });

          // LocalStorage'ı senkronize et
          if (apiMaintenanceMode) {
            localStorage.setItem('maintenanceMode', 'true');
          } else {
            localStorage.removeItem('maintenanceMode');
          }

          // Bakım modu aktif VE şu an maintenance sayfasında değilsek → yönlendir
          if (apiMaintenanceMode && pathname !== '/maintenance') {
            console.log('🚧 BAKIM MODU AKTİF - Yönlendiriliyor:', pathname, '→ /maintenance');
            window.location.href = '/maintenance'; // Hard redirect
            return;
          }
          
          // Bakım modu kapalı VE şu an maintenance sayfasındaysak → ana sayfaya dön
          if (!apiMaintenanceMode && pathname === '/maintenance') {
            console.log('✅ BAKIM MODU KAPALI - Ana sayfaya yönlendiriliyor');
            window.location.href = '/';
            return;
          }
        }
      } catch (error) {
        console.error('Bakım modu kontrol hatası:', error);
        
        // API erişilemiyor - localStorage'dan kontrol et
        const localMaintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
        
        console.log('⚠️ API erişilemiyor, localStorage kullanılıyor:', localMaintenanceMode);
        
        if (localMaintenanceMode && pathname !== '/maintenance') {
          console.log('🚧 BAKIM MODU AKTİF (local) - Yönlendiriliyor');
          window.location.href = '/maintenance';
          return;
        }
      } finally {
        isCurrentlyChecking = false;
        if (mounted) {
          setIsChecking(false);
          setHasChecked(true);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (!mounted || !pathname || isCurrentlyChecking) return;
      
      if (e.key === 'maintenanceMode') {
        const newMaintenanceMode = e.newValue === 'true';
        
        console.log('📢 localStorage değişti:', newMaintenanceMode, 'Path:', pathname);
        
        if (newMaintenanceMode && pathname !== '/maintenance' && !pathname.startsWith('/yonetim') && !pathname.startsWith('/admin')) {
          console.log('🚧 BAKIM MODU AKTİF - Storage değişikliği yönlendirmesi');
          window.location.href = '/maintenance';
        } else if (!newMaintenanceMode && pathname === '/maintenance') {
          console.log('✅ BAKIM MODU KAPALI - Storage değişikliği yönlendirmesi');
          window.location.href = '/';
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!mounted || pathname?.startsWith('/yonetim') || pathname?.startsWith('/admin') || isCurrentlyChecking || !hasChecked) return;
      if (!document.hidden) {
        setTimeout(checkMaintenanceStatus, 1000); // 1 saniye gecikme
      }
    };

    // İlk kontrol - sadece bir kez
    if (!hasChecked) {
      checkMaintenanceStatus();
    } else {
      setIsChecking(false);
    }
    
    // Bakım modu kontrolü - sadece bakım modundayken aktif
    const startMaintenanceCheck = async () => {
      // İlk kontrol yap
      await checkMaintenanceStatus();
      
      // Eğer bakım modundaysa interval başlat
      const isMaintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
      if (isMaintenanceMode) {
        checkInterval = setInterval(checkMaintenanceStatus, 5000); // 5 saniyede bir
      }
    };
    
    startMaintenanceCheck();

    // Event listeners - sadece gerekli olanlar
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      isCurrentlyChecking = false;
      
      // AbortController'ı temizle
      if (currentController) {
        currentController.abort();
        currentController = null;
      }
      
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, pathname, hasChecked]);

  // Loading state sadece ilk kontrolde
  if (isChecking && !hasChecked) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
