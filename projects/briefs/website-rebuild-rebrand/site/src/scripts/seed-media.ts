/**
 * seed-media.ts — Upload WebP images to Payload Media collection and link them
 * to seeded pages and blog posts.
 *
 * Run with:
 *   npm run seed:media
 *
 * What it does:
 *   1. Uploads each WebP from public/images/ to the Media collection (skips duplicates)
 *   2. Links hero backgroundImage on pages: Homepage, TMCP, One-Time, Commercial,
 *      How It Works, Reviews
 *   3. Links featuredImage on 7 blog posts
 */

import { getPayload } from 'payload'
import config from '../payload.config'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Image definitions ────────────────────────────────────────────────────────

const IMAGES_DIR = path.resolve(__dirname, '../../public/images')

const IMAGE_ALT: Record<string, string> = {
  'hero-lawn.webp': 'Healthy green lawn in Western Washington — Got Moles mole control',
  'hero-home.webp': 'Got Moles team in Western Washington forest clearing — mole control specialists',
  'hero-faq.webp': 'Spencer Hill explaining mole control methods to the Got Moles team',
  'mole-damage.webp': 'Mole hills damaging a residential lawn in Western Washington',
  'clean-yard.webp': 'A healthy, mole-free yard where kids and pets can play',
  'inspection.webp': 'Got Moles technician inspecting a yard for mole activity',
  'commercial-grounds.webp': 'Commercial property grounds maintained by Got Moles',
  'service-area.webp': 'Western Washington service area map',
  'results.webp': 'Mole-free yard after Got Moles treatment',
  'blog-choose-company.webp': 'Homeowner researching mole control companies',
  'blog-diy-vs-pro.webp': 'DIY mole trap next to professional equipment comparison',
  'blog-cost.webp': 'Cost breakdown of mole removal services in Washington',
  'blog-pet-safety.webp': 'Dog playing safely on a mole-free lawn',
  'blog-monthly-vs-onetime.webp': 'Monthly vs one-time mole control comparison',
  'blog-seasonal.webp': 'Seasonal mole activity patterns in Washington State',
  'blog-coming-back.webp': 'Mole mounds reappearing in a previously treated yard',
  'case-study-sports-field.webp': 'Mole-free soccer field at a Pierce County sports complex',
  'case-study-public-park.webp': 'Mole-free public park in King County',
  'case-study-airport.webp': 'Mole-free airport taxiway turf in Western Washington',
  'case-study-property-management.webp': 'Mole-free residential community managed by Got Moles',
}

// ─── Page → image mapping (slug → image filename) ────────────────────────────

const PAGE_HERO_IMAGES: Record<string, string> = {
  '/': 'hero-home.webp',
  'total-mole-control-program': 'results.webp',
  'one-time-mole-removal': 'mole-damage.webp',
  'commercial-mole-control': 'commercial-grounds.webp',
  'how-it-works': 'inspection.webp',
  'reviews': 'results.webp',
  'faq': 'hero-faq.webp',
}

// ─── Page → imageText block image mapping (slug → [image filenames in block order]) ─
// Each entry maps imageText blocks on a page to their image files, in block order.

const PAGE_IMAGETEXT_IMAGES: Record<string, string[]> = {
  'commercial-case-studies': [
    'case-study-sports-field.webp',
    'case-study-public-park.webp',
    'case-study-airport.webp',
    'case-study-property-management.webp',
  ],
}

// ─── Blog post → image mapping (slug → image filename) ───────────────────────

