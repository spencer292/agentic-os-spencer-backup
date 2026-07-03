/**
 * audit-json-ld.ts
 *
 * Audits every JSON-LD block on every CMS-backed live page:
 *   1. JSON validity (parse error?)
 *   2. Forbidden terms (trap-mechanism descriptions)
 *   3. Expected schema types present per page type
 *   4. FAQPage drift — does the rendered FAQPage schema match the FAQs
 *      currently in CMS, in count and content?
 *
 * READ-ONLY. Never writes.
 *
 * USAGE
 *   npm run audit-jsonld                         (all 45 records)
 *   npm run audit-jsonld -- --collection pages
 */

import { getPayload } from 'payload'
import config from '@payload-config'

const SITE_BASE = 'https://got-moles.com'

const PAGE_SLUG_TO_PATH: Record<string, string> = {
  '/': '/',
  about: '/about/',
  contact: '/contact/',
  faq: '/faq/',
  'how-it-works': '/how-it-works/',
  reviews: '/reviews/',
  'commercial-case-studies': '/reviews/commercial-case-studies/',
  'one-time-mole-removal': '/services/one-time-mole-removal/',
  'total-mole-control-program': '/services/total-mole-control-program/',
  'commercial-mole-control': '/services/commercial-mole-control/',
}

const FORBIDDEN = [
  'body-grip',
  'kill the animal',
  'kills the animal',
  'neck-or-chest',
  'instantaneous death',
  'kill the mole instantly',
  'fraction of a second',
]

const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx === -1 ? undefined : args[idx + 1]
}
const collectionFilter = getArg('collection') as 'blog-posts' | 'pages' | undefined

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function liveUrl(collection: 'blog-posts' | 'pages', doc: Record<string, unknown>): string | null {
  const slug = doc.slug as string
  if (!slug) return null
  if (collection === 'pages') {
    const path = PAGE_SLUG_TO_PATH[slug]
    return path ? SITE_BASE + path : null
  }
  const urlPattern = (doc.urlPattern as string) || 'blog'
  return urlPattern === 'legacy-root' ? `${SITE_BASE}/${slug}/` : `${SITE_BASE}/blog/${slug}/`
}

function norm(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/\s+/g, ' ').trim()
}

const REGEX_LD = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

type LdBlock = { raw: string; parsed: unknown; parseError?: string }

function extractLdBlocks(html: string): LdBlock[] {
  const out: LdBlock[] = []
  for (const match of html.matchAll(REGEX_LD)) {
    const raw = match[1]
    try {
      const parsed = JSON.parse(raw)
      out.push({ raw, parsed })
    } catch (e) {
      out.push({ raw, parsed: null, parseError: (e as Error).message })
    }
  }
  return out
}

// Walks @graph or array, returns flat list of items
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

function findFirst(items: unknown[], type: string): Record<string, unknown> | null {
  for (const i of items) {
    if (getType(i) === type) return i as Record<string, unknown>
  }
  return null
}

// ----------------------------------------------------------------------
// FAQPage extraction — returns { question, answer } pairs
// ----------------------------------------------------------------------
type FaqPair = { question: string; answer: string }

function extractFaqPagePairs(items: unknown[]): FaqPair[] {
  const faq = findFirst(items, 'FAQPage')
  if (!faq) return []
  const main = (faq as { mainEntity?: unknown[] }).mainEntity
  if (!Array.isArray(main)) return []
  const pairs: FaqPair[] = []
  for (const q of main) {
    if (!q || typeof q !== 'object') continue
    const qObj = q as Record<string, unknown>
    const question = norm((qObj.name as string) || '')
    const accepted = qObj.acceptedAnswer as Record<string, unknown> | undefined
    const answer = norm((accepted?.text as string) || '')
    if (question) pairs.push({ question, answer })
  }
  return pairs
}

// ----------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------
type RouteResult = {
  collection: string
  slug: string
  url: string
  blocks: number
  parseErrors: string[]
  types: string[]
  forbiddenHits: Array<{ term: string; type: string }>
  faqDrift?: {
    cmsCount: number
    schemaCount: number
    mismatches: string[]
  }
}

