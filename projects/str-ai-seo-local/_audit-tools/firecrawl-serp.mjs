// Phase 2 — pull SERP data for top priority keywords via Firecrawl.
// For each keyword: top organic results, PAA (People Also Ask), Related
// Searches. AI Overview detection limited (rendered client-side) — that's
// what SerpAPI is for in Phase 3.
//
// Firecrawl /v1/search endpoint returns structured search results.
// /v1/scrape endpoint can fetch Google SERP HTML directly for PAA extraction.
//
// Output: ../firecrawl-serp-{YYYY-MM-DD}.json
import fs from 'node:fs'
import path from 'node:path'

// Read FIRECRAWL_API_KEY from agent-os root .env
function loadEnv() {
  const envPath = path.resolve('C:/Claude/agent-os/.env')
  if (!fs.existsSync(envPath)) return {}
  const text = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnv()
const KEY = env.FIRECRAWL_API_KEY
if (!KEY) {
  console.error('FIRECRAWL_API_KEY not found in C:/Claude/agent-os/.env')
  process.exit(1)
}

// Top priority keywords pulled from target-keywords.md + GSC top queries
// Mix of head terms (Got Moles competes for these) + commercial city
// queries + informational queries with high impressions but low clicks.
const KEYWORDS = [
  // Homepage / brand commercial head terms
  'mole control western washington',
  'mole control washington',
  'mole control seattle',
  'mole control near me',
  'lawn mole control',
  'professional mole control',
  // Service-specific commercial
  'year round mole control',
  'professional mole removal',
  'mole exterminator near me',
  'commercial mole control',
  // Cost queries (derm-disambig watch)
  'lawn mole removal cost',
  'mole control cost washington',
  'professional mole trapping cost',
  // Top GSC-impression Biology cluster (high impression, low CTR — H2/AEO target)
  'voles vs moles',
  'how many eyes do moles have',
  'are moles blind',
  'do moles bite',
  'how deep do moles dig',
  'what do mole holes look like',
  'is a mole a rodent',
  'are moles nocturnal',
  // Mole Control cluster — informational/decision
  'how to get rid of moles in your yard',
  'best mole traps',
  'how to find active mole tunnels',
  'do mole repellents work',
  'does grub control stop moles',
  'why do moles keep coming back',
  // Top city pages with rank
  'mole control bellevue',
  'mole control sammamish',
  'mole control tacoma',
  'mole control kirkland',
]

console.log(`Pulling SERP data for ${KEYWORDS.length} keywords via Firecrawl /v1/search...`)

async function search(query) {
  const res = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      limit: 10,
      scrapeOptions: { formats: ['markdown'] },
    }),
  })
  if (!res.ok) {
    return { error: `${res.status} ${res.statusText}`, body: await res.text() }
  }
  return res.json()
}

// Try to extract PAA from a Google SERP scrape — Firecrawl's scrape endpoint
// can fetch Google search results pages.
async function scrapeGoogleSerp(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      waitFor: 1500,
    }),
  })
  if (!res.ok) {
    return { error: `${res.status} ${res.statusText}`, body: await res.text() }
  }
  return res.json()
}

// PAA boxes in Google SERP html have a recognizable pattern.
// They appear as collapsed <div> containers with role="heading" and the
// question text inside. Markdown rendering tends to flatten them into a
// list of question-like lines.
function extractPaaFromMarkdown(md) {
  if (!md) return []
  // Lines that look like questions (end with ?), reasonable length, not list items
  const lines = md.split('\n').map((l) => l.trim()).filter(Boolean)
  const questions = []
  for (const line of lines) {
    // Skip URLs, code, headings starting with #
    if (line.startsWith('http') || line.startsWith('#') || line.startsWith('```')) continue
    // Strip markdown link syntax
    const text = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^[-*+]\s+/, '').trim()
    if (text.endsWith('?') && text.length >= 15 && text.length <= 120 && !text.includes('|')) {
      if (!questions.includes(text)) questions.push(text)
    }
  }
  return questions.slice(0, 12)
}

const results = {}
let i = 0
for (const kw of KEYWORDS) {
  i++
  process.stdout.write(`\r[${i}/${KEYWORDS.length}] ${kw}...`)
  try {
    const [searchRes, serpScrape] = await Promise.all([
      search(kw),
      scrapeGoogleSerp(kw),
    ])
    const top = (searchRes?.data || []).map((d) => ({
      url: d.url,
      title: d.title,
      description: d.description,
    }))
    const md = serpScrape?.data?.markdown || ''
    const paa = extractPaaFromMarkdown(md)
    results[kw] = {
      query: kw,
      topResults: top,
      paaCandidates: paa,
      serpScrapeOk: !serpScrape?.error,
      searchOk: !searchRes?.error,
    }
  } catch (e) {
    results[kw] = { query: kw, error: e.message }
  }
  // Rate-limit: 100ms between iterations to be polite
  await new Promise((r) => setTimeout(r, 200))
}
console.log('\n')

const outPath = `../firecrawl-serp-${new Date().toISOString().slice(0, 10)}.json`
fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log(`Written: ${outPath}\n`)

// Quick sanity stats
const ok = Object.values(results).filter((r) => !r.error).length
const withPaa = Object.values(results).filter((r) => (r.paaCandidates || []).length > 0).length
const withTop = Object.values(results).filter((r) => (r.topResults || []).length > 0).length
console.log(`Successful: ${ok}/${KEYWORDS.length}`)
console.log(`With PAA candidates: ${withPaa}`)
console.log(`With organic top results: ${withTop}`)

// Sample 3 keywords
console.log(`\nSample output (first 3 keywords with PAA):`)
let shown = 0
for (const [kw, r] of Object.entries(results)) {
  if (shown >= 3) break
  if (!r.paaCandidates || r.paaCandidates.length === 0) continue
  console.log(`\n  Query: "${kw}"`)
  console.log(`  PAA: ${r.paaCandidates.slice(0, 5).join(' | ')}`)
  console.log(`  Top organic: ${(r.topResults || []).slice(0, 3).map((t) => t.url).join(', ')}`)
  shown++
}
