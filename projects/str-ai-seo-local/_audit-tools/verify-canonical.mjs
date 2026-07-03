// Verify URL canonicalization across the site.
//
// For each URL: status code, full redirect chain, hop count, final URL,
// canonical link tag, JSON-LD presence, title, x-robots/meta-robots.
//
// Use:
//   node verify-canonical.mjs --target https://got-moles.com --label pre-flip
//   node verify-canonical.mjs --target https://project-pf8c6.vercel.app --label post-flip
//
// Inputs:
//   1. All URLs from <target>/sitemap.xml (canonical set — must return 200 in 0 hops)
//   2. Sample historical WordPress URLs (must redirect in 1 hop to a 200)
//
// Output:
//   ../verify-canonical-{label}-{YYYY-MM-DD}.csv
//   ../verify-canonical-{label}-{YYYY-MM-DD}.md (summary)
//
// Read-only. No edits to site, no deploys, no mutations.

import fs from 'node:fs'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]])
    return acc
  }, []),
)

const TARGET = (args.target || 'https://got-moles.com').replace(/\/$/, '')
const LABEL = args.label || 'baseline'
const UA = 'Mozilla/5.0 (compatible; CanonicalVerify/1.0; +got-moles.com)'
const CONCURRENCY = 8
const MAX_HOPS = 10
const TODAY = new Date().toISOString().slice(0, 10)
const OUT_CSV = `../verify-canonical-${LABEL}-${TODAY}.csv`
const OUT_MD = `../verify-canonical-${LABEL}-${TODAY}.md`

// ────────────────────────────────────────────────────────────────────────
// Sample historical WordPress URLs (from Wayback evidence + known patterns)
// These must redirect in 1 hop to a 200 destination.
// Tests the redirect chain for legacy WP URL forms.
// ────────────────────────────────────────────────────────────────────────
const HISTORICAL_SAMPLES = [
  // Legacy core pages with trailing slash
  '/about-us/',
  '/our-services/',
  '/contact/',
  '/blog/',
  // WordPress /city/{slug}/ CPT pattern
  '/city/seattle/',
  '/city/tacoma/',
  '/city/bellevue/',
  // Verb-prefix city patterns
  '/mole-trapping-seattle/',
  '/mole-exterminator-tacoma/',
  '/mole-removal-bellevue/',
  '/mole-catcher-renton/',
  // Reverse verb patterns
  '/seattle-mole-control/',
  '/tacoma-mole-trapping/',
  // Spelling variants
  '/mole-control-southhill/',
  '/mole-repellent-seattle/',
  // Author archive
  '/author/spencer/',
  // Legacy service
  '/pest-control/',
  '/mole-control-2/',
  // /service/ alias
  '/service/total-mole-control/',
  // No-slash variants of above (test trailing-slash strip)
  '/about-us',
  '/city/seattle',
  '/mole-trapping-seattle',
]

// ────────────────────────────────────────────────────────────────────────
// HTML extractors
// ────────────────────────────────────────────────────────────────────────

function stripHtml(s) {
  if (!s) return ''
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractCanonical(html) {
  const tag = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)
  if (!tag) return null
  const href = tag[0].match(/href=["']([^"']*)["']/i)
  return href ? href[1] : null
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? stripHtml(m[1]) : null
}

function hasJsonLd(html) {
  return /<script[^>]+type=["']application\/ld\+json["']/i.test(html)
}

function extractMetaRobots(html) {
  const tag = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i)
  if (!tag) return null
  const c = tag[0].match(/content=["']([^"']*)["']/i)
  return c ? c[1] : null
}

// ────────────────────────────────────────────────────────────────────────
// Fetch with redirect chain capture
// ────────────────────────────────────────────────────────────────────────

async function fetchChain(url) {
  const chain = []
  let current = url
  let lastStatus = null
  let lastHeaders = null

  for (let i = 0; i < MAX_HOPS; i++) {
    let res
    try {
      res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': UA },
      })
    } catch (err) {
      return { chain, finalUrl: current, finalStatus: 0, error: err.message, body: null, headers: null }
    }

    chain.push({ url: current, status: res.status })
    lastStatus = res.status
    lastHeaders = res.headers

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) break
      current = new URL(loc, current).toString()
      continue
    }

    // Terminal — read body
    const body = await res.text().catch(() => null)
    return {
      chain,
      finalUrl: current,
      finalStatus: lastStatus,
      error: null,
      body,
      headers: lastHeaders,
    }
  }

  return {
    chain,
    finalUrl: current,
    finalStatus: lastStatus,
    error: 'max_hops_exceeded',
    body: null,
    headers: lastHeaders,
  }
}

