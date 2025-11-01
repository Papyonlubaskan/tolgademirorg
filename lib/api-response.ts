import { NextResponse } from 'next/server';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  headers?: Partial<RateLimitHeaders>
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, {
    status: 200,
    headers: headers as Record<string, string>
  });
}

/**
 * Success response with pagination
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number,
  headers?: Partial<RateLimitHeaders>
): NextResponse {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };

  return NextResponse.json(response, {
    status: 200,
    headers: headers as Record<string, string>
  });
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = 500,
  headers?: Partial<RateLimitHeaders>
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: message
  };

  return NextResponse.json(response, {
    status,
    headers: headers as Record<string, string>
  });
}

/**
 * Validation error response
 */
export function validationErrorResponse(
  errors: string[] | { [key: string]: string },
  headers?: Partial<RateLimitHeaders>
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: 'Validation failed',
    data: errors
  };

  return NextResponse.json(response, {
    status: 400,
    headers: headers as Record<string, string>
  });
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized',
  headers?: Partial<RateLimitHeaders>
): NextResponse {
  return errorResponse(message, 401, headers);
}

/**
 * Forbidden response
 */
export function forbiddenResponse(
  message: string = 'Forbidden',
  headers?: Partial<RateLimitHeaders>
): NextResponse {
  return errorResponse(message, 403, headers);
}

/**
 * Not found response
 */
export function notFoundResponse(
  message: string = 'Resource not found',
  headers?: Partial<RateLimitHeaders>
): NextResponse {
  return errorResponse(message, 404, headers);
}

/**
 * Rate limit response
 */
export function rateLimitResponse(
  headers: RateLimitHeaders
): NextResponse {
  return NextResponse.json({
    success: false,
    error: 'Too many requests'
  }, {
    status: 429,
    headers: headers as any
  });
}
