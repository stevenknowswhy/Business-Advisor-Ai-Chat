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

  // ESLint configuration for production builds
  eslint: {
    // Disable ESLint during builds for production deployment
    ignoreDuringBuilds: true,
  },

  // Image optimization configuration
  images: {
    // Configure image domains that can be optimized
    domains: [
      'localhost', // For local development
      'vercel.com', // For Vercel deployments
      'openrouter.ai', // For AI model images
    ],

    // Image formats to support
    formats: ['image/webp', 'image/avif'],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for responsive images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimum cache TTL in seconds
    minimumCacheTTL: 60,

    // Enable dangerous SVG loader if needed
    dangerouslyAllowSVG: true,

    // Content security policy for images
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression configuration
  compress: true,

  // Webpack configuration for additional optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
          },
        },
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      '@heroicons/react',
      'framer-motion',
      'clsx',
      'react',
      'react-dom',
    ],
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
      "connect-src 'self' https://api.clerk.com https://clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://openrouter.ai https://x6amvsxo6a.ufs.sh wss: ws: https://*.vercel.app",
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
