// Cross-reference the full GSC 90-day export against current live URL status.
// Distinguishes:
//   - LIVE — same URL serves 200 (incl. trailing-slash normalisation)
//   - REDIRECTED — actual slug change (not just slash strip)
//   - 404 — broken
// Also pulls daily Chart data to identify the launch-week drop magnitude.
import { createRequire } from 'node:module'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const FILE = 'C:/Users/roy.castleman/Downloads/got-moles.com-Performance-on-Search-2026-05-05.xlsx'
const wb = XLSX.readFile(FILE)
const queries = XLSX.utils.sheet_to_json(wb.Sheets['Queries'])
const pages = XLSX.utils.sheet_to_json(wb.Sheets['Pages'])
const chart = XLSX.utils.sheet_to_json(wb.Sheets['Chart'])

console.log(`Queries: ${queries.length}  Pages: ${pages.length}  Chart days: ${chart.length}`)

// ─── Same-URL detection: strip trailing slash + lowercase host ─────────
function normalise(u) {
  if (!u) return ''
  return u
    .replace(/^https?:\/\/(www\.)?got-moles\.com/i, 'https://got-moles.com')
    .replace(/\/$/, '')
}

async function probe(url) {
  try {
    const r = await fetch(url, { redirect: 'manual' })
    if (r.status >= 300 && r.status < 400) {
      let cur = r.headers.get('location')
      let hops = 1
      while (cur && hops < 6) {
        const abs = cur.startsWith('http') ? cur : `https://got-moles.com${cur}`
        const rr = await fetch(abs, { redirect: 'manual' })
        if (rr.status >= 300 && rr.status < 400) {
          cur = rr.headers.get('location')
          hops++
        } else {
          return { initial: r.status, finalStatus: rr.status, finalUrl: abs, hops }
        }
      }
      return { initial: r.status, finalStatus: 'loop', hops }
    }
    return { initial: r.status, finalStatus: r.status, finalUrl: url, hops: 0 }
  } catch (e) {
    return { initial: 'ERR', finalStatus: 'ERR', error: e.message }
  }
}

const topPages = pages
  .filter(p => p['Top pages'] && p.Clicks >= 1)
  .sort((a, b) => b.Clicks - a.Clicks)
  .slice(0, 100)

console.log(`\nProbing top ${topPages.length} pages...`)
const results = []
for (const p of topPages) {
  const url = p['Top pages']
  const probeRes = await probe(url)
  const sameSlug = normalise(url) === normalise(probeRes.finalUrl || '')
  results.push({
    url,
    clicks: p.Clicks,
    impressions: p.Impressions,
    position: p.Position,
    ctr: p.CTR,
    initial: probeRes.initial,
    finalStatus: probeRes.finalStatus,
    finalUrl: probeRes.finalUrl || '',
    hops: probeRes.hops,
    sameSlug,
  })
  process.stdout.write('.')
}
console.log('\n')

const broken404 = results.filter(r => r.finalStatus === 404)
const realRedirect = results.filter(r => r.finalStatus === 200 && !r.sameSlug && r.hops > 0)
const live = results.filter(r => r.finalStatus === 200 && r.sameSlug)
const errors = results.filter(r => r.finalStatus === 'ERR')

// ─── Chart trend analysis: pre-launch vs post-launch ──────────────────
const launchDate = new Date('2026-05-01')
const preLaunch = chart.filter(d => new Date(d.Date) < launchDate)
const postLaunch = chart.filter(d => new Date(d.Date) >= launchDate)
const preTotalClicks = preLaunch.reduce((s, d) => s + (d.Clicks || 0), 0)
const preTotalImp = preLaunch.reduce((s, d) => s + (d.Impressions || 0), 0)
const postTotalClicks = postLaunch.reduce((s, d) => s + (d.Clicks || 0), 0)
const postTotalImp = postLaunch.reduce((s, d) => s + (d.Impressions || 0), 0)
const preDailyClicks = preTotalClicks / preLaunch.length
const postDailyClicks = postLaunch.length > 0 ? postTotalClicks / postLaunch.length : 0
const preDailyImp = preTotalImp / preLaunch.length
const postDailyImp = postLaunch.length > 0 ? postTotalImp / postLaunch.length : 0
const clicksDelta = postDailyClicks - preDailyClicks
const impDelta = postDailyImp - preDailyImp
const clicksPct = (clicksDelta / preDailyClicks) * 100
const impPct = (impDelta / preDailyImp) * 100

// ─── Build report ─────────────────────────────────────────────────────
let md = `---\nproject: str-ai-seo-local\ndate: 2026-05-05\ntype: gsc-drops-from-export\n---\n\n`
md += `# GSC Drops Analysis — XLSX Export\n\n`
md += `**Source:** \`got-moles.com-Performance-on-Search-2026-05-05.xlsx\` (90-day window, 2026-02-04 → 2026-05-02)\n`
md += `**Probed:** top ${topPages.length} pages by clicks\n\n`
md += `---\n\n`

md += `## Pre-launch vs Post-launch Trend (from Chart sheet)\n\n`
md += `| Window | Days | Total clicks | Daily avg | Total imp | Daily avg |\n|---|---:|---:|---:|---:|---:|\n`
md += `| Pre-launch (Feb 4 - Apr 30) | ${preLaunch.length} | ${preTotalClicks.toLocaleString()} | ${preDailyClicks.toFixed(1)} | ${preTotalImp.toLocaleString()} | ${preDailyImp.toFixed(0)} |\n`
md += `| Post-launch (May 1+) | ${postLaunch.length} | ${postTotalClicks.toLocaleString()} | ${postDailyClicks.toFixed(1)} | ${postTotalImp.toLocaleString()} | ${postDailyImp.toFixed(0)} |\n`
md += `| **Delta** | | | **${clicksDelta > 0 ? '+' : ''}${clicksDelta.toFixed(1)}** (${clicksPct > 0 ? '+' : ''}${clicksPct.toFixed(0)}%) | | **${impDelta > 0 ? '+' : ''}${impDelta.toFixed(0)}** (${impPct > 0 ? '+' : ''}${impPct.toFixed(0)}%) |\n\n`

