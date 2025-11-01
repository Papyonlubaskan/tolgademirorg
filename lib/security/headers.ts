import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeaders {
  'Strict-Transport-Security'?: string;
  'Content-Security-Policy'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'X-XSS-Protection'?: string;
  'Cross-Origin-Embedder-Policy'?: string;
  'Cross-Origin-Opener-Policy'?: string;
  'Cross-Origin-Resource-Policy'?: string;
}

export class SecurityHeadersManager {
  // Production güvenlik başlıkları
  static getProductionHeaders(): SecurityHeaders {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
        "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'interest-cohort=()',
        'payment=()',
        'usb=()'
      ].join(', '),
      'X-XSS-Protection': '1; mode=block',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    };
  }

  // Development güvenlik başlıkları (daha esnek)
  static getDevelopmentHeaders(): SecurityHeaders {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block'
    };
  }

  // Güvenlik başlıklarını uygula
  static applySecurityHeaders(response: NextResponse, isProduction: boolean = false): NextResponse {
    const headers = isProduction 
      ? this.getProductionHeaders() 
      : this.getDevelopmentHeaders();

    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value);
      }
    });

    return response;
  }

  // CSP (Content Security Policy) oluştur
  static generateCSP(nonce?: string): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://www.google-analytics.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ];

    if (nonce) {
      directives[1] += ` 'nonce-${nonce}'`;
      directives[2] += ` 'nonce-${nonce}'`;
    }

    return directives.join('; ');
  }

  // Nonce oluştur
  static generateNonce(): string {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  }

  // Rate limiting başlıkları
  static addRateLimitHeaders(
    response: NextResponse,
    limit: number,
    remaining: number,
    resetTime: number
  ): NextResponse {
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    
    if (remaining === 0) {
      response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
    }

    return response;
  }

  // CORS başlıkları
  static addCORSHeaders(response: NextResponse, origin?: string): NextResponse {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://tolgademir.org',
      'https://www.tolgademir.org'
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', 'https://tolgademir.org');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
  }

  // Cache başlıkları
  static addCacheHeaders(
    response: NextResponse,
    maxAge: number = 3600,
    isPublic: boolean = true
  ): NextResponse {
    const cacheControl = isPublic 
      ? `public, max-age=${maxAge}, s-maxage=${maxAge}`
      : `private, max-age=${maxAge}`;

    response.headers.set('Cache-Control', cacheControl);
    response.headers.set('ETag', `"${Date.now()}"`);
    
    return response;
  }

  // Güvenlik başlıklarını middleware ile uygula
  static middleware(request: NextRequest): NextResponse | null {
    // OPTIONS istekleri için CORS preflight
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      return this.addCORSHeaders(response, request.headers.get('origin') || undefined);
    }

    // API rotaları için özel başlıklar
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      
      // API için güvenlik başlıkları
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      
      return response;
    }

    return null;
  }

  // HTTPS yönlendirmesi
  static redirectToHTTPS(request: NextRequest): NextResponse | null {
    if (process.env.NODE_ENV === 'production') {
      const hostname = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      
      if (protocol === 'http' && hostname) {
        const httpsUrl = `https://${hostname}${request.nextUrl.pathname}${request.nextUrl.search}`;
        return NextResponse.redirect(httpsUrl, 301);
      }
    }

    return null;
  }

  // Güvenlik başlıklarını test et
  static validateHeaders(headers: Record<string, string>): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Gerekli başlıkları kontrol et
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection'
    ];

    requiredHeaders.forEach(header => {
      if (!headers[header]) {
        issues.push(`Missing required header: ${header}`);
      }
    });

    // CSP kontrolü
    if (!headers['Content-Security-Policy']) {
      issues.push('Missing Content-Security-Policy header');
    }

    // HSTS kontrolü (production için)
    if (process.env.NODE_ENV === 'production' && !headers['Strict-Transport-Security']) {
      issues.push('Missing Strict-Transport-Security header for production');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export const securityHeadersManager = SecurityHeadersManager;
