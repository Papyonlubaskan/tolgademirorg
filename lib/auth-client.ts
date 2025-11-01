// Client-side authentication utilities
'use client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Client-side token management
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_token', token);
};

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
};

export const getCurrentUser = (): AdminUser | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('admin_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: AdminUser): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_user', JSON.stringify(user));
};

export const removeCurrentUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_user');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
};

// Logout
export const logout = (): void => {
  removeAuthToken();
  removeCurrentUser();
  if (typeof window !== 'undefined') {
    window.location.href = '/yonetim';
  }
};
