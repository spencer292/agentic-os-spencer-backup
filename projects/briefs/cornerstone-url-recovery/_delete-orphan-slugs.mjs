// One-off: delete blog-post DB records orphaned by the cornerstone-url-recovery slug renames.
// After deletion, run `npm run seed -- --reseed-blogs all` to repopulate cleanly.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from './src/payload.config.ts'

const ORPHAN_SLUGS = [
  'mole-vs-vole-vs-gopher',          // renamed → voles-vs-moles-whats-the-difference
  'when-are-moles-most-active-washington', // renamed → do-moles-hibernate
  'how-to-get-rid-of-moles',          // renamed → how-to-get-rid-of-moles-in-your-yard
]

const payload = await getPayload({ config })

for (const slug of ORPHAN_SLUGS) {
  const found = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: slug } },
    limit: 5,
  })
  if (found.docs.length === 0) {
    console.log(`  ${slug}: not in DB (already clean)`)
    continue
  }
  for (const doc of found.docs) {
    await payload.delete({ collection: 'blog-posts', id: doc.id })
    console.log(`  ${slug}: deleted (id=${doc.id})`)
  }
}

console.log('\n✅ Orphan cleanup complete. Now run: npm run seed -- --reseed-blogs all')
process.exit(0)
