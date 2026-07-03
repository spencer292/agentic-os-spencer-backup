import type { GlobalConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Settings' },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'Got Moles' },
    { name: 'tagline', type: 'text', defaultValue: "Western Washington's Mole-Exclusive Specialist" },
    { name: 'phone', type: 'text', defaultValue: '(253) 750-0211' },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'siteUrl', type: 'text', required: true, defaultValue: 'https://got-moles.com' },
    { name: 'defaultOgImage', type: 'upload', relationTo: 'media' },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'googleBusiness', type: 'text' },
        { name: 'facebook', type: 'text' },
        { name: 'nextdoor', type: 'text' },
        { name: 'yelp', type: 'text' },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      admin: { description: 'Tracking IDs. Leave blank to disable.' },
      fields: [
        { name: 'ga4Id', type: 'text', admin: { description: 'Google Analytics 4 Measurement ID (G-XXXXXXX).' } },
        { name: 'metaPixelId', type: 'text', admin: { description: 'Meta/Facebook Pixel ID.' } },
        { name: 'adwordsId', type: 'text', admin: { description: 'Google Ads conversion tracking ID.' } },
      ],
    },
  ],
}