if (postLaunch.length > 0) {
  md += `### Daily post-launch breakdown\n\n`
  md += `| Date | Clicks | Impressions | Pos |\n|---|---:|---:|---:|\n`
  for (const d of postLaunch.sort((a, b) => new Date(a.Date) - new Date(b.Date))) {
    md += `| ${d.Date} | ${d.Clicks} | ${d.Impressions?.toLocaleString()} | ${d.Position?.toFixed(1)} |\n`
  }
  md += `\n`
}

md += `## 🔴 Pages with historical clicks, NOW 404 (real equity leak)\n\n`
if (broken404.length === 0) {
  md += `_None._\n\n`
} else {
  md += `| URL | Clicks | Imp | Pos |\n|---|---:|---:|---:|\n`
  for (const r of broken404.sort((a, b) => b.clicks - a.clicks)) {
    const p = r.url.replace('https://got-moles.com', '')
    md += `| \`${p}\` | ${r.clicks} | ${r.impressions?.toLocaleString()} | ${r.position?.toFixed(1)} |\n`
  }
  md += `\n`
}

md += `## 🟡 Pages redirected to a different slug (review intent preservation)\n\n`
md += `Excludes trailing-slash normalisation (\`/foo/\` → \`/foo\` is the same URL, not a real redirect).\n\n`
if (realRedirect.length === 0) {
  md += `_None._\n\n`
} else {
  md += `| Old URL | → Final URL | Hops | Clicks | Imp | Pos |\n|---|---|---:|---:|---:|---:|\n`
  for (const r of realRedirect.sort((a, b) => b.clicks - a.clicks)) {
    const o = r.url.replace('https://got-moles.com', '')
    const n = r.finalUrl.replace('https://got-moles.com', '')
    md += `| \`${o}\` | \`${n}\` | ${r.hops} | ${r.clicks} | ${r.impressions?.toLocaleString()} | ${r.position?.toFixed(1)} |\n`
  }
  md += `\n`
}

md += `## 🟢 Pages live at original URL\n\n`
md += `${live.length} of top ${topPages.length} pages serving 200 at the same logical URL (preserve-indexed-URLs working).\n\n`

// ─── Top queries ─────────────────────────────────────────────────────
md += `## Top 50 Queries by Clicks (90-day)\n\n`
md += `| Query | Clicks | Imp | Pos | CTR |\n|---|---:|---:|---:|---:|\n`
const topQueries = queries
  .filter(q => q['Top queries'] && q.Clicks >= 1)
  .sort((a, b) => b.Clicks - a.Clicks)
  .slice(0, 50)
for (const q of topQueries) {
  md += `| ${q['Top queries']} | ${q.Clicks} | ${q.Impressions?.toLocaleString()} | ${q.Position?.toFixed(1)} | ${(q.CTR * 100).toFixed(2)}% |\n`
}
md += `\n`

const outPath = '../2026-05-05_gsc-drops-from-export.md'
fs.writeFileSync(outPath, md)
fs.writeFileSync('../2026-05-05_gsc-drops-from-export.json', JSON.stringify({
  pageResults: results,
  topQueries,
  trend: {
    preDailyClicks, postDailyClicks, clicksDelta, clicksPct,
    preDailyImp, postDailyImp, impDelta, impPct,
    preLaunchDays: preLaunch.length, postLaunchDays: postLaunch.length,
  },
  summary: {
    broken404: broken404.length,
    realRedirect: realRedirect.length,
    live: live.length,
    errors: errors.length,
  },
}, null, 2))

console.log(`Written: ${outPath}\n`)
console.log(`SUMMARY of top ${topPages.length} pages:`)
console.log(`  Live at same URL:    ${live.length}`)
console.log(`  Real redirects:      ${realRedirect.length}`)
console.log(`  NOW 404:             ${broken404.length}`)
console.log(`  Errors:              ${errors.length}`)
console.log()
console.log(`TREND (daily averages, pre vs post-launch):`)
console.log(`  Clicks:       ${preDailyClicks.toFixed(1)}  ->  ${postDailyClicks.toFixed(1)}  (${clicksPct > 0 ? '+' : ''}${clicksPct.toFixed(0)}%)`)
console.log(`  Impressions:  ${preDailyImp.toFixed(0)}  ->  ${postDailyImp.toFixed(0)}  (${impPct > 0 ? '+' : ''}${impPct.toFixed(0)}%)`)
console.log()
if (broken404.length > 0) {
  console.log('🔴 PAGES NOW 404:')
  for (const r of broken404.sort((a, b) => b.clicks - a.clicks)) {
    const p = r.url.replace('https://got-moles.com', '')
    console.log(`  ${String(r.clicks).padStart(4)} clicks  pos ${r.position?.toFixed(1)}  ${p}`)
  }
  console.log()
}
if (realRedirect.length > 0) {
  console.log('🟡 PAGES REDIRECTED to a different slug:')
  for (const r of realRedirect.sort((a, b) => b.clicks - a.clicks)) {
    const o = r.url.replace('https://got-moles.com', '')
    const n = r.finalUrl.replace('https://got-moles.com', '')
    console.log(`  ${String(r.clicks).padStart(4)} clicks  ${o.padEnd(45)}  ->  ${n}`)
  }
}
