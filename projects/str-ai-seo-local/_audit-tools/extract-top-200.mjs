// Extract top 200 queries and top 200 pages from the GSC export.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')
const fs = require('node:fs')

const FILE = 'C:/Users/roy.castleman/Downloads/got-moles.com-Performance-on-Search-2026-05-05.xlsx'
const wb = XLSX.readFile(FILE)

const queries = XLSX.utils.sheet_to_json(wb.Sheets['Queries'], { defval: null })
const pages = XLSX.utils.sheet_to_json(wb.Sheets['Pages'], { defval: null })

queries.sort((a, b) => (b.Impressions || 0) - (a.Impressions || 0))
pages.sort((a, b) => (b.Impressions || 0) - (a.Impressions || 0))

const out = {
  queries_top200_by_impressions: queries.slice(0, 200).map(q => ({
    q: q['Top queries'],
    clicks: q.Clicks,
    impressions: q.Impressions,
    ctr: q.CTR,
    position: q.Position,
  })),
  pages_top200_by_impressions: pages.slice(0, 200).map(p => ({
    url: p['Top pages'],
    clicks: p.Clicks,
    impressions: p.Impressions,
    ctr: p.CTR,
    position: p.Position,
  })),
  queries_top50_by_clicks: [...queries].sort((a, b) => (b.Clicks || 0) - (a.Clicks || 0)).slice(0, 50).map(q => ({
    q: q['Top queries'],
    clicks: q.Clicks,
    impressions: q.Impressions,
    position: q.Position,
  })),
  pages_top50_by_clicks: [...pages].sort((a, b) => (b.Clicks || 0) - (a.Clicks || 0)).slice(0, 50).map(p => ({
    url: p['Top pages'],
    clicks: p.Clicks,
    impressions: p.Impressions,
    position: p.Position,
  })),
}

const outPath = 'projects/str-ai-seo-local/_audit-tools/gsc-top-2026-05-05.json'
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(`wrote ${outPath}`)
console.log(`Total queries: ${queries.length}, Total pages: ${pages.length}`)
console.log(`Top 5 queries by impressions:`)
out.queries_top200_by_impressions.slice(0, 5).forEach(q => console.log(`  ${q.q} — imp ${q.impressions} clicks ${q.clicks} pos ${q.position}`))
console.log(`Top 5 pages by impressions:`)
out.pages_top200_by_impressions.slice(0, 5).forEach(p => console.log(`  ${p.url} — imp ${p.impressions} clicks ${p.clicks} pos ${p.position}`))
