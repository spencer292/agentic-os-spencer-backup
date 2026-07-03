/**
 * audit-duplicate-schema.ts
 *
 * Site-wide audit: detects pages with MORE THAN ONE page-type @type in
 * their JSON-LD. Google requires exactly one primary page-type schema
 * per URL. Supplementary types (FAQPage, BreadcrumbList, etc.) are fine.
 *
 * READ-ONLY. Never writes.
 *
 * USAGE
 *   npm run audit-duplicates                           (all pages)
 *   npm run audit-duplicates -- --collection core
 *   npm run audit-duplicates -- --collection city
 *   npm run audit-duplicates -- --collection blog
 */

import * as cheerio from 'cheerio'
import { getAllCitySlugs } from '../lib/city-data.js'
import { blogPosts } from '../lib/blog-data.js'

const SITE_BASE = 'https://got-moles.com'

const PAGE_TYPES = new Set([
  'WebPage',
  'AboutPage',
  'CollectionPage',
  'Article',
  'BlogPosting',
  'LocalBusiness',
  'Service',
  'ProfilePage',
  'ContactPage',
  'HowTo',
])

const CORE_PATHS = [
  '/',
  '/about/',
  '/contact/',
  '/faq/',
  '/how-it-works/',
  '/reviews/',
  '/reviews/commercial-case-studies/',
  '/services/',
  '/services/one-time-mole-removal/',
  '/services/total-mole-control-program/',
  '/services/commercial-mole-control/',
  '/service-areas/',
  '/author/spencer/',
  '/privacy/',
  '/terms/',
]

const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx === -1 ? undefined : args[idx + 1]
}
const collectionFilter = getArg('collection') as 'core' | 'city' | 'blog' | undefined

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function flattenLd(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') {
    const g = (parsed as { '@graph'?: unknown[] })['@graph']
    if (Array.isArray(g)) return g
    return [parsed]
  }
  return []
}

function getType(item: unknown): string | null {
  if (!item || typeof item !== 'object') return null
  const t = (item as { '@type'?: unknown })['@type']
  if (typeof t === 'string') return t
  if (Array.isArray(t)) return t.join('+')
  return null
}

type PageResult = {
  url: string
  collection: string
  pageTypes: string[]
  supplementaryTypes: string[]
  pass: boolean
  error?: string
}

async function fetchAndClassify(url: string, collection: string): Promise<PageResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' },
    })
    if (!res.ok) {
      return { url, collection, pageTypes: [], supplementaryTypes: [], pass: true, error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const allItems: unknown[] = []

    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).html()
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        allItems.push(...flattenLd(parsed))
      } catch {
        // skip unparseable blocks
      }
    })

    const pageTypes: string[] = []
    const supplementaryTypes: string[] = []

    for (const item of allItems) {
      const t = getType(item)
      if (!t) continue
      if (PAGE_TYPES.has(t)) {
        if (!pageTypes.includes(t)) pageTypes.push(t)
      } else {
        if (!supplementaryTypes.includes(t)) supplementaryTypes.push(t)
      }
    }

    const pass = pageTypes.length <= 1

    return { url, collection, pageTypes, supplementaryTypes, pass }
  } catch (err) {
    return {
      url,
      collection,
      pageTypes: [],
      supplementaryTypes: [],
      pass: true,
      error: (err as Error).message,
    }
  }
}

function buildUrls(): Array<{ url: string; collection: string }> {
  const urls: Array<{ url: string; collection: string }> = []

  if (!collectionFilter || collectionFilter === 'core') {
    for (const path of CORE_PATHS) {
      urls.push({ url: SITE_BASE + path, collection: 'core' })
    }
  }

  if (!collectionFilter || collectionFilter === 'city') {
    for (const slug of getAllCitySlugs()) {
      urls.push({ url: `${SITE_BASE}/${slug}/`, collection: 'city' })
    }
  }

  if (!collectionFilter || collectionFilter === 'blog') {
    for (const post of blogPosts) {
      const path = post.urlPattern === 'legacy-root' ? `/${post.slug}/` : `/blog/${post.slug}/`
      urls.push({ url: SITE_BASE + path, collection: 'blog' })
    }
  }

  return urls
}

async function run() {
  const urls = buildUrls()
  console.log(`\nDuplicate schema audit — ${urls.length} pages to check\n`)

  const results: PageResult[] = []
  let checked = 0

  for (const { url, collection } of urls) {
    const result = await fetchAndClassify(url, collection)
    results.push(result)
    checked++

    const status = result.error ? 'ERR' : result.pass ? 'PASS' : 'FAIL'
    const detail = result.error || `page-types=[${result.pageTypes.join(', ')}]`
    process.stdout.write(`  [${checked}/${urls.length}] ${status} ${url}  ${detail}\n`)

    await sleep(100)
  }

  // Report
  console.log('\n=== Duplicate Schema Report ===\n')

  const violations = results.filter((r) => !r.pass)
  const errors = results.filter((r) => r.error)

  if (violations.length === 0) {
    console.log('No duplicate page-type violations found.\n')
  } else {
    console.log(`VIOLATIONS: ${violations.length} page(s) with duplicate page-types:\n`)
    for (const v of violations) {
      console.log(`  FAIL  ${v.url}`)
      console.log(`        page-types: ${v.pageTypes.join(', ')}`)
      console.log(`        supplementary: ${v.supplementaryTypes.join(', ') || 'none'}`)
    }
  }

  if (errors.length > 0) {
    console.log(`\nERRORS: ${errors.length} page(s) could not be fetched:\n`)
    for (const e of errors) {
      console.log(`  ERR   ${e.url}  ${e.error}`)
    }
  }

  console.log('\n--- Summary ---')
  console.log(`  Total pages checked:  ${results.length}`)
  console.log(`  Violations found:     ${violations.length}`)
  console.log(`  Fetch errors:         ${errors.length}`)
  console.log(`  Collections:          ${collectionFilter || 'all (core, city, blog)'}`)

  if (violations.length > 0) {
    console.log('\n  Violating URLs:')
    for (const v of violations) {
      console.log(`    ${v.url}  →  [${v.pageTypes.join(', ')}]`)
    }
  }

  console.log('')
  process.exit(violations.length > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
