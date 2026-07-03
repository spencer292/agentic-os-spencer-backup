#!/usr/bin/env node
/**
 * Phase 3 apply — reservoir links (R3/R6) into blog-data.ts closing sections.
 * Per-post block targeting: each edit is applied WITHIN its post's block (sliced
 * by slug boundary) so shared closing-sentence templates can't cross-match.
 * Asserts every OLD matches EXACTLY once inside its block and NEW isn't already
 * present, then writes. Adds cornerstone link (varied anchor, R7) and/or priority
 * cities (no removals), woven into existing service-areas prose.
 */
import { readFileSync, writeFileSync } from 'node:fs'
const FILE = new URL('../briefs/website-rebuild-rebrand/site/src/lib/blog-data.ts', import.meta.url)
let src = readFileSync(FILE, 'utf8')

const EDITS = [
  { slug: 'how-deep-do-moles-dig', // cornerstone only
    old: 'and [mole control near Sammamish](/mole-control-sammamish/) — plus every neighboring city on our [service areas map](/service-areas/).',
    new: 'and [mole control near Sammamish](/mole-control-sammamish/) — plus every neighboring city on our [service areas map](/service-areas/). If you would rather understand the fix first, our guide on [how to get rid of moles in your yard](/how-to-get-rid-of-moles-in-your-yard/) walks through what actually works.',
  },
  { slug: 'how-many-eyes-do-moles-have', // +Seattle +Bellevue, cornerstone
    old: 'and [mole control near Black Diamond](/mole-control-black-diamond/) — plus every neighboring city on our [service areas map](/service-areas/).',
    new: '[mole control near Black Diamond](/mole-control-black-diamond/), [Seattle mole control](/mole-control-seattle/), and [mole control in Bellevue](/mole-control-bellevue/) — plus every neighboring city on our [service areas map](/service-areas/). Seeing fresh mounds already? Start with our guide on [getting rid of moles in your yard](/how-to-get-rid-of-moles-in-your-yard/).',
  },
  { slug: 'what-do-mole-holes-look-like', // +Bellevue, cornerstone
    old: 'and [mole control near Bothell](/mole-control-bothell/) — plus every neighboring city on our [service areas map](/service-areas/).',
    new: '[mole control near Bothell](/mole-control-bothell/), and [Bellevue mole control](/mole-control-bellevue/) — plus every neighboring city on our [service areas map](/service-areas/). Once you have confirmed it is moles, our guide on [removing moles from your lawn](/how-to-get-rid-of-moles-in-your-yard/) covers your options.',
  },
  { slug: 'do-moles-carry-diseases', // +Renton, cornerstone
    old: 'and [mole control near Puyallup](/mole-control-puyallup/) — plus every neighboring city on our [service areas map](/service-areas/).',
    new: '[mole control near Puyallup](/mole-control-puyallup/), and [Renton mole control](/mole-control-renton/) — plus every neighboring city on our [service areas map](/service-areas/). To clear the moles behind the risk, see our guide on [how to get rid of moles](/how-to-get-rid-of-moles-in-your-yard/).',
  },
  { slug: 'what-eats-moles', // +Seattle, cornerstone
    old: 'and [mole control near Kirkland](/mole-control-kirkland/) — plus every neighboring city on our [service areas map](/service-areas/).',
    new: '[mole control near Kirkland](/mole-control-kirkland/), and [Seattle mole control](/mole-control-seattle/) — plus every neighboring city on our [service areas map](/service-areas/). Since predators will not clear them for you, our guide on [getting moles out of your yard](/how-to-get-rid-of-moles-in-your-yard/) shows what does.',
  },
  { slug: 'how-to-get-rid-of-ground-moles-with-vinegar', // +Kent +Federal Way, cornerstone
    old: 'and [mole control near Auburn](/mole-control-auburn/) — plus every neighboring city on our [service areas map](/service-areas/).',
    new: '[mole control near Auburn](/mole-control-auburn/), [Kent mole control](/mole-control-kent/), and [Federal Way mole control](/mole-control-federal-way/) — plus every neighboring city on our [service areas map](/service-areas/). Skip the vinegar — our guide on [what actually works to get rid of moles](/how-to-get-rid-of-moles-in-your-yard/) lays out the methods that do.',
  },
  { slug: 'do-moles-hibernate', // cornerstone via unique Regional-Variations sentence
    old: 'the season will continue producing them until the mole is removed.',
    new: 'the season will continue producing them until the mole is removed. Our guide on [how to clear moles from your yard](/how-to-get-rid-of-moles-in-your-yard/) covers the options that work in our climate.',
  },
  { slug: 'is-a-mole-a-rodent', // +Renton +Kent (cornerstone already present)
    old: 'and [mole control near Mercer Island](/mole-control-mercer-island/) — plus every neighboring city on our [service areas map](/service-areas/).',
    new: '[mole control near Mercer Island](/mole-control-mercer-island/), [Renton mole control](/mole-control-renton/), and [mole control in Kent](/mole-control-kent/) — plus every neighboring city on our [service areas map](/service-areas/).',
  },
]

// Build slug → [start,end) block boundaries.
const slugRe = /\n {4}slug: '([^']+)',/g
const marks = []
let m
while ((m = slugRe.exec(src))) marks.push({ slug: m[1], idx: m.index })
marks.push({ slug: '__END__', idx: src.length })
function bounds(slug) {
  const i = marks.findIndex((x) => x.slug === slug)
  return i < 0 ? null : [marks[i].idx, marks[i + 1].idx]
}

// Validate ALL within their block before writing.
const errors = []
for (const e of EDITS) {
  const b = bounds(e.slug)
  if (!b) { errors.push(`  ${e.slug}: block NOT FOUND`); continue }
  const block = src.slice(b[0], b[1])
  const n = block.split(e.old).length - 1
  if (n !== 1) errors.push(`  ${e.slug}: OLD matched ${n}× in block (need 1)`)
  if (block.includes(e.new)) errors.push(`  ${e.slug}: NEW already present`)
}
if (errors.length) {
  console.error('VALIDATION FAILED — nothing written:\n' + errors.join('\n'))
  process.exit(1)
}

// Apply back-to-front so indices stay valid.
const applied = []
const sorted = [...EDITS].sort((a, b) => bounds(b.slug)[0] - bounds(a.slug)[0])
for (const e of sorted) {
  const [s, en] = bounds(e.slug)
  const block = src.slice(s, en)
  src = src.slice(0, s) + block.replace(e.old, e.new) + src.slice(en)
  applied.push(e.slug)
}
writeFileSync(FILE, src)
console.log(`✅ Applied ${applied.length} reservoir edits (per-post, each matched once):`)
for (const s of EDITS.map((e) => e.slug)) console.log(`   - ${s}`)
