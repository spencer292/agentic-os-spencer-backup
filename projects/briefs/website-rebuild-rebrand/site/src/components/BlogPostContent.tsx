import type React from 'react'
import Link from 'next/link'
import { JsonLd, articleSchema, faqSchema, breadcrumbSchema, definedTermSchema, personSchema } from '@/lib/schema'
import { Section } from '@/components/Section'
import { CTABlock } from '@/components/CTABlock'
import { PageHero } from '@/components/PageHero'
import { QuizCTA } from '@/components/QuizCTA'
import { getAllBlogPosts } from '@/lib/payload'
import { getBlogHeroImage } from '@/lib/blog-images'
import { getBlogCitations } from '@/lib/blog-citations'
import { getBlogPrimaryMoneyPage } from '@/lib/blog-data'
import { MONEY_PAGE_URL, MONEY_LINK, pickMoneyAnchor } from '@/lib/money-pages'


interface BlogPostContentProps {
  post: Record<string, unknown>
  urlPattern?: 'blog' | 'legacy-root'
}

export function BlogPostContent({ post, urlPattern = 'blog' }: BlogPostContentProps) {
  const title = post.title as string
  const slug = post.slug as string
  const excerpt = post.excerpt as string | undefined
  const definitionBlock = post.definitionBlock as string | undefined
  const publishDate = post.publishDate as string
  const dateModified = (post.updatedAt as string | undefined) || publishDate
  const keywordCluster = post.keywordCluster as string | undefined
  const seoPrimaryKeyword = post.seoPrimaryKeyword as string | undefined
  const tags = post.tags as { tag?: string }[] | string[] | undefined
  const faqs = (post.faqs as { question: string; answer: string }[] | undefined) || []

  const keywordList: string[] = []
  if (seoPrimaryKeyword) keywordList.push(seoPrimaryKeyword)
  if (Array.isArray(tags)) {
    for (const t of tags) {
      const v = typeof t === 'string' ? t : t?.tag
      if (v && !keywordList.includes(v)) keywordList.push(v)
    }
  }

  const cmsImage = post.featuredImage as
    | { url?: string; alt?: string; width?: number; height?: number }
    | undefined
  const fallbackUrl = getBlogHeroImage(slug)
  const featuredImage = cmsImage?.url
    ? cmsImage
    : fallbackUrl
      ? { url: fallbackUrl, alt: title }
      : undefined

  const author = post.author as { name?: string } | string | undefined
  const authorName =
    typeof author === 'object' && author !== null
      ? (author.name ?? 'Spencer Hill')
      : 'Spencer Hill'
  // E-E-A-T byline link (R8). Only Spencer has an author page today; anyone
  // else renders as plain text rather than a broken link.
  const authorSlug = authorName === 'Spencer Hill' ? 'spencer' : null

  // R2 — prominent contextual money link, high in the body. Each post funnels
  // to its primary money page (R1) with a varied offer anchor (R7).
  const moneyPage = getBlogPrimaryMoneyPage(slug)
  const moneyUrl = MONEY_PAGE_URL[moneyPage]
  const moneyLink = MONEY_LINK[moneyPage]
  const moneyAnchor = pickMoneyAnchor(moneyPage, slug)

  const dateModifiedFormatted = new Date(dateModified).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  // Legacy-root blogs live at /{slug}/; new blogs live at /blog/{slug}/
  const canonicalPath = urlPattern === 'legacy-root' ? `/${slug}/` : `/blog/${slug}/`
  const breadcrumbItems =
    urlPattern === 'legacy-root'
      ? [{ name: title, url: canonicalPath }]
      : [
          { name: 'Blog', url: '/blog/' },
          { name: title, url: canonicalPath },
        ]

  return (
    <>
      <JsonLd
        data={articleSchema({
          title,
          slug,
          date: publishDate,
          dateModified,
          excerpt: excerpt || '',
          image: featuredImage?.url,
          url: `https://got-moles.com${canonicalPath}`,
          keywords: keywordList,
          cluster: keywordCluster,
          citations: getBlogCitations(slug),
        })}
      />
      {definitionBlock && (
        <JsonLd
          data={definedTermSchema({
            term: title,
            definition: definitionBlock,
            url: canonicalPath,
          })}
        />
      )}
      {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      {/* Person entity for author E-E-A-T signal. LocalBusiness removed
          per D-07: BlogPosting is the primary page-type for blog posts,
          and LocalBusiness is also a page-type — only one allowed per page.
          Organization schema (sitewide via layout) provides the business entity. */}
      <JsonLd data={personSchema()} />

      {featuredImage?.url ? (
        <PageHero
          heading={title}
          image={featuredImage.url}
          imageAlt={featuredImage.alt || title}
          height="70vh"
        />
      ) : (
        <section
          className="text-cream-200 pt-20 pb-12 lg:pt-28 lg:pb-16 px-4"
          style={{ background: 'linear-gradient(to bottom, #184241, #153635)' }}
        >
          <div className="max-w-[800px] mx-auto">
            {urlPattern === 'blog' && (
              <Link
                href="/blog"
                className="font-body text-sm text-gold-500 hover:text-gold-400 no-underline mb-6 inline-block"
              >
                &larr; Back to Blog
              </Link>
            )}
            <h1
              className="font-heading text-h1 uppercase tracking-tight mb-4"
              style={{ textWrap: 'balance' } as { textWrap: string }}
            >
              {title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-cream-200/65 mt-4">
              {authorSlug ? (
                <Link
                  href={`/author/${authorSlug}/`}
                  className="text-gold-500 hover:text-gold-400 no-underline"
                >
                  {authorName}
                </Link>
              ) : (
                <span>{authorName}</span>
              )}
              <span>&bull;</span>
              <time dateTime={dateModified}>Updated {dateModifiedFormatted}</time>
            </div>
          </div>
        </section>
      )}

      <Section background="grass">
        <div className="max-w-[720px] mx-auto">
          {definitionBlock && (
            <div className="mb-10">
              <p
                id="blog-definition-block"
                className="font-body text-body-lg text-cream-200/80 leading-relaxed max-w-[55ch]"
              >
                {definitionBlock}
              </p>
            </div>
          )}

          {/* R2 — prominent contextual money link, high in the body. Points at
              this post's primary money page (R1) with a varied offer anchor (R7).
              The catch-all 3-service block stays lower in "Related Services". */}
          <div className="mb-10 bg-white/5 border-l-4 border-gold-500 rounded-r-xl px-5 py-4 md:px-6 md:py-5">
            <p className="font-body text-body-lg text-cream-200/90 leading-relaxed">
              {moneyLink.lead} Our{' '}
              <Link
                href={moneyUrl}
                className="text-gold-500 font-semibold no-underline hover:text-gold-400"
              >
                {moneyAnchor}
              </Link>{' '}
              {moneyLink.tail}
            </p>
          </div>

          {post.body ? (
            <div className="max-w-none">
              <PayloadRichText content={post.body} />
            </div>
          ) : null}
        </div>
      </Section>

      {/* Mid-flow QuizCTA — cluster-aware copy keyed off post.keywordCluster.
          Background grass-alt alternates from the body section above (grass).
          Downstream sections flip backgrounds to maintain Rule 7 alternation. */}
      <QuizCTA
        cluster={keywordCluster}
        slug={slug}
        variant="block"
        background="grass-alt"
      />

      {faqs.length > 0 && (
        <Section background="grass">
          <div className="max-w-[720px] mx-auto">
            <h2
              className="font-heading text-h2 uppercase tracking-tight mb-8 text-cream-200"
              style={{ textWrap: 'balance' } as { textWrap: string }}
            >
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group border-b border-cream-200/10 pb-3"
                >
                  <summary className="cursor-pointer font-body font-semibold text-body-lg text-cream-200 py-3 flex justify-between items-center">
                    {faq.question}
                    <svg
                      className="w-5 h-5 text-gold-500 shrink-0 ml-4 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
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
      )}

      <Section background="grass-alt">
        <div className="max-w-[720px] mx-auto">
          <h2
            className="font-heading text-h2 uppercase tracking-tight mb-8"
            style={{ textWrap: 'balance' } as { textWrap: string }}
          >
            Related Services &amp; Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-body font-semibold text-cream-200 mb-3">Our Services</h3>
              <ul className="space-y-2 font-body text-body-lg text-cream-200/80">
                <li>
                  <Link
                    href="/services/total-mole-control-program"
                    className="text-gold-500 hover:text-gold-400 no-underline"
                  >
                    Total Mole Control Program
                  </Link>{' '}
                  — $100/month year-round protection
                </li>
                <li>
                  <Link
                    href="/services/one-time-mole-removal"
                    className="text-gold-500 hover:text-gold-400 no-underline"
                  >
                    One-Time Mole Removal
                  </Link>{' '}
                  — $450 flat rate with guarantee
                </li>
                <li>
                  <Link
                    href="/services/commercial-mole-control"
                    className="text-gold-500 hover:text-gold-400 no-underline"
                  >
                    Commercial Mole Control
                  </Link>{' '}
                  — annual contracts for property managers
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-body font-semibold text-cream-200 mb-3">Learn More</h3>
              <ul className="space-y-2 font-body text-body-lg text-cream-200/80">
                <li>
                  <Link href="/how-it-works" className="text-gold-500 hover:text-gold-400 no-underline">
                    How It Works
                  </Link>{' '}
                  — our 4-step process
                </li>
                <li>
                  <Link href="/faq" className="text-gold-500 hover:text-gold-400 no-underline">
                    FAQ
                  </Link>{' '}
                  — 26 expert answers
                </li>
                <li>
                  <Link href="/service-areas" className="text-gold-500 hover:text-gold-400 no-underline">
                    Service Areas
                  </Link>{' '}
                  — 77 cities across Western Washington
                </li>
              </ul>
            </div>
          </div>
          <RelatedPosts currentSlug={slug} />
        </div>
      </Section>

      <Section background="grass">
        <div className="max-w-[720px] mx-auto flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center shrink-0">
            <span className="font-heading font-bold text-xl text-gold-500">
              {authorName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-body font-semibold text-cream-200">
              {authorSlug ? (
                <Link
                  href={`/author/${authorSlug}/`}
                  className="text-cream-200 hover:text-gold-500 no-underline"
                >
                  {authorName}
                </Link>
              ) : (
                authorName
              )}
            </p>
            <p className="font-body text-body-lg text-cream-200/75 mt-1">
              Spencer Hill is a US Army veteran and founder of Got Moles, a mole control
              specialist serving Western Washington. He has helped over 5,000 homeowners
              reclaim their yards using chemical-free, professional trapping methods.
            </p>
          </div>
        </div>
      </Section>

      <CTABlock
        heading="Ready to Reclaim Your Yard?"
        body="Call (253) 750-0211 — we serve all of Western Washington."
        showForm={true}
        subtext="Free. No obligation."
        secondaryLine={
          <QuizCTA cluster={keywordCluster} slug={slug} variant="inline" />
        }
      />
    </>
  )
}

function PayloadRichText({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') return null

  const root = (content as { root?: { children?: unknown[] } }).root
  if (!root?.children) return null

  return <>{root.children.map((node, i) => renderNode(node, i))}</>
}

type LexicalNode = {
  type?: string
  tag?: string
  version?: number
  children?: LexicalNode[]
  text?: string
  format?: number
  listType?: string
  fields?: { url?: string; newTab?: boolean }
  [key: string]: unknown
}

function renderTableCell(cell: LexicalNode, key: number, isHeader: boolean): React.ReactNode {
  const Tag = isHeader ? 'th' : 'td'
  return (
    <Tag
      key={key}
      className={`px-3 py-2 text-left align-top ${isHeader ? 'font-semibold text-cream-200 text-sm uppercase tracking-wide' : 'text-cream-200/80'}`}
    >
      {cell.children?.map((child, i) => renderNode(child, i))}
    </Tag>
  )
}

function renderNode(node: unknown, key: number | string): React.ReactNode {
  const n = node as LexicalNode
  if (!n) return null

  switch (n.type) {
    case 'paragraph':
      return (
        <p key={key} className="font-body text-body-lg text-cream-200/90 leading-relaxed mb-4">
          {n.children?.map((child, i) => renderNode(child, i))}
        </p>
      )

    case 'heading': {
      const tag = (n.tag || 'h2') as string
      const isH2 = tag === 'h2'
      const className = isH2
        ? 'font-heading text-h2 uppercase tracking-tight text-cream-200 mt-10 mb-4'
        : tag === 'h3'
          ? 'font-heading text-h3 uppercase tracking-tight text-cream-200 mt-8 mb-3'
          : 'font-body font-semibold text-h4 text-cream-200 mt-6 mb-2'
      const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
      type HeadingTag = (typeof validHeadings)[number]
      const Tag: HeadingTag = (validHeadings as readonly string[]).includes(tag)
        ? (tag as HeadingTag)
        : 'h2'
      return (
        <Tag key={key} className={className}>
          {n.children?.map((child, i) => renderNode(child, i))}
        </Tag>
      )
    }

    case 'list':
      if (n.listType === 'number') {
        return (
          <ol
            key={key}
            className="font-body text-body-lg text-cream-200/90 leading-relaxed list-decimal pl-6 mb-4 space-y-1"
          >
            {n.children?.map((child, i) => renderNode(child, i))}
          </ol>
        )
      }
      return (
        <ul
          key={key}
          className="font-body text-body-lg text-cream-200/90 leading-relaxed list-disc pl-6 mb-4 space-y-1"
        >
          {n.children?.map((child, i) => renderNode(child, i))}
        </ul>
      )

    case 'listitem':
      return (
        <li key={key}>{n.children?.map((child, i) => renderNode(child, i))}</li>
      )

    case 'link': {
      const url = n.fields?.url || '#'
      const newTab = n.fields?.newTab
      return (
        <a
          key={key}
          href={url}
          className="text-gold-500 font-semibold no-underline hover:text-gold-400"
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
        >
          {n.children?.map((child, i) => renderNode(child, i))}
        </a>
      )
    }

    case 'text': {
      const text = n.text || ''
      const fmt = n.format || 0
      let el: React.ReactNode = text
      if (fmt & 16) el = <code key={key} className="bg-white/10 px-1.5 py-0.5 rounded text-sm">{text}</code>
      if (fmt & 4) el = <s key={key}>{el}</s>
      if (fmt & 8) el = <u key={key}>{el}</u>
      if (fmt & 2) el = <em key={key}>{el}</em>
      if (fmt & 1)
        el = (
          <strong key={key} className="font-semibold text-cream-200">
            {el}
          </strong>
        )
      return el
    }

    case 'linebreak':
      return <br key={key} />

    case 'quote':
      return (
        <blockquote
          key={key}
          className="border-l-4 border-gold-500 pl-5 my-6 font-body text-body-lg text-cream-200/80 italic"
        >
          {n.children?.map((child, i) => renderNode(child, i))}
        </blockquote>
      )

    case 'table': {
      const rows = (n.children || []) as LexicalNode[]
      const headerRows = rows.filter((row) =>
        (row.children as LexicalNode[] | undefined)?.some(
          (cell) => (cell as { headerState?: number }).headerState === 1
        )
      )
      const bodyRows = rows.filter((row) =>
        !(row.children as LexicalNode[] | undefined)?.some(
          (cell) => (cell as { headerState?: number }).headerState === 1
        )
      )
      return (
        <div key={key} className="overflow-x-auto mb-6 -mx-4 px-4">
          <table className="w-full font-body text-body-lg text-cream-200/90 border-collapse">
            {headerRows.length > 0 && (
              <thead>
                {headerRows.map((row, i) => (
                  <tr key={i} className="border-b-2 border-gold-500/40">
                    {(row.children || []).map((cell, j) => renderTableCell(cell as LexicalNode, j, true))}
                  </tr>
                ))}
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, i) => (
                <tr key={i} className="border-b border-cream-200/10">
                  {(row.children || []).map((cell, j) => renderTableCell(cell as LexicalNode, j, false))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    default:
      if (n.children?.length) {
        return <>{n.children.map((child, i) => renderNode(child, i))}</>
      }
      return null
  }
}

async function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  try {
    const result = await getAllBlogPosts({ limit: 10 })
    const others = result.docs.filter((p) => p.slug && p.slug !== currentSlug)
    if (others.length === 0) return null

    const shown = others.slice(0, 3)

    return (
      <div className="mt-8">
        <h3 className="font-body font-semibold text-cream-200 mb-3">More from the Blog</h3>
        <ul className="space-y-2 font-body text-body-lg text-cream-200/80">
          {shown.map((post) => {
            const postSlug = post.slug as string
            const postUrlPattern = (post as { urlPattern?: string }).urlPattern || 'blog'
            const href =
              postUrlPattern === 'legacy-root' ? `/${postSlug}` : `/blog/${postSlug}`
            return (
              <li key={postSlug}>
                <Link
                  href={href}
                  className="text-gold-500 hover:text-gold-400 no-underline"
                >
                  {post.title as string}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  } catch {
    return null
  }
}
