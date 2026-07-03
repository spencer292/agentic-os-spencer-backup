// Content diff using Wayback CDX API directly (more reliable than the
// Availability API). For each rank-drop URL, find latest snapshot before
// May 2026 and diff against current live page.
import fs from 'node:fs'

const TARGETS = [
  '/how-to-get-rid-of-ground-moles-with-vinegar/',
  '/what-do-mole-holes-look-like/',
  '/what-eats-moles/',
  '/do-moles-live-in-groups/',
  '/are-moles-nocturnal/',
  '/',
]

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

async function getLatestPreLaunchSnapshot(path) {
  const url = 'got-moles.com' + path
  const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&filter=statuscode:200&filter=mimetype:text/html&to=20260430&limit=-1`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(cdxUrl)
      const text = await r.text()
      const data = JSON.parse(text)
      if (data.length <= 1) return null
      const last = data[data.length - 1]
      return { ts: last[1], url: last[2] }
    } catch (e) {
      if (attempt === 2) return null
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  return null
}

function stripHtml(html) {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  // Remove Wayback toolbar markers
  const noWayback = noScript
    .replace(/<!-- BEGIN WAYBACK TOOLBAR INSERT[\s\S]*?END WAYBACK TOOLBAR INSERT -->/g, '')
    .replace(/__wm\.[\s\S]*?<\/script>/g, '')
  const text = noWayback.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, '')
  return text.replace(/\s+/g, ' ').trim()
}

function extractHeadings(html) {
  const out = { h1: [], h2: [], h3: [] }
  for (const tag of ['h1', 'h2', 'h3']) {
    const rx = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
    const matches = [...html.matchAll(rx)]
    for (const m of matches) {
      const text = stripHtml(m[1]).slice(0, 150)
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
      types.push('(parse-err)')
    }
  }
  return { count: blocks.length, types }
}

function countInternalLinks(html) {
  const rx = /<a[^>]+href=["']([^"']+)["']/gi
  const matches = [...html.matchAll(rx)]
  const internal = []
  for (const m of matches) {
    const href = m[1]
    // Strip Wayback prefix if present
    const cleaned = href.replace(/^https?:\/\/web\.archive\.org\/web\/\d+\//, '/')
    if (cleaned.startsWith('/') || cleaned.includes('got-moles.com')) {
      internal.push(cleaned)
    }
  }
  return { count: internal.length, links: [...new Set(internal)] }
}

function countFaqs(html) {
  const detailsCount = (html.match(/<details[\s>]/gi) || []).length
  const faqMatches = html.match(/"@type"\s*:\s*"Question"/gi) || []
  return { detailsCount, faqSchemaQuestions: faqMatches.length }
}

function analyse(html) {
  const text = stripHtml(html)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const headings = extractHeadings(html)
  const schema = countSchemaBlocks(html)
  const links = countInternalLinks(html)
  const faqs = countFaqs(html)
  return {
    bytes: html.length,
    wordCount,
    h1: headings.h1,
    h2: headings.h2,
    h3: headings.h3,
    schemaBlockCount: schema.count,
    schemaTypes: schema.types,
    internalLinks: links.count,
    internalLinkSample: links.links.slice(0, 12),
    faqDetailsCount: faqs.detailsCount,
    faqSchemaCount: faqs.faqSchemaQuestions,
  }
}

const out = []

for (const path of TARGETS) {
  const liveUrl = `https://got-moles.com${path}`
  console.log(`\n=== ${path} ===`)

  const live = await fetchText(liveUrl)
  if (!live.ok) {
    console.log(`  Live fetch failed`)
    out.push({ path, error: 'live-fetch-failed' })
    continue
  }
  const liveAnalysis = analyse(live.body)

  console.log(`  Looking up Wayback snapshot via CDX...`)
  const snap = await getLatestPreLaunchSnapshot(path)
  if (!snap) {
    console.log(`  No snapshot found.`)
    out.push({ path, live: liveAnalysis, wayback: null })
    continue
  }
  console.log(`  Snapshot: ${snap.ts}`)

  const archiveUrl = `https://web.archive.org/web/${snap.ts}id_/${snap.url}`
  const wb = await fetchText(archiveUrl)
  if (!wb.ok) {
    console.log(`  Wayback fetch failed`)
    out.push({ path, live: liveAnalysis, wayback: null })
    continue
  }
  const wbAnalysis = analyse(wb.body)

  out.push({ path, snapTs: snap.ts, live: liveAnalysis, wayback: wbAnalysis })

  console.log(`    LIVE: ${liveAnalysis.wordCount} words, H2=${liveAnalysis.h2.length}, FAQ=${liveAnalysis.faqDetailsCount}, schema=${liveAnalysis.schemaBlockCount}`)
  console.log(`    WB:   ${wbAnalysis.wordCount} words, H2=${wbAnalysis.h2.length}, FAQ=${wbAnalysis.faqDetailsCount}, schema=${wbAnalysis.schemaBlockCount}`)
  console.log(`    Δ:    ${liveAnalysis.wordCount - wbAnalysis.wordCount > 0 ? '+' : ''}${liveAnalysis.wordCount - wbAnalysis.wordCount} words, ${liveAnalysis.h2.length - wbAnalysis.h2.length > 0 ? '+' : ''}${liveAnalysis.h2.length - wbAnalysis.h2.length} H2, ${liveAnalysis.faqDetailsCount - wbAnalysis.faqDetailsCount > 0 ? '+' : ''}${liveAnalysis.faqDetailsCount - wbAnalysis.faqDetailsCount} FAQ`)
}

