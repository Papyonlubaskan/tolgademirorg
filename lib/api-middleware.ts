// API Middleware Utilities
import { NextRequest, NextResponse } from 'next/server';

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
export function handleCors(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
}

// Add CORS headers to response
export function addCorsHeaders(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const current = rateLimitMap.get(identifier);
  
  if (!current || current.resetTime < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }
  
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }
  
  current.count++;
  return {
    allowed: true,
    remaining: limit - current.count,
    resetTime: current.resetTime,
  };
}

// API response helper
export function createApiResponse(
  data: any,
  status: number = 200,
  message?: string
) {
  const response = NextResponse.json({
    success: status >= 200 && status < 300,
    data,
    message,
    timestamp: new Date().toISOString(),
  }, { status });
  
  return addCorsHeaders(response);
}

// API error helper
export function createApiError(
  error: string,
  status: number = 500,
  details?: any
) {
  const response = NextResponse.json({
    success: false,
    error,
    details,
    timestamp: new Date().toISOString(),
  }, { status });
  
  return addCorsHeaders(response);
}

// Request logging
export function logRequest(request: NextRequest, response: NextResponse) {
  const { method, url } = request;
  const { status } = response;
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ${method} ${url} - ${status}`);
}

// IP address extraction
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

// Request validation
export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => !data[field]);
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

// Sanitize input
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
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

export default {
  corsHeaders,
  handleCors,
  addCorsHeaders,
  checkRateLimit,
  createApiResponse,
  createApiError,
  logRequest,
  getClientIP,
  validateRequiredFields,
  sanitizeInput,
};
