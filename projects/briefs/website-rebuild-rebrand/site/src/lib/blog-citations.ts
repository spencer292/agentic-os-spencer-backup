import type { CitedSource } from './schema'

const WSU_FS146E: CitedSource = {
  type: 'ScholarlyArticle',
  name: 'Mole Management in Washington Backyards',
  url: 'https://pubs.extension.wsu.edu/product/mole-management-in-washington-backyards-home-garden-series/',
  author: 'David Pehling',
  publisher: 'Washington State University Extension',
  identifier: 'FS146E',
  datePublished: '2014-09',
}

export const BLOG_CITATIONS: Record<string, CitedSource[]> = {
  'what-do-moles-eat': [WSU_FS146E],
  'voles-vs-moles-whats-the-difference': [WSU_FS146E],
  'how-to-get-rid-of-moles-in-your-yard': [WSU_FS146E],
}

export function getBlogCitations(slug: string): CitedSource[] | undefined {
  return BLOG_CITATIONS[slug]
}
