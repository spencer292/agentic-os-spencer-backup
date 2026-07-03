import type { CollectionConfig } from 'payload'
import { adminOnly, editorOrAdmin, publishedOrAuthenticated } from '../lib/access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'rating', 'featured', 'status'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: editorOrAdmin,
    update: editorOrAdmin,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'Customer first name (from Google review).' } },
    { name: 'city', type: 'text', admin: { description: 'Customer city/suburb (e.g. "Sammamish, WA").' } },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      admin: { description: 'Review excerpt for cards. 1-3 sentences.' },
    },
    {
      name: 'fullQuote',
      type: 'textarea',
      admin: { description: 'Full Google review text for the reviews page.' },
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      defaultValue: 5,
      admin: { position: 'sidebar' },
    },
    {
      name: 'serviceType',
      type: 'select',
      options: [
        { label: 'TMCP (Year-Round)', value: 'tmcp' },
        { label: 'One-Time Removal', value: 'one-time' },
        { label: 'Commercial', value: 'commercial' },
      ],
      admin: { position: 'sidebar', description: 'Which service this review relates to.' },
    },
    {
      name: 'concern',
      type: 'select',
      options: [
        { label: 'Effectiveness', value: 'effectiveness' },
        { label: 'Pet/Child Safety', value: 'safety' },
        { label: 'Ongoing Protection', value: 'ongoing' },
        { label: 'Professionalism', value: 'professionalism' },
        { label: 'Value for Money', value: 'value' },
      ],
      admin: { position: 'sidebar', description: 'Primary concern this review addresses.' },
    },
    {
      name: 'googleReviewUrl',
      type: 'text',
      admin: { description: 'Link to the original Google review.' },
    },
    {
      name: 'gbpLocation',
      type: 'select',
      options: [
        { label: 'Location 1', value: 'location-1' },
        { label: 'Location 2', value: 'location-2' },
        { label: 'Location 3', value: 'location-3' },
      ],
      admin: { position: 'sidebar', description: 'Which GBP location this review is from.' },
    },
    {
      name: 'dateGiven',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show on homepage and priority placements.', position: 'sidebar' },
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
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
