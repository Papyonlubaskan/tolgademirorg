import crypto from 'crypto';

interface CSRFToken {
  token: string;
  expiresAt: number;
  sessionId: string;
}

// In-memory store for CSRF tokens (in production, use Redis or database)
const tokenStore = new Map<string, CSRFToken>();

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, token] of tokenStore.entries()) {
    if (now > token.expiresAt) {
      tokenStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Generate CSRF token
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
  
  tokenStore.set(token, {
    token,
    expiresAt,
    sessionId
  });
  
  return token;
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionId: string): boolean {
  const storedToken = tokenStore.get(token);
  
  if (!storedToken) {
    return false;
  }
  
  // Check if token is expired
  if (Date.now() > storedToken.expiresAt) {
    tokenStore.delete(token);
    return false;
  }
  
  // Check if session matches
  if (storedToken.sessionId !== sessionId) {
    return false;
  }
  
  return true;
}

// Refresh CSRF token (extend expiration)
export function refreshCSRFToken(token: string): boolean {
  const storedToken = tokenStore.get(token);
  
  if (!storedToken) {
    return false;
  }
  
  // Extend expiration by 1 hour
  storedToken.expiresAt = Date.now() + (60 * 60 * 1000);
  tokenStore.set(token, storedToken);
  
  return true;
}

// Revoke CSRF token
export function revokeCSRFToken(token: string): boolean {
  return tokenStore.delete(token);
}

// Revoke all tokens for a session
export function revokeSessionTokens(sessionId: string): number {
  let revokedCount = 0;
  
  for (const [key, token] of tokenStore.entries()) {
    if (token.sessionId === sessionId) {
      tokenStore.delete(key);
      revokedCount++;
    }
  }
  
  return revokedCount;
}

// Get token info (for debugging)
export function getTokenInfo(token: string): CSRFToken | null {
  return tokenStore.get(token) || null;
}

// Get all active tokens (for monitoring)
export function getAllTokens(): Array<{ token: string; info: CSRFToken }> {
  return Array.from(tokenStore.entries()).map(([token, info]) => ({ token, info }));
}

// Cleanup function for graceful shutdown
export function cleanupCSRFTokens(): void {
  tokenStore.clear();
}
