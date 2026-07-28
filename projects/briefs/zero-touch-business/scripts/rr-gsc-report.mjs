#!/usr/bin/env node
// rr-gsc-report.mjs — Route Ready organic search report from Google Search Console.
//
// Closes the blind spot flagged in the 2026-07-23 digest: Cloudflare Worker request counts
// can't tell humans from crawlers, and nothing showed which queries (if any) the site
// surfaces for. This reports real impressions/clicks/position by query and by page, plus
// indexing coverage from the sitemap.
//
// Read-only. Uses ROUTE_READY_GSC_REFRESH_TOKEN + the shared ROUTE_READY_ADS_CLIENT_ID/SECRET
// OAuth client. Mint the token first: node .../rr-mint-gsc-token.mjs
//
// Usage: node projects/briefs/zero-touch-business/scripts/rr-gsc-report.mjs [--days 7] [--json]
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '..', '..', '..', '.env')

const argv = process.argv.slice(2)
const JSON_ONLY = argv.includes('--json')
const daysIdx = argv.indexOf('--days')
const WINDOW = daysIdx !== -1 ? parseInt(argv[daysIdx + 1], 10) || 7 : 7

const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const out = (obj) => { console.log(JSON.stringify(obj, null, 2)); }

if (!env.ROUTE_READY_GSC_REFRESH_TOKEN) {
  out({ status: 'NOT_CONNECTED', reason: 'ROUTE_READY_GSC_REFRESH_TOKEN missing from .env', fix: 'node projects/briefs/zero-touch-business/scripts/rr-mint-gsc-token.mjs' })
  process.exit(0)
}
if (!env.ROUTE_READY_ADS_CLIENT_ID || !env.ROUTE_READY_ADS_CLIENT_SECRET) {
  out({ status: 'ERROR', reason: 'ROUTE_READY_ADS_CLIENT_ID / SECRET missing (shared OAuth client)' })
  process.exit(1)
}

const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.ROUTE_READY_ADS_CLIENT_ID, client_secret: env.ROUTE_READY_ADS_CLIENT_SECRET,
    refresh_token: env.ROUTE_READY_GSC_REFRESH_TOKEN, grant_type: 'refresh_token',
  }),
})).json()
if (!tok.access_token) {
  out({ status: 'ERROR', reason: 'AUTH_FAILED', detail: tok.error_description || tok.error, fix: 're-run rr-mint-gsc-token.mjs' })
  process.exit(1)
}
const H = { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' }
const BASE = 'https://searchconsole.googleapis.com/webmasters/v3'

// Google's own error bodies carry the "enable this API" link — surface it rather than swallow it.
const explain = (j) => {
  const e = j?.error
  if (!e) return 'unknown error'
  const link = (e.details || []).flatMap(d => (d.links || []).map(l => l.url))[0]
  return [e.status || e.code, e.message, link ? `enable: ${link}` : ''].filter(Boolean).join(' — ')
}

// --- resolve the property -----------------------------------------------------------
// ROUTE_READY_GSC_SITE_URL may be a URL-prefix property ("https://routereadykits.com/")
// or a domain property ("sc-domain:routereadykits.com"). Verify against the real list
// rather than trusting the env string — a silent property mismatch reads as "no traffic".
const siteListRes = await fetch(`${BASE}/sites`, { headers: H })
const siteListJson = await siteListRes.json()
if (!siteListRes.ok) {
  out({ status: 'ERROR', reason: 'SITE_LIST_FAILED', detail: explain(siteListJson) })
  process.exit(1)
}
const available = (siteListJson.siteEntry || []).map(s => ({ siteUrl: s.siteUrl, permission: s.permissionLevel }))
if (!available.length) {
  out({ status: 'NO_PROPERTIES', reason: 'This Google account has no Search Console properties. Verify routereadykits.com in Search Console first.', available })
  process.exit(0)
}

const wanted = env.ROUTE_READY_GSC_SITE_URL || ''
const norm = (s) => s.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
let site = available.find(s => s.siteUrl === wanted)?.siteUrl
  || available.find(s => norm(s.siteUrl) === norm(wanted))?.siteUrl
  || available.find(s => norm(s.siteUrl).includes('routereadykits'))?.siteUrl
if (!site) {
  out({ status: 'PROPERTY_NOT_FOUND', wanted, available, fix: 'set ROUTE_READY_GSC_SITE_URL to one of the siteUrl values above' })
  process.exit(0)
}
const propertyMismatch = wanted && site !== wanted

// --- date windows -------------------------------------------------------------------
// GSC finalizes data on a ~2-3 day lag. Ending "yesterday" reports a fake decline every
// run, so end the window 3 days back and compare against the equal-length prior period.
const d = (offsetDays) => new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10)
const LAG = 3
const curEnd = d(LAG), curStart = d(LAG + WINDOW - 1)
const prevEnd = d(LAG + WINDOW), prevStart = d(LAG + WINDOW * 2 - 1)

