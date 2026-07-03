import type { Block } from 'payload'

export const StepsProcess: Block = {
  slug: 'stepsProcess',
  labels: { singular: 'Steps / Process', plural: 'Steps / Process' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'showDivider', type: 'checkbox', defaultValue: false },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 2,
      fields: [
        { name: 'number', type: 'text', required: true, admin: { description: 'Step number (e.g. "01").' } },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true, admin: { description: 'Full step description (used as detail in progressive disclosure, and for SEO/schema).' } },
        { name: 'summary', type: 'text', admin: { description: 'Short 1-line summary shown by default. If empty, the full description is shown.' } },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'text', type: 'text' },
        { name: 'url', type: 'text' },
        { name: 'subtext', type: 'text' },
      ],
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
