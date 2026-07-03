import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/payload'
import { BlogPostContent } from '@/components/BlogPostContent'
import { getBlogHeroImage } from '@/lib/blog-images'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    // Only include posts with urlPattern === 'blog' (or undefined, which defaults to 'blog')
    const result = await getAllBlogPosts({ limit: 500, urlPattern: 'blog' })
    return result.docs
      .filter((post) => post.slug)
      .map((post) => ({ slug: post.slug as string }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await getBlogPostBySlug(slug, { urlPattern: 'blog' })
    if (!post) return {}

    const seo = post.seo as
      | { metaTitle?: string; metaDescription?: string }
      | undefined

    const title = post.title as string
    const excerpt = post.excerpt as string | undefined
    const featured = post.featuredImage as { url?: string; alt?: string } | undefined
    const ogImage = featured?.url || getBlogHeroImage(slug) || '/images/og-default.webp'

    return {
      title: seo?.metaTitle || title,
      description: seo?.metaDescription || excerpt,
      alternates: { canonical: `https://got-moles.com/blog/${slug}/` },
      openGraph: {
        title: seo?.metaTitle || title,
        description: seo?.metaDescription || excerpt,
        type: 'article',
        url: `https://got-moles.com/blog/${slug}/`,
        images: [{ url: ogImage, alt: featured?.alt || title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: seo?.metaTitle || title,
        description: seo?.metaDescription || excerpt,
        images: [ogImage],
      },
    }
  } catch {
    return {}
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params

  let post: Awaited<ReturnType<typeof getBlogPostBySlug>>
  try {
    post = await getBlogPostBySlug(slug, { urlPattern: 'blog' })
  } catch {
    notFound()
  }

  if (!post) notFound()

  return <BlogPostContent post={post as unknown as Record<string, unknown>} urlPattern="blog" />
}
