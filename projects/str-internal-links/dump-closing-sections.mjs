#!/usr/bin/env node
/** Dump the last 1-2 sections (heading + full body) of posts needing Phase 3 edits. Read-only. */
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../briefs/website-rebuild-rebrand/site/src/lib/blog-data.ts', import.meta.url), 'utf8')

const SLUGS = process.argv.slice(2)
const slugRe = /\n {4}slug: '([^']+)',/g
const marks = []
let m
while ((m = slugRe.exec(src))) marks.push({ slug: m[1], idx: m.index })
marks.push({ slug: '__END__', idx: src.length })

function block(slug) {
  const i = marks.findIndex((x) => x.slug === slug)
  return i < 0 ? null : src.slice(marks[i].idx, marks[i + 1].idx)
}

// crude section splitter: matches `{ heading: "...", body: "..." }` (handles both quote styles, escaped quotes)
function sections(b) {
  const re = /\{\s*heading:\s*(["'])((?:\\.|(?!\1).)*?)\1,\s*body:\s*(["'])((?:\\.|(?!\3).)*?)\3\s*\}/gs
  const out = []
  let x
  while ((x = re.exec(b))) out.push({ heading: x[2], body: x[4] })
  return out
}

for (const slug of SLUGS) {
  const b = block(slug)
  if (!b) { console.log(`\n===== ${slug}: NOT FOUND =====`); continue }
  const secs = sections(b)
  const last = secs.slice(-2)
  console.log(`\n===== ${slug} (showing last ${last.length} of ${secs.length} sections) =====`)
  for (const s of last) {
    console.log(`\n--- heading: ${s.heading}`)
    console.log(s.body)
  }
}
