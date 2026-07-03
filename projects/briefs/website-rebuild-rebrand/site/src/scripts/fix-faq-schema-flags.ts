/**
 * fix-faq-schema-flags.ts
 *
 * One-shot fix: on the /faq/ CMS page, walk the layout and set every
 * FAQ block's generateSchema to false. The page route now aggregates
 * all FAQ items into ONE page-level FAQPage schema (Google guideline:
 * one FAQPage per page, not multiple).
 *
 * Idempotent — safe to re-run.
 *
 * USAGE
 *   npm run fix-faq-flags                     (dry-run, default)
 *   npm run fix-faq-flags -- --apply          (write)
 */

import { getPayload } from 'payload'
import config from '@payload-config'

const apply = process.argv.includes('--apply')

async function run() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'faq' }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
    draft: false,
  })

  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined
  if (!doc) {
    console.error('Could not find pages/faq published record')
    process.exit(1)
  }

  const layout = doc.layout as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(layout)) {
    console.error('pages/faq has no layout array')
    process.exit(1)
  }

  const newLayout = layout.map((block) => {
    if (block && block.blockType === 'faq' && block.generateSchema !== false) {
      console.log(`  Flipping generateSchema → false on FAQ block: "${block.heading}"`)
      return { ...block, generateSchema: false }
    }
    return block
  })

  const changed = newLayout.some((b, i) => b !== layout[i])
  if (!changed) {
    console.log('All FAQ blocks already have generateSchema: false. No changes.')
    process.exit(0)
  }

  if (!apply) {
    console.log('\nDry-run only. Re-run with --apply to write.')
    process.exit(0)
  }

  await payload.update({
    collection: 'pages',
    id: doc.id as string | number,
    data: { layout: newLayout, _status: 'published' },
    overrideAccess: true,
    draft: false,
  })
  console.log(`✓ Updated pages/faq (id=${doc.id}).`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Fix failed:', err)
  process.exit(1)
})
