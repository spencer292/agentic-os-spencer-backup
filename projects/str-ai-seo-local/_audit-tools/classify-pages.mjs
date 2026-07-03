import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const wb = XLSX.readFile('C:/Users/roy.castleman/Downloads/got-moles.com-Performance-on-Search-2026-05-05.xlsx')
const pages = XLSX.utils.sheet_to_json(wb.Sheets['Pages'], { defval: null })

const cityish = /^\/mole-(control|trapping|removal)-[a-z]/i
const known = new Set(['/', '/about/', '/contact/', '/how-it-works/', '/reviews/', '/faq/', '/service-areas/', '/our-process/', '/privacy/', '/terms/'])

const out = { tier1Service: [], tier1Local: [], tier2: [], blog: [], cityPages: [], lp: [], other: [] }

for (const p of pages) {
  const url = p['Top pages'].replace('https://got-moles.com', '').replace('https://www.got-moles.com', '')
  const row = { url, clicks: p.Clicks, impressions: p.Impressions, position: p.Position }
  if (url.startsWith('/services/')) out.tier1Service.push(row)
  else if (cityish.test(url)) out.cityPages.push(row)
  else if (url.startsWith('/blog/')) out.blog.push(row)
  else if (url.startsWith('/lp/')) out.lp.push(row)
  else if (url.startsWith('/author/')) out.tier2.push(row)
  else if (known.has(url)) out.tier2.push(row)
  else if (/^\/[a-z][a-z0-9-]+\/?$/.test(url)) out.blog.push(row)  // legacy-root blog posts
  else out.other.push(row)
}

for (const k of Object.keys(out)) out[k].sort((a,b) => b.impressions - a.impressions)

console.log(`\n== TIER 1 SERVICE (${out.tier1Service.length}) ==`)
out.tier1Service.forEach(p => console.log(`  ${p.url} | imp=${p.impressions} clicks=${p.clicks} pos=${p.position}`))

console.log(`\n== TIER 2 CORE (${out.tier2.length}) ==`)
out.tier2.forEach(p => console.log(`  ${p.url} | imp=${p.impressions} clicks=${p.clicks} pos=${p.position}`))

console.log(`\n== LP (${out.lp.length}) ==`)
out.lp.forEach(p => console.log(`  ${p.url} | imp=${p.impressions} clicks=${p.clicks} pos=${p.position}`))

console.log(`\n== BLOG (${out.blog.length}) ==`)
out.blog.forEach(p => console.log(`  ${p.url} | imp=${p.impressions} clicks=${p.clicks} pos=${p.position}`))

console.log(`\n== CITY PAGES (${out.cityPages.length}) — top 30 ==`)
out.cityPages.slice(0, 30).forEach(p => console.log(`  ${p.url} | imp=${p.impressions} clicks=${p.clicks} pos=${p.position}`))

console.log(`\n== OTHER (${out.other.length}) ==`)
out.other.forEach(p => console.log(`  ${p.url} | imp=${p.impressions} clicks=${p.clicks} pos=${p.position}`))
