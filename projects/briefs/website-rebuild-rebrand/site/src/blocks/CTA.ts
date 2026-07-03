import type { Block } from 'payload'

export const CTA: Block = {
  slug: 'cta',
  labels: { singular: 'Call to Action', plural: 'Calls to Action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'buttonText', type: 'text', required: true, defaultValue: 'CALL (253) 750-0211' },
    { name: 'buttonUrl', type: 'text', required: true, defaultValue: 'tel:+12537500211' },
    {
      name: 'buttonStyle',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary (Gold)', value: 'primary' },
        { label: 'Secondary (Cream Outline)', value: 'secondary' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'subtext', type: 'text', admin: { description: 'Friction reducer below button (e.g. "Free quote. No obligation.").' } },
    {
      name: 'showForm',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show a contact form alongside the CTA button.' },
    },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'gradient',
      options: [
        { label: 'Gradient (Blue to Rust)', value: 'gradient' },
        { label: 'Grass', value: 'grass' },
        { label: 'Grass Alt', value: 'grass-alt' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
