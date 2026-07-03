/**
 * diff-cms-source.ts
 *
 * Drift detector — compares source-of-truth files (blog-data.ts,
 * city-data.ts, pages-data.ts) against live Payload CMS records.
 * Surfaces any field where source has been edited but the CMS
 * version was never re-seeded.
 *
 * READ-ONLY. Never writes.
 *
 * USAGE
 *   npm run diff-cms                              (all collections)
 *   npm run diff-cms -- --collection blog-posts   (one collection)
 *   npm run diff-cms -- --slug do-moles-bite      (one record only)
 *
 * v1 scope:
 *   blog-posts: excerpt, bluf↔definitionBlock, faqs (Q+A flat compare)
 *   city-pages: faqs (Q+A)
 *   pages:      not yet (block structure makes meaningful diff harder)
 *
 * v1 limitation: does NOT diff blog body content (Lexical JSON).
 * Section-level body drift is invisible until v2.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { blogPosts } from '../lib/blog-data'
import { cityData } from '../lib/city-data'

// ----------------------------------------------------------------------
// Args
// ----------------------------------------------------------------------
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx === -1 ? undefined : args[idx + 1]
}
const collectionFilter = getArg('collection') as
  | 'blog-posts'
  | 'city-pages'
  | undefined
const slugFilter = getArg('slug')

// ----------------------------------------------------------------------
// Drift records
// ----------------------------------------------------------------------
type Drift = {
  collection: string
  slug: string
  field: string
  kind: 'missing-in-cms' | 'missing-in-source' | 'value-differs'
  source?: string
  cms?: string
  detail?: string
}

const drifts: Drift[] = []

// Trim + collapse whitespace for fair comparison
function norm(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/\s+/g, ' ').trim()
}

function compareString(
  collection: string,
  slug: string,
  field: string,
  source: string | undefined,
  cms: string | null | undefined,
) {
  const a = norm(source)
  const b = norm(cms)
  if (a === b) return
  drifts.push({
    collection,
    slug,
    field,
    kind: 'value-differs',
    source: a.slice(0, 200),
    cms: b.slice(0, 200),
  })
}

function compareFaqs(
  collection: string,
  slug: string,
  sourceFaqs: Array<{ question: string; answer: string }> | undefined,
  cmsFaqs: Array<{ question?: string; answer?: string }> | undefined,
) {
  const src = sourceFaqs || []
  const cmsArr = cmsFaqs || []
  const max = Math.max(src.length, cmsArr.length)
  for (let i = 0; i < max; i++) {
    const s = src[i]
    const c = cmsArr[i]
    if (!s) {
      drifts.push({
        collection,
        slug,
        field: `faqs[${i}]`,
        kind: 'missing-in-source',
        cms: norm(c?.question).slice(0, 100),
        detail: 'CMS has FAQ that source does not',
      })
      continue
    }
    if (!c) {
      drifts.push({
        collection,
        slug,
        field: `faqs[${i}]`,
        kind: 'missing-in-cms',
        source: norm(s.question).slice(0, 100),
        detail: 'Source has FAQ that CMS does not',
      })
      continue
    }
    compareString(collection, slug, `faqs[${i}].question`, s.question, c.question)
    compareString(collection, slug, `faqs[${i}].answer`, s.answer, c.answer)
  }
}

// ----------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------
async function run() {
  const payload = await getPayload({ config })
  console.log(
    `\nDrift check — collection=${collectionFilter || 'all'}, slug=${slugFilter || 'all'}\n`,
  )

  // --- BLOG POSTS ---
  if (!collectionFilter || collectionFilter === 'blog-posts') {
    console.log('Comparing blog-posts...')
    const cmsResult = await payload.find({
      collection: 'blog-posts',
      limit: 500,
      depth: 0,
      draft: false,
      where: { status: { equals: 'published' } },
    })
    const cmsBySlug = new Map(
      (cmsResult.docs as unknown as Array<Record<string, unknown>>).map((d) => [
        d.slug as string,
        d,
      ]),
    )

    const sourcePosts = slugFilter
      ? blogPosts.filter((p) => p.slug === slugFilter)
      : blogPosts

    let checkedCount = 0
    for (const sp of sourcePosts) {
      const cms = cmsBySlug.get(sp.slug)
      if (!cms) {
        drifts.push({
          collection: 'blog-posts',
          slug: sp.slug,
          field: '(record)',
          kind: 'missing-in-cms',
          detail: 'Source has post; CMS does not',
        })
        continue
      }
      checkedCount++
      compareString('blog-posts', sp.slug, 'excerpt', sp.excerpt, cms.excerpt as string)
      compareString(
        'blog-posts',
        sp.slug,
        'definitionBlock',
        sp.bluf,
        cms.definitionBlock as string,
      )
      compareFaqs(
        'blog-posts',
        sp.slug,
        sp.faqs,
        cms.faqs as Array<{ question?: string; answer?: string }>,
      )
    }

    // Records in CMS but not in source
    for (const [slug] of cmsBySlug) {
      if (!sourcePosts.find((p) => p.slug === slug)) {
        drifts.push({
          collection: 'blog-posts',
          slug,
          field: '(record)',
          kind: 'missing-in-source',
          detail: 'CMS has post; source-of-truth does not',
        })
      }
    }

    console.log(`  Checked ${checkedCount} blog posts`)
  }

  // --- CITY PAGES ---
  if (!collectionFilter || collectionFilter === 'city-pages') {
    console.log('Comparing city-pages...')
    const cmsResult = await payload.find({
      collection: 'city-pages',
      limit: 500,
      depth: 0,
      draft: false,
    })
    const cmsBySlug = new Map(
      (cmsResult.docs as unknown as Array<Record<string, unknown>>).map((d) => [
        d.slug as string,
        d,
      ]),
    )

    const allCityValues = Object.values(cityData)
    const sourceCities = slugFilter
      ? allCityValues.filter((c) => c.slug === slugFilter)
      : allCityValues

    let checkedCount = 0
    for (const sc of sourceCities) {
      const cms = cmsBySlug.get(sc.slug)
      if (!cms) {
        drifts.push({
          collection: 'city-pages',
          slug: sc.slug,
          field: '(record)',
          kind: 'missing-in-cms',
          detail: 'Source has city; CMS does not',
        })
        continue
      }
      checkedCount++
      compareFaqs(
        'city-pages',
        sc.slug,
        sc.faqs,
        cms.faqs as Array<{ question?: string; answer?: string }>,
      )
    }

    for (const [slug] of cmsBySlug) {
      if (!sourceCities.find((c: { slug: string }) => c.slug === slug)) {
        drifts.push({
          collection: 'city-pages',
          slug,
          field: '(record)',
          kind: 'missing-in-source',
          detail: 'CMS has city; source-of-truth does not',
        })
      }
    }

    console.log(`  Checked ${checkedCount} city pages`)
  }

  // --- REPORT ---
  console.log('\n=== Drift Report ===\n')
  if (drifts.length === 0) {
    console.log('No drift detected. Source and CMS match.')
    process.exit(0)
  }

  // Group by collection + slug
  const byKey = new Map<string, Drift[]>()
  for (const d of drifts) {
    const key = `${d.collection}/${d.slug}`
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(d)
  }

  console.log(`Total drift entries: ${drifts.length} across ${byKey.size} record(s)\n`)
  for (const [key, list] of byKey) {
    console.log(`\n${key}  (${list.length} drift${list.length === 1 ? '' : 's'})`)
    for (const d of list) {
      if (d.kind === 'missing-in-cms') {
        console.log(`  [missing-in-cms] ${d.field} — ${d.detail || ''}`)
        if (d.source) console.log(`    source: ${d.source}`)
      } else if (d.kind === 'missing-in-source') {
        console.log(`  [missing-in-source] ${d.field} — ${d.detail || ''}`)
        if (d.cms) console.log(`    cms: ${d.cms}`)
      } else {
        console.log(`  [value-differs] ${d.field}`)
        console.log(`    source: ${d.source || '(empty)'}`)
        console.log(`    cms:    ${d.cms || '(empty)'}`)
      }
    }
  }

  // Summary by drift kind
  const byKind: Record<string, number> = {}
  for (const d of drifts) byKind[d.kind] = (byKind[d.kind] || 0) + 1
  console.log('\n--- Summary by kind ---')
  for (const [k, n] of Object.entries(byKind)) console.log(`  ${k}: ${n}`)

  process.exit(0)
}

run().catch((err) => {
  console.error('Drift check failed:', err)
  process.exit(1)
})
