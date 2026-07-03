/**
 * Seed script — populates Payload CMS with Got Moles content.
 *
 * Run with:
 *   npx tsx src/scripts/seed.ts           (defaults to --test mode: Sammamish only)
 *   npx tsx src/scripts/seed.ts --test    (Sammamish only — fast verification)
 *   npx tsx src/scripts/seed.ts --all     (all 33 cities + 7 blog posts + pages)
 *   npx tsx src/scripts/seed.ts --reseed home          (delete + recreate homepage)
 *   npx tsx src/scripts/seed.ts --reseed home,about    (delete + recreate multiple)
 *   npx tsx src/scripts/seed.ts --reseed all            (delete + recreate ALL pages)
 *
 * Seed order:
 *   1. Authors     (Spencer Hill, Cory Ventura)
 *   2. Services    (TMCP, One-Time Removal, Commercial)
 *   3. Testimonials (183 reviews from testimonial-data.ts, top 6 featured)
 *   4. City Pages  (Sammamish only in --test, all 33 in --all)
 *   5. Blog Posts  (--all only)
 *   6. Pages       (block-based CMS pages, --all only OR --reseed)
 *   7. Globals     (site-settings, header, footer — always runs)
 */

import { getPayload } from 'payload'
import config from '../payload.config'
import { cityData } from '../lib/city-data'
import { blogPosts } from '../lib/blog-data'
import { testimonialData } from '../lib/testimonial-data'
import {
  homepageBlocks, homepageMeta,
  tmcpBlocks, tmcpMeta,
  oneTimeBlocks, oneTimeMeta,
  commercialBlocks, commercialMeta,
  howItWorksBlocks, howItWorksMeta,
  aboutBlocks, aboutMeta,
  faqBlocks, faqMeta,
  contactBlocks, contactMeta,
  reviewsBlocks, reviewsMeta,
  commercialCaseStudiesBlocks, commercialCaseStudiesMeta,
  servicesHubBlocks, servicesHubMeta,
} from '../lib/pages-data'

// ─── CLI argument parsing ────────────────────────────────────────────────────

const args = process.argv.slice(2)
const isAll = args.includes('--all')

// --reseed-blogs [all|slug1,slug2] — delete matching blog posts and recreate
const reseedBlogsIdx = args.indexOf('--reseed-blogs')
const isReseedBlogs = reseedBlogsIdx !== -1
const reseedBlogsValue = isReseedBlogs ? (args[reseedBlogsIdx + 1] || 'all') : ''
const reseedBlogSlugs = isReseedBlogs
  ? reseedBlogsValue === 'all'
    ? ['all']
    : reseedBlogsValue.split(',').map((s) => s.trim())
  : []

// --reseed [all|slug1,slug2] — page-level reseed (not blogs)
const reseedArg = args.find(
  (a) => a === '--reseed' || (a.startsWith('--reseed') && a !== '--reseed-blogs'),
)
const reseedValue = reseedArg ? (args[args.indexOf(reseedArg) + 1] || '') : ''
const isReseed = !!reseedArg
const reseedSlugs = isReseed
  ? reseedValue === 'all'
    ? ['all']
    : reseedValue.split(',').map((s: string) => {
        // Map friendly names to slugs
        const map: Record<string, string> = {
          home: '/', homepage: '/',
          tmcp: 'total-mole-control-program',
          'one-time': 'one-time-mole-removal',
          commercial: 'commercial-mole-control',
          'how-it-works': 'how-it-works',
          about: 'about', faq: 'faq',
          contact: 'contact', reviews: 'reviews',
          'case-studies': 'commercial-case-studies',
          services: 'services',
        }
        return map[s.trim()] || s.trim()
      })
  : []
const isTest = !isAll && !isReseed && !isReseedBlogs && (args.includes('--test') || true)

const mode = isReseedBlogs
  ? `--reseed-blogs ${reseedBlogsValue}`
  : isReseed
    ? `--reseed ${reseedValue}`
    : isAll
      ? '--all'
      : '--test'
console.log(`\nGot Moles seed script (mode: ${mode})`)
console.log('─'.repeat(50))

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a Lexical text node.
 */
function textNode(text: string) {
  return {
    type: 'text',
    text,
    version: 1,
    format: 0,
    detail: 0,
    mode: 'normal',
    style: '',
  }
}

