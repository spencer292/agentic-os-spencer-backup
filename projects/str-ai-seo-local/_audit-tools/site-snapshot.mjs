#!/usr/bin/env node
/**
 * Live site snapshot for SEO/GEO/AEO audit (read-only).
 * Fetches key pages with GPTBot UA, extracts: status, title, meta description,
 * canonical, robots meta, H1, H2 count, JSON-LD @types, Article dateModified,
 * Last-Modified header, speakable, BreadcrumbList, FAQPage count (aggregation),
 * og:image, internal-link count, image count + alt coverage. Also audits sitemap.
 */
const BASE = 'https://got-moles.com'
const UA = 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'

const PAGES = [
  '/', '/services/total-mole-control-program/', '/services/one-time-mole-removal/',
  '/services/commercial-mole-control/', '/how-to-get-rid-of-moles-in-your-yard/',
  '/mole-control-seattle/', '/mole-control-tacoma/', '/about/', '/faq/',
  '/service-areas/', '/how-deep-do-moles-dig/', '/voles-vs-moles-whats-the-difference/',
]

function jsonLdTypes(html) {
  const types = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1].trim())
      const arr = Array.isArray(data) ? data : (data['@graph'] || [data])
      for (const node of arr) {
        const t = node['@type']
        if (t) types.push(Array.isArray(t) ? t.join('+') : t)
      }
    } catch { types.push('PARSE_ERR') }
  }
  return types
}

function attr(html, re) { const m = html.match(re); return m ? m[1] : null }

async function snap(path) {
  let res, html
  try {
    res = await fetch(BASE + path, { headers: { 'User-Agent': UA }, redirect: 'manual' })
    if (res.status >= 300 && res.status < 400) return { path, status: res.status, redirect: res.headers.get('location') }
    html = await res.text()
  } catch (e) { return { path, status: 'ERR', error: e.message } }

  const types = jsonLdTypes(html)
  const faqCount = types.filter((t) => t === 'FAQPage').length
  const h2s = (html.match(/<h2[\s>]/gi) || []).length
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((x) => x[0])
  const imgsWithAlt = imgs.filter((t) => /\balt=/.test(t)).length
  const internalLinks = new Set(
    [...html.matchAll(/href=["'](\/[^"'#?]*)/g)].map((x) => x[1])
  )
  return {
    path,
    status: res.status,
    lastModified: res.headers.get('last-modified') || '—',
    title: attr(html, /<title[^>]*>([^<]*)<\/title>/i),
    metaDesc: attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    canonical: attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    robots: attr(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) || '(none=index)',
    h1: attr(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, '').trim().slice(0, 80),
    h2count: h2s,
    schema: types.join(', ') || 'NONE',
    faqPageBlocks: faqCount,
    hasSpeakable: /speakable/i.test(html),
    hasBreadcrumb: types.includes('BreadcrumbList'),
    hasDateModified: /"dateModified"/.test(html),
    ogImage: attr(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i) ? 'y' : 'n',
    internalLinks: internalLinks.size,
    imgs: imgs.length,
    imgAltPct: imgs.length ? Math.round((imgsWithAlt / imgs.length) * 100) : 100,
  }
}

async function auditSitemap() {
  const res = await fetch(BASE + '/sitemap.xml', { headers: { 'User-Agent': UA } })
  if (res.status !== 200) return { status: res.status, urls: [] }
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  return { status: res.status, urls }
}

async function pool(items, fn, concurrency = 10) {
  const out = []
  let i = 0
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]) }
  }))
  return out
}

console.log(`# Live snapshot ${BASE} — ${new Date().toISOString()}\n`)

// --- Sitemap audit ---
const sm = await auditSitemap()
console.log(`## Sitemap: status=${sm.status}, ${sm.urls.length} URLs`)
const statuses = await pool(sm.urls, async (u) => {
  try {
    const r = await fetch(u, { method: 'GET', headers: { 'User-Agent': UA }, redirect: 'manual' })
    return { u, s: r.status, loc: r.headers.get('location') }
  } catch (e) { return { u, s: 'ERR', err: e.message } }
}, 12)
const bad = statuses.filter((x) => x.s !== 200)
console.log(`  non-200 in sitemap: ${bad.length}`)
for (const b of bad.slice(0, 40)) console.log(`    ${b.s}  ${b.u}${b.loc ? ' → ' + b.loc : ''}`)

// --- robots + llms ---
for (const f of ['/robots.txt', '/llms.txt', '/llms-full.txt']) {
  try { const r = await fetch(BASE + f, { headers: { 'User-Agent': UA } }); console.log(`\n## ${f}: ${r.status} (${(await r.text()).length} bytes)`) }
  catch (e) { console.log(`\n## ${f}: ERR ${e.message}`) }
}

// --- page snapshots ---
console.log(`\n## Page snapshots\n`)
const snaps = await pool(PAGES, snap, 6)
for (const s of snaps) console.log(JSON.stringify(s))
