/**
 * audit-cms-vs-live.ts
 *
 * Compares Payload CMS content against the live got-moles.com HTML.
 * Surfaces records where CMS has been updated but Vercel hasn't shipped
 * the change (failed build, edge cache, ISR anomaly, draft-vs-published, etc.).
 *
 * READ-ONLY. Never writes to CMS or to disk.
 *
 * METHOD
 *   For each CMS record:
 *     1. Build the live URL from the record's slug + collection rules
 *     2. Extract a "signature" string from the CMS record (definitionBlock,
 *        excerpt, or first FAQ question) — distinctive, short, hard to
 *        accidentally collide with other content.
 *     3. Fetch the live URL.
 *     4. Search the live HTML for the signature (whitespace-normalized).
 *     5. Match → live is current. Miss → drift.
 *
 * USAGE
 *   npm run audit-live                           (all CMS-backed routes)
 *   npm run audit-live -- --collection blog-posts
 *   npm run audit-live -- --collection pages
 */

import { getPayload } from 'payload'
import config from '@payload-config'

const SITE_BASE = 'https://got-moles.com'

// Slug → URL path map for the Pages collection
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

// ----------------------------------------------------------------------
// Args
// ----------------------------------------------------------------------
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx === -1 ? undefined : args[idx + 1]
}
const collectionFilter = getArg('collection') as 'blog-posts' | 'pages' | undefined

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function norm(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

// Strip HTML tags + scripts/styles, then normalize. Use on fetched live HTML.
function stripHtml(html: string): string {
  return norm(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
}

// Walk a Lexical node tree and concatenate every .text leaf.
function flattenLexicalText(node: unknown): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (typeof (node as { text?: unknown }).text === 'string') {
    return (node as { text: string }).text + ' '
  }
  const children = (node as { children?: unknown[] }).children
  if (Array.isArray(children)) {
    return children.map(flattenLexicalText).join('')
  }
  const root = (node as { root?: unknown }).root
  if (root) return flattenLexicalText(root)
  return ''
}

// Walk a Payload blocks array and concatenate visible text.
function flattenBlocksText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return ''
  const parts: string[] = []
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue
    const block = b as Record<string, unknown>
    // Common text fields across blocks
    for (const f of ['heading', 'subheading', 'body', 'content', 'description', 'label']) {
      const v = block[f]
      if (typeof v === 'string') parts.push(v)
      else if (v && typeof v === 'object') parts.push(flattenLexicalText(v))
    }
    // Items / faqs / quotes / cta
    for (const f of ['items', 'faqs', 'quotes']) {
      const arr = block[f]
      if (Array.isArray(arr)) {
        for (const it of arr) {
          if (it && typeof it === 'object') {
            for (const k of [
              'question',
              'answer',
              'title',
              'description',
              'text',
              'label',
              'name',
              'number',
            ]) {
              const v = (it as Record<string, unknown>)[k]
              if (typeof v === 'string') parts.push(v)
            }
          }
        }
      }
    }
  }
  return parts.join(' ')
}

// Pick a signature string from a CMS record. Prefers distinctive fields
// rendered IN THE BODY (not meta-only).
//
// Excludes: excerpt, meta.description (rendered only in <meta> tags or
// blog-card components, not in the page body — would cause false positives).
function pickSignatures(
  collection: 'blog-posts' | 'pages',
  doc: Record<string, unknown>,
): string[] {
  const sigs: string[] = []
  if (collection === 'blog-posts') {
    const def = doc.definitionBlock as string | undefined
    if (def) sigs.push(def.slice(0, 80))

    const faqs = doc.faqs as Array<{ question?: string; answer?: string }> | undefined
    if (faqs && faqs[0]?.question) sigs.push(faqs[0].question)
    if (faqs && faqs[0]?.answer) sigs.push(faqs[0].answer.slice(0, 80))
    if (faqs && faqs.length > 1 && faqs[faqs.length - 1]?.question) {
      sigs.push(faqs[faqs.length - 1].question!)
    }

    // Body Lexical — first 80 chars of flattened text
    const body = doc.body
    if (body) {
      const flat = norm(flattenLexicalText(body))
      if (flat) sigs.push(flat.slice(0, 80))
    }
  } else {
    // pages — break the layout into per-block signatures so we can detect
    // which specific block failed to render
    const layout = doc.layout
    if (Array.isArray(layout)) {
      for (const b of layout) {
        if (!b || typeof b !== 'object') continue
        const block = b as Record<string, unknown>
        // Take heading or first 80 chars of body text from each block
        if (typeof block.heading === 'string' && block.heading.length >= 10) {
          sigs.push(block.heading.slice(0, 80))
        } else if (typeof block.body === 'string' && block.body.length >= 20) {
          sigs.push(block.body.slice(0, 80))
        } else if (block.body && typeof block.body === 'object') {
          const flat = norm(flattenLexicalText(block.body))
          if (flat.length >= 20) sigs.push(flat.slice(0, 80))
        }
      }
    }
  }
  return sigs.filter((s) => s && s.length >= 15).map(norm)
}