/**
 * Build a Lexical link node wrapping a text child.
 * URL is treated as 'custom' (internal or external) and opens in the same tab.
 */
function linkNode(text: string, url: string) {
  return {
    type: 'link',
    version: 2,
    fields: {
      url,
      newTab: false,
      linkType: 'custom',
    },
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [textNode(text)],
  }
}

/**
 * Parse a paragraph string into an array of Lexical inline children
 * (text nodes and link nodes), honouring markdown-style [text](url) syntax.
 *
 * Example:
 *   "See our [TMCP page](/services/tmcp/) for details."
 * produces three children: text("See our "), link("TMCP page", "/services/tmcp/"),
 * text(" for details.").
 */
function paragraphToInlineChildren(para: string): object[] {
  const children: object[] = []
  // Match **bold** OR [link](url). Process in source order so they can interleave.
  const RE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = RE.exec(para)) !== null) {
    if (match.index > lastIndex) {
      children.push(textNode(para.slice(lastIndex, match.index)))
    }
    if (match[1] !== undefined) {
      children.push({ ...textNode(match[1]), format: 1 })
    } else {
      children.push(linkNode(match[2], match[3]))
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < para.length) {
    children.push(textNode(para.slice(lastIndex)))
  }

  if (children.length === 0) {
    children.push(textNode(para))
  }

  return children
}

/**
 * Build a minimal Lexical richText JSON node tree from an array of sections.
 * Each section becomes an h2 heading node followed by paragraph nodes
 * (splitting on double-newlines to produce multiple paragraphs where present).
 *
 * Paragraphs containing markdown-style [text](url) links are parsed into
 * interleaved text + link child nodes. Plain paragraphs remain single-text.
 */
function sectionsToLexical(sections: { heading: string; body: string }[]) {
  const children: object[] = []

  for (const section of sections) {
    // h2 heading node
    children.push({
      type: 'heading',
      tag: 'h2',
      version: 1,
      children: [textNode(section.heading)],
      direction: 'ltr',
      format: '',
      indent: 0,
    })

    // Split body on double newlines to create separate paragraph nodes
    const paragraphs = section.body.split(/\n\n+/).filter(Boolean)
    for (const para of paragraphs) {
      children.push({
        type: 'paragraph',
        version: 1,
        children: paragraphToInlineChildren(para.trim()),
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
      })
    }
  }

  return {
    root: {
      type: 'root',
      version: 1,
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
    },
  }
}

/**
 * Convert a BlogPost table object into Lexical table nodes (heading + table).
 * Returns an array of nodes to push into the Lexical root children.
 */