const BLOG_FEATURED_IMAGES: Record<string, string> = {
  'how-to-choose-a-mole-control-company': 'blog-choose-company.webp',
  'diy-vs-professional-mole-control': 'blog-diy-vs-pro.webp',
  'mole-removal-cost-washington': 'blog-cost.webp',
  'mole-control-safe-for-pets': 'blog-pet-safety.webp',
  'monthly-vs-one-time-mole-control': 'blog-monthly-vs-onetime.webp',
  'do-moles-hibernate': 'blog-seasonal.webp', // renamed from when-are-moles-most-active-washington (cornerstone-url-recovery 2026-05-02)
  'why-moles-keep-coming-back': 'blog-coming-back.webp',
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedMedia() {
  console.log('\nGot Moles — seed:media')
  console.log('─'.repeat(50))

  console.log('\nConnecting to Payload...')
  const payload = await getPayload({ config })
  console.log('Connected.\n')

  // ── 1. UPLOAD IMAGES ────────────────────────────────────────────────────────
  console.log('Step 1: Uploading WebP images to Media collection...')

  // Build a map of filename → media document ID for use in later steps
  const mediaIdMap: Record<string, number | string> = {}

  // Get all .webp files in the images directory
  let webpFiles: string[]
  try {
    webpFiles = fs
      .readdirSync(IMAGES_DIR)
      .filter((f) => f.endsWith('.webp'))
      .sort()
  } catch (err) {
    console.error(`  ERROR: Could not read images directory at ${IMAGES_DIR}`)
    console.error('  Make sure the public/images/ directory exists and contains WebP files.')
    process.exit(1)
  }

  if (webpFiles.length === 0) {
    console.warn('  No .webp files found in public/images/. Skipping upload step.')
  } else {
    console.log(`  Found ${webpFiles.length} WebP files.\n`)
  }

  let uploadCount = 0
  let skipCount = 0

  for (const filename of webpFiles) {
    const alt = IMAGE_ALT[filename] ?? filename.replace('.webp', '').replace(/-/g, ' ')

    try {
      // Check if already uploaded (match on filename stored in 'filename' field by Payload)
      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: filename } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        const doc = existing.docs[0]
        mediaIdMap[filename] = doc.id
        skipCount++
        console.log(`  SKIP  ${filename} (already in Media, id: ${doc.id})`)
        continue
      }

      // Read file from disk
      const filePath = path.join(IMAGES_DIR, filename)
      const fileData = fs.readFileSync(filePath)
      const fileSize = fs.statSync(filePath).size

      // Upload to Payload — use overwrite to handle existing Vercel Blob files
      const doc = await payload.create({
        collection: 'media',
        data: {
          alt,
        },
        file: {
          data: fileData,
          mimetype: 'image/webp',
          name: filename,
          size: fileSize,
        },
        overwriteExistingFiles: true,
      })

      mediaIdMap[filename] = doc.id
      uploadCount++
      console.log(`  UP    ${filename} → id: ${doc.id}`)
    } catch (err: any) {
      console.error(`  ERROR uploading ${filename}:`, err?.message ?? err)
    }
  }

  console.log(`\n  Uploads complete: ${uploadCount} uploaded, ${skipCount} already existed.`)

  // ── 2. LINK IMAGES TO PAGES (Hero backgroundImage) ──────────────────────────
  console.log('\nStep 2: Linking hero images to pages...')

  let pageUpdateCount = 0
  let pageSkipCount = 0

  for (const [slug, imageFilename] of Object.entries(PAGE_HERO_IMAGES)) {
    const mediaId = mediaIdMap[imageFilename]

    if (!mediaId) {
      console.warn(`  WARN  Page "${slug}": media not found for "${imageFilename}" — skipping`)
      continue
    }

    try {
      // Fetch the page
      const pageResult = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      if (pageResult.docs.length === 0) {
        console.warn(`  WARN  Page with slug "${slug}" not found in database — skipping`)
        pageSkipCount++
        continue
      }

      const page = pageResult.docs[0]
      const layout = (page.layout ?? []) as any[]

      // Find the first Hero block
      const heroIndex = layout.findIndex((block: any) => block.blockType === 'hero')

      if (heroIndex === -1) {
        console.warn(`  WARN  Page "${slug}": no Hero block found in layout — skipping`)
        pageSkipCount++
        continue
      }

      // Check if backgroundImage is already set to this media
      const currentHero = layout[heroIndex]
      const currentBgImage = currentHero.backgroundImage

      // Payload may return the relation as an object {id: ...} or a scalar ID
      const currentId =
        currentBgImage && typeof currentBgImage === 'object'
          ? (currentBgImage as any).id
          : currentBgImage

      if (currentId && String(currentId) === String(mediaId)) {
        console.log(`  SKIP  Page "${slug}": backgroundImage already set to ${mediaId}`)
        pageSkipCount++
        continue
      }

      // Build updated layout with the hero block's backgroundImage set
      const updatedLayout = layout.map((block: any, i: number) => {
        if (i === heroIndex) {
          return { ...block, backgroundImage: mediaId }
        }
        return block
      })

      await payload.update({
        collection: 'pages',
        id: page.id,
        data: {
          layout: updatedLayout as any,
        },
      })

      pageUpdateCount++
      console.log(`  LINK  Page "${slug}" → Hero backgroundImage = ${imageFilename} (id: ${mediaId})`)
    } catch (err: any) {
      console.error(`  ERROR linking page "${slug}":`, err?.message ?? err)
    }
  }

  console.log(
    `\n  Pages complete: ${pageUpdateCount} updated, ${pageSkipCount} skipped.`,
  )

  // ── 3. LINK IMAGES TO BLOG POSTS (featuredImage) ────────────────────────────
  console.log('\nStep 3: Linking featured images to blog posts...')

  let blogUpdateCount = 0
  let blogSkipCount = 0

  for (const [slug, imageFilename] of Object.entries(BLOG_FEATURED_IMAGES)) {
    const mediaId = mediaIdMap[imageFilename]

    if (!mediaId) {
      console.warn(`  WARN  Blog "${slug}": media not found for "${imageFilename}" — skipping`)
      continue
    }

    try {
      // Fetch the blog post
      const postResult = await payload.find({
        collection: 'blog-posts',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      if (postResult.docs.length === 0) {
        console.warn(`  WARN  Blog post with slug "${slug}" not found in database — skipping`)
        blogSkipCount++
        continue
      }

      const post = postResult.docs[0]

      // Check if featuredImage is already set to this media
      const currentFeatured = (post as any).featuredImage
      const currentId =
        currentFeatured && typeof currentFeatured === 'object'
          ? (currentFeatured as any).id
          : currentFeatured

      if (currentId && String(currentId) === String(mediaId)) {
        console.log(`  SKIP  Blog "${slug}": featuredImage already set to ${mediaId}`)
        blogSkipCount++
        continue
      }

      await payload.update({
        collection: 'blog-posts',
        id: post.id,
        data: {
          featuredImage: mediaId as any,
        },
      })

      blogUpdateCount++
      console.log(`  LINK  Blog "${slug}" → featuredImage = ${imageFilename} (id: ${mediaId})`)
    } catch (err: any) {
      console.error(`  ERROR linking blog post "${slug}":`, err?.message ?? err)
    }
  }

  console.log(
    `\n  Blog posts complete: ${blogUpdateCount} updated, ${blogSkipCount} skipped.`,
  )

  // ── 4. LINK IMAGES TO IMAGETEXT BLOCKS ───────────────────────────────────────
  console.log('\nStep 4: Linking imageText block images on pages...')

  let imageTextUpdateCount = 0
  let imageTextSkipCount = 0

  for (const [slug, imageFilenames] of Object.entries(PAGE_IMAGETEXT_IMAGES)) {
    try {
      const pageResult = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      if (pageResult.docs.length === 0) {
        console.warn(`  WARN  Page "${slug}" not found — skipping imageText linking`)
        imageTextSkipCount++
        continue
      }

      const page = pageResult.docs[0]
      const layout = (page.layout ?? []) as any[]

      // Find all imageText blocks in order
      const imageTextIndices = layout
        .map((block: any, i: number) => block.blockType === 'imageText' ? i : -1)
        .filter((i: number) => i !== -1)

      if (imageTextIndices.length === 0) {
        console.warn(`  WARN  Page "${slug}": no imageText blocks found — skipping`)
        imageTextSkipCount++
        continue
      }

      let updated = false
      const updatedLayout = [...layout]

      for (let j = 0; j < Math.min(imageTextIndices.length, imageFilenames.length); j++) {
        const blockIndex = imageTextIndices[j]
        const filename = imageFilenames[j]
        const mediaId = mediaIdMap[filename]

        if (!mediaId) {
          console.warn(`  WARN  Page "${slug}" block ${j}: media not found for "${filename}"`)
          continue
        }

        const currentImage = updatedLayout[blockIndex].image
        const currentId = currentImage && typeof currentImage === 'object'
          ? (currentImage as any).id
          : currentImage

        if (currentId && String(currentId) === String(mediaId)) {
          console.log(`  SKIP  Page "${slug}" block ${j}: image already set`)
          continue
        }

        updatedLayout[blockIndex] = { ...updatedLayout[blockIndex], image: mediaId }
        updated = true
        console.log(`  LINK  Page "${slug}" block ${j} → ${filename} (id: ${mediaId})`)
      }

      if (updated) {
        await payload.update({
          collection: 'pages',
          id: page.id,
          data: { layout: updatedLayout as any },
        })
        imageTextUpdateCount++
      } else {
        imageTextSkipCount++
      }
    } catch (err: any) {
      console.error(`  ERROR linking imageText on "${slug}":`, err?.message ?? err)
    }
  }

  console.log(
    `\n  ImageText linking complete: ${imageTextUpdateCount} pages updated, ${imageTextSkipCount} skipped.`,
  )

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log('seed:media complete.')
  console.log(`  Media: ${uploadCount} uploaded, ${skipCount} already existed`)
  console.log(`  Pages: ${pageUpdateCount} hero images linked, ${pageSkipCount} skipped`)
  console.log(`  Blog posts: ${blogUpdateCount} featured images linked, ${blogSkipCount} skipped`)
  console.log(`  ImageText: ${imageTextUpdateCount} pages updated, ${imageTextSkipCount} skipped`)
  console.log('')

  process.exit(0)
}

seedMedia().catch((err) => {
  console.error('\nFatal error during seed:media:', err)
  process.exit(1)
})
