import type { Block } from 'payload'

export const RichContent: Block = {
  slug: 'richContent',
  labels: { singular: 'Rich Content', plural: 'Rich Content' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'showDivider', type: 'checkbox', defaultValue: false, admin: { description: 'Show gold divider below heading.' } },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'grass',
      options: [
        { label: 'Grass', value: 'grass' },
        { label: 'Grass Alt', value: 'grass-alt' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
