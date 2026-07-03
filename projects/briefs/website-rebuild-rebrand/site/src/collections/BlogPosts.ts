import type { CollectionConfig } from 'payload'
import {
  adminOnly,
  authenticatedOnly,
  editorOrAdmin,
  publishedOrAuthenticated,
} from '../lib/access'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'keywordCluster', 'status', 'publishDate'],
  },
  access: {
    read: publishedOrAuthenticated,
    readVersions: authenticatedOnly,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: adminOnly,
  },
  versions: {
    drafts: {
      autosave: { interval: 300 },
    },
    maxPerDoc: 10,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishDate',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 200,
              admin: { description: 'Used in blog index cards and social sharing.' },
            },
            {
              name: 'definitionBlock',
              type: 'textarea',
              admin: { description: 'GEO-extractable paragraph. 2-3 clear, citable sentences for AI engines.' },
            },
            {
              name: 'body',
              type: 'richText',
              required: true,
            },
            {
              name: 'faqs',
              type: 'array',
              admin: { description: '3-5 questions in homeowner language. FAQPage schema generated.' },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          name: 'seo',
          fields: [
            { name: 'metaTitle', type: 'text', maxLength: 60 },
            { name: 'metaDescription', type: 'textarea', required: true, maxLength: 160 },
            { name: 'primaryKeyword', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'keywordCluster',
      type: 'select',
      required: true,
      options: [
        { label: 'Mole Control', value: 'mole-control' },
        { label: 'Biology', value: 'biology' },
        { label: 'DIY vs Professional', value: 'diy-pro' },
        { label: 'Cost & Value', value: 'cost-value' },
        { label: 'Safety', value: 'safety' },
        { label: 'Seasonal', value: 'seasonal' },
        { label: 'Commercial', value: 'commercial' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'urlPattern',
      type: 'select',
      required: true,
      defaultValue: 'blog',
      options: [
        { label: '/blog/{slug}/ (default)', value: 'blog' },
        { label: '/{slug}/ (migrated legacy post)', value: 'legacy-root' },
      ],
      admin: {
        position: 'sidebar',
        description:
          '"blog" → /blog/{slug}/. "legacy-root" → /{slug}/ (preserves pre-migration indexed URL).',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'wordCount',
      type: 'number',
      admin: { position: 'sidebar' },
    },
  ],
}