// Build the live URL for a record.
function liveUrl(collection: 'blog-posts' | 'pages', doc: Record<string, unknown>): string | null {
  const slug = doc.slug as string
  if (!slug) return null
  if (collection === 'pages') {
    const path = PAGE_SLUG_TO_PATH[slug]
    if (!path) return null
    return SITE_BASE + path
  }
  // blog-posts
  const urlPattern = (doc.urlPattern as string) || 'blog'
  if (urlPattern === 'legacy-root') return `${SITE_BASE}/${slug}/`
  return `${SITE_BASE}/blog/${slug}/`
}

// Fetch live HTML, return normalized text content.
async function fetchLive(url: string): Promise<{ ok: boolean; text: string; status: number; rawLen: number }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    const text = res.ok ? await res.text() : ''
    return { ok: res.ok, text: stripHtml(text), status: res.status, rawLen: text.length }
  } catch (err) {
    return { ok: false, text: '', status: 0, rawLen: 0 }
  }
}

// ----------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------
type AuditResult = {
  collection: string
  slug: string
  url: string
  status: 'match' | 'partial-match' | 'no-match' | 'fetch-failed' | 'no-signature'
  signaturesChecked: number
  signaturesFound: number
  detail?: string
}

async function run() {
  const payload = await getPayload({ config })
  const collections: Array<'blog-posts' | 'pages'> = collectionFilter
    ? [collectionFilter]
    : ['blog-posts', 'pages']

  console.log(
    `\nCMS-vs-Live audit — collections=${collections.join(', ')}, base=${SITE_BASE}\n`,
  )

  const results: AuditResult[] = []

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
      if (!url) {
        results.push({
          collection: col,
          slug: (d.slug as string) || `id=${d.id}`,
          url: '(unknown)',
          status: 'no-match',
          signaturesChecked: 0,
          signaturesFound: 0,
          detail: 'No URL mapping for this slug',
        })
        continue
      }

      const sigs = pickSignatures(col, d)
      if (sigs.length === 0) {
        results.push({
          collection: col,
          slug: d.slug as string,
          url,
          status: 'no-signature',
          signaturesChecked: 0,
          signaturesFound: 0,
          detail: 'CMS record has no signature-able content',
        })
        continue
      }

      const live = await fetchLive(url)
      if (!live.ok) {
        results.push({
          collection: col,
          slug: d.slug as string,
          url,
          status: 'fetch-failed',
          signaturesChecked: 0,
          signaturesFound: 0,
          detail: `HTTP ${live.status}`,
        })
        continue
      }

      const liveText = live.text
      let found = 0
      const missing: string[] = []
      for (const sig of sigs) {
        if (liveText.includes(sig)) {
          found++
        } else {
          missing.push(sig)
        }
      }

      let status: AuditResult['status']
      if (found === sigs.length) status = 'match'
      else if (found > 0) status = 'partial-match'
      else status = 'no-match'

      results.push({
        collection: col,
        slug: d.slug as string,
        url,
        status,
        signaturesChecked: sigs.length,
        signaturesFound: found,
        detail: missing.length > 0 ? `missing: "${missing[0].slice(0, 80)}…"` : undefined,
      })

      // Throttle a touch
      await new Promise((r) => setTimeout(r, 100))
    }
  }

  // ----- Report -----
  console.log('\n=== Audit Report ===\n')

  const byStatus: Record<string, AuditResult[]> = {}
  for (const r of results) {
    if (!byStatus[r.status]) byStatus[r.status] = []
    byStatus[r.status].push(r)
  }

  const order = ['no-match', 'partial-match', 'fetch-failed', 'no-signature', 'match']
  for (const status of order) {
    const list = byStatus[status]
    if (!list || list.length === 0) continue
    console.log(`\n[${status.toUpperCase()}] — ${list.length} record(s)`)
    for (const r of list) {
      const tag = `${r.signaturesFound}/${r.signaturesChecked}`
      console.log(`  ${r.collection}/${r.slug}   ${r.url}`)
      console.log(`    sigs ${tag}${r.detail ? ` · ${r.detail}` : ''}`)
    }
  }

  console.log('\n--- Summary ---')
  for (const status of order) {
    const list = byStatus[status]
    if (list && list.length > 0) console.log(`  ${status}: ${list.length}`)
  }
  console.log(`  total: ${results.length}`)

  process.exit(0)
}

run().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
