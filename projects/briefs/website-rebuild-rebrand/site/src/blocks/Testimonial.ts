import type { Block } from 'payload'

export const Testimonial: Block = {
  slug: 'testimonial',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'What Our Customers Say' },
    { name: 'showDivider', type: 'checkbox', defaultValue: false },
    {
      name: 'quotes',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 4,
      fields: [
        { name: 'text', type: 'textarea', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'city', type: 'text', admin: { description: 'City/suburb (e.g. "Sammamish, WA").' } },
        { name: 'rating', type: 'number', min: 1, max: 5, defaultValue: 5 },
      ],
    },
    {
      name: 'moreLink',
      type: 'group',
      fields: [
        { name: 'text', type: 'text', defaultValue: 'See All 219+ Reviews' },
        { name: 'url', type: 'text', defaultValue: '/reviews/' },
      ],
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
