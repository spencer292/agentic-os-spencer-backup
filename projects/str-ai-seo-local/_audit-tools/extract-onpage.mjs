// Extract on-page SEO signals from every URL in the production sitemap.
// For each page: H1 text, <title>, meta description, ordered H2 list,
// ordered H3 list, OG title/description, canonical URL.
//
// Output: ../onpage-extract-{YYYY-MM-DD}.json — single array of records.
// Concurrency: 8 parallel fetches.
import fs from 'node:fs'

const SITEMAP_URL = 'https://got-moles.com/sitemap.xml'
const UA = 'Mozilla/5.0 (compatible; OnPageAudit/1.0; +got-moles.com)'
const CONCURRENCY = 8
const OUT = `../onpage-extract-${new Date().toISOString().slice(0, 10)}.json`

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

function extractAll(html, tag) {
  const rx = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
  const matches = [...html.matchAll(rx)]
  return matches.map((m) => stripHtml(m[1])).filter(Boolean)
}

function extractMeta(html, name) {
  // name could be `name="description"` or `property="og:title"` or `name="robots"`
  const rxName = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i')
  const rxProp = new RegExp(`<meta[^>]+property=["']${name}["'][^>]*>`, 'i')
  const tag = html.match(rxName)?.[0] || html.match(rxProp)?.[0]
  if (!tag) return null
  const content = tag.match(/content=["']([^"']*)["']/i)
  return content ? stripHtml(content[1]) : null
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

async function extractOne(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
    const html = await r.text()
    return {
      url,
      finalUrl: r.url,
      status: r.status,
      title: extractTitle(html),
      h1List: extractAll(html, 'h1'),
      h2List: extractAll(html, 'h2'),
      h3List: extractAll(html, 'h3').slice(0, 20),
      metaDescription: extractMeta(html, 'description'),
      metaRobots: extractMeta(html, 'robots'),
      ogTitle: extractMeta(html, 'og:title'),
      ogDescription: extractMeta(html, 'og:description'),
      canonical: extractCanonical(html),
      bytes: html.length,
    }
  } catch (e) {
    return { url, error: e.message }
  }
}

async function getSitemapUrls() {
  const r = await fetch(SITEMAP_URL)
  const xml = await r.text()
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  // Filter out the /test/ paths and /lp/ paths (we don't audit those)
  return locs.filter((u) => !u.includes('/test/') && !u.includes('/lp/'))
}

async function runWithConcurrency(urls, fn, max) {
  const results = []
  let idx = 0
  const workers = Array.from({ length: max }, async () => {
    while (idx < urls.length) {
      const myIdx = idx++
      const url = urls[myIdx]
      const res = await fn(url)
      results[myIdx] = res
      if ((myIdx + 1) % 10 === 0) process.stdout.write(`\r  Processed ${myIdx + 1}/${urls.length}...`)
    }
  })
  await Promise.all(workers)
  return results
}

console.log(`Pulling sitemap...`)
const urls = await getSitemapUrls()
console.log(`  ${urls.length} URLs to extract (excludes /test/ and /lp/)`)

console.log(`\nExtracting (concurrency=${CONCURRENCY})...`)
const results = await runWithConcurrency(urls, extractOne, CONCURRENCY)

console.log(`\n\nSaving to ${OUT}...`)
fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
console.log(`Done. ${results.length} records.\n`)

// Quick sanity stats
const byStatus = {}
for (const r of results) {
  const k = r.error ? 'ERR' : String(r.status)
  byStatus[k] = (byStatus[k] || 0) + 1
}
console.log('Status counts:')
for (const [k, v] of Object.entries(byStatus)) console.log(`  ${k}: ${v}`)

const noH1 = results.filter((r) => !r.error && (!r.h1List || r.h1List.length === 0)).length
const multiH1 = results.filter((r) => !r.error && r.h1List && r.h1List.length > 1).length
const noTitle = results.filter((r) => !r.error && !r.title).length
const noMetaDesc = results.filter((r) => !r.error && !r.metaDescription).length
const noCanonical = results.filter((r) => !r.error && !r.canonical).length

console.log(`\nQuick sanity:`)
console.log(`  Missing H1:      ${noH1}`)
console.log(`  Multiple H1:     ${multiH1}`)
console.log(`  Missing title:   ${noTitle}`)
console.log(`  Missing meta:    ${noMetaDesc}`)
console.log(`  Missing canonical: ${noCanonical}`)
