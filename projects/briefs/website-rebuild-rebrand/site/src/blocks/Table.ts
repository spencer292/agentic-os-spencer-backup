import type { Block } from 'payload'

export const Table: Block = {
  slug: 'table',
  labels: { singular: 'Table', plural: 'Tables' },
  fields: [
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption displayed below the table. Describe what the table shows.',
      },
    },
    {
      name: 'hasHeader',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'First row is a header row (renders as <th> elements).',
      },
    },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Table rows. All rows must have the same number of cells (2-6).',
      },
      fields: [
        {
          name: 'cells',
          type: 'array',
          required: true,
          minRows: 2,
          maxRows: 6,
          fields: [
            {
              name: 'content',
              type: 'text',
              required: true,
              admin: { description: 'Cell text content.' },
            },
          ],
        },
      ],
    },
    {
      name: 'background',
      type: 'select',
      defaultValue: 'grass',
      options: [
        { label: 'Grass', value: 'grass' },
        { label: 'Grass Alt', value: 'grass-alt' },
        { label: 'Cream', value: 'cream' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
