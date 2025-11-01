'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const adminToken = sessionStorage.getItem('admin_token');
      
      if (!adminToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Token'ı doğrula
        const response = await fetch('/api/admin/notifications?limit=1', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Token geçersiz, temizle
          sessionStorage.clear();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        sessionStorage.clear();
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = async () => {
    const sessionId = sessionStorage.getItem('admin_session_id');
    
    try {
      // MySQL session'ı sil
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    sessionStorage.clear();
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}