const query = async (body) => {
  const r = await fetch(`${BASE}/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: 'POST', headers: H, body: JSON.stringify({ type: 'web', ...body }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(explain(j))
  return j.rows || []
}

const totalsOf = (rows) => {
  const r = rows[0]
  if (!r) return { clicks: 0, impressions: 0, ctr: 0, position: null }
  return {
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: Number(((r.ctr || 0) * 100).toFixed(2)),
    position: r.position ? Number(r.position.toFixed(1)) : null,
  }
}

let current, previous, queries, pages, countries
try {
  current = totalsOf(await query({ startDate: curStart, endDate: curEnd, dimensions: [] }))
  previous = totalsOf(await query({ startDate: prevStart, endDate: prevEnd, dimensions: [] }))
  queries = await query({ startDate: curStart, endDate: curEnd, dimensions: ['query'], rowLimit: 25 })
  pages = await query({ startDate: curStart, endDate: curEnd, dimensions: ['page'], rowLimit: 25 })
  countries = await query({ startDate: curStart, endDate: curEnd, dimensions: ['country'], rowLimit: 5 })
} catch (e) {
  out({ status: 'ERROR', reason: 'SEARCH_ANALYTICS_FAILED', detail: e.message, site })
  process.exit(1)
}

// --- sitemap / indexing coverage ----------------------------------------------------
let sitemaps = []
try {
  const smRes = await fetch(`${BASE}/sites/${encodeURIComponent(site)}/sitemaps`, { headers: H })
  const smJson = await smRes.json()
  if (smRes.ok) {
    sitemaps = (smJson.sitemap || []).map(s => ({
      path: s.path,
      lastSubmitted: s.lastSubmitted || null,
      lastDownloaded: s.lastDownloaded || null,
      isPending: Boolean(s.isPending),
      warnings: Number(s.warnings || 0),
      errors: Number(s.errors || 0),
      submittedUrls: (s.contents || []).reduce((n, c) => n + Number(c.submitted || 0), 0),
      indexedUrls: (s.contents || []).reduce((n, c) => n + Number(c.indexed || 0), 0),
    }))
  }
} catch { /* sitemaps are supplementary — never fail the report on them */ }

const delta = (a, b) => (b === 0 ? (a === 0 ? 0 : null) : Number((((a - b) / b) * 100).toFixed(1)))

const report = {
  status: 'OK',
  checked_at: new Date().toISOString(),
  site,
  ...(propertyMismatch ? { warning: `ROUTE_READY_GSC_SITE_URL is "${wanted}" but the live property is "${site}" — using the live one` } : {}),
  window: { days: WINDOW, current: [curStart, curEnd], previous: [prevStart, prevEnd], note: `ends ${LAG}d back — GSC finalizes data on a 2-3 day lag` },
  totals: {
    current, previous,
    change: {
      clicks: delta(current.clicks, previous.clicks),
      impressions: delta(current.impressions, previous.impressions),
    },
  },
  topQueries: queries.map(r => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: Number(((r.ctr || 0) * 100).toFixed(2)), position: Number((r.position || 0).toFixed(1)) })),
  topPages: pages.map(r => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: Number(((r.ctr || 0) * 100).toFixed(2)), position: Number((r.position || 0).toFixed(1)) })),
  topCountries: countries.map(r => ({ country: r.keys[0], clicks: r.clicks, impressions: r.impressions })),
  sitemaps,
  interpretation: (() => {
    if (current.impressions === 0) return 'ZERO_IMPRESSIONS — the site is not surfacing in Google search at all for this window. Either not indexed yet, or indexed with no query surface. Check sitemap coverage below and the age of the property.'
    if (current.clicks === 0) return `INDEXED_NO_CLICKS — ${current.impressions} impressions but 0 clicks (avg position ${current.position}). Google is showing the pages; nobody is picking them. That is a title/snippet or a ranking-depth problem, not an indexing problem.`
    return `LIVE — ${current.clicks} clicks from ${current.impressions} impressions (CTR ${current.ctr}%, avg position ${current.position}).`
  })(),
}

if (JSON_ONLY) { out(report); process.exit(0) }

// Human-readable summary, then the JSON for the digest job to quote.
const L = []
L.push(`# Route Ready — Organic Search (GSC)`)
L.push(`property: ${site}`)
if (propertyMismatch) L.push(`WARNING: ${report.warning}`)
L.push(`window: ${curStart} -> ${curEnd} (${WINDOW}d, ends ${LAG}d back for GSC lag)`)
L.push('')
L.push(`clicks ${current.clicks} (prev ${previous.clicks}) | impressions ${current.impressions} (prev ${previous.impressions}) | CTR ${current.ctr}% | avg position ${current.position ?? 'n/a'}`)
L.push('')
L.push(report.interpretation)
if (report.topQueries.length) {
  L.push('')
  L.push('Top queries:')
  for (const q of report.topQueries.slice(0, 10)) L.push(`  ${String(q.impressions).padStart(5)} impr  ${String(q.clicks).padStart(3)} clk  pos ${String(q.position).padStart(5)}  ${q.query}`)
} else {
  L.push('')
  L.push('Top queries: none — no query surfaced an impression in this window.')
}
if (report.topPages.length) {
  L.push('')
  L.push('Top pages:')
  for (const p of report.topPages.slice(0, 10)) L.push(`  ${String(p.impressions).padStart(5)} impr  ${String(p.clicks).padStart(3)} clk  pos ${String(p.position).padStart(5)}  ${p.page}`)
}
if (sitemaps.length) {
  L.push('')
  L.push('Sitemaps:')
  for (const s of sitemaps) L.push(`  ${s.path} — submitted ${s.submittedUrls}, indexed ${s.indexedUrls}, errors ${s.errors}, warnings ${s.warnings}, lastDownloaded ${s.lastDownloaded || 'never'}`)
} else {
  L.push('')
  L.push('Sitemaps: none submitted — Google has no sitemap for this property.')
}
console.log(L.join('\n'))
console.log('\n--- JSON ---')
out(report)