async function run() {
  const payload = await getPayload({ config })
  const collections: Array<'blog-posts' | 'pages'> = collectionFilter
    ? [collectionFilter]
    : ['blog-posts', 'pages']

  console.log(`\nJSON-LD audit — collections=${collections.join(', ')}\n`)

  const results: RouteResult[] = []

  for (const col of collections) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any =
      col === 'blog-posts'
        ? { status: { equals: 'published' } }
        : { _status: { equals: 'published' } }

    const cmsResult = await payload.find({
      collection: col,
      limit: 500,
      depth: 0,
      draft: false,
      where,
    })

    console.log(`Auditing ${cmsResult.docs.length} record(s) in ${col}...`)

    for (const d of cmsResult.docs as unknown as Array<Record<string, unknown>>) {
      const url = liveUrl(col, d)
      if (!url) continue

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' },
      })
      if (!res.ok) {
        results.push({
          collection: col,
          slug: d.slug as string,
          url,
          blocks: 0,
          parseErrors: [`HTTP ${res.status}`],
          types: [],
          forbiddenHits: [],
        })
        continue
      }
      const html = await res.text()
      const blocks = extractLdBlocks(html)

      const allItems: unknown[] = []
      const parseErrors: string[] = []
      for (const b of blocks) {
        if (b.parseError) parseErrors.push(b.parseError)
        else allItems.push(...flattenLd(b.parsed))
      }

      const types = [...new Set(allItems.map(getType).filter((x): x is string => !!x))]

      // Forbidden term scan across all parsed schema content
      const forbiddenHits: Array<{ term: string; type: string }> = []
      for (const item of allItems) {
        const json = JSON.stringify(item).toLowerCase()
        const t = getType(item) || 'unknown'
        for (const term of FORBIDDEN) {
          if (json.includes(term.toLowerCase())) {
            forbiddenHits.push({ term, type: t })
          }
        }
      }

      // FAQPage drift check — compare schema FAQs against CMS faqs.
      //
      // Blog-posts store faqs at the top level (collection field).
      // Pages store faqs inside layout blocks of type 'faq'.
      // Aggregate from both sources.
      let faqDrift: RouteResult['faqDrift']
      const cmsFaqs: Array<{ question?: string; answer?: string }> = []
      const topLevelFaqs = d.faqs as Array<{ question?: string; answer?: string }> | undefined
      if (Array.isArray(topLevelFaqs)) cmsFaqs.push(...topLevelFaqs)
      const layout = d.layout
      if (Array.isArray(layout)) {
        for (const b of layout) {
          if (!b || typeof b !== 'object') continue
          const block = b as Record<string, unknown>
          // Payload blocks have a `blockType` field naming the block kind
          if (block.blockType === 'faq' || block.blockType === 'faqs') {
            const items = block.items
            if (Array.isArray(items)) {
              for (const it of items) {
                if (it && typeof it === 'object') {
                  cmsFaqs.push(it as { question?: string; answer?: string })
                }
              }
            }
          }
        }
      }
      const schemaFaqs = extractFaqPagePairs(allItems)
      if (cmsFaqs.length > 0 || schemaFaqs.length > 0) {
        const mismatches: string[] = []
        if (cmsFaqs.length !== schemaFaqs.length) {
          mismatches.push(
            `count: CMS=${cmsFaqs.length}, schema=${schemaFaqs.length}`,
          )
        }
        const max = Math.min(cmsFaqs.length, schemaFaqs.length)
        for (let i = 0; i < max; i++) {
          const cQ = norm(cmsFaqs[i].question)
          const cA = norm(cmsFaqs[i].answer)
          const sQ = schemaFaqs[i].question
          const sA = schemaFaqs[i].answer
          if (cQ !== sQ) mismatches.push(`Q[${i}]: "${cQ.slice(0, 60)}…" vs schema "${sQ.slice(0, 60)}…"`)
          if (cA !== sA) mismatches.push(`A[${i}]: differs (${cA.length} vs ${sA.length} chars)`)
        }
        faqDrift = { cmsCount: cmsFaqs.length, schemaCount: schemaFaqs.length, mismatches }
      }

      results.push({
        collection: col,
        slug: d.slug as string,
        url,
        blocks: blocks.length,
        parseErrors,
        types,
        forbiddenHits,
        faqDrift,
      })

      await new Promise((r) => setTimeout(r, 80))
    }
  }

  // ----- Report -----
  console.log('\n=== JSON-LD Report ===\n')

  let totalBlocks = 0
  let totalParseErrors = 0
  let totalForbidden = 0
  let totalFaqDrift = 0
  const typesAcrossSite: Record<string, number> = {}

  for (const r of results) {
    totalBlocks += r.blocks
    totalParseErrors += r.parseErrors.length
    totalForbidden += r.forbiddenHits.length
    if (r.faqDrift && r.faqDrift.mismatches.length > 0) totalFaqDrift++
    for (const t of r.types) typesAcrossSite[t] = (typesAcrossSite[t] || 0) + 1
  }

  // Per-route problems only (reduce noise)
  const problems = results.filter(
    (r) =>
      r.parseErrors.length > 0 ||
      r.forbiddenHits.length > 0 ||
      (r.faqDrift && r.faqDrift.mismatches.length > 0),
  )

  if (problems.length === 0) {
    console.log('No issues. All routes pass JSON-LD audit.\n')
  } else {
    console.log(`Issues found on ${problems.length}/${results.length} routes:\n`)
    for (const r of problems) {
      console.log(`${r.collection}/${r.slug}   ${r.url}`)
      if (r.parseErrors.length > 0) {
        console.log(`  ⚠ Parse errors: ${r.parseErrors.join('; ')}`)
      }
      if (r.forbiddenHits.length > 0) {
        const dedup = [...new Set(r.forbiddenHits.map((h) => `${h.term}@${h.type}`))]
        console.log(`  ⚠ Forbidden terms: ${dedup.join(', ')}`)
      }
      if (r.faqDrift && r.faqDrift.mismatches.length > 0) {
        console.log(`  ⚠ FAQ drift (CMS=${r.faqDrift.cmsCount}, schema=${r.faqDrift.schemaCount}):`)
        for (const m of r.faqDrift.mismatches.slice(0, 5)) console.log(`    - ${m}`)
        if (r.faqDrift.mismatches.length > 5) {
          console.log(`    - ...and ${r.faqDrift.mismatches.length - 5} more`)
        }
      }
    }
  }

  console.log('\n--- Site-wide schema coverage ---')
  for (const [type, count] of Object.entries(typesAcrossSite).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(3)} × ${type}`)
  }

  console.log('\n--- Summary ---')
  console.log(`  Routes audited: ${results.length}`)
  console.log(`  Total JSON-LD blocks: ${totalBlocks}`)
  console.log(`  Parse errors: ${totalParseErrors}`)
  console.log(`  Forbidden term hits: ${totalForbidden}`)
  console.log(`  Routes with FAQ drift: ${totalFaqDrift}`)

  process.exit(0)
}

run().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
