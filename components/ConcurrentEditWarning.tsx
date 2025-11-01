'use client';

import { useEffect, useState } from 'react';

interface ConcurrentEditWarningProps {
  resourceType: string;
  resourceId: string | number;
  onLocked?: (isLocked: boolean, lockedBy?: string) => void;
}

export default function ConcurrentEditWarning({
  resourceType,
  resourceId,
  onLocked
}: ConcurrentEditWarningProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string>('');
  const [lockId, setLockId] = useState<number | null>(null);

  // Kilitlemeyi başlat
  const acquireLock = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/concurrent-lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceType,
          resourceId: resourceId.toString()
        })
      });

      const data = await response.json();

      if (response.status === 423) {
        // Başkası kilitlemiş
        setIsLocked(true);
        setLockedBy(data.lockedBy);
        onLocked?.(true, data.lockedBy);
        return false;
      }

      if (data.success) {
        setLockId(data.lockId);
        setIsLocked(false);
        onLocked?.(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Lock acquisition error:', error);
      return false;
    }
  };

  // Kilidi serbest bırak
  const releaseLock = async () => {
    if (!lockId) return;

    try {
      const token = sessionStorage.getItem('admin_token');
      await fetch('/api/admin/concurrent-lock', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceType,
          resourceId: resourceId.toString()
        })
      });

      setLockId(null);
      setIsLocked(false);
      setLockedBy('');
    } catch (error) {
      console.error('Lock release error:', error);
    }
  };

  // Heartbeat - kilidi canlı tut (her 2 dakikada bir)
  useEffect(() => {
    // İlk kilit
    acquireLock();

    // Heartbeat interval
    const heartbeat = setInterval(() => {
      if (lockId) {
        acquireLock();
      }
    }, 120000); // 2 dakika

    // Cleanup: Sayfa kapatılırken kilidi bırak
    const handleBeforeUnload = () => {
      releaseLock();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      releaseLock();
    };
  }, [resourceType, resourceId]);

  if (!isLocked) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 max-w-md">
        <i className="ri-lock-line text-2xl"></i>
        <div>
          <p className="font-semibold">Düzenleme Kilitli</p>
          <p className="text-sm">
            Bu kayıt şu anda <strong>{lockedBy}</strong> tarafından düzenleniyor
          </p>
        </div>
      </div>
    </div>
  );
}

