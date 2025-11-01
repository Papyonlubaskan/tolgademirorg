
'use client';

import { useState } from 'react';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Component mount olduğunda session temizle
  useState(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      // MySQL API ile kimlik doğrulama
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.username,
          password: credentials.password
        })
      });

      const result = await response.json();

      if (result.success && result.token) {
        // Token'ı sessionStorage'a kaydet (geçici)
        sessionStorage.setItem('admin_token', result.token);
        sessionStorage.setItem('admin_session_id', result.sessionId);
        sessionStorage.setItem('admin_user', JSON.stringify(result.user));
        onLogin(true);
      } else {
        setError(result.error || 'Kullanıcı adı veya şifre hatalı!');
        onLogin(false);
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      onLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <i className="ri-admin-line text-3xl text-white"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Admin Paneli</h2>
          <p className="text-gray-400">Tolga Demir Yönetim Sistemi</p>
        </div>

        <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm flex items-center">
                <i className="ri-error-warning-line mr-2"></i>
                {error}
              </div>
            )}

            {/* Giriş bilgileri ipucu */}
            <div className="bg-blue-900/30 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center mb-2">
                <i className="ri-information-line mr-2"></i>
                <strong>MySQL Authentication Active</strong>
              </div>
              <div className="text-xs">
                Admin credentials stored in database
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                E-posta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-mail-line text-gray-400"></i>
                </div>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="admin@tolgademir.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-gray-400"></i>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Şifrenizi girin"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  <i className="ri-login-circle-line mr-2"></i>
                  Giriş Yap
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
