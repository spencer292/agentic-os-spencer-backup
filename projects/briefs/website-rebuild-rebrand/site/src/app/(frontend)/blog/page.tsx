import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Section } from '@/components/Section'
import { getAllBlogPosts } from '@/lib/payload'
import { JsonLd, breadcrumbSchema, collectionPageSchema, itemListSchema, faqSchema } from '@/lib/schema'
import { getBlogHeroImage } from '@/lib/blog-images'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string }>
}): Promise<Metadata> {
  const { cluster } = await searchParams
  if (cluster && CLUSTER_LABELS[cluster]) {
    return {
      title: `${CLUSTER_LABELS[cluster]} | Mole Control Blog`,
      description: `${CLUSTER_LABELS[cluster]} articles from Got Moles — expert mole control advice for Western Washington homeowners.`,
      alternates: { canonical: '/blog' },
      openGraph: {
        type: 'website',
        title: `${CLUSTER_LABELS[cluster]} — Got Moles Blog`,
        description: `${CLUSTER_LABELS[cluster]} articles from Got Moles. Spencer Hill's expert mole control advice for Western Washington.`,
        images: [{ url: '/images/og-default.webp', width: 1200, height: 630, alt: 'Got Moles — Western Washington Mole Control Blog' }],
      },
    }
  }
  return {
    title: 'Mole Control Blog | Western Washington',
    description:
      'Expert mole control, biology, and yard-protection advice for Western Washington homeowners. 35+ in-depth articles from Spencer Hill, founder of Got Moles, with 15+ years and nearly 5,000 mole control jobs.',
    alternates: { canonical: '/blog' },
    openGraph: {
      type: 'website',
      title: 'Got Moles Blog — Western Washington Mole Control Advice',
      description: 'Expert mole control, biology, and yard-protection advice for Western Washington from Spencer Hill at Got Moles.',
      images: [{ url: '/images/og-default.webp', width: 1200, height: 630, alt: 'Got Moles — Western Washington Mole Control Blog' }],
    },
  }
}

// Cluster display labels — keys match keywordCluster values in the DB.
// Order is intentional: Mole Control + Biology lead because they're the
// largest semantic groups; Cost/Safety/Seasonal/DIY rounding out.
const CLUSTER_LABELS: Record<string, string> = {
  'mole-control': 'Mole Control',
  biology: 'Mole Biology',
  safety: 'Safety',
  'cost-value': 'Cost & Value',
  seasonal: 'Seasonal',
  'diy-pro': 'DIY vs Pro',
}
const CLUSTER_ORDER = ['mole-control', 'biology', 'safety', 'cost-value', 'seasonal', 'diy-pro']

const BLOG_FAQS: { question: string; answer: string }[] = [
  {
    question: 'Who writes the Got Moles blog?',
    answer: "Spencer Hill, founder of Got Moles, with editorial input from the field team. Spencer is a US Army veteran with 15+ years of mole control experience and has personally led nearly 5,000 mole control jobs across Western Washington since 2017. Every article is grounded in field observations from real properties in King, Pierce, Snohomish, and Thurston counties.",
  },
  {
    question: 'What does the Got Moles blog cover?',
    answer: "Mole biology and identification (Townsend's, Pacific Coast, and Shrew mole — the three Western Washington species), mole control methods that actually work, the methods that don't (sonic stakes, castor oil, grub control), pet and child safety considerations, seasonal mole activity patterns in the Pacific Northwest, cost and value comparisons, and DIY vs professional control trade-offs. All content is Western Washington specific.",
  },
  {
    question: 'Is the advice on this blog Washington-specific?',
    answer: "Yes. Western Washington has a unique combination of mild winters, year-round rainfall, and earthworm-rich soils that creates dense Townsend's mole populations. Most generic 'how to get rid of moles' advice is written for the Eastern US or the UK and doesn't account for PNW conditions. Every article on this blog is grounded in 15+ years of field experience across the Puget Sound lowlands.",
  },
  {
    question: 'How often is the blog updated?',
    answer: "New articles ship as the team encounters questions worth answering at depth. Existing articles are reviewed and refreshed annually, with seasonal articles updated each spring and autumn to reflect current activity patterns.",
  },
  {
    question: "I have a mole problem now. Where do I start?",
    answer: "Start with How to Get Rid of Moles in Your Yard (the cornerstone guide), then Best Mole Traps if you're considering DIY, or DIY vs Professional Mole Control if you're weighing whether to call in a specialist. If you're in our service area and want to skip the reading, call (253) 750-0211 for a quote.",
  },
]