function tableToLexical(table: { heading: string; headers: string[]; rows: string[][] }): object[] {
  const nodes: object[] = []

  // H2 heading above the table
  nodes.push({
    type: 'heading',
    tag: 'h2',
    version: 1,
    children: [textNode(table.heading)],
    direction: 'ltr',
    format: '',
    indent: 0,
  })

  const tableChildren: object[] = []

  // Header row
  tableChildren.push({
    type: 'tablerow',
    version: 1,
    children: table.headers.map((header) => ({
      type: 'tablecell',
      version: 1,
      headerState: 1,
      colSpan: 1,
      rowSpan: 1,
      width: undefined,
      backgroundColor: null,
      children: [{
        type: 'paragraph',
        version: 1,
        children: [textNode(header)],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
      }],
      direction: 'ltr',
      format: '',
      indent: 0,
    })),
    direction: 'ltr',
    format: '',
    indent: 0,
  })

  // Data rows
  for (const row of table.rows) {
    tableChildren.push({
      type: 'tablerow',
      version: 1,
      children: row.map((cell) => ({
        type: 'tablecell',
        version: 1,
        headerState: 0,
        colSpan: 1,
        rowSpan: 1,
        width: undefined,
        backgroundColor: null,
        children: [{
          type: 'paragraph',
          version: 1,
          children: [textNode(cell)],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
        }],
        direction: 'ltr',
        format: '',
        indent: 0,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
    })
  }

  nodes.push({
    type: 'table',
    version: 1,
    children: tableChildren,
    direction: 'ltr',
    format: '',
    indent: 0,
  })

  return nodes
}

/**
 * Rough word count from blog post sections.
 */
function estimateWordCount(sections: { heading: string; body: string }[]): number {
  return sections.reduce((total, s) => {
    return total + s.heading.split(/\s+/).length + s.body.split(/\s+/).length
  }, 0)
}

/**
 * Map county string from city-data to CityPages select value.
 */
function mapCounty(countyStr: string): 'king' | 'pierce' | 'thurston' | 'snohomish' {
  const map: Record<string, 'king' | 'pierce' | 'thurston' | 'snohomish'> = {
    'King County': 'king',
    'Pierce County': 'pierce',
    'Thurston County': 'thurston',
    'Snohomish County': 'snohomish',
  }
  return map[countyStr] ?? 'king'
}

/**
 * Priority cities — these get the 'priority' select value.
 */
const PRIORITY_SLUGS = new Set([
  'sammamish',
  'bellevue',
  'kirkland',
  'seattle',
  'tacoma',
  'puyallup',
  'enumclaw',
])

/**
 * Map blog post cluster string to BlogPosts keywordCluster select value.
 */
function mapCluster(
  cluster: string,
): 'mole-control' | 'biology' | 'diy-pro' | 'cost-value' | 'safety' | 'seasonal' | 'commercial' {
  const map: Record<
    string,
    'mole-control' | 'biology' | 'diy-pro' | 'cost-value' | 'safety' | 'seasonal' | 'commercial'
  > = {
    'Mole Control': 'mole-control',
    Biology: 'biology',
    'DIY vs Pro': 'diy-pro',
    'Cost & Value': 'cost-value',
    Safety: 'safety',
    Seasonal: 'seasonal',
    Commercial: 'commercial',
  }
  return map[cluster] ?? 'mole-control'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\nConnecting to Payload...')
  const payload = await getPayload({ config })
  console.log('Connected.\n')

  // ── RESEED MODE: skip to pages section ────────────────────────────────────
  if (isReseed) {
    console.log('Reseed mode — skipping authors, services, testimonials, cities, blog.\n')
  }
  if (isReseedBlogs) {
    console.log(
      `Reseed-blogs mode — skipping authors, services, testimonials, cities, pages. Target: ${reseedBlogsValue}.\n`,
    )
  }

  // Author IDs are hoisted so blog reseed mode can still attach Spencer.
  let spencerId: number | string | null = null
  let coreyId: number | string | null = null

  // ── 1. AUTHORS ────────────────────────────────────────────────────────────
  if (!isReseed && !isReseedBlogs) { // begin non-reseed block
  console.log('Seeding authors...')

  try {
    const existingSpencer = await payload.find({
      collection: 'authors',
      where: { name: { equals: 'Spencer Hill' } },
      limit: 1,
    })
    if (existingSpencer.docs.length > 0) {
      spencerId = existingSpencer.docs[0].id
      console.log('  Spencer Hill already exists, skipping.')
    } else {
      const spencer = await payload.create({
        collection: 'authors',
        data: {
          name: 'Spencer Hill',
          role: 'Founder & Owner',
          bio: "Spencer Hill founded Got Moles in Enumclaw, WA in 2017. A U.S. Army veteran with 15+ years of personal mole trapping experience, Spencer has personally developed the chemical-free methods that Got Moles uses across nearly 5,000 client properties. Spencer grew up in nearby Buckley and has been trapping Townsend's moles in Western Washington his entire adult life.",
          veteranStatus: true,
        },
      })
      spencerId = spencer.id
      console.log('  Spencer Hill created.')
    }
  } catch (err) {
    console.error('  Error creating Spencer Hill:', err)
  }

  try {
    const existingCory = await payload.find({
      collection: 'authors',
      where: { name: { equals: 'Cory Ventura' } },
      limit: 1,
    })
    if (existingCory.docs.length > 0) {
      coreyId = existingCory.docs[0].id
      console.log('  Cory Ventura already exists, skipping.')
    } else {
      const corey = await payload.create({
        collection: 'authors',
        data: {
          name: 'Cory Ventura',
          role: 'Lead Technician',
          bio: 'Cory Ventura is Got Moles lead technician, serving King and Pierce County properties. With years of hands-on experience trapping Townsend\'s moles in Western Washington, Cory is the technician behind many of Got Moles\' highest-reviewed service visits.',
          veteranStatus: false,
        },
      })
      coreyId = corey.id
      console.log('  Cory Ventura created.')
    }
  } catch (err) {
    console.error('  Error creating Cory Ventura:', err)
  }

  // ── 2. SERVICES ───────────────────────────────────────────────────────────
  console.log('\nSeeding services...')

  const servicesToSeed = [
    {
      name: 'Total Mole Control Program',
      shortName: 'TMCP',
      slug: 'total-mole-control-program',
      serviceType: 'residential-recurring' as const,
      pricing: {
        price: '$100/month',
        setupFee: '$150',
        commitment: '12-month minimum',
        propertyLimit: 'Under 1 acre',
      },
      summary:
        'Year-round mole monitoring and protection. Regular technician visits, immediate response to new activity at no extra charge, and a written report after every visit. The only way to prevent moles from coming back.',
      guarantee:
        "If moles appear between scheduled visits, we return immediately at no additional charge. That's not a promotional offer — it's how the program works.",
      status: 'published' as const,
    },
    {
      name: 'One-Time Mole Removal',
      shortName: 'One-Time',
      slug: 'one-time-mole-removal',
      serviceType: 'residential-onetime' as const,
      pricing: {
        price: '$450 flat rate',
        setupFee: '$150',
        commitment: undefined,
        propertyLimit: 'Under 1 acre',
      },
      summary:
        'Focused, intensive mole removal that runs for approximately one month. Includes full property inspection, professional equipment placement, 4-5 weekly visits, all equipment removal, and a guarantee: if no moles are caught, you pay only the $150 setup fee.',
      guarantee:
        'A $150 setup fee is collected upfront. If we do not catch a mole during the service period, the remaining $300 is not charged.',
      status: 'published' as const,
    },
    {
      name: 'Commercial Mole Control',
      shortName: 'Commercial',
      slug: 'commercial-mole-control',
      serviceType: 'commercial' as const,
      pricing: {
        price: 'Custom quote',
        setupFee: undefined,
        commitment: undefined,
        propertyLimit: undefined,
      },
      summary:
        'Mole control for commercial properties, HOAs, golf courses, athletic fields, and multi-unit residential. Tailored programs based on property size, usage, and required service frequency. Chemical-free methods safe for employees, residents, and visitors.',
      guarantee: 'Commercial contracts include guaranteed response times and written service reports.',
      status: 'published' as const,
    },
  ]

  for (const svc of servicesToSeed) {
    try {
      const existing = await payload.find({
        collection: 'services',
        where: { slug: { equals: svc.slug } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        console.log(`  ${svc.name} already exists, skipping.`)
        continue
      }

      const pricingData: Record<string, string> = {
        price: svc.pricing.price,
      }
      if (svc.pricing.setupFee) pricingData.setupFee = svc.pricing.setupFee
      if (svc.pricing.commitment) pricingData.commitment = svc.pricing.commitment
      if (svc.pricing.propertyLimit) pricingData.propertyLimit = svc.pricing.propertyLimit

      await payload.create({
        collection: 'services',
        data: {
          name: svc.name,
          shortName: svc.shortName,
          slug: svc.slug,
          serviceType: svc.serviceType,
          pricing: pricingData,
          summary: svc.summary,
          guarantee: svc.guarantee,
          status: svc.status,
        },
      })
      console.log(`  ${svc.name} created.`)
    } catch (err) {
      console.error(`  Error creating service "${svc.name}":`, err)
    }
  }

  // ── 3. TESTIMONIALS ───────────────────────────────────────────────────────
  console.log('\nSeeding testimonials...')

  // 183 enriched reviews from testimonial-data.ts (generated by enrich-reviews.py)
  // Source: projects/briefs/website-rebuild-rebrand/reference-data/reviews.json
  const testimonialsToSeed = [...testimonialData]

  for (const t of testimonialsToSeed) {
    try {
      const existing = await payload.find({
        collection: 'testimonials',
        where: { name: { equals: t.name } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        console.log(`  ${t.name} already exists, skipping.`)
        continue
      }
      await payload.create({
        collection: 'testimonials',
        data: t,
      })
      console.log(`  ${t.name} (${t.city}) created.${t.featured ? ' [featured]' : ''}`)
    } catch (err) {
      console.error(`  Error creating testimonial for "${t.name}":`, err)
    }
  }

  // ── 4. CITY PAGES ─────────────────────────────────────────────────────────
  console.log(`\nSeeding city pages (mode: ${mode})...`)

  const allSlugs = Object.keys(cityData)
  const slugsToSeed = isTest ? ['sammamish'] : allSlugs

  let citySuccessCount = 0
  let citySkipCount = 0

  for (const slug of slugsToSeed) {
    const city = cityData[slug]
    if (!city) {
      console.error(`  City data not found for slug: ${slug}`)
      continue
    }

    try {
      const existing = await payload.find({
        collection: 'city-pages',
        where: { slug: { equals: city.slug } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        citySkipCount++
        console.log(`  ${city.name} already exists, skipping.`)
        continue
      }

      await payload.create({
        collection: 'city-pages',
        data: {
          cityName: city.name,
          slug: city.slug,
          county: mapCounty(city.county),
          priority: PRIORITY_SLUGS.has(city.slug) ? 'priority' : 'standard',
          headline: `Mole Control in ${city.name} — Proven Results from Washington's Mole Specialist`,
          introText: city.intro,
          localDetails: city.localDetails,
          faqs: city.faqs,
          seo: {
            metaTitle: `${city.name} Mole Control | Proven Results`,
            metaDescription: `Professional mole control in ${city.name}, WA. Veteran-owned, chemical-free. Nearly 5,000 clients served since 2017. Call (253) 750-0211.`,
            primaryKeyword: `mole control ${city.name.toLowerCase()}`,
          },
          status: 'published',
        },
      })
      citySuccessCount++
      console.log(
        `  ${city.name} (${city.county}) created.${PRIORITY_SLUGS.has(city.slug) ? ' [priority]' : ''}`,
      )
    } catch (err) {
      console.error(`  Error creating city page for "${city.name}":`, err)
    }
  }

  console.log(
    `  Done: ${citySuccessCount} created, ${citySkipCount} skipped (already existed).`,
  )
  } // end non-reseed block

  // ── 5. BLOG POSTS (--all or --reseed-blogs) ───────────────────────────────
  if (isAll || isReseedBlogs) {
    console.log(
      `\n${isReseedBlogs ? 'Reseeding' : 'Seeding'} blog posts${isReseedBlogs ? ` (target: ${reseedBlogsValue})` : ''}...`,
    )

    if (!spencerId) {
      try {
        const result = await payload.find({
          collection: 'authors',
          where: { name: { equals: 'Spencer Hill' } },
          limit: 1,
        })
        if (result.docs.length > 0) {
          spencerId = result.docs[0].id
          console.log(`  Found Spencer Hill (author), ID: ${spencerId}`)
        } else {
          console.warn('  Warning: Spencer Hill author not found. Blog posts will fail the required author field.')
        }
      } catch (_) {
        // silently continue — create will fail with clear error
      }
    }

    let blogSuccessCount = 0
    let blogSkipCount = 0
    let blogReseedCount = 0

    for (const post of blogPosts) {
      // In reseed-blogs mode, only touch posts whose slug is in the target list
      // (or 'all' means every post).
      const isTargetedForReseed =
        isReseedBlogs &&
        (reseedBlogSlugs.includes('all') || reseedBlogSlugs.includes(post.slug))

      try {
        const existing = await payload.find({
          collection: 'blog-posts',
          where: { slug: { equals: post.slug } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          if (isTargetedForReseed) {
            // Delete existing so we can recreate with updated body/links/etc.
            await payload.delete({
              collection: 'blog-posts',
              id: existing.docs[0].id,
            })
            blogReseedCount++
          } else {
            blogSkipCount++
            if (!isReseedBlogs) {
              console.log(`  "${post.title}" already exists, skipping.`)
            }
            continue
          }
        } else if (isReseedBlogs && !isTargetedForReseed) {
          // In reseed-blogs mode with specific slugs, skip non-targeted posts entirely.
          continue
        }

        const bodyLexical = sectionsToLexical(post.sections)
        if (post.table) {
          const tableNodes = tableToLexical(post.table)
          bodyLexical.root.children.push(...tableNodes)
        }
        const wordCount = estimateWordCount(post.sections)

        await payload.create({
          collection: 'blog-posts',
          data: {
            title: post.title,
            slug: post.slug,
            publishDate: post.date,
            author: spencerId as number,
            status: 'published',
            excerpt: post.excerpt,
            definitionBlock: post.bluf,
            body: bodyLexical as any,
            faqs: post.faqs,
            keywordCluster: mapCluster(post.cluster),
            urlPattern: post.urlPattern || 'blog',
            wordCount,
            seo: {
              metaDescription: post.excerpt,
              primaryKeyword: post.primaryKeyword,
            },
          },
        })
        blogSuccessCount++
        console.log(
          `  "${post.title}" ${isTargetedForReseed ? 'reseeded' : 'created'}. (~${wordCount} words)`,
        )
      } catch (err) {
        console.error(`  Error ${isTargetedForReseed ? 'reseeding' : 'creating'} blog post "${post.title}":`, err)
      }
    }

    console.log(
      `  Done: ${blogSuccessCount} ${isReseedBlogs ? 'written' : 'created'}, ${blogSkipCount} skipped${isReseedBlogs ? `, ${blogReseedCount} reseeded (deleted + recreated)` : ' (already existed)'}.`,
    )
  } else if (!isReseed) {
    console.log('\nBlog posts skipped (run with --all or --reseed-blogs to seed/refresh blog posts).')
  }

  // ── 6. PAGES (block-based CMS pages) ────────────────────────────────────
  if (isAll || isReseed) {
    const allPages = [
      { title: 'Home', slug: '/', layout: homepageBlocks, meta: homepageMeta, schemaType: 'WebPage' },
      { title: 'Total Mole Control Program', slug: 'total-mole-control-program', layout: tmcpBlocks, meta: tmcpMeta, schemaType: 'Service' },
      { title: 'One-Time Mole Removal', slug: 'one-time-mole-removal', layout: oneTimeBlocks, meta: oneTimeMeta, schemaType: 'Service' },
      { title: 'Commercial Mole Control', slug: 'commercial-mole-control', layout: commercialBlocks, meta: commercialMeta, schemaType: 'Service' },
      { title: 'How It Works', slug: 'how-it-works', layout: howItWorksBlocks, meta: howItWorksMeta, schemaType: 'WebPage' },
      { title: 'About Got Moles', slug: 'about', layout: aboutBlocks, meta: aboutMeta, schemaType: 'AboutPage' },
      { title: 'FAQ', slug: 'faq', layout: faqBlocks, meta: faqMeta, schemaType: 'FAQPage' },
      { title: 'Contact', slug: 'contact', layout: contactBlocks, meta: contactMeta, schemaType: 'ContactPage' },
      { title: 'Reviews', slug: 'reviews', layout: reviewsBlocks, meta: reviewsMeta, schemaType: 'WebPage' },
      // Commercial Case Studies: strip CMS image (upload field) but keep fallbackImage (text field)
      // so ImageTextBlock renders static /images/ paths until Payload media is set up.
      { title: 'Commercial Case Studies', slug: 'commercial-case-studies', layout: commercialCaseStudiesBlocks.map((b: any) => b.blockType === 'imageText' ? { ...b, image: undefined } : b), meta: commercialCaseStudiesMeta, schemaType: 'WebPage' },
      { title: 'Services', slug: 'services', layout: servicesHubBlocks.map((b: any) => b.blockType === 'imageText' ? { ...b, image: undefined } : b), meta: servicesHubMeta, schemaType: 'CollectionPage' },
    ]

    // Filter pages for --reseed (or use all for --all)
    const pagesToSeed = isReseed && !reseedSlugs.includes('all')
      ? allPages.filter(p => reseedSlugs.includes(p.slug))
      : allPages

    if (isReseed) {
      console.log(`\nReseeding ${pagesToSeed.length} page(s) (delete + recreate)...`)
    } else {
      console.log('\nSeeding pages (block-based)...')
    }

    for (const page of pagesToSeed) {
      try {
        const existing = await payload.find({
          collection: 'pages',
          where: { slug: { equals: page.slug } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          if (isReseed) {
            // Delete existing page so we can recreate with updated data
            await payload.delete({
              collection: 'pages',
              id: existing.docs[0].id,
            })
            console.log(`  "${page.title}" deleted (will recreate).`)
          } else {
            console.log(`  "${page.title}" already exists, skipping.`)
            continue
          }
        }

        await payload.create({
          collection: 'pages',
          draft: false,
          data: {
            title: page.title,
            slug: page.slug,
            layout: page.layout as any,
            meta: {
              title: page.meta.title,
              description: page.meta.description,
              noIndex: (page.meta as any).noIndex ?? false,
            },
            schema: {
              type: page.schemaType as any,
            },
            _status: 'published',
            publishedAt: new Date().toISOString(),
          } as any,
        })
        console.log(`  "${page.title}" (/${page.slug}) ${isReseed ? 'reseeded' : 'created'}.`)
      } catch (err: any) {
        console.error(`  Error ${isReseed ? 'reseeding' : 'creating'} page "${page.title}":`, err?.message || err)
      }
    }
  } else {
    console.log('\nPages skipped (run with --all to seed pages).')
  }

  // ── 7. GLOBALS ────────────────────────────────────────────────────────────
  console.log('\nSeeding globals...')

  // site-settings
  try {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        siteName: 'Got Moles',
        tagline: "Washington's Mole Control Specialist",
        phone: '(253) 750-0211',
        siteUrl: 'https://got-moles.com',
        social: {
          googleBusiness: 'https://www.google.com/search?q=Got+Moles+Enumclaw+WA',
          facebook: 'https://www.facebook.com/getridofmoles/',
          nextdoor: 'https://nextdoor.com/pages/got-moles-enumclaw-wa/',
          yelp: 'https://www.yelp.com/biz/got-moles-enumclaw',
        },
      },
    })
    console.log('  site-settings updated.')
  } catch (err) {
    console.error('  Error updating site-settings:', err)
  }

  // header navigation
  try {
    await payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            label: 'How It Works',
            url: '/how-it-works',
            children: [],
          },
          {
            label: 'Services',
            url: '/services/',
            children: [
              { label: 'Year-Round Protection (TMCP)', url: '/services/total-mole-control-program' },
              { label: 'One-Time Removal', url: '/services/one-time-mole-removal' },
              { label: 'Commercial', url: '/services/commercial-mole-control' },
            ],
          },
          {
            label: 'Service Areas',
            url: '/service-areas',
            children: [],
          },
          {
            label: 'About',
            url: '/about',
            children: [],
          },
          {
            label: 'Contact',
            url: '/contact',
            children: [],
          },
        ],
        ctaButton: {
          text: 'Get a Free Quote',
          url: '/contact',
        },
        phone: '(253) 750-0211',
      },
    })
    console.log('  header updated.')
  } catch (err) {
    console.error('  Error updating header:', err)
  }

  // footer
  try {
    await payload.updateGlobal({
      slug: 'footer',
      data: {
        brandDescription:
          "Western Washington's mole-exclusive specialist. Veteran-owned. Chemical-free. Proven results.",
        columns: [
          {
            title: 'Services',
            links: [
              { label: 'Year-Round Protection (TMCP)', url: '/services/total-mole-control-program' },
              { label: 'One-Time Removal', url: '/services/one-time-mole-removal' },
              { label: 'Commercial', url: '/services/commercial-mole-control' },
              { label: 'How It Works', url: '/how-it-works' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About Got Moles', url: '/about' },
              { label: 'Reviews', url: '/reviews' },
              { label: 'FAQ', url: '/faq' },
              { label: 'Blog', url: '/blog' },
              { label: 'Contact', url: '/contact' },
            ],
          },
          {
            title: 'Service Areas',
            links: [
              { label: 'Sammamish', url: '/mole-control-sammamish' },
              { label: 'Bellevue', url: '/mole-control-bellevue' },
              { label: 'Kirkland', url: '/mole-control-kirkland' },
              { label: 'Seattle', url: '/mole-control-seattle' },
              { label: 'Tacoma', url: '/mole-control-tacoma' },
              { label: 'All Service Areas', url: '/service-areas' },
            ],
          },
        ],
        serviceArea: 'Serving King, Pierce, Snohomish, Thurston, Kitsap & Lewis Counties',
        legalLinks: [
          { label: 'Privacy Policy', url: '/privacy' },
          { label: 'Terms of Service', url: '/terms' },
        ],
        copyright: 'Got Moles. All rights reserved. Veteran-Owned.',
      },
    })
    console.log('  footer updated.')
  } catch (err) {
    console.error('  Error updating footer:', err)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log('Seed complete.')
  if (isTest) {
    console.log(
      'Test mode: only Sammamish was seeded. Run with --all to seed all cities and blog posts.',
    )
  }
  console.log('')

  process.exit(0)
}

seed().catch((err) => {
  console.error('\nFatal error during seed:', err)
  process.exit(1)
})
