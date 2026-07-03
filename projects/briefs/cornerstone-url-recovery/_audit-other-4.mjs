import fs from 'node:fs'

const corpus = JSON.parse(fs.readFileSync('projects/briefs/website-launch-readiness/keyword-corpus-raw.json', 'utf-8'))
const corpusArray = Array.isArray(corpus) ? corpus : Object.values(corpus)

// Check: are these URLs actually IN the corpus at all?
const TARGETS = [
  '/what-species-of-moles-live-in-washington-state',
  '/how-to-get-rid-of-moles-in-your-yard',
  '/moles-vs-gopher-mounds',
  '/what-works-for-mole-extermination',
]

console.log(`Total corpus rows: ${corpusArray.length}\n`)

for (const target of TARGETS) {
  const matches = corpusArray.filter((r) => {
    if (!r.url) return false
    try { return new URL(r.url).pathname.replace(/\/$/, '') === target } catch { return false }
  })
  // Also check loose match (URL contains target)
  const loose = corpusArray.filter((r) => r.url && typeof r.url === 'string' && r.url.includes(target))

  console.log(`${target}`)
  console.log(`  Strict matches: ${matches.length}`)
  console.log(`  Loose matches: ${loose.length}`)

  if (loose.length > 0 && loose.length <= 30) {
    for (const m of loose.slice(0, 30)) {
      console.log(`    rank=${String(m.cur || '?').padStart(3)}  "${m.kw}"  url=${m.url}`)
    }
  }
  console.log('')
}

// Also check the inventory file which originally classified these URLs
console.log('═══ Cross-check vs old-blog-inventory.json (which initially scored these) ═══')
try {
  const inv = JSON.parse(fs.readFileSync('projects/briefs/seo-geo-reinforcement/reports/old-blog-inventory.json', 'utf-8'))
  const arr = Array.isArray(inv) ? inv : Object.values(inv)
  for (const target of TARGETS) {
    const found = arr.find((r) => r.url && r.url.includes(target))
    if (found) {
      console.log(`\n${target}`)
      console.log('  ', JSON.stringify(found, null, 2))
    } else {
      console.log(`\n${target}  — not in inventory`)
    }
  }
} catch (e) {
  console.log('Inventory file read failed:', e.message)
}
