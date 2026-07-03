import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limit store
// Note: on Vercel serverless each invocation may get fresh memory, so this
// protects against burst attacks within a single function lifetime.
// Upgrade to Vercel KV / Upstash Redis for persistent cross-invocation limits.
interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetTime) {
    // First request or window has expired — reset
    store.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count += 1
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}

/**
 * Force search engines to ignore any host that isn't the canonical production
 * domain. Vercel serves the same build at `project-pf8c6.vercel.app` and any
 * custom-preview URLs — without this header, Google may index staging content
 * and compete with production on duplicate content.
 *
 * Production host: `got-moles.com`. Everything else gets `noindex, nofollow`.
 */
function applyNoindexForNonProdHost(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const host = request.headers.get('host') || ''
  const normalizedHost = host.toLowerCase().split(':')[0]
  const isProd = normalizedHost === 'got-moles.com' || normalizedHost === 'www.got-moles.com'
  if (!isProd) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
  }
  return response
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)

  // /api/* — 60 requests per minute per IP
  if (pathname.startsWith('/api/')) {
    const key = `api:${ip}`
    const { allowed, remaining, resetTime } = checkRateLimit(key, 60, 60_000)

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      return applyNoindexForNonProdHost(
        request,
        new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
            'Content-Type': 'text/plain',
          },
        }),
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', '60')
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)))
    return applyNoindexForNonProdHost(request, response)
  }

  // /admin/* — 10 requests per minute per IP
  if (pathname.startsWith('/admin/')) {
    const key = `admin:${ip}`
    const { allowed, remaining, resetTime } = checkRateLimit(key, 10, 60_000)

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      return applyNoindexForNonProdHost(
        request,
        new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
            'Content-Type': 'text/plain',
          },
        }),
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', '10')
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)))
    return applyNoindexForNonProdHost(request, response)
  }

  // Default path: add the noindex header for non-prod hosts, then continue.
  return applyNoindexForNonProdHost(request, NextResponse.next())
}

export const config = {
  // Match every request except Next internals and static assets — so the
  // noindex header can be applied site-wide, not just on /api or /admin.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|robots.txt|sitemap.xml|images/|fonts/).*)',
  ],
}
