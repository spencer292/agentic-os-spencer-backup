import type { Block } from 'payload'

export const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'heading', type: 'text', required: true, admin: { description: 'Main headline. Uppercase Lexend Bold.' } },
    { name: 'subheading', type: 'textarea', admin: { description: 'Supporting text. Zilla Slab Regular.' } },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media', admin: { description: 'Full-width background. Preloaded as LCP element.' } },
    { name: 'fallbackImage', type: 'text', admin: { description: 'Static fallback image key (e.g. "hero-lawn") when no CMS backgroundImage is set. Maps to /images/{key}.webp.' } },
    {
      name: 'heroHeight',
      type: 'select',
      defaultValue: '85vh',
      options: [
        { label: '85vh (Standard — all core pages)', value: '85vh' },
        { label: '100vh (Full viewport — rarely used)', value: '100vh' },
        { label: '70vh (City pages)', value: '70vh' },
      ],
      admin: { position: 'sidebar', description: 'Hero section height.' },
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'text', type: 'text', defaultValue: 'CALL (253) 750-0211' },
        { name: 'url', type: 'text', defaultValue: 'tel:+12537500211' },
        { name: 'style', type: 'select', defaultValue: 'primary', options: [
          { label: 'Primary (Gold)', value: 'primary' },
          { label: 'Secondary (Cream Outline)', value: 'secondary' },
        ]},
      ],
    },
    {
      name: 'trustStrip',
      type: 'json',
      admin: { description: 'JSON array of trust items shown at hero bottom. E.g. ["5-Star Rated", "Nearly 5,000 Clients Served"]. Leave empty for no trust strip in hero.' },
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left Aligned (text panel)', value: 'left' },
        { label: 'Centered', value: 'centered' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
