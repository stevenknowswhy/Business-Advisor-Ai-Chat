import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders as rateLimitSecurityHeaders } from './rateLimiter';

export const securityHeaders = {
  ...rateLimitSecurityHeaders,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function corsMiddleware(request: NextRequest, response: NextResponse): NextResponse {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL,
  ].filter(Boolean) as string[];

  const origin = request.headers.get('origin');

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

export function createSecurityResponse(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return corsMiddleware(request, applySecurityHeaders(response));
}

export function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (!origin && !referer) {
    return false; // Require origin or referer
  }

  const allowedHosts = [
    'localhost:3000',
    'localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, ''),
    process.env.VERCEL_URL?.replace(/^https?:\/\//, ''),
  ].filter(Boolean) as string[];

  if (origin) {
    const originHost = origin.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!allowedHosts.includes(originHost)) {
      return false;
    }
  }

  if (referer) {
    const refererHost = referer.replace(/^https?:\/\//, '').replace(/\/.*/, '');
    if (!allowedHosts.includes(refererHost)) {
      return false;
    }
  }

  if (host && !allowedHosts.includes(host)) {
    return false;
  }

  return true;
}

export function validateContentType(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type');

  if (!contentType) {
    return false;
  }

  const allowedTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ];

  return allowedTypes.some(type => contentType.toLowerCase().includes(type.toLowerCase()));
}

export function validateContentLength(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length');

  if (!contentLength) {
    return true; // No content length is acceptable
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  const size = parseInt(contentLength, 10);

  return !isNaN(size) && size <= maxSize;
}

export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Validate origin
  if (!validateRequestOrigin(request)) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid origin' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Handle OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return createSecurityResponse(request);
  }

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (!validateContentType(request)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid content type' }),
        {
          status: 415,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!validateContentLength(request)) {
      return new NextResponse(
        JSON.stringify({ error: 'Request entity too large' }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  return null; // Continue with the request
}

export function addSecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  return corsMiddleware(request, applySecurityHeaders(response));
}