import type { Block } from 'payload'

export const ServiceComparison: Block = {
  slug: 'serviceComparison',
  labels: { singular: 'Service Comparison', plural: 'Service Comparisons' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    {
      name: 'services',
      type: 'array',
      required: true,
      minRows: 2,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'link', type: 'text' },
        { name: 'bestFor', type: 'textarea', required: true },
        { name: 'howItWorks', type: 'textarea', required: true },
        { name: 'pricing', type: 'text', required: true },
        { name: 'guarantee', type: 'textarea' },
        { name: 'duration', type: 'text' },
        { name: 'reporting', type: 'textarea' },
      ],
    },
    { name: 'footnote', type: 'textarea' },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'grass-alt',
      options: [
        { label: 'Grass', value: 'grass' },
        { label: 'Grass Alt', value: 'grass-alt' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
