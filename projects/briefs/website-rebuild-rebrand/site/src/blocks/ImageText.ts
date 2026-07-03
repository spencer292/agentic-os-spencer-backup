import type { Block } from 'payload'

export const ImageText: Block = {
  slug: 'imageText',
  labels: { singular: 'Image + Text', plural: 'Image + Text' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'content', type: 'richText', required: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'fallbackImage', type: 'text', admin: { description: 'Static image filename (without /images/ prefix) used when CMS media is not set' } },
    { name: 'imageAlt', type: 'text', required: true },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Image Right', value: 'right' },
        { label: 'Image Left', value: 'left' },
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
