import type { Block } from 'payload'

export const PainPoints: Block = {
  slug: 'painPoints',
  labels: { singular: 'Pain Points', plural: 'Pain Points' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'showDivider', type: 'checkbox', defaultValue: false },
    { name: 'body', type: 'textarea', admin: { description: 'Empathy copy. In the ICP language.' } },
    {
      name: 'points',
      type: 'array',
      fields: [
        { name: 'text', type: 'text', required: true },
      ],
      admin: { description: 'Optional bullet points of specific pain points.' },
    },
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
