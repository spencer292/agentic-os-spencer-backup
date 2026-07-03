import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageHero } from '@/components/PageHero'
import { Section } from '@/components/Section'
import { CTABlock } from '@/components/CTABlock'
import { QuizCTA } from '@/components/QuizCTA'
import { JsonLd, breadcrumbSchema } from '@/lib/schema'
import { getAllBlogPosts } from '@/lib/payload'
import { getBlogHeroImage } from '@/lib/blog-images'

const SLUG = '/author/spencer/'

export const metadata: Metadata = {
  title: 'Spencer Hill — Founder, Got Moles | US Army Veteran, 15+ Years Mole Control',
  description:
    "Spencer Hill is the founder of Got Moles and an Army veteran who's run nearly 5,000 mole control jobs across Western Washington since 2017. Articles, credentials, and field experience from the team's lead trapper.",
  alternates: { canonical: SLUG },
  openGraph: {
    type: 'profile',
    title: 'Spencer Hill — Founder, Got Moles',
    description:
      'US Army veteran, 15+ years of mole control specialism in Western Washington, nearly 5,000 jobs since 2017.',
    url: `https://got-moles.com${SLUG}`,
    images: [
      {
        url: '/images/team-spencer.webp',
        alt: 'Spencer Hill, founder of Got Moles',
      },
    ],
  },
}

// Standalone Person schema for the author page — richer than the shared
// personSchema() in lib/schema.tsx, with mainEntityOfPage and authoredPosts.
function authorPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': 'https://got-moles.com/author/spencer/#person',
    name: 'Spencer Hill',
    givenName: 'Spencer',
    familyName: 'Hill',
    jobTitle: 'Owner & Founder',
    description:
      'US Army veteran and founder of Got Moles, a Western Washington mole control specialist serving King, Pierce, Snohomish, and Thurston counties since 2017.',
    image: 'https://got-moles.com/images/team-spencer.webp',
    worksFor: { '@id': 'https://got-moles.com/#organization' },
    birthPlace: 'Buckley, Washington',
    homeLocation: { '@type': 'Place', name: 'Enumclaw, Washington' },
    nationality: { '@type': 'Country', name: 'United States' },
    hasCredential: [
      {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'Military Service',
        description: 'US Army Infantryman, 2011-2014',
      },
    ],
    knowsAbout: [
      'mole control',
      'mole trapping',
      "Townsend's mole",
      'Pacific Coast mole',
      'Shrew mole',
      'chemical-free pest control',
      'Western Washington wildlife',
      'lawn restoration',
    ],
    mainEntityOfPage: { '@id': 'https://got-moles.com/author/spencer/#webpage' },
    url: 'https://got-moles.com/author/spencer/',
  }
}

function profilePageSchema(postCount: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': 'https://got-moles.com/author/spencer/#webpage',
    url: 'https://got-moles.com/author/spencer/',
    name: 'Spencer Hill — Founder, Got Moles',
    description: `Spencer Hill is the founder of Got Moles. US Army veteran, 15+ years of mole control specialism in Western Washington, nearly 5,000 jobs since 2017. Author of ${postCount} field-grounded articles on mole biology, identification, and control.`,
    mainEntity: { '@id': 'https://got-moles.com/author/spencer/#person' },
    isPartOf: { '@id': 'https://got-moles.com/#website' },
    breadcrumb: { '@id': 'https://got-moles.com/author/spencer/#breadcrumb' },
  }
}

