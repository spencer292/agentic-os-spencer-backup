import type { Block } from 'payload'

export const TeamCards: Block = {
  slug: 'teamCards',
  labels: { singular: 'Team Cards', plural: 'Team Cards' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    { name: 'showDivider', type: 'checkbox', defaultValue: false },
    {
      name: 'members',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text', required: true },
        { name: 'bio', type: 'textarea', required: true },
        {
          name: 'photoKey',
          type: 'text',
          required: true,
          admin: {
            description: 'Static image key (e.g. "team-spencer"). Maps to /images/{key}.webp in site/public/images/.',
          },
        },
      ],
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
