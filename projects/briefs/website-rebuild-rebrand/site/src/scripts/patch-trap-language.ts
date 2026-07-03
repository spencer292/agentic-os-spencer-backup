/**
 * patch-trap-language.ts
 *
 * Surgical patch for trap-mechanism language in Payload CMS records.
 * In-place updates only — no deletes, no ID changes, no relation churn.
 *
 * USAGE
 *   npm run patch-trap -- --slug do-moles-bite              (single, dry-run)
 *   npm run patch-trap -- --slug do-moles-bite --apply      (single, write)
 *   npm run patch-trap -- --scan                            (discovery: all 3 collections)
 *   npm run patch-trap -- --scan --collection blog-posts    (discovery: one collection)
 *
 *   --collection blog-posts | city-pages | pages   (default: blog-posts)
 *   --slug <slug>                                  (required for single mode)
 *   --scan                                         (read-only across all records)
 *   --apply                                        (omit = dry-run; required to write)
 *
 * Lexical (richText) is walked recursively — only the .text leaf
 * fields on text nodes are touched. Structure preserved.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

// ----------------------------------------------------------------------
// Replacement table — order matters (longest/most specific first).
// Each entry: { find: RegExp, replace: string, label: string }
// ----------------------------------------------------------------------
const REPLACEMENTS: Array<{ find: RegExp; replace: string; label: string }> = [
  // Mechanism + outcome combos (specific phrases first)
  {
    find: /Professional body-gripping traps — the kind Got Moles has used/g,
    replace: 'Professional methods — the kind Got Moles has used',
    label: 'professional-methods-the-kind',
  },
  {
    find: /the mole is already dead when the trap is retrieved/g,
    replace: 'the mole is already gone when equipment is retrieved',
    label: 'already-gone-when-equipment',
  },
  {
    find: /\*\*1\. Instantaneous death\.\*\* Body-gripping traps designed for moles deliver immediate neck-or-chest compression that kills the animal in a fraction of a second\./g,
    replace: '**1. Immediate result.** Professional traps designed for moles work instantly.',
    label: 'instant-death-heading-and-body',
  },
  {
    find: /Body-gripping traps designed for moles deliver immediate neck-or-chest compression that kills the animal in a fraction of a second\./g,
    replace: 'Professional traps designed for moles work instantly.',
    label: 'kill-mechanism-detail-1',
  },
  {
    find: /Professional body-gripping traps designed for moles kill the animal instantly/g,
    replace: 'Professional traps designed for moles work instantly',
    label: 'kill-instantly-1283',
  },
  {
    find: /kills the animal in a fraction of a second/g,
    replace: 'works instantly',
    label: 'kills-fraction-of-second',
  },
  {
    find: /the trap closes, death is instantaneous\./g,
    replace: 'the result is immediate.',
    label: 'trap-closes-death-instant',
  },
  // Combined rewrite — avoids two adjacent "immediate" clauses
  {
    find: /Professional physical trapping delivers instantaneous death — the mole dies in a fraction of a second without prolonged suffering/g,
    replace: 'Professional physical trapping delivers an immediate result without prolonged suffering',
    label: 'instantaneous-death-faq-combined',
  },
  // Fallback for the standalone "instantaneous death" if the combined form doesn't match
  {
    find: /Professional physical trapping delivers instantaneous death/g,
    replace: 'Professional physical trapping delivers an immediate result',
    label: 'instantaneous-death-faq',
  },
  // Standalone — only fires if combined rule didn't catch it
  {
    find: /the mole dies in a fraction of a second/g,
    replace: 'the result is immediate',
    label: 'mole-dies-fraction',
  },
  // Preserve "trapping" as a noun where generic strip would leave clunky "trap approach"
  {
    find: /our chemical-free body-gripping trap approach/g,
    replace: 'our chemical-free trapping approach',
    label: 'chemfree-trapping-approach',
  },
  {
    find: /instantaneous death with no secondary environmental harm/g,
    replace: 'an immediate result with no secondary environmental harm',
    label: 'instantaneous-death-secondary',
  },
  {
    find: /kill the mole instantly/g,
    replace: 'work instantly',
    label: 'kill-mole-instantly',
  },
  {
    find: /Traps designed for the job kill the mole instantly/g,
    replace: 'Traps designed for the job work instantly',
    label: 'traps-job-kill-mole',
  },
  // Specific service-describing phrases (Roy's softer rewrites)
  {
    find: /Got Moles uses chemical-free body-gripping traps across every service\./g,
    replace: 'Got Moles uses chemical-free, professional methods across every service.',
    label: 'gm-uses-chemfree-bgt',
  },
  {
    find: /Got Moles uses chemical-free traps across every service\./g,
    replace: 'Got Moles uses chemical-free, professional methods across every service.',
    label: 'gm-uses-chemfree-traps',
  },
  {
    find: /uses exclusively chemical-free methods — professional body-gripping traps placed in active tunnels\./g,
    replace: 'uses exclusively chemical-free methods — professional, mechanical placement in active tunnels.',
    label: 'uses-exclusively-mechanical',
  },
  {
    find: /However, Washington State has specific regulations around trap types — body-gripping traps for moles are regulated under state law, and professionals use compliant equipment\. Got Moles operates within Washington's mole trapping regulations and uses only chemical-free physical methods\./g,
    replace:
      "However, professional mole removal in Washington is performed under a state regulatory framework, and Got Moles uses methods that fit. We work within Washington's mole control regulations and use only chemical-free professional methods.",
    label: 'wa-state-regulations',
  },
  // "Body-gripping" as sentence start (capital B) — used in DIY comparison
  {
    find: /\bBody-gripping traps placed in active tunnels catch moles/g,
    replace: 'Professional methods set in active tunnels catch moles',
    label: 'body-gripping-sentence-start',
  },
  // Boilerplate
  {
    find: /\*\*Zero chemicals\*\* — professional body-gripping traps placed in active tunnels\./g,
    replace: '**Zero chemicals** — professional, mechanical placement in active tunnels.',
    label: 'zero-chemicals-bgt-boilerplate',
  },
  {
    find: /\*\*Zero chemicals\*\* — professional traps placed in active tunnels\./g,
    replace: '**Zero chemicals** — professional, mechanical placement in active tunnels.',
    label: 'zero-chemicals-traps-boilerplate',
  },
  // Generic "body-gripping " strip — safety net for any leftover
  // ALWAYS LAST (so specific patterns above match first)
  {
    find: /body-gripping /g,
    replace: '',
    label: 'generic-body-gripping-strip',
  },
  {
    find: /Body-gripping /g,
    replace: 'Professional ',
    label: 'generic-Body-gripping-strip',
  },
]

// ----------------------------------------------------------------------
// Walk a value (object/array/string) and apply replacements to every
// string. Returns { value, hits } where hits is array of changes.
// ----------------------------------------------------------------------
type Hit = { path: string; label: string; before: string; after: string }

function patchValue(value: unknown, path: string, hits: Hit[]): unknown {
  if (typeof value === 'string') {
    let next = value
    for (const r of REPLACEMENTS) {
      if (r.find.test(next)) {
        const before = next
        // reset lastIndex for /g regex reuse
        r.find.lastIndex = 0
        next = next.replace(r.find, r.replace)
        if (next !== before) {
          hits.push({ path, label: r.label, before, after: next })
        }
      }
      r.find.lastIndex = 0
    }
    return next
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => patchValue(item, `${path}[${i}]`, hits))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = patchValue(v, path ? `${path}.${k}` : k, hits)
    }
    return out
  }
  return value
}

// ----------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx === -1 ? undefined : args[idx + 1]
}
const apply = args.includes('--apply')
const scanMode = args.includes('--scan')
const collectionArg = getArg('collection') as
  | 'blog-posts'
  | 'city-pages'
  | 'pages'
  | undefined
const collection = collectionArg || 'blog-posts'
const slug = getArg('slug')

if (!scanMode && !slug) {
  console.error(
    'Missing --slug (single mode) or --scan (discovery mode). Examples:\n' +
      '  --slug do-moles-bite\n' +
      '  --scan\n' +
      '  --scan --collection blog-posts',
  )
  process.exit(1)
}

// ----------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// Scan a single record (no writes). Returns hits.
// ----------------------------------------------------------------------
async function scanRecord(
  doc: Record<string, unknown>,
  collectionSlug: string,
): Promise<Hit[]> {
  const hits: Hit[] = []
  if (collectionSlug === 'blog-posts') {
    if (doc.excerpt !== undefined) patchValue(doc.excerpt, 'excerpt', hits)
    if (doc.definitionBlock !== undefined)
      patchValue(doc.definitionBlock, 'definitionBlock', hits)
    if (doc.body !== undefined) patchValue(doc.body, 'body', hits)
    if (doc.faqs !== undefined) patchValue(doc.faqs, 'faqs', hits)
    if (doc.seo !== undefined) patchValue(doc.seo, 'seo', hits)
  } else {
    if (doc.layout !== undefined) patchValue(doc.layout, 'layout', hits)
    if (doc.faqs !== undefined) patchValue(doc.faqs, 'faqs', hits)
    if (doc.meta !== undefined) patchValue(doc.meta, 'meta', hits)
  }
  return hits
}

// ----------------------------------------------------------------------
// Discovery mode: scan all records across one or all collections.
// Read-only. Prints a report.
// ----------------------------------------------------------------------
async function runScan() {
  const payload = await getPayload({ config })
  const collections: Array<'blog-posts' | 'city-pages' | 'pages'> = collectionArg
    ? [collectionArg]
    : ['blog-posts', 'city-pages', 'pages']

  console.log(
    `\nDiscovery scan — collections=${collections.join(', ')}, mode=read-only\n`,
  )

  let grandTotalHits = 0
  let grandTotalRecords = 0
  const labelTotals: Record<string, number> = {}
  const genericStripOnly: Array<{ collection: string; slug: string; hits: number }> = []

  for (const col of collections) {
    // Match production query filters per collection:
    //   blog-posts: manual `status` field (= 'published')
    //   pages:      Payload version-system `_status` (= 'published')
    //   city-pages: no status filter (programmatic)
    const result = await payload.find({
      collection: col,
      limit: 500,
      depth: 0,
      draft: false,
      where:
        col === 'blog-posts'
          ? { status: { equals: 'published' } }
          : col === 'pages'
            ? { _status: { equals: 'published' } }
            : {},
    })

    const records = result.docs as unknown as Array<Record<string, unknown>>
    const affected: Array<{ slug: string; hits: Hit[] }> = []

    for (const doc of records) {
      const hits = await scanRecord(doc, col)
      if (hits.length === 0) continue
      affected.push({ slug: (doc.slug as string) || `id=${doc.id}`, hits })
    }

    console.log(`\n=== ${col} === ${affected.length}/${records.length} records affected\n`)
    for (const a of affected) {
      const labels = [...new Set(a.hits.map((h) => h.label))]
      const labelStr = labels.join(', ')
      console.log(`  ${a.slug} — ${a.hits.length} hits [${labelStr}]`)
      for (const l of labels) labelTotals[l] = (labelTotals[l] || 0) + a.hits.filter((h) => h.label === l).length

      // Flag records that ONLY get generic strip — candidates for specific rule
      const onlyGeneric =
        labels.length > 0 &&
        labels.every((l) => l === 'generic-body-gripping-strip' || l === 'generic-Body-gripping-strip')
      if (onlyGeneric) {
        genericStripOnly.push({ collection: col, slug: a.slug, hits: a.hits.length })
      }
    }

    // Batch apply if --apply was passed alongside --scan
    if (apply && affected.length > 0) {
      console.log(`\n  Applying ${affected.length} record(s) in ${col}...`)
      let okCount = 0
      let errCount = 0
      for (const a of affected) {
        const doc = records.find((r) => r.slug === a.slug)!
        // Build patched fields
        const fieldsToPatch: Record<string, unknown> = {}
        if (col === 'blog-posts') {
          if (doc.excerpt !== undefined)
            fieldsToPatch.excerpt = patchValue(doc.excerpt, 'excerpt', [])
          if (doc.definitionBlock !== undefined)
            fieldsToPatch.definitionBlock = patchValue(doc.definitionBlock, 'definitionBlock', [])
          if (doc.body !== undefined) fieldsToPatch.body = patchValue(doc.body, 'body', [])
          if (doc.faqs !== undefined) fieldsToPatch.faqs = patchValue(doc.faqs, 'faqs', [])
          if (doc.seo !== undefined) fieldsToPatch.seo = patchValue(doc.seo, 'seo', [])
        } else {
          if (doc.layout !== undefined) fieldsToPatch.layout = patchValue(doc.layout, 'layout', [])
          if (doc.faqs !== undefined) fieldsToPatch.faqs = patchValue(doc.faqs, 'faqs', [])
          if (doc.meta !== undefined) fieldsToPatch.meta = patchValue(doc.meta, 'meta', [])
        }
        try {
          await payload.update({
            collection: col,
            id: doc.id as string | number,
            data: { ...fieldsToPatch, _status: 'published' },
            overrideAccess: true,
            draft: false,
          })
          okCount++
          console.log(`    ✓ ${a.slug}`)
        } catch (err) {
          errCount++
          console.error(`    ✗ ${a.slug} — ${(err as Error).message}`)
        }
      }
      console.log(`  Done: ${okCount} updated, ${errCount} failed.\n`)
    }

    grandTotalHits += affected.reduce((s, a) => s + a.hits.length, 0)
    grandTotalRecords += affected.length
  }

  console.log('\n=== Summary ===')
  console.log(`  Total affected records: ${grandTotalRecords}`)
  console.log(`  Total replacements queued: ${grandTotalHits}`)
  console.log('\n  Hits by rule label:')
  for (const [label, count] of Object.entries(labelTotals).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${count.toString().padStart(4)} × ${label}`)
  }

  if (genericStripOnly.length > 0) {
    console.log(
      `\n  ⚠ ${genericStripOnly.length} record(s) only match the generic strip (no specific rule).`,
    )
    console.log('    These will become "professional traps" via fallback.')
    console.log('    Review these to decide if you want specific phrasing instead:')
    for (const r of genericStripOnly.slice(0, 50)) {
      console.log(`      ${r.collection}/${r.slug} (${r.hits} hits)`)
    }
    if (genericStripOnly.length > 50) {
      console.log(`      ...and ${genericStripOnly.length - 50} more`)
    }
  }

  console.log('\nScan complete (read-only, nothing written).\n')
  process.exit(0)
}

async function run() {
  if (scanMode) return runScan()
  const payload = await getPayload({ config })
  console.log(
    `\nPatch trap language — collection=${collection}, slug=${slug}, mode=${apply ? 'APPLY' : 'dry-run'}\n`,
  )

  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    draft: false, // read PUBLISHED version (matches production rendering)
  })

  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined
  if (!doc) {
    console.error(`No record found in ${collection} with slug=${slug}`)
    process.exit(1)
  }

  const id = doc.id
  console.log(`Found record id=${id}, title="${doc.title}"`)

  // Build a patch payload — only the fields we walk.
  // For blog-posts: excerpt, definitionBlock, body (richText), faqs, seo.metaDescription
  // For pages / city-pages: layout (blocks array)
  const fieldsToPatch: Record<string, unknown> = {}
  const hits: Hit[] = []

  if (collection === 'blog-posts') {
    if (doc.excerpt !== undefined)
      fieldsToPatch.excerpt = patchValue(doc.excerpt, 'excerpt', hits)
    if (doc.definitionBlock !== undefined)
      fieldsToPatch.definitionBlock = patchValue(doc.definitionBlock, 'definitionBlock', hits)
    if (doc.body !== undefined) fieldsToPatch.body = patchValue(doc.body, 'body', hits)
    if (doc.faqs !== undefined) fieldsToPatch.faqs = patchValue(doc.faqs, 'faqs', hits)
    if (doc.seo !== undefined) fieldsToPatch.seo = patchValue(doc.seo, 'seo', hits)
  } else {
    // pages / city-pages
    if (doc.layout !== undefined) fieldsToPatch.layout = patchValue(doc.layout, 'layout', hits)
    if (doc.faqs !== undefined) fieldsToPatch.faqs = patchValue(doc.faqs, 'faqs', hits)
    if (doc.meta !== undefined) fieldsToPatch.meta = patchValue(doc.meta, 'meta', hits)
  }

  if (hits.length === 0) {
    console.log('\nNo changes needed — no target strings found.')
    process.exit(0)
  }

  console.log(`\n${hits.length} change(s) detected:\n`)
  hits.forEach((h, i) => {
    console.log(`  ${i + 1}. [${h.label}] ${h.path}`)
    console.log(`     - ${h.before.slice(0, 140).replace(/\n/g, ' ')}${h.before.length > 140 ? '…' : ''}`)
    console.log(`     + ${h.after.slice(0, 140).replace(/\n/g, ' ')}${h.after.length > 140 ? '…' : ''}`)
    console.log('')
  })

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to write changes to Payload.')
    process.exit(0)
  }

  console.log('Applying patch...')
  await payload.update({
    collection,
    id: id as string | number,
    data: { ...fieldsToPatch, _status: 'published' }, // publish, don't autosave as draft
    overrideAccess: true,
    draft: false,
  })
  console.log(`✓ Patched ${collection}/${slug} (id=${id}).`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Patch failed:', err)
  process.exit(1)
})
