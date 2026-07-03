// Probe Payload's local API to read the home page's stored layout from Supabase.
// Counts FAQ items in the Common Questions block.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

const payload = await getPayload({ config })
const result = await payload.find({
  collection: 'pages',
  where: { slug: { equals: '/' } },
  limit: 1,
})

if (result.docs.length === 0) {
  console.log('No homepage doc found in Supabase.')
  process.exit(1)
}

const layout = result.docs[0].layout || []
console.log(`Total blocks in homepage layout: ${layout.length}`)

const faqBlocks = layout.filter((b) => b.blockType === 'faq')
console.log(`FAQ blocks: ${faqBlocks.length}`)

faqBlocks.forEach((b, i) => {
  const items = b.items || []
  console.log(`\nFAQ block ${i + 1}: heading="${b.heading}" — ${items.length} items`)
  items.forEach((it, j) => console.log(`  ${j + 1}. ${it.question}`))
})

process.exit(0)