// Markdown report
let md = `---\nproject: str-ai-seo-local\ndate: 2026-05-05\ntype: content-diff\n---\n\n`
md += `# Content Diff — Rank-Drop URLs\n\n`
md += `Wayback latest pre-launch snapshot vs current live page.\n\n`
md += `For each URL where rank dropped without a slug change, identify what content/structure changed during the WordPress → Next.js migration.\n\n`
md += `---\n\n`

for (const r of out) {
  md += `## \`${r.path}\`\n\n`
  if (!r.wayback) {
    md += `_No Wayback snapshot available_\n\n---\n\n`
    continue
  }
  const live = r.live, wb = r.wayback
  md += `**Wayback snapshot:** ${r.snapTs.slice(0,4)}-${r.snapTs.slice(4,6)}-${r.snapTs.slice(6,8)}\n\n`

  md += `| Metric | Wayback (old) | Live (new) | Δ |\n|---|---:|---:|---:|\n`
  md += `| Word count | ${wb.wordCount.toLocaleString()} | ${live.wordCount.toLocaleString()} | **${live.wordCount - wb.wordCount > 0 ? '+' : ''}${(live.wordCount - wb.wordCount).toLocaleString()}** |\n`
  md += `| H1 | ${wb.h1.length} | ${live.h1.length} | ${live.h1.length - wb.h1.length} |\n`
  md += `| H2 | ${wb.h2.length} | ${live.h2.length} | ${live.h2.length - wb.h2.length} |\n`
  md += `| H3 | ${wb.h3.length} | ${live.h3.length} | ${live.h3.length - wb.h3.length} |\n`
  md += `| Internal links | ${wb.internalLinks} | ${live.internalLinks} | **${live.internalLinks - wb.internalLinks > 0 ? '+' : ''}${live.internalLinks - wb.internalLinks}** |\n`
  md += `| FAQ \`<details>\` | ${wb.faqDetailsCount} | ${live.faqDetailsCount} | ${live.faqDetailsCount - wb.faqDetailsCount} |\n`
  md += `| FAQ Q schema | ${wb.faqSchemaCount} | ${live.faqSchemaCount} | ${live.faqSchemaCount - wb.faqSchemaCount} |\n`
  md += `| Schema blocks | ${wb.schemaBlockCount} | ${live.schemaBlockCount} | ${live.schemaBlockCount - wb.schemaBlockCount} |\n`
  md += `| Bytes | ${wb.bytes.toLocaleString()} | ${live.bytes.toLocaleString()} | ${(live.bytes - wb.bytes).toLocaleString()} |\n\n`
  md += `**Schema types — Wayback:** ${wb.schemaTypes.join(', ') || '(none detected)'}\n\n`
  md += `**Schema types — Live:** ${live.schemaTypes.join(', ') || '(none detected)'}\n\n`

  md += `### H1 — Wayback\n${wb.h1.map(h => `- ${h}`).join('\n') || '(none)'}\n\n`
  md += `### H1 — Live\n${live.h1.map(h => `- ${h}`).join('\n') || '(none)'}\n\n`

  md += `### H2s — Wayback (${wb.h2.length})\n${wb.h2.map(h => `- ${h}`).join('\n') || '(none)'}\n\n`
  md += `### H2s — Live (${live.h2.length})\n${live.h2.map(h => `- ${h}`).join('\n') || '(none)'}\n\n`

  md += `### Internal link sample — Wayback\n${wb.internalLinkSample.map(l => `- ${l}`).join('\n')}\n\n`
  md += `### Internal link sample — Live\n${live.internalLinkSample.map(l => `- ${l}`).join('\n')}\n\n`

  md += `---\n\n`
}

const outPath = '../2026-05-05_content-diff.md'
fs.writeFileSync(outPath, md)
fs.writeFileSync('../2026-05-05_content-diff.json', JSON.stringify(out, null, 2))
console.log(`\nWritten: ${outPath}`)
