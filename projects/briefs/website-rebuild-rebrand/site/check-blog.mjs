import { getPayload } from 'payload'
import config from './src/payload.config.ts'

const payload = await getPayload({ config })

// Compare my new blog vs an existing working blog
for (const slug of ['how-many-eyes-do-moles-have', 'are-moles-blind']) {
  console.log(`\n=== ${slug} ===`)
  const result = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: slug } },
    limit: 5,
    draft: false,
  })
  console.log('docs count (draft: false):', result.docs.length)
  for (const d of result.docs) {
    console.log({
      id: d.id,
      slug: d.slug,
      status: d.status,
      urlPattern: d.urlPattern,
      _status: d._status,
    })
  }
}

process.exit(0)