async function probeUrl(rawUrl, sourceLabel) {
  const url = rawUrl.startsWith('http') ? rawUrl : `${TARGET}${rawUrl}`
  const result = await fetchChain(url)

  const hops = result.chain.length - 1 // count of redirects
  const html = result.body || ''
  const xRobots = result.headers ? result.headers.get('x-robots-tag') : null

  return {
    source_label: sourceLabel,
    input_url: url,
    final_url: result.finalUrl,
    final_status: result.finalStatus,
    hops,
    chain: result.chain.map((c) => `${c.status} ${c.url}`).join(' → '),
    canonical: html ? extractCanonical(html) : null,
    canonical_matches_final: null, // computed below
    title: html ? extractTitle(html) : null,
    has_jsonld: html ? hasJsonLd(html) : false,
    meta_robots: html ? extractMetaRobots(html) : null,
    x_robots: xRobots,
    error: result.error,
  }
}

function computeMatch(record) {
  if (!record.canonical || !record.final_url) {
    record.canonical_matches_final = null
    return
  }
  // Compare canonical to final URL ignoring https/http but preserving slash
  const a = record.canonical.replace(/^https?:\/\//, '')
  const b = record.final_url.replace(/^https?:\/\//, '')
  record.canonical_matches_final = a === b
}

// ────────────────────────────────────────────────────────────────────────
// Concurrency-limited mapper
// ────────────────────────────────────────────────────────────────────────

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let i = 0
  const workers = Array(limit)
    .fill(0)
    .map(async () => {
      while (true) {
        const idx = i++
        if (idx >= items.length) return
        try {
          results[idx] = await fn(items[idx], idx)
        } catch (e) {
          results[idx] = { error: e.message, input: items[idx] }
        }
      }
    })
  await Promise.all(workers)
  return results
}

// ────────────────────────────────────────────────────────────────────────
// CSV writer
// ────────────────────────────────────────────────────────────────────────

function csvEscape(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toCsv(records) {
  const cols = [
    'source_label',
    'input_url',
    'final_url',
    'final_status',
    'hops',
    'chain',
    'canonical',
    'canonical_matches_final',
    'title',
    'has_jsonld',
    'meta_robots',
    'x_robots',
    'error',
  ]
  const header = cols.join(',')
  const rows = records.map((r) => cols.map((c) => csvEscape(r[c])).join(','))
  return [header, ...rows].join('\n')
}

// ────────────────────────────────────────────────────────────────────────
// Summary md
// ────────────────────────────────────────────────────────────────────────

function buildSummary(sitemapRecords, historicalRecords) {
  const all = [...sitemapRecords, ...historicalRecords]

  const sitemapBad = sitemapRecords.filter((r) => r.final_status !== 200 || r.hops > 0)
  const sitemapCanonicalMismatch = sitemapRecords.filter((r) => r.canonical_matches_final === false)
  const sitemapMissingCanonical = sitemapRecords.filter((r) => r.final_status === 200 && !r.canonical)
  const sitemapMissingJsonLd = sitemapRecords.filter((r) => r.final_status === 200 && !r.has_jsonld)

  const historicalBad = historicalRecords.filter((r) => r.final_status !== 200)
  const historicalMultiHop = historicalRecords.filter((r) => r.hops > 1)
  const historicalSingleHop = historicalRecords.filter((r) => r.hops === 1 && r.final_status === 200)

  const errors = all.filter((r) => r.error)

  return `# Canonical Verification — ${LABEL}

**Run:** ${new Date().toISOString()}
**Target:** ${TARGET}

## Sitemap URLs (canonical set — must return 200 in 0 hops)

| Metric | Count |
|---|---|
| Total sitemap URLs | ${sitemapRecords.length} |
| 200 in 0 hops | ${sitemapRecords.filter((r) => r.final_status === 200 && r.hops === 0).length} |
| Returning 308 first (hop > 0) | ${sitemapRecords.filter((r) => r.hops > 0 && r.final_status === 200).length} |
| Non-200 final | ${sitemapRecords.filter((r) => r.final_status !== 200 && !r.error).length} |
| Errors | ${sitemapRecords.filter((r) => r.error).length} |
| Canonical tag missing | ${sitemapMissingCanonical.length} |
| Canonical ≠ final URL | ${sitemapCanonicalMismatch.length} |
| Missing JSON-LD | ${sitemapMissingJsonLd.length} |

### Sitemap URLs requiring attention

${
  sitemapBad.length === 0
    ? '_All sitemap URLs return 200 in 0 hops._'
    : sitemapBad
        .slice(0, 50)
        .map((r) => `- \`${r.input_url}\` — ${r.final_status} via ${r.hops} hop(s) → ${r.final_url}`)
        .join('\n')
}

### Canonical/final mismatches (top 20)

${
  sitemapCanonicalMismatch.length === 0
    ? '_All canonical tags align with served URL._'
    : sitemapCanonicalMismatch
        .slice(0, 20)
        .map((r) => `- \`${r.final_url}\` declares canonical \`${r.canonical}\``)
        .join('\n')
}

## Historical WordPress URLs (must redirect in 1 hop to 200)

| Metric | Count |
|---|---|
| Sampled | ${historicalRecords.length} |
| 1-hop to 200 (target state) | ${historicalSingleHop.length} |
| Multi-hop (>1) | ${historicalMultiHop.length} |
| Failed (non-200 or error) | ${historicalBad.length} |

### Multi-hop chains (need shortening after flip)

${
  historicalMultiHop.length === 0
    ? '_All historical samples reach destination in 1 hop._'
    : historicalMultiHop
        .map((r) => `- \`${r.input_url}\` — ${r.hops} hops: ${r.chain}`)
        .join('\n')
}

### Failed historical URLs

${
  historicalBad.length === 0
    ? '_All historical samples return 200 at end of chain._'
    : historicalBad.map((r) => `- \`${r.input_url}\` — ${r.final_status} ${r.error || ''}`).join('\n')
}

## Errors

${errors.length === 0 ? '_No fetch errors._' : errors.map((r) => `- \`${r.input_url}\` — ${r.error}`).join('\n')}

## Files

- Full data: \`verify-canonical-${LABEL}-${TODAY}.csv\`
- This summary: \`verify-canonical-${LABEL}-${TODAY}.md\`
`
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Target: ${TARGET}`)
  console.log(`Label:  ${LABEL}`)
  console.log()

  // 1. Fetch sitemap
  console.log('Fetching sitemap...')
  const sitemapRes = await fetch(`${TARGET}/sitemap.xml`, { headers: { 'User-Agent': UA } })
  if (!sitemapRes.ok) {
    console.error(`Sitemap fetch failed: ${sitemapRes.status}`)
    process.exit(1)
  }
  const sitemapXml = await sitemapRes.text()
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  console.log(`  ${sitemapUrls.length} URLs`)

  // 2. Probe sitemap URLs
  console.log(`Probing sitemap URLs (concurrency ${CONCURRENCY})...`)
  const sitemapRecords = await mapLimit(sitemapUrls, CONCURRENCY, (u) => probeUrl(u, 'sitemap'))
  sitemapRecords.forEach(computeMatch)
  console.log('  done')

  // 3. Probe historical samples
  console.log(`Probing ${HISTORICAL_SAMPLES.length} historical samples...`)
  const historicalRecords = await mapLimit(HISTORICAL_SAMPLES, CONCURRENCY, (u) => probeUrl(u, 'historical'))
  historicalRecords.forEach(computeMatch)
  console.log('  done')

  // 4. Write outputs
  const allRecords = [...sitemapRecords, ...historicalRecords]
  fs.writeFileSync(OUT_CSV, toCsv(allRecords))
  fs.writeFileSync(OUT_MD, buildSummary(sitemapRecords, historicalRecords))

  console.log()
  console.log(`CSV: ${OUT_CSV}`)
  console.log(`MD:  ${OUT_MD}`)

  // 5. Console summary
  const sitemapClean = sitemapRecords.filter((r) => r.final_status === 200 && r.hops === 0).length
  const historicalSingleHop = historicalRecords.filter((r) => r.hops === 1 && r.final_status === 200).length
  const historicalMultiHop = historicalRecords.filter((r) => r.hops > 1).length
  console.log()
  console.log('─── SUMMARY ───')
  console.log(`Sitemap: ${sitemapClean}/${sitemapRecords.length} return 200 in 0 hops`)
  console.log(`Historical: ${historicalSingleHop}/${historicalRecords.length} reach 200 in 1 hop, ${historicalMultiHop} multi-hop`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
