// Content comparison audit. For each rank-drop URL, compare:
//  - Current live page (production)
//  - Wayback Machine snapshot from before launch (target ~mid-Apr 2026)
// Surface deltas in: word count, H2/H3 headings, FAQ count, schema blocks,
// internal links, structured signals.
import fs from 'node:fs'

const TARGETS = [
  '/how-to-get-rid-of-ground-moles-with-vinegar/',
  '/what-do-mole-holes-look-like/',
  '/what-eats-moles/',
  '/do-moles-live-in-groups/',
  '/are-moles-nocturnal/',
  '/',
]

const WAYBACK_TARGET_TS = '20260415' // mid-April pre-deploy snapshot

async function fetchText(url, opts = {}) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GotMolesAudit/1.0)',
        ...(opts.headers || {}),
      },
      redirect: 'follow',
    })
    if (!r.ok) return { ok: false, status: r.status, body: '' }
    const body = await r.text()
    return { ok: true, status: r.status, body, finalUrl: r.url }
  } catch (e) {
    return { ok: false, error: e.message, body: '' }
  }
}

async function getWaybackSnapshot(url, targetTs) {
  // Wayback Availability API
  const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=${targetTs}`
  const res = await fetch(apiUrl)
  const j = await res.json()
  const snap = j?.archived_snapshots?.closest
  if (!snap || !snap.url) return null
  return { ts: snap.timestamp, url: snap.url }
}

function stripHtml(html) {
  // Strip script + style first
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  // Strip tags
  const text = noScript.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, '')
  // Collapse whitespace
  return text.replace(/\s+/g, ' ').trim()
}

function countTags(html, tag) {
  const rx = new RegExp(`<${tag}[\\s>]`, 'gi')
  return (html.match(rx) || []).length
}

function extractHeadings(html) {
  const out = { h1: [], h2: [], h3: [] }
  for (const tag of ['h1', 'h2', 'h3']) {
    const rx = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
    const matches = [...html.matchAll(rx)]
    for (const m of matches) {
      const text = stripHtml(m[1]).slice(0, 120)
      if (text) out[tag].push(text)
    }
  }
  return out
}

function countSchemaBlocks(html) {
  const rx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const blocks = [...html.matchAll(rx)]
  const types = []
  for (const [, body] of blocks) {
    try {
      const j = JSON.parse(body.trim())
      const collect = (n) => {
        if (!n) return
        if (Array.isArray(n)) return n.forEach(collect)
        if (typeof n === 'object') {
          if (n['@type']) types.push(Array.isArray(n['@type']) ? n['@type'].join('/') : n['@type'])
          if (n['@graph']) collect(n['@graph'])
        }
      }
      collect(j)
    } catch {
      types.push('(parse error)')
    }
  }
  return { count: blocks.length, types }
}

function countInternalLinks(html) {
  const rx = /<a[^>]+href=["']([^"']+)["']/gi
  const matches = [...html.matchAll(rx)]
  const internal = []
  const external = []
  for (const m of matches) {
    const href = m[1]
    if (href.startsWith('/') || href.includes('got-moles.com')) {
      internal.push(href)
    } else if (href.startsWith('http')) {
      external.push(href)
    }
  }
  return { internalCount: internal.length, externalCount: external.length, internal: [...new Set(internal)] }
}

function countFaqs(html) {
  // Count <details> elements (accordion FAQ pattern) + FAQPage schema entries
  const detailsCount = (html.match(/<details[\s>]/gi) || []).length
  const faqMatches = html.match(/"@type"\s*:\s*"Question"/gi) || []
  return { detailsCount, faqSchemaQuestions: faqMatches.length }
}

function analyse(html, label) {
  const text = stripHtml(html)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const headings = extractHeadings(html)
  const schema = countSchemaBlocks(html)
  const links = countInternalLinks(html)
  const faqs = countFaqs(html)
  return {
    label,
    bytes: html.length,
    wordCount,
    h1Count: headings.h1.length,
    h2Count: headings.h2.length,
    h3Count: headings.h3.length,
    h2List: headings.h2,
    h3List: headings.h3,
    schemaBlockCount: schema.count,
    schemaTypes: schema.types,
    internalLinks: links.internalCount,
    externalLinks: links.externalCount,
    faqDetailsCount: faqs.detailsCount,
    faqSchemaCount: faqs.faqSchemaQuestions,
  }
}

const out = []

for (const path of TARGETS) {
  const liveUrl = `https://got-moles.com${path}`
  console.log(`\n=== ${path} ===`)

  // Live current
  console.log(`  Fetching live...`)
  const live = await fetchText(liveUrl)
  if (!live.ok) {
    console.log(`  Live fetch failed: ${live.status} ${live.error || ''}`)
    out.push({ path, error: 'live-fetch-failed' })
    continue
  }
  const liveAnalysis = analyse(live.body, 'live')

  // Wayback
  console.log(`  Looking up Wayback snapshot...`)
  const snap = await getWaybackSnapshot(liveUrl, WAYBACK_TARGET_TS)
  if (!snap) {
    console.log(`  No Wayback snapshot found.`)
    out.push({ path, live: liveAnalysis, wayback: null })
    continue
  }
  console.log(`  Wayback: ${snap.ts}  ${snap.url}`)
  // Fetch the raw archived html — append id_ to get unmodified version (no Wayback toolbar)
  const rawArchiveUrl = snap.url.replace(/\/web\/(\d+)\//, '/web/$1id_/')
  const wb = await fetchText(rawArchiveUrl)
  if (!wb.ok) {
    console.log(`  Wayback fetch failed: ${wb.status}`)
    out.push({ path, live: liveAnalysis, wayback: null, error: 'wayback-fetch-failed' })
    continue
  }
  const wbAnalysis = analyse(wb.body, 'wayback')

  out.push({ path, snapTs: snap.ts, live: liveAnalysis, wayback: wbAnalysis })

  console.log(`    LIVE words: ${liveAnalysis.wordCount}  H2: ${liveAnalysis.h2Count}  H3: ${liveAnalysis.h3Count}  links: ${liveAnalysis.internalLinks}  FAQ-details: ${liveAnalysis.faqDetailsCount}  schema: ${liveAnalysis.schemaBlockCount} (${liveAnalysis.schemaTypes.join(', ')})`)
  console.log(`    WB   words: ${wbAnalysis.wordCount}  H2: ${wbAnalysis.h2Count}  H3: ${wbAnalysis.h3Count}  links: ${wbAnalysis.internalLinks}  FAQ-details: ${wbAnalysis.faqDetailsCount}  schema: ${wbAnalysis.schemaBlockCount} (${wbAnalysis.schemaTypes.join(', ')})`)
  console.log(`    Δ    words: ${liveAnalysis.wordCount - wbAnalysis.wordCount}  H2: ${liveAnalysis.h2Count - wbAnalysis.h2Count}  H3: ${liveAnalysis.h3Count - wbAnalysis.h3Count}  internal links: ${liveAnalysis.internalLinks - wbAnalysis.internalLinks}`)
}

// Build markdown report
let md = `---\nproject: str-ai-seo-local\ndate: 2026-05-05\ntype: content-diff\n---\n\n`
md += `# Content Diff — Rank-Drop URLs\n\n`
md += `Live got-moles.com vs Wayback Machine snapshot (~${WAYBACK_TARGET_TS.slice(0,4)}-${WAYBACK_TARGET_TS.slice(4,6)}-${WAYBACK_TARGET_TS.slice(6,8)}).\n\n`
md += `For each URL where rank dropped without a slug change, identify what content/structure changed in the migration.\n\n`
md += `---\n\n`

for (const r of out) {
  md += `## \`${r.path}\`\n\n`
  if (r.error || !r.wayback) {
    md += `_${r.error || 'no Wayback snapshot found'}_\n\n`
    continue
  }
  const live = r.live, wb = r.wayback
  md += `Wayback snapshot: ${r.snapTs}\n\n`
  md += `| Metric | Wayback (old) | Live (new) | Δ |\n|---|---:|---:|---:|\n`
  md += `| Word count | ${wb.wordCount.toLocaleString()} | ${live.wordCount.toLocaleString()} | **${live.wordCount - wb.wordCount > 0 ? '+' : ''}${(live.wordCount - wb.wordCount).toLocaleString()}** |\n`
  md += `| H1 count | ${wb.h1Count} | ${live.h1Count} | ${live.h1Count - wb.h1Count} |\n`
  md += `| H2 count | ${wb.h2Count} | ${live.h2Count} | ${live.h2Count - wb.h2Count} |\n`
  md += `| H3 count | ${wb.h3Count} | ${live.h3Count} | ${live.h3Count - wb.h3Count} |\n`
  md += `| Internal links | ${wb.internalLinks} | ${live.internalLinks} | **${live.internalLinks - wb.internalLinks > 0 ? '+' : ''}${live.internalLinks - wb.internalLinks}** |\n`
  md += `| External links | ${wb.externalLinks} | ${live.externalLinks} | ${live.externalLinks - wb.externalLinks > 0 ? '+' : ''}${live.externalLinks - wb.externalLinks} |\n`
  md += `| FAQ count (\`<details>\`) | ${wb.faqDetailsCount} | ${live.faqDetailsCount} | ${live.faqDetailsCount - wb.faqDetailsCount} |\n`
  md += `| FAQ schema Questions | ${wb.faqSchemaCount} | ${live.faqSchemaCount} | ${live.faqSchemaCount - wb.faqSchemaCount} |\n`
  md += `| Schema blocks | ${wb.schemaBlockCount} | ${live.schemaBlockCount} | ${live.schemaBlockCount - wb.schemaBlockCount} |\n`
  md += `| Bytes | ${wb.bytes.toLocaleString()} | ${live.bytes.toLocaleString()} | ${(live.bytes - wb.bytes).toLocaleString()} |\n\n`
  md += `**Schema types — Wayback:** ${wb.schemaTypes.join(', ') || '(none)'}\n\n`
  md += `**Schema types — Live:** ${live.schemaTypes.join(', ') || '(none)'}\n\n`
  md += `### H2s — Wayback (${wb.h2Count})\n\n`
  for (const h of wb.h2List) md += `- ${h}\n`
  md += `\n### H2s — Live (${live.h2Count})\n\n`
  for (const h of live.h2List) md += `- ${h}\n`
  md += `\n---\n\n`
}

const outPath = '../2026-05-05_content-diff.md'
fs.writeFileSync(outPath, md)
fs.writeFileSync('../2026-05-05_content-diff.json', JSON.stringify(out, null, 2))
console.log(`\n\nWritten: ${outPath}`)
