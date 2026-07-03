#!/usr/bin/env node
/** Competitor site snapshot (read-only). Fetches sitemap + homepage + sampled pages; extracts on-page + schema + content depth. */
const BASE = process.argv[2] || 'https://www.mole-patrol.com'
const UA = 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)'

function jsonLdTypes(html) {
  const types = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) {
    try {
      const d = JSON.parse(m[1].trim())
      const arr = Array.isArray(d) ? d : (d['@graph'] || [d])
      for (const n of arr) { const t = n['@type']; if (t) types.push(Array.isArray(t) ? t.join('+') : t) }
    } catch { types.push('PARSE_ERR') }
  }
  return types
}
const attr = (html, re) => { const m = html.match(re); return m ? m[1].replace(/\s+/g, ' ').trim() : null }
function textLen(html) {
  const body = (html.split(/<body[^>]*>/i)[1] || html)
  return body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length
}

async function snap(url) {
  let res, html
  try { res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' }); html = await res.text() }
  catch (e) { return { url, status: 'ERR', error: e.message } }
  const types = jsonLdTypes(html)
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((x) => x[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean)
  const internal = new Set([...html.matchAll(/href=["'](\/[^"'#?]*)/g)].map((x) => x[1]))
  return {
    url, status: res.status,
    generator: attr(html, /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)["']/i) || '?',
    title: attr(html, /<title[^>]*>([^<]*)<\/title>/i),
    h1: attr(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, '').trim(),
    metaDesc: attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    h2count: h2s.length,
    h2s: h2s.slice(0, 12),
    schema: types.join(', ') || 'NONE',
    words: textLen(html),
    internalLinks: internal.size,
  }
}

console.log(`# Competitor snapshot — ${BASE} — ${new Date().toISOString()}\n`)

// sitemap inventory
for (const sm of ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']) {
  try {
    const r = await fetch(BASE + sm, { headers: { 'User-Agent': UA } })
    if (r.status === 200) {
      const xml = await r.text()
      const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
      console.log(`## sitemap ${sm}: ${r.status} — ${locs.length} entries`)
      console.log(locs.slice(0, 60).join('\n'))
      break
    }
  } catch {}
}

console.log(`\n## Homepage\n`)
console.log(JSON.stringify(await snap(BASE), null, 1))
