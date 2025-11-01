'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface CSRFContextType {
  token: string | null;
  sessionId: string | null;
  refreshToken: () => Promise<void>;
  validateToken: () => Promise<boolean>;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

interface CSRFProviderProps {
  children: ReactNode;
}

export function CSRFProvider({ children }: CSRFProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setToken(data.data.token);
          setSessionId(data.data.sessionId);
          
          // Store in sessionStorage for persistence
          sessionStorage.setItem('csrf_token', data.data.token);
          sessionStorage.setItem('session_id', data.data.sessionId);
        }
      }
    } catch (error) {
      console.error('CSRF token refresh error:', error);
    }
  };

  const validateToken = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch('/api/csrf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId || ''
        },
        body: JSON.stringify({ token }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
    } catch (error) {
      console.error('CSRF token validation error:', error);
    }

    return false;
  };

  useEffect(() => {
    // Try to get token from sessionStorage first
    const storedToken = sessionStorage.getItem('csrf_token');
    const storedSessionId = sessionStorage.getItem('session_id');

    if (storedToken && storedSessionId) {
      setToken(storedToken);
      setSessionId(storedSessionId);
      
      // Validate stored token
      validateToken().then(isValid => {
        if (!isValid) {
          refreshToken();
        }
        setLoading(false);
      });
    } else {
      // Generate new token
      refreshToken().finally(() => setLoading(false));
    }

    // Refresh token every 30 minutes
    const interval = setInterval(refreshToken, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const value: CSRFContextType = {
    token,
    sessionId,
    refreshToken,
    validateToken
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 dark:border-orange-400"></div>
      </div>
    );
  }

  return (
    <CSRFContext.Provider value={value}>
      {children}
    </CSRFContext.Provider>
  );
}

export function useCSRF() {
  const context = useContext(CSRFContext);
  if (context === undefined) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
}

// HOC for CSRF protection
export function withCSRF<T extends object>(Component: React.ComponentType<T>) {
  return function CSRFProtectedComponent(props: T) {
    return (
      <CSRFProvider>
        <Component {...props} />
      </CSRFProvider>
    );
  };
}
