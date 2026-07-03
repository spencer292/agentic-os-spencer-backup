import { readFileSync, writeFileSync } from 'fs'
const STAGING = 'https://project-pf8c6.vercel.app'
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1)'
const corpus = JSON.parse(readFileSync('keyword-corpus-raw.json', 'utf-8'))

// Per-URL: aggregate keywords, top-3 count, sample keywords
const byUrl = new Map()
for (const r of corpus) {
  const u = String(r.url || '').replace('https://got-moles.com', '').replace(/\/$/, '') || '/'
  if (!u || u.startsWith('>') || u === 'NA' || /^\d+\.\d+$/.test(u)) continue
  if (!byUrl.has(u)) byUrl.set(u, { ranked: 0, top3: 0, top1: 0, samples: [] })
  const e = byUrl.get(u)
  if (r.cur && r.cur <= 100) e.ranked++
  if (r.cur && r.cur <= 3) e.top3++
  if (r.cur === 1) e.top1++
  if (r.cur && r.cur <= 10 && e.samples.length < 5) e.samples.push(r.kw)
}

// Sort by top3 desc, take top 40 highest-value URLs
const targets = [...byUrl.entries()]
  .sort((a, b) => b[1].top3 - a[1].top3 || b[1].ranked - a[1].ranked)
  .slice(0, 40)

async function probe(path) {
  try {
    const r = await fetch(STAGING + path, { headers: { 'user-agent': UA }, redirect: 'follow' })
    const html = await r.text()
    const finalUrl = r.url.replace(STAGING, '')
    const title = (html.match(/<title>([^<]+)<\/title>/) || [, ''])[1].trim()
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1].replace(/<[^>]+>/g, '').trim()
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    const wc = text.split(/\s+/).filter(w => w.length > 1).length
    const schemaCount = (html.match(/<script[^>]+application\/ld\+json/g) || []).length
    const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [, ''])[1]
    return { status: r.status, finalUrl, title, h1, wc, schemaCount, desc, text: text.toLowerCase() }
  } catch (e) { return { error: e.message } }
}

const rows = []
for (const [url, info] of targets) {
  const probePath = url || '/'
  const p = await probe(probePath)
  if (p.error) { rows.push({ url: probePath, status: 'ERR' }); continue }
  // Keyword presence: how many of the sample keywords appear in body?
  const present = info.samples.filter(kw => p.text.includes(kw.toLowerCase())).length
  // Title length
  const titleLen = (p.title || '').length
  // Identify potential thin-content
  const thin = p.wc < 600
  rows.push({
    old: probePath,
    final: p.finalUrl,
    status: p.status,
    titleLen,
    h1Words: (p.h1 || '').split(' ').length,
    wc: p.wc,
    schema: p.schemaCount,
    thin: thin ? 'THIN' : '',
    kwHit: `${present}/${info.samples.length}`,
    ranked: info.ranked,
    top3: info.top3,
    top1: info.top1,
    sample: info.samples[0] || '',
  })
}

console.table(rows)
writeFileSync('live-vs-corpus_2026-04-25.json', JSON.stringify(rows, null, 2))
console.log('\nSaved → live-vs-corpus_2026-04-25.json')

// Surface anomalies
console.log('\n=== Anomalies ===')
const issues = []
for (const r of rows) {
  if (r.status !== 200) issues.push(`${r.old} → status ${r.status}`)
  if (r.thin === 'THIN') issues.push(`${r.old} → thin content (${r.wc} words)`)
  if (r.titleLen > 60) issues.push(`${r.old} → title ${r.titleLen} chars (>60)`)
  if (r.titleLen < 30 && r.titleLen > 0) issues.push(`${r.old} → title only ${r.titleLen} chars`)
  if (r.kwHit && r.kwHit.startsWith('0/')) issues.push(`${r.old} → 0 of sampled keywords found in body`)
  if (r.schema < 3) issues.push(`${r.old} → only ${r.schema} schema blocks`)
}
if (!issues.length) console.log('  (none)')
else issues.forEach(i => console.log('  - ' + i))
