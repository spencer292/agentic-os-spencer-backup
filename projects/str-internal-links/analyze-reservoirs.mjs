#!/usr/bin/env node
/** Phase 3 audit: per-reservoir-post inventory of existing in-content links + section headings. Read-only. */
import { readFileSync } from 'node:fs'

const FILE = new URL('../briefs/website-rebuild-rebrand/site/src/lib/blog-data.ts', import.meta.url)
const src = readFileSync(FILE, 'utf8')

const RESERVOIRS = [
  'how-deep-do-moles-dig',
  'how-many-eyes-do-moles-have',
  'what-do-mole-holes-look-like',
  'do-moles-bite',
  'voles-vs-moles-whats-the-difference',
  'do-moles-carry-diseases',
  'what-eats-moles',
  'is-a-mole-a-rodent',
  'do-moles-hibernate',
  'how-to-get-rid-of-ground-moles-with-vinegar',
]

const CORNERSTONE = '/how-to-get-rid-of-moles-in-your-yard/'

// Find each post block: from its `slug: 'X'` line to the next `    slug: '` line.
const slugRe = /\n {4}slug: '([^']+)',/g
const marks = []
let m
while ((m = slugRe.exec(src))) marks.push({ slug: m[1], idx: m.index })
marks.push({ slug: '__END__', idx: src.length })

function block(slug) {
  const i = marks.findIndex((x) => x.slug === slug)
  if (i < 0) return null
  return src.slice(marks[i].idx, marks[i + 1].idx)
}

for (const slug of RESERVOIRS) {
  const b = block(slug)
  if (!b) { console.log(`\n### ${slug}\n  ⚠ NOT FOUND in blog-data.ts`); continue }

  const primaryMoney = (b.match(/primaryMoneyPage: '([^']+)'/) || [, 'tmcp (default)'])[1]
  const cities = [...b.matchAll(/\/mole-control-([a-z-]+)\//g)].map((x) => x[1])
  const uniqCities = [...new Set(cities)]
  const tmcp = (b.match(/\/services\/total-mole-control-program\//g) || []).length
  const oneTime = (b.match(/\/services\/one-time-mole-removal\//g) || []).length
  const commercial = (b.match(/\/services\/commercial-mole-control\//g) || []).length
  const cornerstone = b.includes(CORNERSTONE)
  const serviceAreas = (b.match(/\/service-areas\//g) || []).length
  const blogLinks = [...b.matchAll(/\/blog\/([a-z-]+)\//g)].map((x) => x[1])
  const legacyBlogLinks = [...b.matchAll(/\]\(\/((?:do|are|what|how|why|when|is|can|voles)[a-z-]+)\/\)/g)].map((x) => x[1])
  const headings = [...b.matchAll(/heading: "([^"]+)"|heading: '([^']+)'/g)].map((x) => x[1] || x[2])

  console.log(`\n### ${slug}   [primaryMoney=${primaryMoney}]`)
  console.log(`  cities(${uniqCities.length}): ${uniqCities.join(', ') || '—'}`)
  console.log(`  services: tmcp=${tmcp} one-time=${oneTime} commercial=${commercial} | service-areas=${serviceAreas}`)
  console.log(`  cornerstone link: ${cornerstone ? 'YES' : 'no'}`)
  console.log(`  blog/legacy links: ${[...blogLinks, ...legacyBlogLinks].join(', ') || '—'}`)
  console.log(`  sections: ${headings.map((h) => `“${h}”`).join('  |  ')}`)
}
