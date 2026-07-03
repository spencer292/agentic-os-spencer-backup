// Pre-flip URL coverage check — HEAD every unique URL in the corpus,
// flag any 404. Built 2026-04-30 for the Friday flip.
import { readFileSync, writeFileSync } from 'fs'

const STAGING = 'https://project-pf8c6.vercel.app'
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1)'
const CORPUS_PATH = 'keyword-corpus-raw.json'

const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf-8'))

// Aggregate per-URL stats so we can prioritize fixes by ranking impact.
// Corpus has ~457 contaminated entries from a plumbing-competitor SpyFu export
// (keywords like "utility locator puyallup", "url" field containing rank
// positions like "1", "12", ">100", "NA"). Strict filter: only got-moles.com URLs.
const byUrl = new Map()
let skippedNonGotMoles = 0
for (const r of corpus) {
  const raw = String(r.url || '')
  if (!raw.startsWith('https://got-moles.com')) {
    if (raw) skippedNonGotMoles++
    continue
  }
  const u = raw.replace('https://got-moles.com', '').replace(/\/$/, '') || '/'
  if (!byUrl.has(u)) byUrl.set(u, { ranked: 0, top3: 0, top1: 0, samples: [] })
  const e = byUrl.get(u)
  if (r.cur && r.cur <= 100) e.ranked++
  if (r.cur && r.cur <= 3) e.top3++
  if (r.cur === 1) e.top1++
  if (r.cur && r.cur <= 10 && e.samples.length < 3) e.samples.push(r.kw)
}
console.log(`Skipped ${skippedNonGotMoles} non-got-moles entries (corpus contamination — known issue).`)

const urls = [...byUrl.keys()]
console.log(`Probing ${urls.length} unique URLs against ${STAGING} ...`)

// Concurrent probes (8 at a time) to keep it fast
async function probe(path) {
  try {
    // Try with trailing slash variant if no trailing slash
    const r = await fetch(STAGING + path, {
      method: 'GET', // GET because some routes only respond properly to GET
      headers: { 'user-agent': UA },
      redirect: 'manual', // we want to see the redirect itself
    })
    return { status: r.status, location: r.headers.get('location') || '' }
  } catch (e) {
    return { status: 'ERR', error: e.message }
  }
}

async function probeWithFollow(path) {
  try {
    const r = await fetch(STAGING + path, {
      headers: { 'user-agent': UA },
      redirect: 'follow',
    })
    const finalUrl = r.url.replace(STAGING, '')
    return { finalStatus: r.status, finalUrl }
  } catch (e) {
    return { finalStatus: 'ERR', error: e.message }
  }
}

const results = []
const concurrency = 8
let idx = 0

async function worker() {
  while (idx < urls.length) {
    const i = idx++
    const url = urls[i]
    const info = byUrl.get(url)
    const initial = await probe(url)
    let finalStatus = initial.status
    let finalUrl = url
    if (initial.status >= 300 && initial.status < 400) {
      const followed = await probeWithFollow(url)
      finalStatus = followed.finalStatus
      finalUrl = followed.finalUrl
    }
    results.push({
      url,
      initial: initial.status,
      finalStatus,
      finalUrl,
      ranked: info.ranked,
      top3: info.top3,
      top1: info.top1,
      sample: info.samples[0] || '',
    })
    if (i % 25 === 0) process.stdout.write(`  ${i}/${urls.length}\r`)
  }
}

await Promise.all(Array.from({ length: concurrency }, worker))
console.log(`\nDone — ${results.length} probed.`)

// Sort by ranking impact (top3 desc, ranked desc) for the report
results.sort((a, b) => b.top3 - a.top3 || b.ranked - a.ranked)

const today = new Date().toISOString().slice(0, 10)
writeFileSync(`pre-flip-coverage_${today}.json`, JSON.stringify(results, null, 2))

// Surface anomalies
const broken = results.filter(r => r.finalStatus === 404 || r.finalStatus === 'ERR')
const redirects = results.filter(r => r.initial >= 300 && r.initial < 400)
const ok = results.filter(r => r.finalStatus === 200)

console.log(`\n=== Summary ===`)
console.log(`  200 OK:        ${ok.length}`)
console.log(`  301/302/308:   ${redirects.length} (followed to ${redirects.filter(r => r.finalStatus === 200).length} OK)`)
console.log(`  404 / ERR:     ${broken.length}`)

if (broken.length) {
  console.log(`\n=== BROKEN URLS (sorted by ranking impact) ===`)
  for (const r of broken) {
    console.log(`  ${r.finalStatus}  ${r.url}  (${r.top3} top3, ${r.ranked} ranked) — sample: "${r.sample}"`)
  }
} else {
  console.log(`\nAll URLs resolve. No 404s.`)
}

// Also surface redirects that ended in non-200 (e.g. redirect chain ending in 404)
const redirectToBroken = results.filter(r => r.initial >= 300 && r.initial < 400 && r.finalStatus !== 200)
if (redirectToBroken.length) {
  console.log(`\n=== REDIRECTS ENDING NON-200 ===`)
  for (const r of redirectToBroken) {
    console.log(`  ${r.initial} → ${r.finalStatus}  ${r.url} → ${r.finalUrl}`)
  }
}

console.log(`\nFull output: pre-flip-coverage_${today}.json`)
