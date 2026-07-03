import type { CollectionConfig } from 'payload'
import { allBlocks } from '../blocks'
import {
  adminOnly,
  authenticatedOnly,
  editorOrAdmin,
  publishedOrAuthenticated,
} from '../lib/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
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
    maxPerDoc: 25,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL slug. Use "/" for homepage.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: allBlocks,
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
        },
        {
          label: 'SEO',
          name: 'meta',
          fields: [
            {
              name: 'title',
              type: 'text',
              admin: { description: 'Override the page <title>. Defaults to page title + site name.' },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: { description: 'Meta description. Max 160 characters.' },
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Open Graph image for social sharing.' },
            },
            {
              name: 'noIndex',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Prevent search engines from indexing this page.' },
            },
          ],
        },
        {
          label: 'Schema',
          name: 'schema',
          fields: [
            {
              name: 'type',
              type: 'select',
              defaultValue: 'WebPage',
              options: [
                { label: 'Web Page', value: 'WebPage' },
                { label: 'About Page', value: 'AboutPage' },
                { label: 'Contact Page', value: 'ContactPage' },
                { label: 'FAQ Page', value: 'FAQPage' },
                { label: 'Collection Page', value: 'CollectionPage' },
                { label: 'Service', value: 'Service' },
              ],
              admin: { description: 'JSON-LD @type for this page.' },
            },
            {
              name: 'customJsonLd',
              type: 'code',
              admin: {
                language: 'json',
                description: 'Additional JSON-LD to inject. Merged with auto-generated schema.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
  ],
}
