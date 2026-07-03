import type { Block } from 'payload'

export const FeatureGrid: Block = {
  slug: 'featureGrid',
  labels: { singular: 'Feature Grid', plural: 'Feature Grids' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'showDivider', type: 'checkbox', defaultValue: false },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 2,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'icon', type: 'upload', relationTo: 'media', admin: { description: 'SVG icon (optional).' } },
        { name: 'link', type: 'text', admin: { description: 'Optional link URL.' } },
        { name: 'linkText', type: 'text', admin: { description: 'Link text (e.g. "Learn more").' } },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
      ],
      admin: { position: 'sidebar' },
    },
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
