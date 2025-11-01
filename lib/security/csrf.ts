import { NextRequest } from 'next/server';
import crypto from 'crypto';

interface CSRFToken {
  token: string;
  expires: number;
}

const csrfTokens = new Map<string, CSRFToken>();

// CSRF token oluştur
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 saat
  
  csrfTokens.set(sessionId, {
    token,
    expires
  });
  
  return token;
}

// CSRF token doğrula
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const storedToken = csrfTokens.get(sessionId);
  
  if (!storedToken) {
    return false;
  }
  
  // Token süresi dolmuş mu?
  if (Date.now() > storedToken.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  // Token eşleşiyor mu?
  return storedToken.token === token;
}

// CSRF token temizle
export function clearCSRFToken(sessionId: string): void {
  csrfTokens.delete(sessionId);
}

// Süresi dolmuş tokenları temizle
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [sessionId, token] of csrfTokens.entries()) {
    if (now > token.expires) {
      csrfTokens.delete(sessionId);
    }
  }
}

// CSRF middleware
export function csrfMiddleware(request: NextRequest): boolean {
  const sessionId = request.headers.get('x-session-id') || 'anonymous';
  const csrfToken = request.headers.get('x-csrf-token');
  
  // GET, HEAD, OPTIONS istekleri için CSRF kontrolü yapma
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }
  
  if (!csrfToken) {
    return false;
  }
  
  return validateCSRFToken(sessionId, csrfToken);
}

// Her 5 dakikada bir süresi dolmuş tokenları temizle
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);