import type { Block } from 'payload'

export const TrustBar: Block = {
  slug: 'trustBar',
  labels: { singular: 'Trust Bar', plural: 'Trust Bars' },
  fields: [
    {
      name: 'metrics',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'number', type: 'text', required: true, admin: { description: 'The stat (e.g. "9", "5,000+", "219+").' } },
        { name: 'label', type: 'text', admin: { description: 'Optional label. If empty, "number" field is used as the full flowing text item.' } },
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
