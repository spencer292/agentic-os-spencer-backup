#!/usr/bin/env node
/**
 * Phase 0 hygiene probe — internal-linking-recovery.
 * Read-only. Follows each candidate URL's redirect chain manually (no auto-follow),
 * reports status code + Location per hop + hop count + final status, and pulls the
 * <link rel="canonical"> from any final 200 HTML so we can spot trailing-slash /
 * duplicate-content canonical issues. Does NOT modify anything.
 */

const BASE = 'https://got-moles.com'
const MAX_HOPS = 6

// Candidate URLs from 2026-05-24_internal-linking-architecture.md → Phase 0
const candidates = [
  // --- trailing-slash duplicate suspects (top organic info pages) ---
  '/do-moles-bite',
  '/do-moles-bite/',
  '/what-do-mole-holes-look-like',
  '/what-do-mole-holes-look-like/',
  // --- other top organic info pages: confirm 200 + self-canonical ---
  '/how-deep-do-moles-dig/',
  '/how-many-eyes-do-moles-have/',
  '/voles-vs-moles-whats-the-difference/',
  // --- legacy core/page URLs still pulling clicks ---
  '/our-process/',
  '/about-us/',
  '/what-species-of-moles-live-in-washington-state/',
  // --- legacy city / verb-city URLs ---
  '/des-moines/',
  '/bothell/',
  '/lake-stevens/',
  '/olympia-mole-exterminator/',
  '/mole-trapping-olympia/',
  '/mole-control-edgewood-2/',
  // --- money pages: confirm 200 (equity sinks) ---
  '/services/total-mole-control-program/',
  '/services/one-time-mole-removal/',
  '/services/commercial-mole-control/',
  // --- cornerstone ---
  '/how-to-get-rid-of-moles-in-your-yard/',
]

async function probe(path) {
  const chain = []
  let url = BASE + path
  for (let i = 0; i < MAX_HOPS; i++) {
    let res
    try {
      res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'gm-phase0-probe/1.0' } })
    } catch (e) {
      chain.push({ url, status: 'ERR', error: e.message })
      break
    }
    const status = res.status
    const loc = res.headers.get('location')
    chain.push({ url, status, loc })
    if (status >= 300 && status < 400 && loc) {
      url = loc.startsWith('http') ? loc : BASE + loc
      continue
    }
    // terminal — grab canonical if HTML 200
    if (status === 200) {
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('text/html')) {
        const html = await res.text()
        const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)
        let canon = null
        if (m) {
          const h = m[0].match(/href=["']([^"']+)["']/i)
          canon = h ? h[1] : null
        }
        const robots = (html.match(/<meta[^>]+name=["']robots["'][^>]*>/i) || [null])[0]
        chain[chain.length - 1].canonical = canon
        chain[chain.length - 1].robots = robots
      }
    }
    break
  }
  return chain
}

console.log(`Phase 0 redirect/canonical probe — ${BASE} — ${new Date().toISOString()}\n`)
for (const path of candidates) {
  const chain = await probe(path)
  const hops = chain.filter((c) => typeof c.status === 'number' && c.status >= 300 && c.status < 400).length
  const last = chain[chain.length - 1]
  const trail = chain
    .map((c) => `${c.status}${c.loc ? ' → ' + c.loc : ''}`)
    .join('  ')
  console.log(`${path}`)
  console.log(`  hops=${hops} final=${last.status}  [${trail}]`)
  if (last.canonical !== undefined) {
    const selfCanon = last.canonical === last.url || last.canonical === last.url.replace(/\/$/, '') + '/'
    console.log(`  canonical=${last.canonical}  ${selfCanon ? '(self)' : '(⚠ points elsewhere)'}`)
  }
  if (last.robots) console.log(`  robots=${last.robots.replace(/\s+/g, ' ')}`)
  console.log()
}
