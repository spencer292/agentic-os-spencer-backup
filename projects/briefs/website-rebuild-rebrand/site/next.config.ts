import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import { getRedirects } from './src/lib/redirects'

const isProduction = process.env.VERCEL_ENV === 'production'

const nextConfig: NextConfig = {
  // Do NOT set outputFileTracingRoot — Vercel's root directory setting handles it.
  // Setting it causes path doubling: Vercel looks for .next/ at repo root instead of site dir.
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return getRedirects()
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Block indexing on staging/preview — protect 635 #1 keywords from duplicate content
          ...(!isProduction
            ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
            : []),
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '0' },
          // CSP in report-only mode first — switch to enforcing after verification
          {
            key: 'Content-Security-Policy-Report-Only',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.googleadservices.com https://www.clarity.ms https://*.clarity.ms https://cdn.callrail.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://www.facebook.com https://region1.google-analytics.com https://*.clarity.ms https://api.callrail.com; frame-ancestors 'none';",
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)
