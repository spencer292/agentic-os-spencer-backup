import type { Block } from 'payload'

export const TLDR: Block = {
  slug: 'tldr',
  labels: { singular: 'TL;DR Block', plural: 'TL;DR Blocks' },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'TL;DR summary. Target: 40-60 words. This text renders with id="blog-definition-block" for speakable schema and AI extraction.',
      },
    },
  ],
}
