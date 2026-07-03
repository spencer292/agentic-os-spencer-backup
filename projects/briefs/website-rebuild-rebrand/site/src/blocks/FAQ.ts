import type { Block } from 'payload'

export const FAQ: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ Section', plural: 'FAQ Sections' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Frequently Asked Questions' },
    { name: 'showDivider', type: 'checkbox', defaultValue: false },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    {
      name: 'moreLink',
      type: 'group',
      fields: [
        { name: 'text', type: 'text', defaultValue: 'See all FAQs' },
        { name: 'url', type: 'text', defaultValue: '/faq/' },
      ],
    },
    {
      name: 'generateSchema',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Output FAQPage JSON-LD schema.', position: 'sidebar' },
    },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'grass',
      options: [
        { label: 'Grass', value: 'grass' },
        { label: 'Grass Alt', value: 'grass-alt' },
        { label: 'Grass to Blue', value: 'grass-to-blue' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
