// Audit: for each of 7 MERGE-redirected old URLs, compare its historical ranked
// keywords against the new cornerstone content. Report gaps.
import fs from 'node:fs'

const corpus = JSON.parse(fs.readFileSync('projects/briefs/website-launch-readiness/keyword-corpus-raw.json', 'utf-8'))
const blogDataRaw = fs.readFileSync('projects/briefs/website-rebuild-rebrand/site/src/lib/blog-data.ts', 'utf-8')

const PAIRS = [
  { rank: 1,  old: '/what-do-moles-eat', new_slug: 'what-do-moles-eat' },
  { rank: 4,  old: '/voles-vs-moles-whats-the-difference', new_slug: 'mole-vs-vole-vs-gopher' },
  { rank: 19, old: '/do-moles-hibernate', new_slug: 'when-are-moles-most-active-washington' },
  { rank: 'm6', old: '/what-species-of-moles-live-in-washington-state', new_slug: 'types-of-moles-in-washington' },
  { rank: 'm10', old: '/how-to-get-rid-of-moles-in-your-yard', new_slug: 'how-to-get-rid-of-moles' },
  { rank: 'm16', old: '/moles-vs-gopher-mounds', new_slug: 'mole-vs-vole-vs-gopher' },
  { rank: 'm17', old: '/what-works-for-mole-extermination', new_slug: 'best-mole-traps' },
]

// Group corpus by URL path
const byPath = {}
const corpusArray = Array.isArray(corpus) ? corpus : Object.values(corpus)
for (const row of corpusArray) {
  if (!row.url) continue
  let path
  try { path = new URL(row.url).pathname.replace(/\/$/, '') } catch { continue }
  if (!byPath[path]) byPath[path] = []
  byPath[path].push({ kw: row.kw, rank: row.cur })
}

// Extract content for each new slug from blog-data.ts
function extractBlogContent(blogDataRaw, slug) {
  const slugRegex = new RegExp(`slug:\\s*['"\`]${slug}['"\`]`)
  const slugMatch = blogDataRaw.match(slugRegex)
  if (!slugMatch) return null
  const startIdx = slugMatch.index
  // Find next `slug:` occurrence to bound the entry
  const afterStart = blogDataRaw.slice(startIdx + 10)
  const nextSlugMatch = afterStart.match(/slug:\s*['"`]/)
  const endIdx = nextSlugMatch ? startIdx + 10 + nextSlugMatch.index : blogDataRaw.length
  return blogDataRaw.slice(startIdx, endIdx).toLowerCase()
}

// Tokenize a keyword phrase: lowercase, drop very-short words
function tokens(kw) {
  return kw.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((t) => t.length > 2 && !['the', 'and', 'for', 'are', 'how', 'what', 'why', 'you', 'your', 'with', 'have'].includes(t))
}

// Check if keyword phrase is present in content (loose match — all significant tokens present)
function isPresent(kw, content) {
  if (!content) return false
  // Try exact phrase first
  if (content.includes(kw.toLowerCase())) return 'exact'
  // Try all tokens present (ANY order)
  const ts = tokens(kw)
  if (ts.length === 0) return 'skip'
  const allPresent = ts.every((t) => content.includes(t))
  return allPresent ? 'partial' : false
}

console.log('═══ Keyword audit per OLD URL → NEW cornerstone ═══\n')

for (const p of PAIRS) {
  const kws = byPath[p.old] || []
  const content = extractBlogContent(blogDataRaw, p.new_slug)

  console.log(`\n══ Rank #${p.rank}: ${p.old}  →  /${p.new_slug}/  ══`)
  console.log(`  Old URL ranked keywords: ${kws.length}`)
  console.log(`  New cornerstone content found in blog-data.ts: ${content ? `YES (${content.length} chars)` : 'NO ❌'}`)

  if (!content || kws.length === 0) continue

  let exact = 0, partial = 0, missing = []
  for (const k of kws) {
    const r = isPresent(k.kw, content)
    if (r === 'exact') exact++
    else if (r === 'partial') partial++
    else missing.push(k)
  }

  console.log(`  Coverage:  ${exact} exact-phrase / ${partial} partial-tokens / ${missing.length} MISSING`)

  if (missing.length > 0) {
    console.log(`  Missing keywords (top 20 by current rank):`)
    missing.sort((a, b) => (a.rank || 999) - (b.rank || 999))
    for (const m of missing.slice(0, 20)) {
      console.log(`    rank=${String(m.rank || '?').padStart(3)}  "${m.kw}"`)
    }
    if (missing.length > 20) console.log(`    … and ${missing.length - 20} more`)
  }
}

console.log('\n═══ Summary ═══')
let totalKw = 0, totalMissing = 0
for (const p of PAIRS) {
  const kws = byPath[p.old] || []
  const content = extractBlogContent(blogDataRaw, p.new_slug)
  if (!content) continue
  totalKw += kws.length
  for (const k of kws) {
    if (!isPresent(k.kw, content)) totalMissing++
  }
}
console.log(`Across all 7 URLs: ${totalKw} historical keywords, ${totalMissing} missing from new cornerstone content (${(totalMissing/totalKw*100).toFixed(0)}%)`)
