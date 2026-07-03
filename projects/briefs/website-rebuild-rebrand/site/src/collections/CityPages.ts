import type { CollectionConfig } from 'payload'
import { adminOnly, editorOrAdmin, publishedOrAuthenticated } from '../lib/access'

export const CityPages: CollectionConfig = {
  slug: 'city-pages',
  admin: {
    useAsTitle: 'cityName',
    defaultColumns: ['cityName', 'county', 'priority', 'status'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: adminOnly,
  },
  fields: [
    { name: 'cityName', type: 'text', required: true, admin: { description: 'City name (e.g. "Sammamish").' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar', description: 'URL slug (e.g. "sammamish"). Used as /mole-control-{slug}/.' },
    },
    {
      name: 'county',
      type: 'select',
      required: true,
      options: [
        { label: 'King County', value: 'king' },
        { label: 'Pierce County', value: 'pierce' },
        { label: 'Thurston County', value: 'thurston' },
        { label: 'Snohomish County', value: 'snohomish' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Priority (top 12)', value: 'priority' },
        { label: 'Standard', value: 'standard' },
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
              name: 'headline',
              type: 'text',
              required: true,
              admin: { description: 'H1 for this city page (e.g. "Mole Control in Sammamish, WA").' },
            },
            {
              name: 'introText',
              type: 'textarea',
              required: true,
              admin: { description: 'City-specific intro. 2-3 sentences with local references.' },
            },
            {
              name: 'localDetails',
              type: 'textarea',
              admin: { description: 'Neighborhoods, local landmarks, soil conditions, common mole species.' },
            },
            {
              name: 'body',
              type: 'richText',
              admin: { description: 'Additional city-specific content.' },
            },
            {
              name: 'faqs',
              type: 'array',
              admin: { description: 'City-specific FAQs (3-5 questions). FAQPage schema generated.' },
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
            { name: 'metaDescription', type: 'textarea', maxLength: 160 },
            { name: 'primaryKeyword', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'population',
      type: 'number',
      admin: { position: 'sidebar', description: 'City population (for local stats).' },
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
  ],
}
