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
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.com https://*.vercel.app"
        : "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.com https://*.vercel.app",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev",
      "font-src 'self' https://fonts.gstatic.com https://*.clerk.accounts.dev",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.clerk.com https://clerk.com https://*.clerk.accounts.dev https://openrouter.ai https://x6amvsxo6a.ufs.sh wss: ws: https://*.vercel.app",
      "worker-src 'self' blob: https://*.clerk.accounts.dev", // Enhanced worker support for Clerk
      "child-src 'self' blob: https://*.clerk.accounts.dev", // Allow child contexts for Clerk
      "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
      "manifest-src 'self'", // Allow web app manifest
      "media-src 'self' blob: data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://*.clerk.accounts.dev",
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
