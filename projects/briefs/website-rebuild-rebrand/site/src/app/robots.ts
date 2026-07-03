import { MetadataRoute } from 'next'

const PRODUCTION_HOST = 'got-moles.com'

export default function robots(): MetadataRoute.Robots {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  const isProduction = host === PRODUCTION_HOST || process.env.VERCEL_ENV === 'production'

  if (!isProduction) {
    // Block all crawlers on staging/preview — prevent duplicate content indexation
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  // Production: full access, AI crawlers welcomed.
  //
  // /lp/ stays disallowed because every landing page in src/app/(frontend)/lp/
  // sets `robots: 'noindex, nofollow'` at the page level. They are paid-traffic
  // conversion pages that duplicate service page content — keeping them out of
  // organic indexation avoids cannibalising the canonical service pages.
  //
  // AI bot allowlist: belt-and-suspenders coverage. The `userAgent: '*'` rule
  // above already allows everything, but named bots get explicit entries so
  // future disallow changes never accidentally clip the crawlers that matter
  // most for GEO citation share.
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/lp/'],
      },
      // Major search + AI bots (traditional SEO)
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      // OpenAI
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      // Google AI
      { userAgent: 'Google-Extended', allow: '/' },
      // Anthropic
      { userAgent: 'Anthropic-AI', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      // Perplexity
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Perplexity-User', allow: '/' },
      // Other AI / LLM training crawlers
      { userAgent: 'Cohere-AI', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      { userAgent: 'Applebot', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'meta-externalagent', allow: '/' },
      { userAgent: 'FacebookBot', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
      { userAgent: 'DuckAssistBot', allow: '/' },
      { userAgent: 'YouBot', allow: '/' },
    ],
    sitemap: `https://${PRODUCTION_HOST}/sitemap.xml`,
  }
}