export default async function SpencerAuthorPage() {
  let posts: Awaited<ReturnType<typeof getAllBlogPosts>>['docs'] = []
  try {
    const result = await getAllBlogPosts({ limit: 100 })
    posts = result.docs
  } catch {
    posts = []
  }

  function postUrl(post: (typeof posts)[0]): string {
    const slug = post.slug as string
    const pattern = post.urlPattern as string | undefined
    return pattern === 'legacy-root' ? `/${slug}` : `/blog/${slug}`
  }

  function postImage(post: (typeof posts)[0]): string | null {
    const cmsUrl = (post.featuredImage as { url?: string } | undefined)?.url
    if (cmsUrl) return cmsUrl
    return getBlogHeroImage(post.slug as string)
  }

  return (
    <>
      <JsonLd data={authorPersonSchema()} />
      <JsonLd data={profilePageSchema(posts.length)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Spencer Hill', url: SLUG },
        ])}
      />

      <PageHero
        heading="Spencer Hill — Founder, Got Moles"
        subheading="US Army veteran. 15+ years of mole control specialism. Nearly 5,000 jobs across Western Washington since 2017."
        image="/images/hero-spencer-team.webp"
        imageAlt="Spencer Hill and the Got Moles field team"
        height="70vh"
      />

      {/* BIO — grass */}
      <Section background="grass">
        <div className="max-w-[720px] mx-auto">
          <div className="flex items-start gap-5 mb-8">
            <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0">
              <Image
                src="/images/team-spencer.webp"
                alt="Spencer Hill"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div>
              <p className="font-body font-semibold text-cream-200">Spencer Hill</p>
              <p className="font-body text-sm text-cream-200/65">
                Founder, Got Moles · US Army veteran · 15+ years mole control specialist
              </p>
            </div>
          </div>

          <p className="font-body text-body-lg text-cream-200/90 leading-relaxed mb-4">
            Spencer was born in Buckley, Washington, served three years in the US Army as an
            infantryman, and now runs the only mole-only specialist in Western Washington from
            Enumclaw. He started trapping moles for neighbors over 15 years ago and turned the
            work into a business in 2017. Got Moles has run nearly 5,000 mole control jobs since
            then — chemical-free, professionally trapped, with a written report after every visit.
          </p>

          <p className="font-body text-body-lg text-cream-200/90 leading-relaxed mb-4">
            What separates Spencer from the general pest control rotation is depth. Most pest
            companies handle ants, spiders, termites, rats, and moles in the same week. Spencer
            handles moles. Every day. For 15+ years. He knows Townsend&apos;s mole behavior,
            Pacific Northwest soil patterns, and how mole activity shifts through the seasons —
            because he&apos;s on properties seeing it, not reading about it.
          </p>

          <p className="font-body text-body-lg text-cream-200/90 leading-relaxed">
            He lives in Enumclaw with his wife Courtney and daughter Emery. Got Moles serves King,
            Pierce, Snohomish, and Thurston counties from three Western Washington offices.
          </p>
        </div>
      </Section>

      {/* CREDENTIALS / EXPERTISE — grass-alt */}
      <Section background="grass-alt">
        <div className="max-w-[720px] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight text-cream-200 mb-6" style={{ textWrap: 'balance' } as { textWrap: string }}>
            Credentials &amp; Field Experience
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 rounded-2xl p-6">
              <p className="font-heading font-bold text-h4 text-gold-500 mb-2">5,000+</p>
              <p className="font-body text-body-lg text-cream-200/85">Mole control jobs across Western Washington since 2017.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6">
              <p className="font-heading font-bold text-h4 text-gold-500 mb-2">15+ years</p>
              <p className="font-body text-body-lg text-cream-200/85">Personal field experience trapping moles, dating back before the company existed.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6">
              <p className="font-heading font-bold text-h4 text-gold-500 mb-2">3 species</p>
              <p className="font-body text-body-lg text-cream-200/85">Specialist in Townsend&apos;s, Pacific Coast, and Shrew mole — the three native to Washington state.</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6">
              <p className="font-heading font-bold text-h4 text-gold-500 mb-2">219+</p>
              <p className="font-body text-body-lg text-cream-200/85">Five-star Google reviews across three local offices.</p>
            </div>
          </div>

          <h3 className="font-heading text-h3 uppercase tracking-tight text-cream-200 mb-4">Background</h3>
          <ul className="font-body text-body-lg text-cream-200/85 leading-relaxed space-y-2 list-disc pl-6 mb-6">
            <li>US Army Infantryman, 2011-2014</li>
            <li>Founded Got Moles in 2017 from Enumclaw, Washington</li>
            <li>3 office locations: Enumclaw, Seattle, Tacoma</li>
            <li>Service area: King, Pierce, Snohomish, Thurston counties</li>
            <li>Chemical-free trapping methods, safe for pets and children</li>
          </ul>

          <h3 className="font-heading text-h3 uppercase tracking-tight text-cream-200 mb-4">Subject Matter Expertise</h3>
          <p className="font-body text-body-lg text-cream-200/85 leading-relaxed">
            Mole biology and identification (Washington&apos;s three native species), professional
            trapping technique, lawn-damage assessment, seasonal mole activity patterns in the
            Puget Sound lowlands, the difference between active and abandoned tunnels, and the
            real-world cost-benefit of DIY versus professional mole control.
          </p>
        </div>
      </Section>

      {/* AUTHOR ARCHIVE — grass */}
      <Section background="grass">
        <div className="max-w-[720px] mx-auto">
          <h2 className="font-heading text-h2 uppercase tracking-tight text-cream-200 mb-2" style={{ textWrap: 'balance' } as { textWrap: string }}>
            Articles by Spencer
          </h2>
          <p className="font-body text-body-lg text-cream-200/70 mb-8">
            {posts.length} field-grounded articles on mole biology, identification, control, and
            the realities of Western Washington yards.
          </p>

          {posts.length === 0 ? (
            <p className="font-body text-cream-200/60">No posts available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => {
                const img = postImage(post)
                return (
                  <Link
                    key={post.slug as string}
                    href={postUrl(post)}
                    className="block bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors no-underline group"
                  >
                    {img && (
                      <div className="relative w-full aspect-[16/10] overflow-hidden">
                        <Image
                          src={img}
                          alt={(post.title as string) || ''}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 360px"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.keywordCluster && (
                        <span className="font-body text-xs uppercase tracking-wide text-gold-500">
                          {post.keywordCluster as string}
                        </span>
                      )}
                      <h3 className="font-body font-semibold text-h4 text-cream-200 mt-2 group-hover:text-gold-500 transition-colors" style={{ textWrap: 'balance' } as { textWrap: string }}>
                        {post.title as string}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </Section>

      {/* HIGHLIGHT — grass-alt */}
      <Section background="grass-alt">
        <div className="max-w-[720px] mx-auto">
          <blockquote className="border-l-4 border-gold-500 pl-6 py-2 font-body text-body-lg text-cream-200/90 italic leading-relaxed">
            Most pest control rotates technicians across dozens of pest types. Mole work needs
            depth — reading tunnel patterns, predicting where the animal will move next, knowing
            which signs are active and which are abandoned. That only comes from doing it every
            day, on real properties, for years.
          </blockquote>
          <p className="font-body text-sm text-cream-200/65 mt-4">
            — Spencer Hill, Founder
          </p>
        </div>
      </Section>

      {/* FINAL CTA — gradient (last block per design-system Rule 4) */}
      <CTABlock
        heading="Want Spencer's Team On Your Property?"
        body="Call (253) 750-0211 — Western Washington only. Free quote. No obligation."
        showForm={true}
        subtext="Free. No obligation."
        secondaryLine={<QuizCTA cluster="Mole Control" slug="author-spencer" variant="inline" />}
      />
    </>
  )
}
