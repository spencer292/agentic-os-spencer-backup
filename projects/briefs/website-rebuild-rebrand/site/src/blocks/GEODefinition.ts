import type { Block } from 'payload'

export const GEODefinition: Block = {
  slug: 'geoDefinition',
  labels: { singular: 'GEO Definition', plural: 'GEO Definitions' },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'AI-extractable definition block. 2-3 clear, independently citable sentences. Place in the first 30% of page content. Used for speakable schema.',
      },
    },
  ],
}
