/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Fix Turbopack workspace root warning
  turbopack: {
    root: process.cwd(),
  },

  // Security headers including CSP
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // More permissive CSP for development, stricter for production
    const cspDirectives = [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.com"
        : "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.clerk.com https://clerk.com https://*.clerk.accounts.dev https://openrouter.ai https://x6amvsxo6a.ufs.sh wss: ws:",
      "worker-src 'self' blob:", // Allow web workers with blob URLs for Clerk
      "frame-src 'self' https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      isDev ? "report-uri /api/csp-report" : "",
      isDev ? "" : "upgrade-insecure-requests"
    ].filter(Boolean);

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  },
};

export default config;
