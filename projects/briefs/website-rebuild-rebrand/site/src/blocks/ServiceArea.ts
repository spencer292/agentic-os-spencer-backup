import type { Block } from 'payload'

export const ServiceArea: Block = {
  slug: 'serviceArea',
  labels: { singular: 'Service Area Grid', plural: 'Service Area Grids' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Serving 70+ Communities Across Western Washington' },
    { name: 'showDivider', type: 'checkbox', defaultValue: false },
    {
      name: 'cities',
      type: 'array',
      required: true,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'url', type: 'text', required: true, admin: { description: 'Link to city page (e.g. "/mole-control-sammamish/").' } },
      ],
    },
    {
      name: 'allAreasLink',
      type: 'group',
      fields: [
        { name: 'text', type: 'text', defaultValue: 'See All Service Areas' },
        { name: 'url', type: 'text', defaultValue: '/service-areas/' },
      ],
    },
    { name: 'countyText', type: 'text', defaultValue: 'Covering King, Pierce, Thurston & Snohomish Counties' },
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
