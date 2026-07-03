import type { CollectionConfig } from 'payload'
import { adminOnly, editorOrAdmin, publishedOrAuthenticated } from '../lib/access'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'Service name (e.g. "Total Mole Control Program").' } },
    { name: 'shortName', type: 'text', admin: { description: 'Short name for cards (e.g. "TMCP").' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'serviceType',
      type: 'select',
      required: true,
      options: [
        { label: 'Residential - Recurring', value: 'residential-recurring' },
        { label: 'Residential - One-Time', value: 'residential-onetime' },
        { label: 'Commercial', value: 'commercial' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'pricing',
      type: 'group',
      fields: [
        { name: 'price', type: 'text', admin: { description: 'Display price (e.g. "$100/month", "$450 flat rate", "Custom quote").' } },
        { name: 'setupFee', type: 'text', admin: { description: 'Setup fee if applicable (e.g. "$150").' } },
        { name: 'commitment', type: 'text', admin: { description: 'Minimum commitment (e.g. "12-month minimum").' } },
        { name: 'propertyLimit', type: 'text', admin: { description: 'Property size limit (e.g. "Under 1 acre").' } },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: { description: 'Short description for service cards. 2-3 sentences.' },
    },
    {
      name: 'guarantee',
      type: 'textarea',
      admin: { description: 'Guarantee text specific to this service.' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