interface BlogIndexProps {
  searchParams: Promise<{ cluster?: string }>
}

export default async function BlogIndex({ searchParams }: BlogIndexProps) {
  const { cluster: activeCluster } = await searchParams
  let posts: Awaited<ReturnType<typeof getAllBlogPosts>>['docs'] = []
  try {
    const result = await getAllBlogPosts({ limit: 100 })
    posts = result.docs
  } catch {
    posts = []
  }

  // Build cluster counts from the FULL post set so chip counts stay
  // stable regardless of current filter
  const clusterCounts: Record<string, number> = {}
  for (const post of posts) {
    const c = post.keywordCluster as string | undefined
    if (c) clusterCounts[c] = (clusterCounts[c] ?? 0) + 1
  }

  // Filter posts by active cluster if one is selected
  if (activeCluster && CLUSTER_LABELS[activeCluster]) {
    posts = posts.filter((p) => (p.keywordCluster as string | undefined) === activeCluster)
  }

  function getPostImageUrl(post: (typeof posts)[0]): string | null {
    const cmsUrl = (post.featuredImage as { url?: string } | undefined)?.url
    if (cmsUrl) return cmsUrl
    return getBlogHeroImage(post.slug as string)
  }

  function getPostImageAlt(post: (typeof posts)[0]): string {
    return (post.featuredImage as { alt?: string } | undefined)?.alt || (post.title as string)
  }

  function getPostUrl(post: (typeof posts)[0]): string {
    const slug = post.slug as string
    const pattern = post.urlPattern as string | undefined
    return pattern === 'legacy-root' ? `/${slug}` : `/blog/${slug}`
  }

  const featuredPost = posts[0]
  const remainingPosts = posts.slice(1)

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Blog', url: '/blog/' }])} />
      <JsonLd
        data={collectionPageSchema({
          name: 'Mole Control Blog — Expert Advice from Got Moles',
          url: 'https://got-moles.com/blog/',
          description: 'Expert mole control, biology, and yard-protection advice for Western Washington homeowners from Spencer Hill at Got Moles.',
          about: 'Mole control in Western Washington',
          authorName: 'Spencer Hill',
          authorJobTitle: 'Founder, Got Moles',
          authorDescription: 'US Army veteran and 15+ year mole control specialist serving Western Washington. Has helped over 5,000 homeowners reclaim their yards using chemical-free professional trapping.',
          speakableSelector: '#blog-bluf',
        })}
      />
      <JsonLd
        data={itemListSchema(
          posts.map((post) => ({
            url: `https://got-moles.com${getPostUrl(post)}/`,
            name: post.title as string,
          })),
          { orderDescending: true },
        )}
      />
      <JsonLd data={faqSchema(BLOG_FAQS)} />

      {/* Hero */}
      <section className="text-cream-200 pt-20 pb-12 lg:pt-28 lg:pb-16 px-4" style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}>
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="font-heading text-h1 uppercase tracking-tight mb-4" style={{ textWrap: 'balance' } as { textWrap: string }}>
            {activeCluster && CLUSTER_LABELS[activeCluster] ? `${CLUSTER_LABELS[activeCluster]} — Mole Control Insights` : 'Mole Control Insights'}
          </h1>
          <p
            id="blog-bluf"
            className="font-body text-body-lg text-cream-200/90 max-w-[65ch] mx-auto leading-relaxed"
          >
            {activeCluster && CLUSTER_LABELS[activeCluster]
              ? `${CLUSTER_LABELS[activeCluster]} articles from Got Moles — ${clusterCounts[activeCluster] ?? 0} in-depth guides for homeowners in Sammamish, Bellevue, Kirkland, Issaquah, Seattle, Tacoma, Puyallup, Federal Way, Renton, Kent, Enumclaw, and the rest of Western Washington. Written by Spencer Hill from 15+ years and nearly 5,000 mole control jobs across King, Pierce, Snohomish, and Thurston counties.`
              : 'Expert mole control, biology, and yard-protection advice for homeowners in Sammamish, Bellevue, Kirkland, Issaquah, Seattle, Tacoma, Puyallup, Federal Way, Renton, Kent, Enumclaw, and the rest of Western Washington. 35+ in-depth articles by Spencer Hill — US Army veteran, founder of Got Moles, and a 15+ year specialist with nearly 5,000 jobs across the Puget Sound lowlands. Every article is grounded in real field experience with the three native Washington mole species: Townsend’s, Pacific Coast, and Shrew mole.'}
          </p>
        </div>
      </section>

      {/* Category sub-nav */}
      <section className="text-cream-200 pt-6 pb-2 px-4" style={{ background: '#153635' }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/blog"
              className={`px-4 py-2 rounded-full text-sm font-body font-semibold no-underline transition-colors ${
                !activeCluster
                  ? 'bg-gold-500 text-blue-600'
                  : 'bg-white/5 text-cream-200/80 hover:bg-white/10 hover:text-cream-200'
              }`}
            >
              All <span className="opacity-60">({Object.values(clusterCounts).reduce((a, b) => a + b, 0)})</span>
            </Link>
            {CLUSTER_ORDER.filter((key) => clusterCounts[key]).map((key) => {
              const isActive = activeCluster === key
              return (
                <Link
                  key={key}
                  href={`/blog?cluster=${key}`}
                  className={`px-4 py-2 rounded-full text-sm font-body font-semibold no-underline transition-colors ${
                    isActive
                      ? 'bg-gold-500 text-blue-600'
                      : 'bg-white/5 text-cream-200/80 hover:bg-white/10 hover:text-cream-200'
                  }`}
                >
                  {CLUSTER_LABELS[key]} <span className="opacity-60">({clusterCounts[key]})</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <Section background="grass">
        <div className="max-w-4xl mx-auto">
          {featuredPost && (
            <Link
              href={getPostUrl(featuredPost)}
              className="block bg-white/5 rounded-2xl overflow-hidden mb-8 hover:bg-white/10 transition-colors no-underline group"
            >
              {getPostImageUrl(featuredPost) && (
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  <Image
                    src={getPostImageUrl(featuredPost)!}
                    alt={getPostImageAlt(featuredPost)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 896px"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-8">
                {featuredPost.keywordCluster && (
                  <span className="font-body text-xs uppercase tracking-wide text-gold-500">
                    {featuredPost.keywordCluster as string}
                  </span>
                )}
                <h2 className="font-heading text-h3 uppercase tracking-tight text-cream-200 mt-2 mb-3 group-hover:text-gold-500 transition-colors" style={{ textWrap: 'balance' } as { textWrap: string }}>
                  {featuredPost.title as string}
                </h2>
                {featuredPost.excerpt && (
                  <p className="font-body text-body-lg text-cream-200/80 leading-relaxed">
                    {featuredPost.excerpt as string}
                  </p>
                )}
                {featuredPost.publishDate && (
                  <p className="font-body text-sm text-cream-200/50 mt-3">
                    {new Date(featuredPost.publishDate as string).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </Link>
          )}

          {/* Post grid */}
          {remainingPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {remainingPosts.map((post) => (
                <Link
                  key={post.slug as string}
                  href={getPostUrl(post)}
                  className="block bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors no-underline group"
                >
                  {getPostImageUrl(post) && (
                    <div className="relative w-full aspect-[16/10] overflow-hidden">
                      <Image
                        src={getPostImageUrl(post)!}
                        alt={getPostImageAlt(post)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 448px"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {post.keywordCluster && (
                      <span className="font-body text-xs uppercase tracking-wide text-gold-500">
                        {post.keywordCluster as string}
                      </span>
                    )}
                    <h3 className="font-body font-semibold text-h4 text-cream-200 mt-2 mb-2 group-hover:text-gold-500 transition-colors" style={{ textWrap: 'balance' } as { textWrap: string }}>
                      {post.title as string}
                    </h3>
                    {post.excerpt && (
                      <p className="font-body text-body-lg text-cream-200/80 leading-relaxed">
                        {post.excerpt as string}
                      </p>
                    )}
                    {post.publishDate && (
                      <p className="font-body text-xs text-cream-200/50 mt-3">
                        {new Date(post.publishDate as string).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {posts.length === 0 && (
            <p className="font-body text-body-lg text-cream-200/50 text-center py-16">
              No posts yet. Check back soon.
            </p>
          )}
        </div>
      </Section>

      {/* About this blog — E-E-A-T signals + author authority */}
      <Section background="grass-alt">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-6 text-cream-200" style={{ textWrap: 'balance' } as { textWrap: string }}>
            About the Got Moles Blog
          </h2>
          <div className="flex items-start gap-5 mb-6">
            <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
              <span className="font-heading font-bold text-xl text-gold-500">SH</span>
            </div>
            <div>
              <p className="font-body font-semibold text-cream-200">Spencer Hill</p>
              <p className="font-body text-sm text-cream-200/65">Founder, Got Moles · US Army veteran · 15+ years mole control specialist</p>
            </div>
          </div>
          <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-4">
            Every article on this blog is written from real field experience — nearly 5,000 mole control jobs across Western Washington since 2017, plus 15+ years before that. There's no recycled generic mole-removal advice here. Every piece is grounded in the actual conditions of Puget Sound lowland soils, the three native Washington mole species (Townsend's, Pacific Coast, Shrew), and the seasonal patterns we see across King, Pierce, Snohomish, and Thurston counties.
          </p>
          <p className="font-body text-body-lg text-cream-200/85 leading-relaxed mb-4">
            We focus on what actually works (chemical-free physical trapping by trained specialists), what doesn't (sonic stakes, castor oil, grub control), and the trade-offs in between (DIY vs professional, one-time removal vs ongoing protection). The goal is honest, field-tested advice that helps homeowners make the right call for their specific yard.
          </p>
          <p className="font-body text-body-lg text-cream-200/65 leading-relaxed">
            Got Moles serves all of Western Washington with chemical-free mole control. <Link href="/services/one-time-mole-removal" className="text-gold-500 hover:text-gold-400 no-underline">One-Time Mole Removal</Link> ($450 flat rate, results guarantee) or the year-round <Link href="/services/total-mole-control-program" className="text-gold-500 hover:text-gold-400 no-underline">Total Mole Control Program</Link> ($100/month). Call (253) 750-0211 or <Link href="/contact" className="text-gold-500 hover:text-gold-400 no-underline">request a free quote</Link>.
          </p>
        </div>
      </Section>

      {/* Blog-level FAQ — speakable + extractable for AI/search */}
      <Section background="grass">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight mb-6 text-cream-200" style={{ textWrap: 'balance' } as { textWrap: string }}>
            About This Blog — FAQ
          </h2>
          <div className="space-y-4">
            {BLOG_FAQS.map((faq) => (
              <details key={faq.question} className="group border-b border-cream-200/10 pb-3">
                <summary className="cursor-pointer font-body font-semibold text-body-lg text-cream-200 py-3 flex justify-between items-center">
                  {faq.question}
                  <svg className="w-5 h-5 text-gold-500 shrink-0 ml-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="blog-faq-answer font-body text-body-lg text-cream-200/80 leading-relaxed mt-2 pr-8">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Section>
    </>
  )
}
