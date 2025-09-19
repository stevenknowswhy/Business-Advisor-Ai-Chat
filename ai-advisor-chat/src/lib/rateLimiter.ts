import { NextRequest, NextResponse } from 'next/server';
// import { authMiddleware } from '@/lib/auth';

// In-memory rate limiting store for development
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const getRateLimitKey = (request: NextRequest): string => {
  // Get user ID from auth if available, otherwise use IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'anonymous';
  const authHeader = request.headers.get('authorization');
  const userId = authHeader ? `user_${authHeader.slice(0, 10)}` : ip;
  return userId || 'anonymous';
};

const checkRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

export async function applyRateLimit(request: NextRequest, type: 'general' | 'chat' = 'general'): Promise<NextResponse | null> {
  try {
    // Clean up expired entries
    cleanupExpiredEntries();

    const key = getRateLimitKey(request);
    const maxRequests = type === 'chat' ? 30 : 100; // Requests per minute
    const windowMs = 60 * 1000; // 1 minute

    if (!checkRateLimit(key, maxRequests, windowMs)) {
      const record = rateLimitStore.get(key);
      const remainingTime = Math.ceil((record!.resetTime - Date.now()) / 1000);

      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: remainingTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record!.resetTime).toISOString(),
            'Retry-After': remainingTime.toString(),
          },
        }
      );
    }

    return null; // Continue with the request
  } catch (error) {
    console.error('Rate limit error:', error);
    // If rate limiting fails, allow the request to continue
    return null;
  }
}

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    // For now, we'll just hash the token as a simple identifier
    // In production, you'd validate the token with Clerk
    return `user_${token.slice(0, 10)}`;
  } catch {
    return null;
  }
}

export const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};