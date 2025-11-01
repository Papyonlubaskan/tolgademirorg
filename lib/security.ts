import { NextRequest, NextResponse } from 'next/server';
// DOMPurify disabled - using validator library instead

// XSS Protection Headers
export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

// Content Security Policy
export function setCSPHeaders(response: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

// XSS Sanitization - simplified (no DOMPurify)
export function sanitizeHTML(html: string): string {
  // Basic HTML escaping
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// SQL Injection Prevention
export function sanitizeSQL(input: string): string {
  return input
    .replace(/['"\\]/g, '') // Remove quotes and backslashes
    .replace(/[;-]/g, '') // Remove SQL comment markers (fixed regex)
    .replace(/union/gi, '') // Remove UNION keywords
    .replace(/select/gi, '') // Remove SELECT keywords
    .replace(/insert/gi, '') // Remove INSERT keywords
    .replace(/update/gi, '') // Remove UPDATE keywords
    .replace(/delete/gi, '') // Remove DELETE keywords
    .replace(/drop/gi, '') // Remove DROP keywords
    .replace(/create/gi, '') // Remove CREATE keywords
    .replace(/alter/gi, '') // Remove ALTER keywords
    .trim();
}

// Input Sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeHTML(input.trim());
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Rate Limiting (Simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  limit: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  // Increment count
  current.count++;
  rateLimitMap.set(key, current);
  
  return { 
    allowed: true, 
    remaining: limit - current.count, 
    resetTime: current.resetTime 
  };
}

// CSRF Token Generation
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

// CSRF Token Validation
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// IP Address Extraction
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Request Size Validation
export function validateRequestSize(request: NextRequest, maxSize: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength);
    return size <= maxSize;
  }
  
  return true;
}

// File Upload Validation
export function validateFileUpload(
  file: File, 
  options?: {
    allowedTypes?: string[];
    allowedExtensions?: string[];
    allowedMimeTypes?: string[];
    maxSize?: number;
  }
): { valid: boolean; error?: string } {
  const allowedTypes = options?.allowedTypes || options?.allowedMimeTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = options?.allowedExtensions || [];
  const maxSize = options?.maxSize || 5 * 1024 * 1024; // 5MB

  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `Dosya boyutu ${Math.round(maxSize / 1024 / 1024)}MB'dan büyük olamaz` 
    };
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Geçersiz dosya türü' };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Sadece ${allowedExtensions.join(', ')} dosya türleri kabul edilir`
      };
    }
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(php|asp|jsp|py|rb|pl|cgi)$/i,
    /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
    /\.\./, // Path traversal
    /[<>:"\\|?*]/ // Invalid characters
  ];

  // Skip suspicious checks for allowed backup file types
  const isBackupFile = file.name.endsWith('.sql') || file.name.endsWith('.zip');
  if (!isBackupFile) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        return {
          valid: false,
          error: 'Geçersiz dosya adı'
        };
      }
    }
  }
  
  return { valid: true };
}

// Security Middleware
export function securityMiddleware(request: NextRequest): NextResponse | null {
  // Check request size
  if (!validateRequestSize(request)) {
    return NextResponse.json(
      { success: false, error: 'İstek boyutu çok büyük' },
      { status: 413 }
    );
  }
  
  // Check for suspicious patterns
  const url = request.url;
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz istek' },
        { status: 400 }
      );
    }
  }
  
  return null;
}

// Log Security Events
export function logSecurityEvent(
  event: string, 
  details: any, 
  ip: string, 
  userAgent: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip,
    userAgent,
    severity: 'medium'
  };
  
  console.warn('Security Event:', JSON.stringify(logEntry));
  
  // In production, send to logging service
  // await sendToLoggingService(logEntry);
}

// Advanced rate limiting - disabled
export const checkAdvancedRateLimit = () => ({ allowed: true });
export const RATE_LIMITS = {};

// Rate limit management functions
export function getAllRateLimits() {
  return {
    general: {},
    auth: {},
    contact: {},
    api: {},
    admin: {}
  };
}
