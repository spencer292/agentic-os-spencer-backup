/**
 * validate-schema.ts
 *
 * CI validator: checks that each page has at most ONE page-type @type
 * in its JSON-LD. Self-contained — no Payload or src/ imports.
 *
 * USAGE
 *   npm run validate-schema -- --base-url https://preview-xyz.vercel.app
 *   npm run validate-schema -- --base-url https://preview-xyz.vercel.app --paths /,/about/,/faq/
 *   npm run validate-schema -- --base-url https://preview-xyz.vercel.app --paths paths.txt
 */

import * as cheerio from 'cheerio'
import { readFileSync, existsSync } from 'node:fs'

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

const DEFAULT_PATHS = [
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

const baseUrl = getArg('base-url')

if (!baseUrl) {
  console.error('Usage: validate-schema --base-url <URL> [--paths /a,/b or paths.txt]')
  console.error('')
  console.error('Options:')
  console.error('  --base-url   Required. Vercel preview deploy URL.')
  console.error('  --paths      Optional. Comma-separated paths or path to a text file (one path per line).')
  console.error('               Defaults to core pages if omitted.')
  process.exit(1)
}

function parsePaths(raw: string): string[] {
  if (existsSync(raw)) {
    return readFileSync(raw, 'utf-8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
  }
  return raw.split(',').map((p) => p.trim()).filter(Boolean)
}

const pathsArg = getArg('paths')
const paths = pathsArg ? parsePaths(pathsArg) : DEFAULT_PATHS

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

type Result = {
  path: string
  url: string
  pageTypes: string[]
  supplementaryTypes: string[]
  pass: boolean
  error?: string
}

async function validate(path: string): Promise<Result> {
  const url = baseUrl!.replace(/\/$/, '') + path
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' },
    })
    if (!res.ok) {
      return { path, url, pageTypes: [], supplementaryTypes: [], pass: true, error: `HTTP ${res.status}` }
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
        // skip unparseable
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

    return { path, url, pageTypes, supplementaryTypes, pass: pageTypes.length <= 1 }
  } catch (err) {
    return { path, url, pageTypes: [], supplementaryTypes: [], pass: true, error: (err as Error).message }
  }
}

async function run() {
  console.log(`\nSchema validation — ${paths.length} paths against ${baseUrl}\n`)

  const results: Result[] = []

  for (const path of paths) {
    const result = await validate(path)
    results.push(result)

    const status = result.error ? 'ERR' : result.pass ? 'PASS' : 'FAIL'
    const detail = result.error || `page-types=[${result.pageTypes.join(', ')}]`
    console.log(`  ${status}  ${path}  ${detail}`)

    await sleep(100)
  }

  const failures = results.filter((r) => !r.pass)
  const errors = results.filter((r) => r.error)

  console.log(`\n--- Results ---`)
  console.log(`  Checked: ${results.length}`)
  console.log(`  Passed:  ${results.length - failures.length - errors.length}`)
  console.log(`  Failed:  ${failures.length}`)
  console.log(`  Errors:  ${errors.length}`)

  if (failures.length > 0) {
    console.log('\nFAILURES:')
    for (const f of failures) {
      console.log(`  ${f.path}  page-types=[${f.pageTypes.join(', ')}]`)
    }
  }

  console.log('')
  process.exit(failures.length > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('Validation failed:', err)
  process.exit(1)
})
